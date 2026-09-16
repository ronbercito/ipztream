// IPZStream secure entry — 2026-09-15
// Update: adds the authenticated update-center API while preserving existing auth, HLS and stream routes.
// Receives browser requests, validates RBAC, and delegates fixed update operations to update-service.js.

import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { URL } from 'node:url';
import { ensureAuthSchema, authenticate, getSessionUser, destroySession, serializeSessionCookie, clearSessionCookie, hasPermission, permissionForRequest } from './auth.js';
import { addAudit } from './db.js';
import { ensureUserSchema, listUsers, createUser, updateUser, deleteUser } from './user-service.js';
import { ensureClientSessionSchema, authenticateClient, createClientSession, getClientSession, destroyClientSession, clientSessionCookie, clearClientSessionCookie, getClientToken, publicClient } from './client-auth.js';
import { assertFfmpeg, getStream, listStreams, startStream, stopStream, restartStream } from './stream-manager.js';
import { getUpdateStatus, installUpdate } from './update-service.js';

const PUBLIC_PORT = Number(process.env.IPZTREAM_API_PORT || 3100);
const INTERNAL_PORT = Number(process.env.IPZTREAM_INTERNAL_API_PORT || 3101);
const HOST = process.env.IPZTREAM_API_HOST || '127.0.0.1';
const STREAM_ROOT = path.resolve(process.env.IPZTREAM_STREAM_ROOT || '/var/lib/ipztream/streams');

function send(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': process.env.IPZTREAM_CORS_ORIGIN || '*',
    'Access-Control-Allow-Credentials': 'true',
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  if (body.length > 64 * 1024) throw new Error('Solicitud demasiado grande.');
  if (!body) return {};
  return JSON.parse(body);
}

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '').split(',')[0].trim();
}

function sessionToken(req) {
  return decodeURIComponent((req.headers.cookie || '').match(/(?:^|;\s*)ipztream_session=([^;]+)/)?.[1] || '');
}

function safeStreamPath(channelId, filename) {
  if (!/^[A-Za-z0-9_-]{1,191}$/.test(channelId)) return null;
  if (filename !== 'index.m3u8' && !/^segment_[0-9]{6}\.ts$/.test(filename)) return null;
  const root = path.resolve(STREAM_ROOT);
  const outputDir = path.resolve(root, channelId);
  const filePath = path.resolve(outputDir, filename);
  if (outputDir !== root && !outputDir.startsWith(`${root}${path.sep}`)) return null;
  if (!filePath.startsWith(`${outputDir}${path.sep}`)) return null;
  return filePath;
}

async function handleHls(req, res, pathname) {
  if (!['GET', 'HEAD'].includes(req.method)) return false;
  const match = pathname.match(/^\/streams\/([^/]+)\/(index\.m3u8|segment_[0-9]{6}\.ts)$/);
  if (!match) return false;

  const channelId = decodeURIComponent(match[1]);
  const filename = match[2];
  const filePath = safeStreamPath(channelId, filename);
  if (!filePath) return send(res, 400, { message: 'Ruta HLS no válida.' });

  const stream = getStream(channelId);
  if (!stream || !['starting', 'running'].includes(stream.status)) {
    return send(res, 404, { message: 'Stream no disponible.' });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return send(res, 404, { message: 'Archivo HLS no encontrado.' });
    const contentType = filename === 'index.m3u8' ? 'application/vnd.apple.mpegurl' : 'video/mp2t';
    const headers = {
      'Content-Type': contentType,
      'Content-Length': String(info.size),
      'Cache-Control': filename === 'index.m3u8' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=10',
      'Access-Control-Allow-Origin': process.env.IPZTREAM_CORS_ORIGIN || '*',
      'Access-Control-Allow-Credentials': 'true'
    };
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    return createReadStream(filePath).pipe(res);
  } catch (error) {
    if (error.code === 'ENOENT') return send(res, 404, { message: 'Archivo HLS no encontrado.' });
    throw error;
  }
}

function proxyRequest(req, res, body) {
  const options = {
    hostname: HOST,
    port: INTERNAL_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `${HOST}:${INTERNAL_PORT}`, 'x-real-ip': clientIp(req) }
  };
  delete options.headers['content-length'];
  const proxy = http.request(options, (upstream) => {
    const headers = { ...upstream.headers, 'cache-control': 'no-store' };
    res.writeHead(upstream.statusCode || 502, headers);
    upstream.pipe(res);
  });
  proxy.on('error', (error) => send(res, 502, { message: `API interna no disponible: ${error.message}` }));
  if (body?.length) proxy.write(body);
  proxy.end();
}

