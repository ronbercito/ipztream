import http from 'node:http';
import { randomUUID } from 'node:crypto';
import {
  pool,
  TABLES,
  initDatabase,
  dbHealth,
  listItems,
  getItem,
  insertItem,
  updateItem,
  deleteItem,
  addAudit
} from './db.js';

const PORT = Number(process.env.IPZTREAM_API_PORT || 3100);
const HOST = process.env.IPZTREAM_API_HOST || '127.0.0.1';

const genericTypes = ['vod', 'series', 'epg', 'm3u'];

function send(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': process.env.IPZTREAM_CORS_ORIGIN || '*'
  });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  if (body.length > 1024 * 64) throw new Error('Solicitud demasiado grande.');
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error('El cuerpo de la solicitud no es JSON válido.');
    error.status = 400;
    throw error;
  }
}

function makeId(prefix) {
  return `${prefix}-${randomUUID()}`;
}

function validIPv4(ip) {
  const parts = String(ip).split('.');
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
}

function normalizeNode(input, current = {}) {
  return {
    id: current.id || input.id || makeId('node'),
    name: String(input.name ?? current.name ?? '').trim(),
    status: input.status === 'Fuera de línea' ? 'Fuera de línea' : 'En línea',
    ip: String(input.ip ?? current.ip ?? '').trim(),
    region: String(input.region ?? current.region ?? '').trim(),
    cpu: input.cpu === null || input.cpu === '' ? null : Number(input.cpu),
    ram: input.ram === null || input.ram === '' ? null : Number(input.ram),
    capacity: String(input.capacity ?? current.capacity ?? '').trim()
  };
}

function normalizeSource(input, index = 0) {
  return {
    id: String(input.id || makeId(`source-${index}`)),
    url: String(input.url || '').trim(),
    protocol: String(input.protocol || 'HLS').trim(),
    status: input.status === 'Inactiva' ? 'Inactiva' : 'Activa',
    priority: Number(input.priority || index + 1)
  };
}

function normalizeChannel(input, current = {}) {
  return {
    id: current.id || input.id || makeId('channel'),
    number: Number(input.number ?? current.number),
    name: String(input.name ?? current.name ?? '').trim(),
    category: String(input.category ?? current.category ?? '').trim(),
    status: input.status === 'Inactivo' ? 'Inactivo' : 'Activo',
    logo: String(input.logo ?? current.logo ?? '').trim(),
    sources: Array.isArray(input.sources)
      ? input.sources.map(normalizeSource)
      : Array.isArray(current.sources)
        ? current.sources.map(normalizeSource)
        : []
  };
}

function validateChannel(channel, channels, idValue = null) {
  if (!Number.isInteger(channel.number) || channel.number < 1 || channel.number > 99999) return 'El número de canal debe ser un entero entre 1 y 99999.';
  if (!channel.name || !channel.category) return 'Nombre y categoría son obligatorios.';
  if (!channel.sources.length) return 'El canal debe tener al menos una fuente.';
  if (channel.sources.some((source) => !source.url)) return 'Todas las fuentes deben tener una URL.';
  if (channel.sources.some((source) => !Number.isInteger(source.priority) || source.priority < 1 || source.priority > 99)) return 'La prioridad de cada fuente debe estar entre 1 y 99.';
  if (channels.some((item) => item.number === channel.number && item.id !== idValue)) return `El número ${channel.number} ya está asignado a otro canal.`;
  return null;
}

