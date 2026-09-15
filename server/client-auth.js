import { createHash, randomBytes } from 'node:crypto';
import { pool, addAudit } from './db.js';
import { verifyPassword } from './auth.js';

const SESSION_TTL_SECONDS = Number(process.env.IPZTREAM_CLIENT_SESSION_TTL || 86400);

function tokenHash(token) {
  return createHash('sha256').update(String(token || ''), 'utf8').digest('hex');
}

function normalizeClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    status: row.status,
    packageId: row.packageId,
    package: row.packageName || null,
    maxConnections: Number(row.maxConnections || 1),
    expiresAt: row.expiresAt
  };
}

function clientQuery() {
  return `SELECT
    u.id,
    JSON_UNQUOTE(JSON_EXTRACT(u.payload, '$.username')) AS username,
    JSON_UNQUOTE(JSON_EXTRACT(u.payload, '$.name')) AS name,
    JSON_UNQUOTE(JSON_EXTRACT(u.payload, '$.status')) AS status,
    JSON_UNQUOTE(JSON_EXTRACT(u.payload, '$.packageId')) AS packageId,
    JSON_UNQUOTE(JSON_EXTRACT(u.payload, '$.package')) AS packageName,
    CAST(JSON_UNQUOTE(JSON_EXTRACT(u.payload, '$.maxConnections')) AS UNSIGNED) AS maxConnections,
    JSON_UNQUOTE(JSON_EXTRACT(u.payload, '$.expiresAt')) AS expiresAt,
    c.password_hash
  FROM users u
  LEFT JOIN user_credentials c ON c.user_id = u.id`;
}

function isClientActive(user) {
  if (!user) return false;
  const today = new Date().toISOString().slice(0, 10);
  return user.status !== 'Suspendido' && (!user.expiresAt || user.expiresAt >= today);
}

export async function ensureClientSessionSchema() {
  await pool.query(`CREATE TABLE IF NOT EXISTS client_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_client_sessions_user (user_id),
    INDEX idx_client_sessions_expiry (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await pool.query('DELETE FROM client_sessions WHERE expires_at <= CURRENT_TIMESTAMP');
}

export async function authenticateClient(username, password) {
  const result = await pool.query(`${clientQuery()} WHERE LOWER(JSON_UNQUOTE(JSON_EXTRACT(u.payload, '$.username'))) = LOWER(?) LIMIT 1`, [String(username || '').trim()]);
  const row = result.rows?.[0];
  const user = normalizeClient(row);
  if (!user || !row.password_hash) return null;
  if (!(await verifyPassword(String(password || ''), row.password_hash))) return null;
  if (!isClientActive(user)) return null;
  return user;
}

export async function createClientSession(user, actor = 'client') {
  const token = randomBytes(32).toString('base64url');
  const id = randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await pool.query('INSERT INTO client_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)', [id, user.id, tokenHash(token), expiresAt]);
  await addAudit({ action: 'CLIENT_LOGIN', module: 'client-auth', actor, detail: `Inicio de sesión de ${user.username}` });
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function getClientSession(token) {
  if (!token) return null;
  const result = await pool.query(`${clientQuery()} JOIN client_sessions s ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP LIMIT 1`, [tokenHash(token)]);
  const row = result.rows?.[0];
  const user = normalizeClient(row);
  if (!row || !user || !isClientActive(user)) return null;
  return { sessionId: row.session_id, user };
}

export async function destroyClientSession(token, actor = 'client') {
  if (!token) return false;
  const session = await getClientSession(token);
  const result = await pool.query('DELETE FROM client_sessions WHERE token_hash = ?', [tokenHash(token)]);
  if (result.affectedRows && session) await addAudit({ action: 'CLIENT_LOGOUT', module: 'client-auth', actor, detail: `Cierre de sesión de ${session.user.username}` });
  return Boolean(result.affectedRows);
}

export function clientSessionCookie(token, maxAge = SESSION_TTL_SECONDS) {
  const secure = process.env.IPZTREAM_COOKIE_SECURE === 'true' ? '; Secure' : '';
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
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
}

export function publicClient(user) {
  return normalizeClient({
    ...user,
    packageId: user.packageId,
    packageName: user.package,
    maxConnections: user.maxConnections,
    expiresAt: user.expiresAt
  });
}
