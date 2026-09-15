import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { pool } from './db.js';

const scrypt = promisify(scryptCallback);
const SESSION_TTL_SECONDS = Number(process.env.IPZTREAM_SESSION_TTL || 60 * 60 * 8);
const COOKIE_NAME = 'ipztream_session';
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;

export const AUTH_COOKIE = COOKIE_NAME;

const permissions = [
  ['dashboard.view', 'Ver dashboard'],
  ['users.view', 'Ver usuarios'], ['users.create', 'Crear usuarios'], ['users.update', 'Editar usuarios'], ['users.delete', 'Eliminar usuarios'],
  ['nodes.view', 'Ver nodos'], ['nodes.create', 'Crear nodos'], ['nodes.update', 'Editar nodos'], ['nodes.delete', 'Eliminar nodos'],
  ['channels.view', 'Ver canales'], ['channels.create', 'Crear canales'], ['channels.update', 'Editar canales'], ['channels.delete', 'Eliminar canales'],
  ['vod.view', 'Ver VOD'], ['vod.create', 'Crear VOD'], ['vod.update', 'Editar VOD'], ['vod.delete', 'Eliminar VOD'],
  ['series.view', 'Ver series'], ['series.create', 'Crear series'], ['series.update', 'Editar series'], ['series.delete', 'Eliminar series'],
  ['epg.view', 'Ver EPG'], ['epg.create', 'Crear EPG'], ['epg.update', 'Editar EPG'], ['epg.delete', 'Eliminar EPG'],
  ['m3u.view', 'Ver M3U'], ['m3u.create', 'Crear M3U'], ['m3u.update', 'Editar M3U'], ['m3u.delete', 'Eliminar M3U'],
  ['packages.view', 'Ver paquetes'], ['packages.create', 'Crear paquetes'], ['packages.update', 'Editar paquetes'], ['packages.delete', 'Eliminar paquetes'],
  ['connections.view', 'Ver conexiones'], ['connections.update', 'Gestionar conexiones'],
  ['devices.view', 'Ver dispositivos'], ['devices.update', 'Gestionar dispositivos'],
  ['audit.view', 'Ver auditoría'], ['statistics.view', 'Ver estadísticas'],
  ['settings.view', 'Ver configuración'], ['settings.update', 'Modificar configuración'],
  ['auth.manage', 'Administrar autenticación']
];

const roles = [
  ['superadmin', 'Acceso total a IPZStream'],
  ['admin', 'Administración general'],
  ['operator', 'Operación diaria'],
  ['viewer', 'Solo lectura']
];

