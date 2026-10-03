import { createHash, randomUUID } from 'node:crypto';
import { pool, TABLES, addAudit } from './db.js';

const PLAYBACK_TTL_SECONDS = Math.max(30, Number(process.env.IPZTREAM_PLAYBACK_TTL_SECONDS || 120));

function decode(payload) {
  if (payload && typeof payload === 'object') return payload;
  try { return JSON.parse(payload); } catch { return {}; }
}
function asArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (value === null || value === undefined || value === '') return [];
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}
async function packageById(id) {
  if (!id) return null;
  const result = await pool.query(`SELECT payload FROM ${TABLES.packages} WHERE id = ? LIMIT 1`, [id]);
  return result.rows[0] ? decode(result.rows[0].payload) : null;
}
function packageAllowsChannel(pkg, channel) {
  if (!pkg) return true;
  const channelIds = asArray(pkg.channelIds || pkg.channels);
  const bouquets = asArray(pkg.bouquets || pkg.bouquetIds);
  if (!channelIds.length && !bouquets.length) return true;
  return channelIds.includes(String(channel.id)) || Boolean(channel.bouquet && bouquets.includes(String(channel.bouquet)));
}

export async function ensureIptvSchema() {
  await pool.query(`CREATE TABLE IF NOT EXISTS iptv_playback_sessions (
    id CHAR(36) PRIMARY KEY,
    session_key CHAR(64) NOT NULL UNIQUE,
    user_id VARCHAR(191) NOT NULL,
    username VARCHAR(64) NOT NULL,
    channel_id VARCHAR(191) NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    node_id VARCHAR(191) NOT NULL DEFAULT '',
    ip_address VARCHAR(64) NOT NULL DEFAULT '',
    user_agent VARCHAR(512) NOT NULL DEFAULT '',
    status ENUM('Activa','Cerrada') NOT NULL DEFAULT 'Activa',
    started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    last_seen_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    closed_at DATETIME(3) NULL,
    INDEX idx_iptv_playback_user_status (user_id, status, last_seen_at),
    INDEX idx_iptv_playback_channel (channel_id, status),
    INDEX idx_iptv_playback_last_seen (last_seen_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await expirePlaybackSessions();
}

export async function channelsForUser(user) {
  const pkg = await packageById(user.packageId);
  const result = await pool.query(`SELECT id, payload FROM ${TABLES.channels} ORDER BY created_at ASC`);
  return result.rows
    .map((row) => ({ ...decode(row.payload), id: row.id }))
    .filter((channel) => channel.status !== 'Inactivo')
    .filter((channel) => packageAllowsChannel(pkg, channel))
    .sort((a, b) => Number(a.sortOrder ?? a.number ?? 0) - Number(b.sortOrder ?? b.number ?? 0));
}

export async function liveCategoriesForUser(user) {
  const channels = await channelsForUser(user);
  return [...new Set(channels.map((item) => String(item.category || 'Sin categoría')).filter(Boolean))]
    .map((name, index) => ({ category_id: String(index + 1), category_name: name, parent_id: 0 }));
}

export async function liveStreamsForUser(user, categoryName = '') {
  const channels = await channelsForUser(user);
  const filtered = categoryName ? channels.filter((item) => String(item.category || '') === categoryName) : channels;
  return filtered.map((channel, index) => ({
    num: index + 1,
    name: channel.name,
    stream_type: 'live',
    stream_id: String(channel.id),
    stream_icon: channel.logo || '',
    epg_channel_id: channel.epgId || '',
    added: '0',
    category_id: String(channel.category || 'Sin categoría'),
    tv_archive: 0,
    direct_source: '',
    tv_archive_duration: 0
  }));
}

export async function epgForChannel(channelId, limit = 10) {
  const channelResult = await pool.query(`SELECT payload FROM ${TABLES.channels} WHERE id = ? LIMIT 1`, [channelId]);
  if (!channelResult.rows[0]) return [];
  const channel = decode(channelResult.rows[0].payload);
  const epg = await pool.query(`SELECT payload FROM ${TABLES.epg} ORDER BY created_at DESC LIMIT 500`);
  const key = String(channel.epgId || channel.name || channelId);
  return epg.rows.map((row) => decode(row.payload))
    .filter((item) => String(item.channel || item.epgId || '') === key || String(item.channel || '') === String(channel.name || ''))
    .slice(0, Math.max(1, Math.min(100, Number(limit || 10))));
}

export async function getAllowedChannel(user, channelId) {
  const channels = await channelsForUser(user);
  return channels.find((channel) => String(channel.id) === String(channelId)) || null;
}

function playbackKey(userId, channelId, ip, userAgent) {
  return createHash('sha256').update([userId, channelId, ip || '', userAgent || ''].join('|')).digest('hex');
}

export async function expirePlaybackSessions() {
  await pool.query(`UPDATE iptv_playback_sessions
    SET status = 'Cerrada', closed_at = COALESCE(closed_at, CURRENT_TIMESTAMP(3))
    WHERE status = 'Activa'
      AND last_seen_at < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL ? SECOND)`, [PLAYBACK_TTL_SECONDS]);
}

export async function touchPlayback(user, channel, metadata = {}) {
  await expirePlaybackSessions();
  const key = playbackKey(user.id, channel.id, metadata.ip, metadata.userAgent);
  const existing = await pool.query(`SELECT id FROM iptv_playback_sessions WHERE session_key = ? AND status = 'Activa' LIMIT 1`, [key]);
  if (existing.rows[0]) {
    await pool.query(`UPDATE iptv_playback_sessions SET last_seen_at = CURRENT_TIMESTAMP(3), node_id = ?, channel_name = ? WHERE id = ?`,
      [String(channel.nodeId || ''), String(channel.name || ''), existing.rows[0].id]);
    return existing.rows[0].id;
  }
  const active = await pool.query(`SELECT COUNT(*) AS count FROM iptv_playback_sessions
    WHERE user_id = ? AND status = 'Activa' AND last_seen_at >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL ? SECOND)`,
    [user.id, PLAYBACK_TTL_SECONDS]);
  if (Number(active.rows[0]?.count || 0) >= Math.max(1, Number(user.maxConnections || 1))) {
    const error = new Error('Límite de conexiones simultáneas alcanzado.');
    error.status = 429;
    throw error;
  }
  const id = randomUUID();
  await pool.query(`INSERT INTO iptv_playback_sessions
    (id, session_key, user_id, username, channel_id, channel_name, node_id, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    id, key, user.id, user.username, String(channel.id), String(channel.name || ''), String(channel.nodeId || ''),
    String(metadata.ip || '').slice(0, 64), String(metadata.userAgent || '').slice(0, 512)
  ]);
  await addAudit({ action: 'IPTV_PLAY_START', module: 'connections', actor: user.username, detail: `${channel.name} (${channel.id})`, metadata: { sessionId: id, channelId: channel.id, nodeId: channel.nodeId || null } });
  return id;
}