async function handleUserApi(req, res, user) {
  const pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  const match = pathname.match(/^\/api\/users(?:\/([^/]+))?$/);
  if (!match) return false;
  const id = match[1] ? decodeURIComponent(match[1]) : null;
  const actor = user.username;
  try {
    if (req.method === 'GET' && !id) return send(res, 200, { users: await listUsers() });
    if (req.method === 'POST' && !id) return send(res, 201, await createUser(await readBody(req), actor));
    if (req.method === 'PUT' && id) {
      const updated = await updateUser(id, await readBody(req), actor);
      return send(res, updated ? 200 : 404, updated || { message: 'Usuario no encontrado.' });
    }
    if (req.method === 'DELETE' && id) return send(res, (await deleteUser(id, actor)) ? 200 : 404, { ok: true });
    return send(res, 405, { message: 'Método no permitido.' });
  } catch (error) {
    return send(res, error.status || 400, { message: error.message || 'No se pudo procesar el usuario.' });
  }
}

async function handleClientApi(req, res, pathname) {
  try {
    if (pathname === '/api/client/login' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.username || body.password === undefined) return send(res, 400, { message: 'Usuario y contraseña son obligatorios.' });
      const user = await authenticateClient(body.username, body.password);
      if (!user) {
        await addAudit({ action: 'CLIENT_LOGIN_FAILED', module: 'client-auth', actor: String(body.username || '').slice(0, 191), detail: 'Credenciales inválidas o cliente no activo', metadata: { ip: clientIp(req) } });
        return send(res, 401, { message: 'Usuario o contraseña incorrectos, o cliente no activo.' });
      }
      const session = await createClientSession(user, user.username);
      return send(res, 200, { client: publicClient(user), expiresAt: session.expiresAt }, { 'Set-Cookie': clientSessionCookie(session.token) });
    }

    if (pathname === '/api/client/me' && req.method === 'GET') {
      const session = await getClientSession(getClientToken(req));
      if (!session) return send(res, 401, { message: 'Sesión de cliente no válida o expirada.' });
      return send(res, 200, { client: publicClient(session.user) });
    }

    if (pathname === '/api/client/logout' && req.method === 'POST') {
      await destroyClientSession(getClientToken(req));
      return send(res, 200, { ok: true }, { 'Set-Cookie': clearClientSessionCookie() });
    }

    if (pathname.startsWith('/api/client/')) return send(res, 404, { message: 'Ruta de cliente no encontrada.' });
    return false;
  } catch (error) {
    return send(res, error.status || 400, { message: error.message || 'No se pudo procesar la sesión del cliente.' });
  }
}

async function handleStreamApi(req, res, pathname, user) {
  try {
    if (pathname === '/api/streams' && req.method === 'GET') {
      return send(res, 200, { ffmpeg: await assertFfmpeg(), streams: listStreams() });
    }

    const stateMatch = pathname.match(/^\/api\/streams\/([^/]+)$/);
    if (stateMatch && req.method === 'GET') {
      return send(res, 200, { stream: getStream(decodeURIComponent(stateMatch[1])) });
    }

    const actionMatch = pathname.match(/^\/api\/streams\/([^/]+)\/(start|stop|restart)$/);
    if (actionMatch && req.method === 'POST') {
      const channelId = decodeURIComponent(actionMatch[1]);
      const action = actionMatch[2];
      const stream = action === 'start'
        ? await startStream(channelId)
        : action === 'stop'
          ? await stopStream(channelId)
          : await restartStream(channelId);
      await addAudit({ action: `STREAM_${action.toUpperCase()}`, module: 'streaming', actor: user.username, detail: `Canal ${channelId}`, metadata: { channelId, status: stream.status } });
      return send(res, 200, { stream });
    }

    return false;
  } catch (error) {
    return send(res, error.status || 500, { message: error.message || 'No se pudo controlar el stream.' });
  }
}

