import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
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
  addAudit,
  listStreamNodes,
  getStreamNode,
  findStreamNodeByIp,
  upsertStreamNode,
  recordStreamNodeHeartbeat,
  listStreamNodeHeartbeats,
  deleteStreamNode,
  markOfflineStreamNodes,
  pruneStreamNodeHeartbeats,
  streamNodeOfflineAfterSeconds,
  streamNodeHeartbeatRetentionDays,
  getStreamDesiredState
} from './db.js';
import { ensureUserSchema, listUsers, getUser, createUser, updateUser, deleteUser } from './user-service.js';

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

function validNodeHost(value) {
  const host = String(value || '').trim();
  if (!host) return false;
  if (isIP(host)) return true;
  return /^(?=.{1,253}$)(?!-)[a-z0-9-]+(?:\.(?!-)[a-z0-9-]+)*\.?$/i.test(host);
}

function normalizeCapabilities(value = []) {
  const allowed = new Set(['live', 'vod', 'timeshift', 'hls', 'rtmp', 'ffmpeg', 'transcode', 'remux']);
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(list.map((item) => String(item).trim().toLowerCase()).filter((item) => allowed.has(item)))];
}

function normalizeMetrics(value = {}) {
  const finiteOrNull = (input) => {
    if (input === null || input === '' || input === undefined) return null;
    const parsed = Number(input);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const percent = (input) => {
    const parsed = finiteOrNull(input);
    return parsed === null ? null : Math.min(100, Math.max(0, parsed));
  };
  const nonNegative = (input, fallback = 0) => {
    const parsed = finiteOrNull(input);
    return parsed === null ? fallback : Math.max(0, parsed);
  };
  return {
    cpu: percent(value.cpu),
    ram: percent(value.ram),
    disk: percent(value.disk),
    load: nonNegative(value.load, 0),
    activeStreams: Math.trunc(nonNegative(value.activeStreams, 0)),
    uptime: Math.trunc(nonNegative(value.uptime, 0))
  };
}

function normalizeNode(input, current = {}) {
  const metrics = normalizeMetrics(input.metrics || {
    cpu: input.cpu ?? current.cpu,
    ram: input.ram ?? current.ram,
    disk: input.disk ?? current.disk,
    load: input.load ?? current.load,
    activeStreams: input.activeStreams ?? current.activeStreams,
    uptime: input.uptime ?? current.uptime
  });
  const status = input.status || current.status;
  const role = ['main', 'sub', 'edge'].includes(input.role || current.role) ? (input.role || current.role) : 'sub';
  return {
    id: current.id || input.id || makeId('node'),
    name: String(input.name ?? current.name ?? '').trim(),
    role,
    status: ['En línea', 'Fuera de línea', 'Degradado', 'Mantenimiento'].includes(status) ? status : 'En línea',
    ip: String(input.ip ?? current.ip ?? '').trim(),
    apiBaseUrl: String(input.apiBaseUrl ?? current.apiBaseUrl ?? '').trim(),
    region: String(input.region ?? current.region ?? '').trim(),
    cpu: metrics.cpu,
    ram: metrics.ram,
    disk: metrics.disk,
    load: metrics.load,
    activeStreams: metrics.activeStreams,
    uptime: metrics.uptime,
    capacity: String(input.capacity ?? current.capacity ?? '').trim(),
    capabilities: normalizeCapabilities(input.capabilities ?? current.capabilities ?? ['live', 'hls', 'ffmpeg']),
    lastSeenAt: input.lastSeenAt ?? current.lastSeenAt ?? null,
    version: String(input.version ?? current.version ?? '').trim(),
    notes: String(input.notes ?? current.notes ?? '').trim()
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
    nodeId: String(input.nodeId ?? current.nodeId ?? '').trim(),
    bouquet: String(input.bouquet ?? current.bouquet ?? '').trim(),
    epgId: String(input.epgId ?? current.epgId ?? '').trim(),
    streamProfile: ['remux-copy','transcode-h264-aac'].includes(input.streamProfile ?? current.streamProfile) ? (input.streamProfile ?? current.streamProfile) : 'remux-copy',
    outputFormat: String(input.outputFormat ?? current.outputFormat ?? 'HLS').trim(),
    notes: String(input.notes ?? current.notes ?? '').trim(),
    sortOrder: Number.isFinite(Number(input.sortOrder ?? current.sortOrder)) ? Number(input.sortOrder ?? current.sortOrder) : Number(input.number ?? current.number),
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

async function validateChannelNode(channel) {
  const nodeId=String(channel?.nodeId||'').trim();
  if(!nodeId)return null;
  const node=await getStreamNode(nodeId);
  if(!node)return `El nodo asignado ${nodeId} no existe.`;
  if(!['main','sub','edge'].includes(node.role))return `El nodo ${node.name||nodeId} no tiene un rol válido para streaming.`;
  if(['sub','edge'].includes(node.role)&&!(node.capabilities||[]).includes('ffmpeg'))return `El nodo ${node.name||nodeId} no declara capacidad FFmpeg.`;
  return null;
}

function normalizeGeneric(type, input, current = {}) {
  const value = { ...current, ...input, id: current.id || input.id || makeId(type) };
  if (type === 'vod') return { id: value.id, title: String(value.title || '').trim(), description: String(value.description || '').trim(), category: String(value.category || '').trim(), year: Number(value.year) || new Date().getFullYear(), duration: String(value.duration || '').trim(), poster: String(value.poster || '').trim(), url: String(value.url || '').trim(), status: value.status === 'Inactivo' ? 'Inactivo' : 'Activo' };
  if (type === 'series') return { id: value.id, title: String(value.title || '').trim(), description: String(value.description || '').trim(), category: String(value.category || '').trim(), year: Number(value.year) || new Date().getFullYear(), poster: String(value.poster || '').trim(), status: value.status === 'Inactivo' ? 'Inactivo' : 'Activo', seasons: Math.max(1, Number(value.seasons) || 1), episodes: Math.max(1, Number(value.episodes) || 1) };
  if (type === 'epg') return { id: value.id, channel: String(value.channel || '').trim(), title: String(value.title || '').trim(), start: String(value.start || ''), end: String(value.end || ''), description: String(value.description || '').trim(), status: ['Programado', 'Emitido', 'Cancelado'].includes(value.status) ? value.status : 'Programado' };
  if (type === 'm3u') return { id: value.id, name: String(value.name || '').trim(), profile: String(value.profile || '').trim(), status: value.status === 'Inactivo' ? 'Inactivo' : 'Activo', description: String(value.description || '').trim(), sourceUrl: String(value.sourceUrl || '').trim(), items: Math.max(0, Number(value.items) || 0) };
  if (type === 'packages') return { id: value.id || makeId('pkg'), name: String(value.name || '').trim(), description: String(value.description || '').trim(), price: Number(value.price) || 0, duration: Math.max(1, Number(value.duration) || 30), maxConnections: Math.max(1, Number(value.maxConnections) || 1), status: value.status === 'Inactivo' ? 'Inactivo' : 'Activo', userCount: Math.max(0, Number(value.userCount) || 0) };
  return { id: value.id || makeId(type), ...value };
}

function requireNodeToken(req) {
  const expected = process.env.IPZTREAM_NODE_REGISTRATION_TOKEN || '';
  if (!expected) {
    const error = new Error('IPZTREAM_NODE_REGISTRATION_TOKEN no configurado.');
    error.status = 503;
    throw error;
  }
  const received = String(req.headers['x-ipztream-node-token'] || '').trim();
  if (received !== expected) {
    const error = new Error('Token de nodo inválido.');
    error.status = 401;
    throw error;
  }
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

  if (pathname === '/api/users') {
    if (req.method === 'GET') return send(res, 200, { users: await listUsers() });
    if (req.method === 'POST') return send(res, 201, await createUser(await readBody(req), req.headers['x-ipztream-actor'] || 'system'));
  }

  const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
  if (userMatch) {
    const id = decodeURIComponent(userMatch[1]);
    if (req.method === 'GET') {
      const user = await getUser(id);
      return user ? send(res, 200, { user }) : send(res, 404, { message: 'Usuario no encontrado.' });
    }
    if (req.method === 'PUT') {
      const user = await updateUser(id, await readBody(req), req.headers['x-ipztream-actor'] || 'system');
      return user ? send(res, 200, { user }) : send(res, 404, { message: 'Usuario no encontrado.' });
    }
    if (req.method === 'DELETE') return send(res, (await deleteUser(id, req.headers['x-ipztream-actor'] || 'system')) ? 200 : 404, { ok: true });
  }

  if (pathname === '/api/stream-nodes' && req.method === 'GET') {
    const nodes = await listStreamNodes();
    return send(res, 200, {
      nodes,
      offlineAfterSeconds: streamNodeOfflineAfterSeconds(),
      heartbeatRetentionDays: streamNodeHeartbeatRetentionDays()
    });
  }

  if (pathname === '/api/stream-nodes' && req.method === 'POST') {
    const body = await readBody(req);
    const item = normalizeNode({ ...body, status: body.status || 'Fuera de línea' });
    if (!item.name || !item.ip || !item.region || !item.capacity) {
      return send(res, 400, { message: 'Nombre, IP, región y capacidad son obligatorios.' });
    }
    if (!validNodeHost(item.ip)) return send(res, 400, { message: 'Ingresa una IP o hostname válido.' });
    const existing = await findStreamNodeByIp(item.ip);
    if (existing) return send(res, 409, { message: `La IP ${item.ip} ya está registrada en otro nodo.` });
    const { node } = await upsertStreamNode({ ...item, status: item.status || 'Fuera de línea' }, { matchByIp: false });
    await addAudit({ action: 'CREATE', module: 'stream-nodes', detail: `Nodo ${node.id} creado manualmente`, metadata: { nodeId: node.id, ip: node.ip, role: node.role } });
    return send(res, 201, { node });
  }

  if (pathname === '/api/stream-nodes/register' && req.method === 'POST') {
    requireNodeToken(req);
    const body = await readBody(req);
    const item = normalizeNode({ ...body, status: body.status || 'En línea', lastSeenAt: new Date().toISOString() });
    if (!item.name || !item.ip || !item.region) return send(res, 400, { message: 'Nombre, IP/host y región son obligatorios.' });
    if (!validNodeHost(item.ip)) return send(res, 400, { message: 'IP/host de nodo inválido.' });

    const result = await upsertStreamNode(item, { matchByIp: true });
    await addAudit({
      action: result.created ? 'REGISTER' : 'REREGISTER',
      module: 'stream-nodes',
      detail: `Nodo ${result.node.id} registrado por agente`,
      metadata: { nodeId: result.node.id, requestedId: item.id, ip: result.node.ip, role: result.node.role }
    });
    return send(res, result.created ? 201 : 200, {
      node: result.node,
      registered: result.created,
      canonicalId: result.canonicalId
    });
  }

  const streamNodeHeartbeats = pathname.match(/^\/api\/stream-nodes\/([^/]+)\/heartbeats$/);
  if (streamNodeHeartbeats && req.method === 'GET') {
    const nodeId = decodeURIComponent(streamNodeHeartbeats[1]);
    const node = await getStreamNode(nodeId);
    if (!node) return send(res, 404, { message: 'Nodo no encontrado.' });
    const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get('limit') || 120)));
    return send(res, 200, { node, heartbeats: await listStreamNodeHeartbeats(nodeId, limit) });
  }

  const streamNodeHeartbeat = pathname.match(/^\/api\/stream-nodes\/([^/]+)\/heartbeat$/);
  if (streamNodeHeartbeat && req.method === 'POST') {
    requireNodeToken(req);
    const requestedId = decodeURIComponent(streamNodeHeartbeat[1]);
    const body = await readBody(req);
    const current = await getStreamNode(requestedId) || (body.ip ? await findStreamNodeByIp(body.ip) : null);
    if (!current) return send(res, 404, { message: 'Nodo no encontrado. Registra el nodo antes de enviar heartbeat.' });

    const node = normalizeNode(
      { ...current, ...body, id: current.id, status: body.status || 'En línea', lastSeenAt: new Date().toISOString() },
      current
    );
    const saved = await recordStreamNodeHeartbeat(current.id, node);
    return send(res, 200, { node: saved, canonicalId: saved.id });
  }

  const streamNodeMatch = pathname.match(/^\/api\/stream-nodes\/([^/]+)$/);
  if (streamNodeMatch) {
    const id = decodeURIComponent(streamNodeMatch[1]);
    if (req.method === 'GET') {
      const node = await getStreamNode(id);
      return node ? send(res, 200, { node }) : send(res, 404, { message: 'Nodo no encontrado.' });
    }
    if (req.method === 'DELETE') {
      const ok = await deleteStreamNode(id);
      if (ok) await addAudit({ action: 'DELETE', module: 'stream-nodes', detail: `Nodo ${id} eliminado`, metadata: { nodeId: id } });
      return send(res, ok ? 200 : 404, { ok });
    }
  }

  // Compatibilidad con la API histórica. Desde 0.4.3 comparte exactamente
  // la misma fuente dedicada que /api/stream-nodes para evitar doble verdad.
  if (pathname === '/api/nodes') {
    if (req.method === 'GET') return send(res, 200, { nodes: await listStreamNodes() });
    if (req.method === 'POST') {
      const body = await readBody(req);
      const item = normalizeNode({ ...body, status: body.status || 'Fuera de línea' });
      if (!item.name || !item.ip || !item.region || !item.capacity) return send(res, 400, { message: 'Nombre, IP, región y capacidad son obligatorios.' });
      if (!validNodeHost(item.ip)) return send(res, 400, { message: 'Ingresa una IP o hostname válido.' });
      if (await findStreamNodeByIp(item.ip)) return send(res, 409, { message: `La IP ${item.ip} ya está registrada en otro nodo.` });
      const { node } = await upsertStreamNode(item, { matchByIp: false });
      await addAudit({ action: 'CREATE', module: 'stream-nodes', detail: `Nodo ${node.id} creado por API compatible`, metadata: { nodeId: node.id, ip: node.ip } });
      return send(res, 201, node);
    }
  }

  const nodeMatch = pathname.match(/^\/api\/nodes\/([^/]+)$/);
  if (nodeMatch && req.method === 'DELETE') {
    const id = decodeURIComponent(nodeMatch[1]);
    const ok = await deleteStreamNode(id);
    if (ok) await addAudit({ action: 'DELETE', module: 'stream-nodes', detail: `Nodo ${id} eliminado por API compatible`, metadata: { nodeId: id } });
    return send(res, ok ? 200 : 404, { ok });
  }

  if (pathname === '/api/channels/bulk-create' && req.method === 'POST') {
    const body = await readBody(req), input = Array.isArray(body.channels) ? body.channels : [];
    if (!input.length || input.length > 500) return send(res, 400, { message: 'Envía entre 1 y 500 canales.' });
    const existing = await listItems(TABLES.channels), created = [], errors = [];
    for (let i=0;i<input.length;i++) {
      const item = normalizeChannel(input[i]);
      const validation = validateChannel(item, [...existing,...created]) || await validateChannelNode(item);
      if (validation) { errors.push({ index:i, name:item.name, message:validation }); continue; }
      await saveNew(TABLES.channels,item,'channels'); created.push(item);
    }
    return send(res, created.length ? 201 : 400, { created, errors });
  }

  if (pathname === '/api/channels/bulk' && req.method === 'POST') {
    const body=await readBody(req), ids=[...new Set(Array.isArray(body.ids)?body.ids.map(String):[])], action=String(body.action||''), payload=body.payload||{};
    if (!ids.length || ids.length>500) return send(res,400,{message:'Selecciona entre 1 y 500 canales.'});
    const allowed=['activate','deactivate','delete','category','bouquet','node','profile','reorder'];
    if(!allowed.includes(action)) return send(res,400,{message:'Acción masiva no válida.'});
    const updated=[],missing=[];
    for(const id of ids){const current=await getItem(TABLES.channels,id);if(!current){missing.push(id);continue}
      if(action==='delete'){await saveDelete(TABLES.channels,id,'channels');updated.push({id,deleted:true});continue}
      const patch={...current};
      if(action==='activate')patch.status='Activo'; if(action==='deactivate')patch.status='Inactivo';
      if(action==='category')patch.category=String(payload.category||'').trim();
      if(action==='bouquet')patch.bouquet=String(payload.bouquet||'').trim();
      if(action==='node'){const nextNodeId=String(payload.nodeId||'').trim();if(nextNodeId!==String(current.nodeId||'').trim()&&await getStreamDesiredState(id)==='running')return send(res,409,{message:`Detén el stream ${current.name||id} antes de moverlo a otro nodo.`});patch.nodeId=nextNodeId}
      if(action==='profile')patch.streamProfile=String(payload.streamProfile||'remux-copy');
      if(action==='reorder')patch.sortOrder=Number(payload.orders?.[id]??patch.sortOrder??patch.number);
      const item=normalizeChannel(patch,current); const validation=await validateChannelNode(item); if(validation)return send(res,400,{message:validation}); await saveUpdate(TABLES.channels,id,item,'channels');updated.push(item);
    }
    return send(res,200,{updated,missing});
  }

  if (pathname === '/api/channels') {
    if (req.method === 'GET') return send(res, 200, { channels: await listItems(TABLES.channels) });
    if (req.method === 'POST') {
      const channels = await listItems(TABLES.channels);
      const item = normalizeChannel(await readBody(req));
      const validation = validateChannel(item, channels) || await validateChannelNode(item);
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
      if(String(item.nodeId||'').trim()!==String(current.nodeId||'').trim()&&await getStreamDesiredState(id)==='running')return send(res,409,{message:'Detén el stream antes de moverlo a otro nodo.'});
      const validation = validateChannel(item, channels, id) || await validateChannelNode(item);
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

  return send(res, 404, { message: 'Ruta no encontrada.' });
}

async function start() {
  await initDatabase();
  await ensureUserSchema();

  const offlineEveryMs = Math.max(15000, Math.min(60000, Math.floor(streamNodeOfflineAfterSeconds() * 500)));
  const offlineTimer = setInterval(() => {
    markOfflineStreamNodes().catch((error) => console.error('No se pudo actualizar estado offline de nodos:', error));
  }, offlineEveryMs);
  offlineTimer.unref();

  const heartbeatPruneTimer = setInterval(() => {
    pruneStreamNodeHeartbeats().catch((error) => console.error('No se pudo depurar historial de heartbeats:', error));
  }, 60 * 60 * 1000);
  heartbeatPruneTimer.unref();

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
