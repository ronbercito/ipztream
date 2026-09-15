import { authenticateClient, createClientSession, getClientSession, destroyClientSession, clientSessionCookie, clearClientSessionCookie, getClientToken, publicClient } from './client-auth.js';

export async function handleClientAuth(req, res, send, readBody) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/client/login' && req.method === 'POST') {
    const body = await readBody(req);
    const user = await authenticateClient(body.username, body.password);
    if (!user) return send(res, 401, { message: 'Usuario, contraseña, estado o vencimiento inválido.' });
    const session = await createClientSession(user, user.username);
    res.setHeader('Set-Cookie', clientSessionCookie(session.token));
    return send(res, 200, { client: publicClient(user), expiresAt: session.expiresAt });
  }

  if (url.pathname === '/api/client/me' && req.method === 'GET') {
    const session = await getClientSession(getClientToken(req));
    if (!session) return send(res, 401, { message: 'Sesión de cliente inválida o expirada.' });
    return send(res, 200, { client: publicClient(session.user), sessionExpiresAt: undefined });
  }

  if (url.pathname === '/api/client/logout' && req.method === 'POST') {
    await destroyClientSession(getClientToken(req), 'client');
    res.setHeader('Set-Cookie', clearClientSessionCookie());
    return send(res, 200, { ok: true });
  }

  return false;
}