function normalizeGeneric(type, input, current = {}) {
  const value = { ...current, ...input, id: current.id || input.id || makeId(type) };
  if (type === 'vod') return { id: value.id, title: String(value.title || '').trim(), description: String(value.description || '').trim(), category: String(value.category || '').trim(), year: Number(value.year) || new Date().getFullYear(), duration: String(value.duration || '').trim(), poster: String(value.poster || '').trim(), url: String(value.url || '').trim(), status: value.status === 'Inactivo' ? 'Inactivo' : 'Activo' };
  if (type === 'series') return { id: value.id, title: String(value.title || '').trim(), description: String(value.description || '').trim(), category: String(value.category || '').trim(), year: Number(value.year) || new Date().getFullYear(), poster: String(value.poster || '').trim(), status: value.status === 'Inactivo' ? 'Inactivo' : 'Activo', seasons: Math.max(1, Number(value.seasons) || 1), episodes: Math.max(1, Number(value.episodes) || 1) };
  if (type === 'epg') return { id: value.id, channel: String(value.channel || '').trim(), title: String(value.title || '').trim(), start: String(value.start || ''), end: String(value.end || ''), description: String(value.description || '').trim(), status: ['Programado', 'Emitido', 'Cancelado'].includes(value.status) ? value.status : 'Programado' };
  if (type === 'm3u') return { id: value.id, name: String(value.name || '').trim(), profile: String(value.profile || '').trim(), status: value.status === 'Inactivo' ? 'Inactivo' : 'Activo', description: String(value.description || '').trim(), sourceUrl: String(value.sourceUrl || '').trim(), items: Math.max(0, Number(value.items) || 0) };
  if (type === 'packages') return { id: value.id, name: String(value.name || '').trim(), description: String(value.description || '').trim(), price: Number(value.price) || 0, duration: Math.max(1, Number(value.duration) || 30), maxConnections: Math.max(1, Number(value.maxConnections) || 1), status: value.status === 'Inactivo' ? 'Inactivo' : 'Activo', userCount: Math.max(0, Number(value.userCount) || 0) };
  return { id: value.id || makeId(type), ...value };
}

function validateGeneric(type, item, list, idValue = null) {
  if (type === 'vod' || type === 'series') return item.title && item.category ? null : 'Título y categoría son obligatorios.';
  if (type === 'epg') {
    if (!item.channel || !item.title || !item.start || !item.end) return 'Canal, título, inicio y fin son obligatorios.';
    if (new Date(item.end) <= new Date(item.start)) return 'La hora de fin debe ser posterior al inicio.';
    return null;
  }
  if (type === 'm3u') return item.name ? null : 'El nombre de la lista es obligatorio.';
  if (type === 'packages') {
    if (!item.name) return 'El nombre del paquete es obligatorio.';
    if (item.price < 0) return 'El precio no puede ser negativo.';
    if (item.duration < 1) return 'La duración debe ser mayor a 0 días.';
    if (item.maxConnections < 1 || item.maxConnections > 99) return 'Las conexiones deben estar entre 1 y 99.';
    if (list.some((x) => x.name.toLowerCase() === item.name.toLowerCase() && x.id !== idValue)) return `El paquete ${item.name} ya existe.`;
  }
  return null;
}

async function saveNew(table, item, module) {
  await insertItem(table, item);
  await addAudit({ action: 'CREATE', module, detail: `Creado ${item.id}` });
  return item;
}

async function saveUpdate(table, id, item, module) {
  const result = await updateItem(table, id, item);
  if (result) await addAudit({ action: 'UPDATE', module, detail: `Actualizado ${id}` });
  return result;
}

