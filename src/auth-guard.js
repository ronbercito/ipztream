const root = document.getElementById('root');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function showLogin(message = '') {
  root.innerHTML = `
    <div class="ipz-login-shell">
      <div class="ipz-login-card">
        <div class="ipz-login-brand"><div class="ipz-login-mark">▶</div><div><strong>IPZSTREAM</strong><span>IPTV Management Platform</span></div></div>
        <div class="ipz-login-copy"><h1>Acceso administrativo</h1><p>Ingresa con tu cuenta de administrador para continuar.</p></div>
        <form id="ipz-login-form">
          <label>Usuario<input name="username" autocomplete="username" required autofocus /></label>
          <label>Contraseña<input name="password" type="password" autocomplete="current-password" required /></label>
          <div id="ipz-login-error" class="ipz-login-error">${escapeHtml(message)}</div>
          <button type="submit">Iniciar sesión</button>
        </form>
      </div>
    </div>`;
  document.getElementById('ipz-login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button');
    const error = document.getElementById('ipz-login-error');
    error.textContent = '';
    button.disabled = true;
    button.textContent = 'Verificando...';
    try {
      const body = Object.fromEntries(new FormData(form).entries());
      const response = await fetch('/api/auth/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'No se pudo iniciar sesión.');
      await startApplication(data.user);
    } catch (err) {
      error.textContent = err.message;
      button.disabled = false;
      button.textContent = 'Iniciar sesión';
    }
  });
}

async function getMe() {
  const response = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) return null;
  const data = await response.json();
  return data.user || null;
}

async function startApplication(user) {
  root.innerHTML = '';
  await import('./main.jsx');
  setTimeout(() => decoratePanel(user), 0);
}

function decoratePanel(user) {
  const initials = user.username.slice(0, 2).toUpperCase();
  const avatar = document.querySelector('.topbar .avatar');
  const admin = document.querySelector('.topbar .admin');
  if (avatar) avatar.textContent = initials;
  if (admin) admin.textContent = `${user.username} · ${user.roleName}`;

  if (!document.getElementById('ipz-logout')) {
    const logout = document.createElement('button');
    logout.id = 'ipz-logout';
    logout.type = 'button';
    logout.textContent = 'Cerrar sesión';
    logout.title = 'Cerrar sesión';
    logout.addEventListener('click', async () => {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
      window.location.reload();
    });
    document.querySelector('.top-actions')?.appendChild(logout);
  }
}

const style = document.createElement('style');
style.textContent = `
  .ipz-login-shell{min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(135deg,#0b2035,#123b5d);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
  .ipz-login-card{width:min(390px,100%);background:#fff;border-radius:14px;padding:28px;box-shadow:0 28px 80px #06192b66}
  .ipz-login-brand{display:flex;align-items:center;gap:10px;margin-bottom:28px}.ipz-login-mark{width:38px;height:38px;border-radius:10px;background:#078cf2;color:#fff;display:grid;place-items:center;font-size:18px}.ipz-login-brand strong{display:block;color:#16344d;font-size:17px}.ipz-login-brand span{display:block;color:#8aa0b3;font-size:8px;margin-top:2px}
  .ipz-login-copy h1{margin:0 0 6px;color:#18324a;font-size:20px}.ipz-login-copy p{margin:0 0 22px;color:#7890a4;font-size:10px;line-height:1.5}
  #ipz-login-form{display:grid;gap:14px}.ipz-login-card label{display:grid;gap:6px;color:#61788d;font-size:9px;font-weight:700}.ipz-login-card input{height:40px;border:1px solid #dbe5ed;border-radius:7px;padding:0 11px;outline:none;color:#29455f;font-size:11px}.ipz-login-card input:focus{border-color:#087fe9;box-shadow:0 0 0 3px #087fe914}.ipz-login-card button{height:40px;border:0;border-radius:7px;background:#087fe9;color:#fff;font-weight:700;font-size:10px;cursor:pointer}.ipz-login-card button:disabled{opacity:.65;cursor:wait}.ipz-login-error{min-height:16px;color:#d74354;font-size:9px}
  #ipz-logout{height:30px;border:1px solid #ffffff24;border-radius:6px;background:#ffffff10;color:#fff;padding:0 9px;font:600 9px Inter;cursor:pointer}
  #ipz-logout:hover{background:#ffffff1c}
`;
document.head.appendChild(style);

(async () => {
  try {
    const user = await getMe();
    if (user) await startApplication(user);
    else showLogin();
  } catch {
    showLogin('No se pudo contactar con el servidor de autenticación.');
  }
})();
