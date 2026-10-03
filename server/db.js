import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mariadb from 'mariadb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

const mariaPool = mariadb.createPool({
  host: process.env.IPZTREAM_DB_HOST || '127.0.0.1',
  port: Number(process.env.IPZTREAM_DB_PORT || 3306),
  user: process.env.IPZTREAM_DB_USER || 'ipztream',
  password: process.env.IPZTREAM_DB_PASSWORD || '',
  database: process.env.IPZTREAM_DB_NAME || 'ipztream',
  connectionLimit: Number(process.env.IPZTREAM_DB_POOL_SIZE || 10),
  connectTimeout: 5000,
  idleTimeout: 30000,
  bigIntAsNumber: true
});

export const pool = {
  async query(sql, params = []) {
    const result = await mariaPool.query(sql, params);
    return { rows: Array.isArray(result) ? result : [], rowCount: Number(result?.affectedRows || 0) };
  },
  async end() {
    return mariaPool.end();
  }
};

export const TABLES = {
  nodes: 'nodes',
  channels: 'channels',
  vod: 'vod',
  series: 'series',
  epg: 'epg',
  m3u: 'm3u',
  packages: 'packages',
  connections: 'connections',
  devices: 'devices',
  users: 'users',
  audit: 'audit_logs'
};

const seedFallbacks = {
  nodes: [],
  channels: [],
  vod: [],
  series: [],
  epg: [],
  m3u: [],
  packages: [],
  connections: [],
  devices: [],
  users: []
};

function positiveInt(value, fallback, min = 1, max = 86400) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

export function streamNodeOfflineAfterSeconds() {
  return positiveInt(process.env.IPZTREAM_NODE_OFFLINE_AFTER_SECONDS, 150, 30, 86400);
}

export function streamNodeHeartbeatRetentionDays() {
  return positiveInt(process.env.IPZTREAM_NODE_HEARTBEAT_RETENTION_DAYS, 7, 1, 365);
}

