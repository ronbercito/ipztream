import { ensureAuthSchema, bootstrapAdmin } from './auth.js';
import { pool } from './db.js';

const username = process.env.IPZTREAM_ADMIN_USER || 'admin';
const password = process.env.IPZTREAM_ADMIN_PASSWORD || '';

if (!password) {
  console.error('Falta IPZTREAM_ADMIN_PASSWORD.');
  process.exit(1);
}

try {
  await ensureAuthSchema();
  const result = await bootstrapAdmin(username, password);
  console.log(result.created ? `Administrador creado: ${result.username}` : `Ya existe un administrador; no se creó otro.`);
} finally {
  await pool.end().catch(() => {});
}
