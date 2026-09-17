import { ensureAuthSchema, hashPassword } from './auth.js';
import { pool } from './db.js';

const username = String(process.argv[2] || '').trim().toLowerCase();
const password = String(process.argv[3] || '');

if (!/^[a-z0-9._-]{3,64}$/.test(username)) {
  console.error('Uso: node server/reset-admin-password.js <usuario> <nueva-contraseña>');
  process.exit(1);
}

if (password.length < 8) {
  console.error('La contraseña administrativa debe tener al menos 8 caracteres.');
  process.exit(1);
}

try {
  await ensureAuthSchema();
  const found = await pool.query('SELECT id FROM admin_users WHERE username = ? LIMIT 1', [username]);
  const user = found.rows[0];
  if (!user) throw new Error(`No existe el administrador ${username}.`);
  const passwordHash = await hashPassword(password);
  await pool.query('UPDATE admin_users SET password_hash = ?, status = ? WHERE id = ?', [passwordHash, 'active', user.id]);
  await pool.query('DELETE FROM admin_sessions WHERE admin_user_id = ?', [user.id]);
  console.log(`Contraseña actualizada para ${username}. Las sesiones anteriores fueron cerradas.`);
} catch (error) {
  console.error(error.message || error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