export async function listPlaybackConnections({ includeClosed = false } = {}) {
  await expirePlaybackSessions();
  const where = includeClosed ? '' : `WHERE status = 'Activa'`;
  const result = await pool.query(`SELECT id, username, user_id AS userId, channel_id AS channelId,
    channel_name AS channelName, node_id AS nodeId, ip_address AS ip, user_agent AS userAgent,
    status, started_at AS startedAt, last_seen_at AS lastSeenAt, closed_at AS closedAt
    FROM iptv_playback_sessions ${where} ORDER BY last_seen_at DESC LIMIT 1000`);
  return result.rows;
}

export async function closePlaybackConnection(id, actor = 'system') {
  const result = await pool.query(`SELECT id, username, channel_id AS channelId FROM iptv_playback_sessions WHERE id = ? LIMIT 1`, [id]);
  const item = result.rows[0];
  if (!item) return false;
  await pool.query(`UPDATE iptv_playback_sessions SET status = 'Cerrada', closed_at = CURRENT_TIMESTAMP(3) WHERE id = ?`, [id]);
  await addAudit({ action: 'IPTV_PLAY_CLOSE', module: 'connections', actor, detail: `Sesión ${id}`, metadata: { sessionId: id, username: item.username, channelId: item.channelId } });
  return true;
}
