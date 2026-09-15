import http from 'node:http';
import { URL } from 'node:url';
import { ensureAuthSchema, authenticate, getSessionUser, destroySession, serializeSessionCookie, clearSessionCookie, hasPermission, permissionForRequest } from './auth.js';
import { addAudit } from './db.js';
import { ensureUserSchema, listUsers, createUser, updateUser, deleteUser } from './user-service.js';

const PUBLIC_PORT = Number(process.env.IPZTREAM_API_PORT || 3100);
const INTERNAL_PORT = Number(process.env.IPZTREAM_INTERNAL_API_PORT || 3101);
const HOST = process.env.IPZTREAM_API_HOST || '127.0.0.1';

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

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': process.env.IPZTREAM_CORS_ORIGIN || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
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

  const permission = permissionForRequest(req.method, pathname);
  if (permission && !hasPermission(user, permission)) return send(res, 403, { message: 'No tienes permiso para realizar esta acción.', permission });

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
process.env.IPZTREAM_API_PORT = String(INTERNAL_PORT);
await import('./index.js');

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error(error);
    send(res, 500, { message: error.message || 'Error interno del servidor.' });
  });
});

server.listen(PUBLIC_PORT, HOST, () => console.log(`IPZStream Secure API escuchando en http://${HOST}:${PUBLIC_PORT}; API interna en ${INTERNAL_PORT}`));