async function handleUpdateApi(req, res, pathname, user) {
  if (!pathname.startsWith('/api/update')) return false;
  try {
    if (pathname === '/api/update/status' && req.method === 'GET') {
      return send(res, 200, await getUpdateStatus());
    }
    if (pathname === '/api/update/install' && req.method === 'POST') {
      const result = await installUpdate();
      await addAudit({ action: result.installed ? 'SYSTEM_UPDATE' : 'SYSTEM_UPDATE_CHECK', module: 'system-update', actor: user.username, detail: result.message, metadata: { previousRevision: result.previousRevision || null, installedRevision: result.installedRevision || null } });
      return send(res, result.installed ? 202 : 200, result);
    }
    return send(res, 404, { message: 'Ruta de actualización no encontrada.' });
  } catch (error) {
    await addAudit({ action: 'SYSTEM_UPDATE_FAILED', module: 'system-update', actor: user.username, detail: error.message || 'Error de actualización', metadata: { status: error.status || 500 } });
    return send(res, error.status || 500, { message: error.message || 'No se pudo actualizar IPZStream.', details: error.details || null });
  }
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': process.env.IPZTREAM_CORS_ORIGIN || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  if (pathname.startsWith('/api/client/')) {
    const handled = await handleClientApi(req, res, pathname);
    if (handled !== false) return;
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch { return send(res, 400, { message: 'JSON de login inválido.' }); }
    if (!body.username || !body.password) return send(res, 400, { message: 'Usuario y contraseña son obligatorios.' });
    const result = await authenticate(body.username, body.password, { ip: clientIp(req), userAgent: req.headers['user-agent'] || '' });
    if (!result) {
      await addAudit({ action: 'LOGIN_FAILED', module: 'auth', actor: String(body.username || '').slice(0, 191), detail: 'Credenciales inválidas', metadata: { ip: clientIp(req) } });
      return send(res, 401, { message: 'Usuario o contraseña incorrectos.' });
    }
    await addAudit({ action: 'LOGIN', module: 'auth', actor: result.user.username, detail: 'Inicio de sesión correcto', metadata: { ip: clientIp(req), role: result.user.roleName } });
    return send(res, 200, { user: result.user }, { 'Set-Cookie': serializeSessionCookie(result.token) });
  }

  if (pathname === '/api/auth/me' && req.method === 'GET') {
    const user = await getSessionUser(sessionToken(req));
    if (!user) return send(res, 401, { message: 'No autenticado.' });
    return send(res, 200, { user });
  }

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const token = sessionToken(req);
    const user = await getSessionUser(token);
    await destroySession(token);
    if (user) await addAudit({ action: 'LOGOUT', module: 'auth', actor: user.username, detail: 'Cierre de sesión', metadata: { ip: clientIp(req) } });
    return send(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
  }

  if (pathname === '/api/health') return proxyRequest(req, res);

  const user = await getSessionUser(sessionToken(req));
  if (!user) return send(res, 401, { message: 'Autenticación requerida.' });

  if (pathname.startsWith('/api/update')) {
    if (!hasPermission(user, 'system.update')) return send(res, 403, { message: 'No tienes permiso para actualizar IPZStream.', permission: 'system.update' });
    const handled = await handleUpdateApi(req, res, pathname, user);
    if (handled !== false) return;
  }

  if (pathname.startsWith('/streams/')) {
    const handled = await handleHls(req, res, pathname);
    if (handled !== false) return;
  }

  const permission = pathname.startsWith('/api/streams')
    ? (req.method === 'GET' ? 'channels.view' : 'channels.update')
    : permissionForRequest(req.method, pathname);
  if (permission && !hasPermission(user, permission)) return send(res, 403, { message: 'No tienes permiso para realizar esta acción.', permission });

  if (pathname.startsWith('/api/streams')) {
    const handled = await handleStreamApi(req, res, pathname, user);
    if (handled !== false) return;
  }

  if (pathname === '/api/users' || pathname.startsWith('/api/users/')) return handleUserApi(req, res, user);

  let body = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = Buffer.from(await new Promise((resolve, reject) => {
      const chunks = [];
      let size = 0;
      req.on('data', (chunk) => { size += chunk.length; if (size > 64 * 1024) reject(new Error('Solicitud demasiado grande.')); else chunks.push(chunk); });
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    }));
  }
  req.headers['x-ipztream-actor'] = user.username;
  req.headers['x-ipztream-role'] = user.roleName;
  proxyRequest(req, res, body);
}

await ensureAuthSchema();
await ensureUserSchema();
await ensureClientSessionSchema();
process.env.IPZTREAM_API_PORT = String(INTERNAL_PORT);
await import('./index.js');

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error(error);
    send(res, 500, { message: error.message || 'Error interno del servidor.' });
  });
});

server.listen(PUBLIC_PORT, HOST, () => console.log(`IPZStream Secure API escuchando en http://${HOST}:${PUBLIC_PORT}; API interna en ${INTERNAL_PORT}`));