async function saveDelete(table, id, module) {
  const ok = await deleteItem(table, id);
  if (ok) await addAudit({ action: 'DELETE', module, detail: `Eliminado ${id}` });
  return ok;
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': process.env.IPZTREAM_CORS_ORIGIN || '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  if (req.method === 'GET' && pathname === '/api/health') {
    try { return send(res, 200, await dbHealth()); } catch (error) { return send(res, 503, { ok: false, database: 'mariadb', message: error.message }); }
  }

  if (req.method === 'GET' && pathname === '/api/audit') {
    const result = await pool.query('SELECT id, action, module, actor, detail, metadata, created_at AS "createdAt" FROM audit_logs ORDER BY created_at DESC LIMIT 500');
    return send(res, 200, { logs: result.rows });
  }

  if (req.method === 'GET' && pathname === '/api/users') return send(res, 200, { users: await listItems(TABLES.users) });

  if (pathname === '/api/nodes') {
    if (req.method === 'GET') return send(res, 200, { nodes: await listItems(TABLES.nodes) });
    if (req.method === 'POST') {
      const item = normalizeNode(await readBody(req));
      if (!item.name || !item.ip || !item.region || !item.capacity) return send(res, 400, { message: 'Nombre, IP, región y capacidad son obligatorios.' });
      if (!validIPv4(item.ip)) return send(res, 400, { message: 'Ingresa una dirección IPv4 válida.' });
      if ((item.cpu !== null && (!Number.isFinite(item.cpu) || item.cpu < 0 || item.cpu > 100)) || (item.ram !== null && (!Number.isFinite(item.ram) || item.ram < 0 || item.ram > 100))) return send(res, 400, { message: 'CPU y RAM deben estar entre 0 y 100.' });
      const nodes = await listItems(TABLES.nodes);
      if (nodes.some((node) => node.ip.toLowerCase() === item.ip.toLowerCase())) return send(res, 409, { message: `La IP ${item.ip} ya está registrada en otro nodo.` });
      return send(res, 201, await saveNew(TABLES.nodes, item, 'nodes'));
    }
  }

  const nodeMatch = pathname.match(/^\/api\/nodes\/([^/]+)$/);
  if (nodeMatch) {
    const id = decodeURIComponent(nodeMatch[1]);
    if (req.method === 'DELETE') return send(res, (await saveDelete(TABLES.nodes, id, 'nodes')) ? 200 : 404, { ok: true });
  }

  if (pathname === '/api/channels') {
    if (req.method === 'GET') return send(res, 200, { channels: await listItems(TABLES.channels) });
    if (req.method === 'POST') {
      const channels = await listItems(TABLES.channels);
      const item = normalizeChannel(await readBody(req));
      const validation = validateChannel(item, channels);
      if (validation) return send(res, 400, { message: validation });
      return send(res, 201, await saveNew(TABLES.channels, item, 'channels'));
    }
  }

  const channelMatch = pathname.match(/^\/api\/channels\/([^/]+)$/);
  if (channelMatch) {
    const id = decodeURIComponent(channelMatch[1]);
    const current = await getItem(TABLES.channels, id);
    if (!current) return send(res, 404, { message: 'Canal no encontrado.' });
    if (req.method === 'PUT') {
      const channels = await listItems(TABLES.channels);
      const item = normalizeChannel(await readBody(req), current);
      const validation = validateChannel(item, channels, id);
      if (validation) return send(res, 400, { message: validation });
      return send(res, 200, await saveUpdate(TABLES.channels, id, item, 'channels'));
    }
    if (req.method === 'DELETE') return send(res, (await saveDelete(TABLES.channels, id, 'channels')) ? 200 : 404, { ok: true });
  }

  if (pathname === '/api/packages') {
    const list = await listItems(TABLES.packages);
    if (req.method === 'GET') return send(res, 200, { packages: list });
    if (req.method === 'POST') {
      const item = normalizeGeneric('packages', await readBody(req));
      const validation = validateGeneric('packages', item, list);
      if (validation) return send(res, 409, { message: validation });
      return send(res, 201, await saveNew(TABLES.packages, item, 'packages'));
    }
  }

  const packageMatch = pathname.match(/^\/api\/packages\/([^/]+)$/);
  if (packageMatch) {
    const id = decodeURIComponent(packageMatch[1]);
    const current = await getItem(TABLES.packages, id);
    if (!current) return send(res, 404, { message: 'Paquete no encontrado.' });
    if (req.method === 'PUT') {
      const list = await listItems(TABLES.packages);
      const item = normalizeGeneric('packages', await readBody(req), current);
      const validation = validateGeneric('packages', item, list, id);
      if (validation) return send(res, 409, { message: validation });
      return send(res, 200, await saveUpdate(TABLES.packages, id, item, 'packages'));
    }
    if (req.method === 'DELETE') return send(res, (await saveDelete(TABLES.packages, id, 'packages')) ? 200 : 404, { ok: true });
  }

  if (pathname === '/api/connections' && req.method === 'GET') return send(res, 200, { connections: await listItems(TABLES.connections) });
  const connectionClose = pathname.match(/^\/api\/connections\/([^/]+)\/close$/);
  if (connectionClose && req.method === 'POST') {
    const id = decodeURIComponent(connectionClose[1]);
    const item = await getItem(TABLES.connections, id);
    if (!item) return send(res, 404, { message: 'Conexión no encontrada.' });
    item.status = 'Cerrada';
    item.lastActivity = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    return send(res, 200, await saveUpdate(TABLES.connections, id, item, 'connections'));
  }

  if (pathname === '/api/devices' && req.method === 'GET') return send(res, 200, { devices: await listItems(TABLES.devices) });
  const deviceUnlink = pathname.match(/^\/api\/devices\/([^/]+)\/unlink$/);
  if (deviceUnlink && req.method === 'POST') {
    const id = decodeURIComponent(deviceUnlink[1]);
    const item = await getItem(TABLES.devices, id);
    if (!item) return send(res, 404, { message: 'Dispositivo no encontrado.' });
    item.username = '';
    item.status = 'Sin asociar';
    return send(res, 200, await saveUpdate(TABLES.devices, id, item, 'devices'));
  }

  for (const type of genericTypes) {
    const table = TABLES[type];
    const collection = `/api/${type}`;
    if (pathname === collection) {
      if (req.method === 'GET') return send(res, 200, await listItems(table));
      if (req.method === 'POST') {
        const item = normalizeGeneric(type, await readBody(req));
        const validation = validateGeneric(type, item, []);
        if (validation) return send(res, 400, { message: validation });
        return send(res, 201, await saveNew(table, item, type));
      }
    }
    const match = pathname.match(new RegExp(`^/api/${type}/([^/]+)$`));
    if (match) {
      const id = decodeURIComponent(match[1]);
      const current = await getItem(table, id);
      if (!current) return send(res, 404, { message: 'Registro no encontrado.' });
      if (req.method === 'PUT') {
        const item = normalizeGeneric(type, await readBody(req), current);
        const validation = validateGeneric(type, item, []);
        if (validation) return send(res, 400, { message: validation });
        return send(res, 200, await saveUpdate(table, id, item, type));
      }
      if (req.method === 'DELETE') return send(res, (await saveDelete(table, id, type)) ? 200 : 404, { ok: true });
    }
  }

  if (pathname === '/api/users' && req.method === 'POST') {
    const input = await readBody(req);
    const item = { ...input, id: input.id || makeId('user') };
    if (!String(item.username || '').trim()) return send(res, 400, { message: 'El usuario es obligatorio.' });
    const users = await listItems(TABLES.users);
    if (users.some((user) => String(user.username || '').toLowerCase() === String(item.username).toLowerCase())) return send(res, 409, { message: `El usuario ${item.username} ya existe.` });
    return send(res, 201, await saveNew(TABLES.users, item, 'users'));
  }

  return send(res, 404, { message: 'Ruta no encontrada.' });
}

async function start() {
  await initDatabase();
  const server = http.createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (error) {
      console.error(error);
      send(res, error.status || 500, { message: error.message || 'Error interno del servidor.' });
    }
  });
  server.listen(PORT, HOST, () => console.log(`IPZStream API escuchando en http://${HOST}:${PORT} con MariaDB`));
}

start().catch(async (error) => {
  console.error('No se pudo iniciar IPZStream API:', error);
  await pool.end().catch(() => {});
  process.exit(1);
});