async function readJsonSeed(name) {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${name}.json`), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed[name] || [];
  } catch {
    return seedFallbacks[name] || [];
  }
}

function decodePayload(payload) {
  if (payload && typeof payload === 'object') return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

function jsonValue(value, fallback = []) {
  try {
    return JSON.stringify(value ?? fallback);
  } catch {
    return JSON.stringify(fallback);
  }
}

function iso(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function streamNodeFromRow(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name || ''),
    role: String(row.role || 'sub'),
    status: String(row.status || 'Fuera de línea'),
    ip: String(row.ip_address || ''),
    apiBaseUrl: String(row.api_base_url || ''),
    region: String(row.region || ''),
    capacity: String(row.capacity || ''),
    capabilities: decodePayload(row.capabilities) || [],
    version: String(row.version || ''),
    notes: String(row.notes || ''),
    cpu: nullableNumber(row.cpu_percent),
    ram: nullableNumber(row.ram_percent),
    disk: nullableNumber(row.disk_percent),
    load: nullableNumber(row.load_avg),
    activeStreams: Math.max(0, Number(row.active_streams || 0)),
    uptime: Math.max(0, Number(row.uptime_seconds || 0)),
    lastSeenAt: iso(row.last_seen_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

async function createSchema() {
  const generic = Object.values(TABLES)
    .filter((table) => table !== 'audit_logs')
    .map((table) => `CREATE TABLE IF NOT EXISTS ${table} (
      id VARCHAR(191) PRIMARY KEY,
      payload JSON NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

  const statements = [
    ...generic,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(64) NOT NULL,
      module VARCHAR(128) NOT NULL,
      actor VARCHAR(191),
      detail TEXT,
      metadata JSON NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_logs_created_at (created_at)
    )`,
    `CREATE TABLE IF NOT EXISTS app_meta (
      meta_key VARCHAR(128) PRIMARY KEY,
      meta_value TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS stream_runtime (
      channel_id VARCHAR(191) PRIMARY KEY,
      desired_state ENUM('running','stopped') NOT NULL DEFAULT 'stopped',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_stream_runtime_desired (desired_state)
    )`,
    `CREATE TABLE IF NOT EXISTS stream_nodes (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      role ENUM('main','sub','edge') NOT NULL DEFAULT 'sub',
      status ENUM('En línea','Fuera de línea','Degradado','Mantenimiento') NOT NULL DEFAULT 'Fuera de línea',
      ip_address VARCHAR(255) NOT NULL,
      api_base_url VARCHAR(512) NOT NULL DEFAULT '',
      region VARCHAR(128) NOT NULL DEFAULT '',
      capacity VARCHAR(128) NOT NULL DEFAULT '',
      capabilities JSON NOT NULL,
      version VARCHAR(128) NOT NULL DEFAULT '',
      notes TEXT NOT NULL,
      cpu_percent DECIMAL(5,2) NULL,
      ram_percent DECIMAL(5,2) NULL,
      disk_percent DECIMAL(5,2) NULL,
      load_avg DECIMAL(8,2) NULL,
      active_streams INT UNSIGNED NOT NULL DEFAULT 0,
      uptime_seconds BIGINT UNSIGNED NOT NULL DEFAULT 0,
      last_seen_at DATETIME(3) NULL,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_stream_nodes_role (role),
      INDEX idx_stream_nodes_status (status),
      INDEX idx_stream_nodes_ip (ip_address),
      INDEX idx_stream_nodes_last_seen (last_seen_at)
    )`,
    `CREATE TABLE IF NOT EXISTS stream_node_heartbeats (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      node_id VARCHAR(191) NOT NULL,
      status ENUM('En línea','Fuera de línea','Degradado','Mantenimiento') NOT NULL DEFAULT 'En línea',
      cpu_percent DECIMAL(5,2) NULL,
      ram_percent DECIMAL(5,2) NULL,
      disk_percent DECIMAL(5,2) NULL,
      load_avg DECIMAL(8,2) NULL,
      active_streams INT UNSIGNED NOT NULL DEFAULT 0,
      uptime_seconds BIGINT UNSIGNED NOT NULL DEFAULT 0,
      version VARCHAR(128) NOT NULL DEFAULT '',
      received_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_stream_node_heartbeats_node_received (node_id, received_at),
      CONSTRAINT fk_stream_node_heartbeats_node
        FOREIGN KEY (node_id) REFERENCES stream_nodes(id) ON DELETE CASCADE
    )`
  ];

  for (const statement of statements) await mariaPool.query(statement);
}

async function migrateSeed(name) {
  const table = TABLES[name];
  const result = await mariaPool.query(`SELECT COUNT(*) AS count FROM ${table}`);
  if (Number(result[0]?.count || 0) > 0) return;
  for (const item of await readJsonSeed(name)) {
    if (item?.id) {
      await mariaPool.query(
        `INSERT IGNORE INTO ${table} (id,payload) VALUES (?,?)`,
        [String(item.id), JSON.stringify(item)]
      );
    }
  }
}

async function migrateLegacyStreamNodes() {
  const marker = await mariaPool.query(
    "SELECT meta_value FROM app_meta WHERE meta_key='stream_nodes_migrated_v1' LIMIT 1"
  );
  if (marker[0]?.meta_value === '1') return;

  const rows = await mariaPool.query(`SELECT payload FROM ${TABLES.nodes} ORDER BY created_at ASC`);
  for (const row of rows) {
    const item = decodePayload(row.payload);
    if (!item?.id || !item?.name || !item?.ip) continue;
    const current = await findStreamNodeByIdOrIp(String(item.id), String(item.ip));
    if (current) continue;
    await upsertStreamNode({
      id: String(item.id),
      name: String(item.name),
      role: ['main', 'sub', 'edge'].includes(item.role) ? item.role : 'sub',
      status: ['En línea', 'Fuera de línea', 'Degradado', 'Mantenimiento'].includes(item.status)
        ? item.status
        : 'Fuera de línea',
      ip: String(item.ip),
      apiBaseUrl: String(item.apiBaseUrl || ''),
      region: String(item.region || ''),
      capacity: String(item.capacity || ''),
      capabilities: Array.isArray(item.capabilities) ? item.capabilities : [],
      version: String(item.version || ''),
      notes: String(item.notes || ''),
      cpu: nullableNumber(item.cpu),
      ram: nullableNumber(item.ram),
      disk: nullableNumber(item.disk),
      load: nullableNumber(item.load),
      activeStreams: Math.max(0, Number(item.activeStreams || 0)),
      uptime: Math.max(0, Number(item.uptime || 0)),
      lastSeenAt: item.lastSeenAt || null
    });
  }

  await mariaPool.query(
    "INSERT INTO app_meta (meta_key,meta_value) VALUES ('stream_nodes_migrated_v1','1') ON DUPLICATE KEY UPDATE meta_value='1'"
  );
}

export async function initDatabase() {
  await createSchema();
  for (const name of Object.keys(TABLES).filter((key) => key !== 'audit')) {
    await migrateSeed(name);
  }
  await migrateLegacyStreamNodes();
  await markOfflineStreamNodes();
  await pruneStreamNodeHeartbeats();
}

export async function dbHealth() {
  const result = await mariaPool.query('SELECT CURRENT_TIMESTAMP AS now');
  return { ok: true, database: 'mariadb', now: result[0]?.now };
}

export async function listItems(table) {
  const rows = await mariaPool.query(`SELECT payload FROM ${table} ORDER BY created_at ASC`);
  return rows.map((row) => decodePayload(row.payload));
}

export async function getItem(table, id) {
  const rows = await mariaPool.query(`SELECT payload FROM ${table} WHERE id=?`, [id]);
  return rows[0] ? decodePayload(rows[0].payload) : null;
}

export async function insertItem(table, item) {
  await mariaPool.query(`INSERT INTO ${table} (id,payload) VALUES (?,?)`, [String(item.id), JSON.stringify(item)]);
  return item;
}

export async function updateItem(table, id, item) {
  const result = await mariaPool.query(`UPDATE ${table} SET payload=? WHERE id=?`, [JSON.stringify(item), id]);
  return result.affectedRows ? item : null;
}

export async function deleteItem(table, id) {
  const result = await mariaPool.query(`DELETE FROM ${table} WHERE id=?`, [id]);
  return result.affectedRows > 0;
}

export async function addAudit({ action, module, actor = 'system', detail = '', metadata = {} }) {
  await mariaPool.query(
    'INSERT INTO audit_logs (action,module,actor,detail,metadata) VALUES (?,?,?,?,?)',
    [action, module, actor, detail, JSON.stringify(metadata)]
  );
}

export async function findStreamNodeByIdOrIp(id, ip = '') {
  const rows = await mariaPool.query(
    `SELECT * FROM stream_nodes
     WHERE id=? OR (?<>'' AND LOWER(ip_address)=LOWER(?))
     ORDER BY CASE WHEN id=? THEN 0 ELSE 1 END
     LIMIT 1`,
    [String(id || ''), String(ip || ''), String(ip || ''), String(id || '')]
  );
  return streamNodeFromRow(rows[0]);
}

export async function getStreamNode(id) {
  const rows = await mariaPool.query('SELECT * FROM stream_nodes WHERE id=? LIMIT 1', [String(id)]);
  return streamNodeFromRow(rows[0]);
}

export async function findStreamNodeByIp(ip) {
  if (!String(ip || '').trim()) return null;
  const rows = await mariaPool.query(
    'SELECT * FROM stream_nodes WHERE LOWER(ip_address)=LOWER(?) ORDER BY updated_at DESC LIMIT 1',
    [String(ip).trim()]
  );
  return streamNodeFromRow(rows[0]);
}

export async function markOfflineStreamNodes(offlineAfterSeconds = streamNodeOfflineAfterSeconds()) {
  const seconds = positiveInt(offlineAfterSeconds, streamNodeOfflineAfterSeconds(), 30, 86400);
  const result = await mariaPool.query(
    `UPDATE stream_nodes
     SET status='Fuera de línea'
     WHERE status<>'Mantenimiento'
       AND last_seen_at IS NOT NULL
       AND last_seen_at < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL ? SECOND)`,
    [seconds]
  );
  return Number(result.affectedRows || 0);
}

export async function listStreamNodes({ offlineAfterSeconds = streamNodeOfflineAfterSeconds() } = {}) {
  await markOfflineStreamNodes(offlineAfterSeconds);
  const rows = await mariaPool.query('SELECT * FROM stream_nodes ORDER BY created_at ASC');
  return rows.map(streamNodeFromRow);
}

export async function upsertStreamNode(item, { matchByIp = true } = {}) {
  const requestedId = String(item.id || '').trim();
  const ip = String(item.ip || '').trim();
  let current = requestedId ? await getStreamNode(requestedId) : null;
  if (!current && matchByIp && ip) current = await findStreamNodeByIp(ip);

  const id = current?.id || requestedId;
  if (!id) throw new Error('El nodo requiere un ID estable.');

  const effectiveLastSeenAt = item.lastSeenAt ?? current?.lastSeenAt ?? null;
  const parsedLastSeenAt = effectiveLastSeenAt ? new Date(effectiveLastSeenAt) : null;
  const params = [
    id,
    String(item.name || current?.name || '').trim(),
    ['main', 'sub', 'edge'].includes(item.role) ? item.role : (current?.role || 'sub'),
    ['En línea', 'Fuera de línea', 'Degradado', 'Mantenimiento'].includes(item.status)
      ? item.status
      : (current?.status || 'Fuera de línea'),
    ip || current?.ip || '',
    String(item.apiBaseUrl ?? current?.apiBaseUrl ?? '').trim(),
    String(item.region ?? current?.region ?? '').trim(),
    String(item.capacity ?? current?.capacity ?? '').trim(),
    jsonValue(item.capabilities ?? current?.capabilities ?? []),
    String(item.version ?? current?.version ?? '').trim(),
    String(item.notes ?? current?.notes ?? '').trim(),
    nullableNumber(item.cpu ?? current?.cpu),
    nullableNumber(item.ram ?? current?.ram),
    nullableNumber(item.disk ?? current?.disk),
    nullableNumber(item.load ?? current?.load),
    Math.max(0, Number(item.activeStreams ?? current?.activeStreams ?? 0)),
    Math.max(0, Number(item.uptime ?? current?.uptime ?? 0)),
    parsedLastSeenAt && !Number.isNaN(parsedLastSeenAt.getTime()) ? parsedLastSeenAt : null
  ];

  await mariaPool.query(
    `INSERT INTO stream_nodes (
      id,name,role,status,ip_address,api_base_url,region,capacity,capabilities,version,notes,
      cpu_percent,ram_percent,disk_percent,load_avg,active_streams,uptime_seconds,last_seen_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      name=VALUES(name), role=VALUES(role), status=VALUES(status), ip_address=VALUES(ip_address),
      api_base_url=VALUES(api_base_url), region=VALUES(region), capacity=VALUES(capacity),
      capabilities=VALUES(capabilities), version=VALUES(version), notes=VALUES(notes),
      cpu_percent=VALUES(cpu_percent), ram_percent=VALUES(ram_percent), disk_percent=VALUES(disk_percent),
      load_avg=VALUES(load_avg), active_streams=VALUES(active_streams), uptime_seconds=VALUES(uptime_seconds),
      last_seen_at=VALUES(last_seen_at)`,
    params
  );

  return { node: await getStreamNode(id), created: !current, canonicalId: id };
}

export async function recordStreamNodeHeartbeat(id, item) {
  let current = await getStreamNode(id);
  if (!current && item?.ip) current = await findStreamNodeByIp(item.ip);
  if (!current) return null;

  const now = new Date();
  const merged = {
    ...current,
    ...item,
    id: current.id,
    status: item.status === 'Mantenimiento' ? 'Mantenimiento' : (item.status === 'Degradado' ? 'Degradado' : 'En línea'),
    lastSeenAt: now.toISOString()
  };
  const { node } = await upsertStreamNode(merged, { matchByIp: false });

  await mariaPool.query(
    `INSERT INTO stream_node_heartbeats (
      node_id,status,cpu_percent,ram_percent,disk_percent,load_avg,active_streams,uptime_seconds,version
    ) VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      node.id,
      node.status,
      nullableNumber(node.cpu),
      nullableNumber(node.ram),
      nullableNumber(node.disk),
      nullableNumber(node.load),
      Math.max(0, Number(node.activeStreams || 0)),
      Math.max(0, Number(node.uptime || 0)),
      String(node.version || '')
    ]
  );

  return node;
}

