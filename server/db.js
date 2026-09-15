import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mariadb from 'mariadb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

const DATABASE_HOST = process.env.IPZTREAM_DB_HOST || '127.0.0.1';
const DATABASE_PORT = Number(process.env.IPZTREAM_DB_PORT || 3306);
const DATABASE_NAME = process.env.IPZTREAM_DB_NAME || 'ipztream';
const DATABASE_USER = process.env.IPZTREAM_DB_USER || 'ipztream';
const DATABASE_PASSWORD = process.env.IPZTREAM_DB_PASSWORD || '';

const mariaPool = mariadb.createPool({
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  connectionLimit: Number(process.env.IPZTREAM_DB_POOL_SIZE || 10),
  connectTimeout: 5000,
  idleTimeout: 30000,
  bigIntAsNumber: true
});

// Mantiene el contrato { rows, rowCount } usado por la API actual para consultas directas.
export const pool = {
  async query(sql, params = []) {
    const result = await mariaPool.query(sql, params);
    const rows = Array.isArray(result) ? result : [];
    const affectedRows = Number(result?.affectedRows || 0);
    return { rows, rowCount: affectedRows };
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
  nodes: [
    { id: 'node-01', name: 'Nodo 01 - Lima', status: 'En línea', ip: '192.168.10.21', region: 'Lima', cpu: 22, ram: 41, capacity: '10 Gbps' },
    { id: 'node-02', name: 'Nodo 02 - Arequipa', status: 'En línea', ip: '192.168.10.22', region: 'Arequipa', cpu: 18, ram: 36, capacity: '10 Gbps' },
    { id: 'node-03', name: 'Nodo 03 - Trujillo', status: 'En línea', ip: '192.168.10.23', region: 'Trujillo', cpu: 27, ram: 48, capacity: '5 Gbps' },
    { id: 'node-05', name: 'Nodo 05 - Piura', status: 'Fuera de línea', ip: '192.168.10.25', region: 'Piura', cpu: null, ram: null, capacity: '5 Gbps' }
  ],
  channels: [
    { id: 'channel-espn', number: 1, name: 'ESPN', category: 'Deportes', status: 'Activo', logo: '', sources: [{ id: 'src-espn-1', url: 'https://example.com/espn.m3u8', protocol: 'HLS', status: 'Activa', priority: 1 }] },
    { id: 'channel-hbo', number: 2, name: 'HBO Max', category: 'Entretenimiento', status: 'Activo', logo: '', sources: [{ id: 'src-hbo-1', url: 'https://example.com/hbo.m3u8', protocol: 'HLS', status: 'Activa', priority: 1 }] },
    { id: 'channel-tudn', number: 3, name: 'TUDN', category: 'Deportes', status: 'Activo', logo: '', sources: [{ id: 'src-tudn-1', url: 'https://example.com/tudn.m3u8', protocol: 'HLS', status: 'Activa', priority: 1 }] }
  ],
  vod: [{ id: 'vod-demo-1', title: 'Película de prueba', description: 'Contenido demostrativo', category: 'Películas', year: 2026, duration: '01:45:00', poster: '', url: '', status: 'Activo' }],
  series: [{ id: 'series-demo-1', title: 'La Serie IPZ', description: 'Serie demostrativa', category: 'Series', year: 2026, poster: '', status: 'Activo', seasons: 1, episodes: 8 }],
  epg: [
    { id: 'epg-1', channel: 'ESPN', title: 'Fútbol Internacional', start: '2026-09-13T18:00', end: '2026-09-13T20:00', description: 'Programación de prueba', status: 'Programado' },
    { id: 'epg-2', channel: 'HBO Max', title: 'Película Prime', start: '2026-09-13T20:00', end: '2026-09-13T22:00', description: 'Programación de prueba', status: 'Programado' }
  ],
  m3u: [
    { id: 'm3u-premium', name: 'Lista Premium', profile: 'Premium', status: 'Activo', description: 'Lista demostrativa', sourceUrl: '', items: 1024 },
    { id: 'm3u-basic', name: 'Lista Básica', profile: 'Básico', status: 'Activo', description: 'Lista demostrativa', sourceUrl: '', items: 512 }
  ],
  packages: [
    { id: 'pkg-basic', name: 'Básico', description: 'Plan inicial', price: 10, duration: 30, maxConnections: 1, status: 'Activo', userCount: 2 },
    { id: 'pkg-premium', name: 'Premium', description: 'Plan para usuarios avanzados', price: 20, duration: 30, maxConnections: 3, status: 'Activo', userCount: 1 },
    { id: 'pkg-family', name: 'Familia', description: 'Plan multidispositivo', price: 35, duration: 30, maxConnections: 5, status: 'Activo', userCount: 1 }
  ],
  connections: [
    { id: 'conn-01', username: 'cliente01', device: 'Smart TV Samsung', ip: '192.168.1.45', content: 'ESPN', node: 'Nodo 01', startedAt: '14:12', lastActivity: '14:28', status: 'Activo' },
    { id: 'conn-02', username: 'cliente02', device: 'Android TV', ip: '192.168.1.78', content: 'HBO Max', node: 'Nodo 02', startedAt: '14:10', lastActivity: '14:26', status: 'Activo' },
    { id: 'conn-03', username: 'cliente03', device: 'Fire TV', ip: '192.168.1.92', content: 'Discovery', node: 'Nodo 03', startedAt: '14:08', lastActivity: '14:24', status: 'Activo' }
  ],
  devices: [
    { id: 'dev-01', name: 'Smart TV Samsung', identifier: 'device-samsung-01', username: 'cliente01', type: 'TV', ip: '192.168.1.45', node: 'Nodo 01', status: 'Activo', lastActivity: '14:28' },
    { id: 'dev-02', name: 'Android TV Box', identifier: 'device-android-01', username: 'cliente02', type: 'TV Box', ip: '192.168.1.78', node: 'Nodo 02', status: 'Activo', lastActivity: '14:26' },
    { id: 'dev-03', name: 'Fire TV', identifier: 'device-fire-01', username: 'cliente03', type: 'TV Box', ip: '192.168.1.92', node: 'Nodo 03', status: 'Activo', lastActivity: '14:24' }
  ]
};

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
  try { return JSON.parse(payload); } catch { return payload; }
}

