import { randomUUID } from 'node:crypto';
import { pool, TABLES, addAudit } from './db.js';
import { hashPassword } from './auth.js';

const USER_STATUSES = ['Activo', 'Suspendido', 'Vencido'];

function decode(payload) {
  if (payload && typeof payload === 'object') return payload;
  try { return JSON.parse(payload); } catch { return {}; }
}

function makeId() {
  return `user-${randomUUID()}`;
}

function validUsername(username) {
  return /^[a-z0-9._-]{3,64}$/.test(username);
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function getPackages() {
  const result = await pool.query(`SELECT id, payload FROM ${TABLES.packages} ORDER BY created_at ASC`);
  return result.map((row) => decode(row.payload));
}

async function resolvePackage(input, packages) {
  const requested = String(input.packageId || input.package || '').trim();
  if (!requested) return null;
  return packages.find((item) => item.id === requested || String(item.name || '').toLowerCase() === requested.toLowerCase()) || null;
}

function publicUser(item, credentialConfigured, packageItem) {
  const expiresAt = item.expiresAt || null;
  const expired = expiresAt && expiresAt < todayIso();
  const status = expired && item.status === 'Activo' ? 'Vencido' : item.status;
  return {
    ...item,
    status,
    package: packageItem?.name || item.package || 'Sin paquete',
    packageId: packageItem?.id || item.packageId || null,
    maxConnections: Number(item.maxConnections || packageItem?.maxConnections || 1),
    activeConnections: Math.max(0, Number(item.activeConnections || 0)),
    passwordConfigured: Boolean(credentialConfigured)
  };
}

export async function listUsers() {
  const [usersResult, credentialsResult, packages] = await Promise.all([
    pool.query(`SELECT id, payload FROM ${TABLES.users} ORDER BY created_at ASC`),
    pool.query('SELECT user_id FROM user_credentials'),
    getPackages()
  ]);
  const configured = new Set(credentialsResult.map((row) => row.user_id));
  return usersResult.map((row) => {
    const item = decode(row.payload);
    const packageItem = packages.find((pkg) => pkg.id === item.packageId || String(pkg.name || '').toLowerCase() === String(item.package || '').toLowerCase());
    return publicUser(item, configured.has(item.id || row.id), packageItem);
  });
}

export async function getUser(id) {
  const result = await pool.query(`SELECT payload FROM ${TABLES.users} WHERE id = ? LIMIT 1`, [id]);
  if (!result.rows[0]) return null;
  const item = decode(result.rows[0].payload);
  const credentials = await pool.query('SELECT user_id FROM user_credentials WHERE user_id = ? LIMIT 1', [id]);
  const packages = await getPackages();
  const packageItem = packages.find((pkg) => pkg.id === item.packageId || String(pkg.name || '').toLowerCase() === String(item.package || '').toLowerCase());
  return publicUser(item, credentials.rows.length > 0, packageItem);
}

async function normalize(input, current = {}, requirePassword = false) {
  const username = String(input.username ?? current.username ?? '').trim().toLowerCase();
  const name = String(input.name ?? current.name ?? '').trim();
  const status = USER_STATUSES.includes(input.status) ? input.status : (current.status || 'Activo');
  if (!validUsername(username)) throw new Error('El usuario debe tener entre 3 y 64 caracteres y solo usar letras minúsculas, números, punto, guion o guion bajo.');
  if (!name) throw new Error('El nombre del cliente es obligatorio.');

  const packages = await getPackages();
  const packageItem = await resolvePackage(input, packages) || packages.find((pkg) => pkg.id === current.packageId || String(pkg.name || '').toLowerCase() === String(current.package || '').toLowerCase());
  if (!packageItem) throw new Error('Selecciona un paquete válido.');
  if (packageItem.status === 'Inactivo') throw new Error('El paquete seleccionado está inactivo.');

  const expiresAt = String(input.expiresAt ?? current.expiresAt ?? '').trim();
  if (!validDate(expiresAt)) throw new Error('La fecha de vencimiento debe tener formato AAAA-MM-DD.');

  const maxAllowed = Math.max(1, Number(packageItem.maxConnections) || 1);
  const requestedMax = Number(input.maxConnections ?? current.maxConnections ?? maxAllowed);
  if (!Number.isInteger(requestedMax) || requestedMax < 1 || requestedMax > maxAllowed) throw new Error(`El máximo de conexiones debe estar entre 1 y ${maxAllowed} para el paquete seleccionado.`);

  const password = String(input.password || '');
  if (requirePassword && password.length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres.');

  return {
    id: current.id || input.id || makeId(),
    username,
    name,
    status,
    packageId: packageItem.id,
    package: packageItem.name,
    maxConnections: requestedMax,
    activeConnections: Math.max(0, Math.min(Number(current.activeConnections || input.activeConnections || 0), requestedMax)),
    expiresAt,
    createdAt: current.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export async function createUser(input, actor = 'system') {
  const password = String(input.password || '');
  const item = await normalize(input, {}, true);
  const duplicate = await pool.query(`SELECT id FROM ${TABLES.users} WHERE LOWER(JSON_VALUE(payload, '$.username')) = LOWER(?) LIMIT 1`, [item.username]);
  if (duplicate.rows.length) throw Object.assign(new Error(`El usuario ${item.username} ya existe.`), { status: 409 });

  await pool.query(`INSERT INTO ${TABLES.users} (id, payload) VALUES (?, ?)`, [item.id, JSON.stringify(item)]);
  await pool.query('INSERT INTO user_credentials (user_id, password_hash) VALUES (?, ?)', [item.id, await hashPassword(password)]);
  await addAudit({ action: 'CREATE', module: 'users', actor, detail: `Creado ${item.username}` });
  return publicUser(item, true, { id: item.packageId, name: item.package, maxConnections: item.maxConnections });
}

export async function updateUser(id, input, actor = 'system') {
  const existing = await getUser(id);
  if (!existing) return null;
  const item = await normalize(input, existing, false);
  const duplicate = await pool.query(`SELECT id FROM ${TABLES.users} WHERE LOWER(JSON_VALUE(payload, '$.username')) = LOWER(?) AND id <> ? LIMIT 1`, [item.username, id]);
  if (duplicate.rows.length) throw Object.assign(new Error(`El usuario ${item.username} ya existe.`), { status: 409 });

  await pool.query(`UPDATE ${TABLES.users} SET payload = ? WHERE id = ?`, [JSON.stringify(item), id]);
  if (input.password) {
    await pool.query('INSERT INTO user_credentials (user_id, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), updated_at = CURRENT_TIMESTAMP', [id, await hashPassword(String(input.password))]);
  }
  await addAudit({ action: 'UPDATE', module: 'users', actor, detail: `Actualizado ${item.username}` });
  return getUser(id);
}

export async function deleteUser(id, actor = 'system') {
  const existing = await getUser(id);
  if (!existing) return false;
  await pool.query(`DELETE FROM ${TABLES.users} WHERE id = ?`, [id]);
  await pool.query('DELETE FROM user_credentials WHERE user_id = ?', [id]);
  await pool.query(`UPDATE ${TABLES.devices} SET payload = JSON_SET(payload, '$.username', '', '$.status', 'Sin asociar') WHERE JSON_VALUE(payload, '$.username') = ?`, [existing.username]);
  await addAudit({ action: 'DELETE', module: 'users', actor, detail: `Eliminado ${existing.username}` });
  return true;
}
