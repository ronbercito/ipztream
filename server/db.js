import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://ipztream:ipztream@127.0.0.1:5432/ipztream';
export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: Number(process.env.IPZTREAM_DB_POOL_SIZE || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  application_name: 'ipztream-api'
});

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

export async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nodes (id TEXT PRIMARY KEY, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS channels (id TEXT PRIMARY KEY, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS vod (id TEXT PRIMARY KEY, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS series (id TEXT PRIMARY KEY, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS epg (id TEXT PRIMARY KEY, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS m3u (id TEXT PRIMARY KEY, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS packages (id TEXT PRIMARY KEY, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS connections (id TEXT PRIMARY KEY, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS audit_logs (id BIGSERIAL PRIMARY KEY, action TEXT NOT NULL, module TEXT NOT NULL, actor TEXT, detail TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
  `);

  for (const name of Object.keys(TABLES).filter((key) => key !== 'users' && key !== 'audit')) {
    const count = await pool.query(`SELECT COUNT(*)::int AS count FROM ${TABLES[name]}`);
    if (count.rows[0].count === 0) {
      const seed = await readJsonSeed(name);
      for (const item of seed) {
        if (!item?.id) continue;
        await pool.query(`INSERT INTO ${TABLES[name]} (id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING`, [String(item.id), JSON.stringify(item)]);
      }
    }
  }
}

export async function dbHealth() {
  const result = await pool.query('SELECT NOW() AS now');
  return { ok: true, database: 'postgresql', now: result.rows[0].now };
}

export async function listItems(table) {
  const result = await pool.query(`SELECT payload FROM ${table} ORDER BY created_at ASC`);
  return result.rows.map((row) => row.payload);
}

export async function getItem(table, id) {
  const result = await pool.query(`SELECT payload FROM ${table} WHERE id = $1`, [id]);
  return result.rows[0]?.payload || null;
}

export async function insertItem(table, item) {
  await pool.query(`INSERT INTO ${table} (id, payload) VALUES ($1, $2::jsonb)`, [String(item.id), JSON.stringify(item)]);
  return item;
}

export async function updateItem(table, id, item) {
  const result = await pool.query(`UPDATE ${table} SET payload = $2::jsonb, updated_at = NOW() WHERE id = $1`, [id, JSON.stringify(item)]);
  return result.rowCount ? item : null;
}

export async function deleteItem(table, id) {
  const result = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  return result.rowCount > 0;
}

export async function addAudit({ action, module, actor = 'system', detail = '', metadata = {} }) {
  await pool.query('INSERT INTO audit_logs (action, module, actor, detail, metadata) VALUES ($1,$2,$3,$4,$5::jsonb)', [action, module, actor, detail, JSON.stringify(metadata)]);
}