export async function listStreamNodeHeartbeats(nodeId, limit = 120) {
  const safeLimit = positiveInt(limit, 120, 1, 1000);
  const rows = await mariaPool.query(
    `SELECT id,node_id,status,cpu_percent,ram_percent,disk_percent,load_avg,
            active_streams,uptime_seconds,version,received_at
     FROM stream_node_heartbeats
     WHERE node_id=?
     ORDER BY received_at DESC
     LIMIT ?`,
    [String(nodeId), safeLimit]
  );
  return rows.map((row) => ({
    id: Number(row.id),
    nodeId: String(row.node_id),
    status: String(row.status),
    cpu: nullableNumber(row.cpu_percent),
    ram: nullableNumber(row.ram_percent),
    disk: nullableNumber(row.disk_percent),
    load: nullableNumber(row.load_avg),
    activeStreams: Math.max(0, Number(row.active_streams || 0)),
    uptime: Math.max(0, Number(row.uptime_seconds || 0)),
    version: String(row.version || ''),
    receivedAt: iso(row.received_at)
  }));
}

export async function deleteStreamNode(id) {
  const result = await mariaPool.query('DELETE FROM stream_nodes WHERE id=?', [String(id)]);
  return result.affectedRows > 0;
}

export async function pruneStreamNodeHeartbeats(retentionDays = streamNodeHeartbeatRetentionDays()) {
  const days = positiveInt(retentionDays, streamNodeHeartbeatRetentionDays(), 1, 365);
  const result = await mariaPool.query(
    'DELETE FROM stream_node_heartbeats WHERE received_at < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL ? DAY)',
    [days]
  );
  return Number(result.affectedRows || 0);
}

export async function setStreamDesiredState(channelId, state) {
  const desired = state === 'running' ? 'running' : 'stopped';
  await mariaPool.query(
    `INSERT INTO stream_runtime (channel_id,desired_state) VALUES (?,?)
     ON DUPLICATE KEY UPDATE desired_state=VALUES(desired_state)`,
    [String(channelId), desired]
  );
  return desired;
}

export async function getStreamDesiredState(channelId) {
  const rows = await mariaPool.query('SELECT desired_state FROM stream_runtime WHERE channel_id=?', [String(channelId)]);
  return rows[0]?.desired_state || 'stopped';
}

export async function listDesiredRunningStreams() {
  const rows = await mariaPool.query(
    `SELECT channel_id FROM stream_runtime WHERE desired_state='running' ORDER BY updated_at ASC`
  );
  return rows.map((row) => String(row.channel_id));
}