async function createSchema() {
  await mariaPool.query(`
    CREATE TABLE IF NOT EXISTS nodes (id VARCHAR(191) PRIMARY KEY, payload JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS channels (id VARCHAR(191) PRIMARY KEY, payload JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS vod (id VARCHAR(191) PRIMARY KEY, payload JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS series (id VARCHAR(191) PRIMARY KEY, payload JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS epg (id VARCHAR(191) PRIMARY KEY, payload JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS m3u (id VARCHAR(191) PRIMARY KEY, payload JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS packages (id VARCHAR(191) PRIMARY KEY, payload JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS connections (id VARCHAR(191) PRIMARY KEY, payload JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS devices (id VARCHAR(191) PRIMARY KEY, payload JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS users (id VARCHAR(191) PRIMARY KEY, payload JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS audit_logs (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, action VARCHAR(64) NOT NULL, module VARCHAR(128) NOT NULL, actor VARCHAR(191), detail TEXT, metadata JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_audit_logs_created_at (created_at));
  `);
}

async function migrateSeed(name) {
  const table = TABLES[name];
  const countResult = await mariaPool.query(`SELECT COUNT(*) AS count FROM ${table}`);
  const count = Number(countResult[0]?.count || 0);
  if (count > 0) return;

  const seed = await readJsonSeed(name);
  for (const item of seed) {
    if (!item?.id) continue;
    await mariaPool.query(`INSERT IGNORE INTO ${table} (id, payload) VALUES (?, ?)`, [String(item.id), JSON.stringify(item)]);
  }
}

export async function initDatabase() {
  await createSchema();
  for (const name of Object.keys(TABLES).filter((key) => key !== 'audit')) await migrateSeed(name);
}

export async function dbHealth() {
  const result = await mariaPool.query('SELECT CURRENT_TIMESTAMP AS now');
  return { ok: true, database: 'mariadb', now: result[0]?.now };
}

export async function listItems(table) {
  const result = await mariaPool.query(`SELECT payload FROM ${table} ORDER BY created_at ASC`);
  return result.map((row) => decodePayload(row.payload));
}

export async function getItem(table, id) {
  const result = await mariaPool.query(`SELECT payload FROM ${table} WHERE id = ?`, [id]);
  return result[0] ? decodePayload(result[0].payload) : null;
}

export async function insertItem(table, item) {
  await mariaPool.query(`INSERT INTO ${table} (id, payload) VALUES (?, ?)`, [String(item.id), JSON.stringify(item)]);
  return item;
}

export async function updateItem(table, id, item) {
  const result = await mariaPool.query(`UPDATE ${table} SET payload = ? WHERE id = ?`, [JSON.stringify(item), id]);
  return result.affectedRows ? item : null;
}

export async function deleteItem(table, id) {
  const result = await mariaPool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}

export async function addAudit({ action, module, actor = 'system', detail = '', metadata = {} }) {
  await mariaPool.query('INSERT INTO audit_logs (action, module, actor, detail, metadata) VALUES (?, ?, ?, ?, ?)', [action, module, actor, detail, JSON.stringify(metadata)]);
}
