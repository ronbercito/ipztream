import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { pool, addAudit } from './db.js';
import { verifyPassword } from './auth.js';

const SESSION_TTL_SECONDS = Number(process.env.IPZTREAM_CLIENT_SESSION_TTL || 86400);

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function publicClient(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    status: user.status,
    packageId: user.package_id,
    maxConnections: user.max_connections,
    expiresAt: user.expires_at
  };
}

function normalizeClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    status: row.status,
    package_id: row.package_id,
    max_connections: row.max_connections,
    expires_at: row.expires_at
  };
}

export async function authenticateClient(username, password) {
  const [result] = await Promise.all([
    pool.query(`SELECT u.id, u.username, u.name, u.status, u.package_id, u.max_connections, u.expires_at, c.password_hash
      FROM users u
      LEFT JOIN user_credentials c ON c.user_id = u.id
      WHERE u.username = ? LIMIT 1`, [String(username || '').trim()])
  ]);
  const user = normalizeClient(result.rows?.[0]);
  const passwordHash = result.rows?.[0]?.password_hash;
  if (!user || !passwordHash) return null;
  if (!(await verifyPassword(String(password || ''), passwordHash))) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (user.status === 'Suspendido' || user.expires_at < today) return null;
  return user;
}

export async function createClientSession(user, actor = 'client') {
  const token = randomBytes(32).toString('base64url');
  const hash = tokenHash(token);
  const id = randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await pool.query(`INSERT INTO client_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`, [id, user.id, hash, expiresAt]);
  await addAudit({ action: 'CLIENT_LOGIN', module: 'client-auth', actor, detail: `Inicio de sesión de ${user.username}` });
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function getClientSession(token) {
  if (!token) return null;
  const hash = tokenHash(token);
  const result = await pool.query(`SELECT s.id AS session_id, u.id, u.username, u.name, u.status, u.package_id, u.max_connections, u.expires_at
    FROM client_sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP LIMIT 1`, [hash]);
  const row = result.rows?.[0];
  if (!row) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (row.status === 'Suspendido' || row.expires_at < today) return null;
  return { sessionId: row.session_id, user: normalizeClient(row) };
}

export async function destroyClientSession(token, actor = 'client') {
  if (!token) return false;
  const session = await getClientSession(token);
  const result = await pool.query('DELETE FROM client_sessions WHERE token_hash = ?', [tokenHash(token)]);
  if (result.affectedRows && session) {
    await addAudit({ action: 'CLIENT_LOGOUT', module: 'client-auth', actor, detail: `Cierre de sesión de ${session.user.username}` });
  }
  return Boolean(result.affectedRows);
}

export function clientSessionCookie(token, maxAge = SESSION_TTL_SECONDS) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `ipztream_client_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/api/client; Max-Age=${maxAge}${secure}`;
}

export function clearClientSessionCookie() {
  return 'ipztream_client_session=; HttpOnly; SameSite=Strict; Path=/api/client; Max-Age=0';
}

export function getClientToken(req) {
  const cookie = String(req.headers.cookie || '');
  const match = cookie.match(/(?:^|;\s*)ipztream_client_session=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  const auth = String(req.headers.authorization || '');
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

export { publicClient, timingSafeEqual };
