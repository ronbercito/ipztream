import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { authenticateClient } from './client-auth.js';
import {
  channelsForUser,
  liveCategoriesForUser,
  liveStreamsForUser,
  epgForChannel,
  getAllowedChannel,
  touchPlayback
} from './iptv-service.js';

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}
function sendText(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store', 'Content-Length': String(Buffer.byteLength(body)) });
  res.end(body);
}
function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '').split(',')[0].trim();
}
function publicBase(req) {
  const proto = String(req.headers['x-forwarded-proto'] || (process.env.IPZTREAM_PUBLIC_HTTPS === 'true' ? 'https' : 'http')).split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost').split(',')[0].trim();
  return `${proto}://${host}`;
}
function safeStreamPath(root, channelId, file) {
  if (!/^[A-Za-z0-9._:-]{1,191}$/.test(channelId)) return null;
  if (!(file === 'index.m3u8' || /^segment_[0-9]{6}\.ts$/.test(file))) return null;
  const base = path.resolve(root);
  const dir = path.resolve(base, channelId);
  const target = path.resolve(dir, file);
  return target.startsWith(`${dir}${path.sep}`) ? target : null;
}
async function authenticate(url) {
  const username = url.searchParams.get('username') || '';
  const password = url.searchParams.get('password') || '';
  if (!username || !password) return null;
  return authenticateClient(username, password);
}
function userInfo(user, activeCons = 0) {
  const exp = user.expiresAt ? Math.floor(new Date(`${user.expiresAt}T23:59:59Z`).getTime() / 1000) : null;
  return {
    auth: 1,
    status: 'Active',
    username: user.username,
    password: '',
    exp_date: exp ? String(exp) : null,
    is_trial: '0',
    active_cons: String(activeCons),
    created_at: '0',
    max_connections: String(Math.max(1, Number(user.maxConnections || 1))),
    allowed_output_formats: ['m3u8', 'ts']
  };
}
function serverInfo(req) {
  const base = new URL(publicBase(req));
  return {
    url: base.hostname,
    port: base.port || (base.protocol === 'https:' ? '443' : '80'),
    https_port: base.protocol === 'https:' ? (base.port || '443') : '443',
    server_protocol: base.protocol.replace(':', ''),
    rtmp_port: '0',
    timezone: 'America/Lima',
    timestamp_now: Math.floor(Date.now() / 1000),
    time_now: new Date().toISOString()
  };
}
async function handlePlayerApi(req, res, url) {
  const user = await authenticate(url);
  if (!user) return sendJson(res, 200, { user_info: { auth: 0, status: 'Disabled' }, server_info: serverInfo(req) });
  const action = url.searchParams.get('action') || '';
  if (!action) return sendJson(res, 200, { user_info: userInfo(user), server_info: serverInfo(req) });
  if (action === 'get_live_categories') return sendJson(res, 200, await liveCategoriesForUser(user));
  if (action === 'get_live_streams') {
    const categories = await liveCategoriesForUser(user);
    const categoryId = String(url.searchParams.get('category_id') || '');
    const category = categories.find((item) => String(item.category_id) === categoryId);
    return sendJson(res, 200, await liveStreamsForUser(user, category?.category_name || ''));
  }
  if (action === 'get_short_epg') {
    const streamId = String(url.searchParams.get('stream_id') || '');
    if (!(await getAllowedChannel(user, streamId))) return sendJson(res, 200, { epg_listings: [] });
    const rows = await epgForChannel(streamId, Number(url.searchParams.get('limit') || 10));
    return sendJson(res, 200, { epg_listings: rows.map((item, index) => ({
      id: String(item.id || index + 1),
      epg_id: String(item.epgId || ''),
      title: Buffer.from(String(item.title || ''), 'utf8').toString('base64'),
      lang: 'es',
      start: item.start || '',
      end: item.end || '',
      description: Buffer.from(String(item.description || ''), 'utf8').toString('base64'),
      channel_id: streamId,
      start_timestamp: item.start ? Math.floor(new Date(item.start).getTime() / 1000) : 0,
      stop_timestamp: item.end ? Math.floor(new Date(item.end).getTime() / 1000) : 0
    })) });
  }
  return sendJson(res, 200, []);
}
async function handlePlaylist(req, res, url) {
  const user = await authenticate(url);
  if (!user) return sendText(res, 401, 'Credenciales IPTV no válidas.');
  const username = url.searchParams.get('username') || '';
  const password = url.searchParams.get('password') || '';
  const output = String(url.searchParams.get('output') || 'm3u8').toLowerCase() === 'ts' ? 'ts' : 'm3u8';
  const channels = await channelsForUser(user);
  const base = publicBase(req);
  const lines = ['#EXTM3U'];
  for (const channel of channels) {
    const logo = String(channel.logo || '').replace(/"/g, '&quot;');
    const group = String(channel.category || 'Sin categoría').replace(/"/g, '&quot;');
    lines.push(`#EXTINF:-1 tvg-id="${channel.epgId || ''}" tvg-logo="${logo}" group-title="${group}",${channel.name}`);
    lines.push(`${base}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${encodeURIComponent(channel.id)}.${output}`);
  }
  return sendText(res, 200, `${lines.join('\n')}\n`, 'audio/x-mpegurl; charset=utf-8');
}
async function authPathUser(username, password) {
  return authenticateClient(decodeURIComponent(username), decodeURIComponent(password));
}
async function serveLive(req, res, url, streamRoot) {
  const playlist = url.pathname.match(/^\/live\/([^/]+)\/([^/]+)\/([^/]+)\.m3u8$/);
  const segment = url.pathname.match(/^\/live\/([^/]+)\/([^/]+)\/([^/]+)\/(segment_[0-9]{6}\.ts)$/);
  const match = playlist || segment;
  if (!match) return false;
  const [, rawUser, rawPass, rawChannel] = match;
  const user = await authPathUser(rawUser, rawPass);
  if (!user) return sendText(res, 401, 'Credenciales IPTV no válidas.');
  const channelId = decodeURIComponent(rawChannel);
  const channel = await getAllowedChannel(user, channelId);
  if (!channel) return sendText(res, 403, 'Canal no autorizado.');
  await touchPlayback(user, channel, { ip: clientIp(req), userAgent: req.headers['user-agent'] || '' });

  if (transport) {
    const location = `/live/${rawUser}/${rawPass}/${encodeURIComponent(channelId)}.m3u8`;
    res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' });
    return res.end();
  }

  if (playlist) {
    const filePath = safeStreamPath(streamRoot, channelId, 'index.m3u8');
    if (!filePath) return sendText(res, 400, 'Ruta de canal no válida.');
    try {
      let body = await readFile(filePath, 'utf8');
      const base = `/live/${rawUser}/${rawPass}/${encodeURIComponent(channelId)}`;
      body = body.replace(/^(segment_[0-9]{6}\.ts)$/gm, `${base}/$1`);
      return sendText(res, 200, body, 'application/vnd.apple.mpegurl');
    } catch {
      return sendText(res, 404, 'Stream no disponible.');
    }
  }

  const file = match[4];
  const filePath = safeStreamPath(streamRoot, channelId, file);
  if (!filePath) return sendText(res, 400, 'Segmento no válido.');
  try {
    const info = await stat(filePath);
    res.writeHead(200, { 'Content-Type': 'video/mp2t', 'Content-Length': String(info.size), 'Cache-Control': 'public, max-age=5' });
    return req.method === 'HEAD' ? res.end() : createReadStream(filePath).pipe(res);
  } catch {
    return sendText(res, 404, 'Segmento no disponible.');
  }
}

export async function handleIptvHttp(req, res, url, { streamRoot }) {
  if (!['GET', 'HEAD'].includes(req.method)) return false;
  if (url.pathname === '/player_api.php') return handlePlayerApi(req, res, url);
  if (url.pathname === '/get.php') return handlePlaylist(req, res, url);
  if (url.pathname.startsWith('/live/')) return serveLive(req, res, url, streamRoot);
  return false;
}