const permissionGroups = {
  superadmin: permissions.map(([code]) => code),
  admin: permissions.filter(([code]) => code !== 'auth.manage').map(([code]) => code),
  operator: permissions.filter(([code]) => /\.view$/.test(code) || ['connections.update', 'devices.update'].includes(code)).map(([code]) => code),
  viewer: permissions.filter(([code]) => /\.view$/.test(code)).map(([code]) => code)
};

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function cookieValue(header, name) {
  const match = String(header || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

export function getSessionToken(req) {
  return cookieValue(req.headers.cookie, COOKIE_NAME);
}

function passwordPolicy(password) {
  return typeof password === 'string' && password.length >= 12;
}

export async function hashPassword(password) {
  if (!passwordPolicy(password)) throw new Error('La contraseña debe tener al menos 12 caracteres.');
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64, { N: SCRYPT_COST, r: SCRYPT_BLOCK_SIZE, p: SCRYPT_PARALLELIZATION });
  return `scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLELIZATION}$${salt}$${Buffer.from(derived).toString('hex')}`;
}

export async function verifyPassword(password, encoded) {
  const parts = String(encoded || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, salt, expectedHex] = parts;
  try {
    const derived = await scrypt(String(password || ''), salt, 64, { N: Number(n), r: Number(r), p: Number(p) });
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = Buffer.from(derived);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function ensureAuthSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS admin_roles (id VARCHAR(64) PRIMARY KEY, name VARCHAR(64) NOT NULL UNIQUE, description VARCHAR(255) NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS admin_permissions (id VARCHAR(64) PRIMARY KEY, code VARCHAR(128) NOT NULL UNIQUE, description VARCHAR(255) NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS admin_role_permissions (role_id VARCHAR(64) NOT NULL, permission_id VARCHAR(64) NOT NULL, PRIMARY KEY (role_id, permission_id), FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE, FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS admin_users (id CHAR(36) PRIMARY KEY, username VARCHAR(64) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, role_id VARCHAR(64) NOT NULL, status ENUM('active','disabled') NOT NULL DEFAULT 'active', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, last_login_at TIMESTAMP NULL, FOREIGN KEY (role_id) REFERENCES admin_roles(id))`,
    `CREATE TABLE IF NOT EXISTS admin_sessions (token_hash CHAR(64) PRIMARY KEY, admin_user_id CHAR(36) NOT NULL, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ip_address VARCHAR(64), user_agent VARCHAR(512), INDEX idx_admin_sessions_user (admin_user_id), INDEX idx_admin_sessions_expiry (expires_at), FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE)`
  ];
  for (const statement of statements) await pool.query(statement);

  for (const [name, description] of roles) await pool.query('INSERT IGNORE INTO admin_roles (id, name, description) VALUES (?, ?, ?)', [name, name, description]);
  for (const [code, description] of permissions) await pool.query('INSERT IGNORE INTO admin_permissions (id, code, description) VALUES (?, ?, ?)', [code, code, description]);
  for (const [role, codes] of Object.entries(permissionGroups)) {
    for (const code of codes) await pool.query('INSERT IGNORE INTO admin_role_permissions (role_id, permission_id) VALUES (?, ?)', [role, code]);
  }
  await pool.query('DELETE FROM admin_sessions WHERE expires_at < CURRENT_TIMESTAMP');
}

export async function bootstrapAdmin(username, password) {
  const normalized = normalizeUsername(username || 'admin');
  const existing = await pool.query('SELECT id FROM admin_users LIMIT 1');
  if (existing.rows.length) return { created: false, username: normalized };
  if (!/^[a-z0-9._-]{3,64}$/.test(normalized)) throw new Error('Usuario administrativo no válido.');
  const passwordHash = await hashPassword(password);
  const id = randomBytes(16).toString('hex');
  await pool.query('INSERT INTO admin_users (id, username, password_hash, role_id) VALUES (?, ?, ?, ?)', [id, normalized, passwordHash, 'superadmin']);
  return { created: true, username: normalized };
}

function hashSessionToken(token) {
  return createHash('sha256').update(String(token || ''), 'utf8').digest('hex');
}

export async function authenticate(username, password, metadata = {}) {
  const normalized = normalizeUsername(username);
  const result = await pool.query('SELECT id, username, password_hash AS passwordHash, role_id AS roleId, status FROM admin_users WHERE username = ? LIMIT 1', [normalized]);
  const user = result.rows[0];
  if (!user || user.status !== 'active' || !(await verifyPassword(password, user.passwordHash))) return null;
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);
  await pool.query('INSERT INTO admin_sessions (token_hash, admin_user_id, expires_at, ip_address, user_agent) VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND), ?, ?)', [tokenHash, user.id, SESSION_TTL_SECONDS, metadata.ip || '', metadata.userAgent || '']);
  await pool.query('UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
  return { token, user: await getUserById(user.id) };
}

export async function getUserById(id) {
  const result = await pool.query(`SELECT u.id, u.username, u.role_id AS roleId, r.name AS roleName, u.status, u.created_at AS createdAt, u.last_login_at AS lastLoginAt FROM admin_users u JOIN admin_roles r ON r.id = u.role_id WHERE u.id = ? LIMIT 1`, [id]);
  const user = result.rows[0];
  if (!user) return null;
  const perms = await pool.query('SELECT p.code FROM admin_permissions p JOIN admin_role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = ? ORDER BY p.code', [user.roleId]);
  return { ...user, permissions: perms.rows.map((row) => row.code) };
}

export async function getSessionUser(token) {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const result = await pool.query('SELECT admin_user_id AS userId FROM admin_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1', [tokenHash]);
  if (!result.rows[0]) return null;
  await pool.query('UPDATE admin_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_hash = ?', [tokenHash]);
  return getUserById(result.rows[0].userId);
}

export async function destroySession(token) {
  if (!token) return;
  await pool.query('DELETE FROM admin_sessions WHERE token_hash = ?', [hashSessionToken(token)]);
}

export function serializeSessionCookie(token) {
  const secure = process.env.IPZTREAM_COOKIE_SECURE === 'true';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${secure ? '; Secure' : ''}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export function hasPermission(user, permission) {
  return Boolean(user?.permissions?.includes(permission));
}

export function permissionForRequest(method, pathname) {
  if (pathname === '/api/audit') return 'audit.view';
  if (pathname === '/api/users') return method === 'GET' ? 'users.view' : method === 'POST' ? 'users.create' : null;
  const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
  if (userMatch) {
    if (method === 'GET') return 'users.view';
    if (method === 'PUT') return 'users.update';
    if (method === 'DELETE') return 'users.delete';
    return null;
  }
  const match = pathname.match(/^\/api\/(nodes|channels|vod|series|epg|m3u|packages|connections|devices)(?:\/|$)/);
  if (!match) return 'dashboard.view';
  const module = match[1];
  if (module === 'connections' || module === 'devices') return method === 'GET' ? `${module}.view` : `${module}.update`;
  if (method === 'GET') return `${module}.view`;
  if (method === 'POST') return `${module}.create`;
  if (method === 'PUT') return `${module}.update`;
  if (method === 'DELETE') return `${module}.delete`;
  return null;
}
