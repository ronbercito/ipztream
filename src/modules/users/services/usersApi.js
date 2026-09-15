async function request(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Error HTTP ${response.status}`);
  return data;
}

export async function listUsers() {
  const data = await request('/api/users');
  return Array.isArray(data.users) ? data.users : [];
}

export async function listPackages() {
  const data = await request('/api/packages');
  return Array.isArray(data.packages) ? data.packages : [];
}

export async function saveUser(user) {
  const editing = Boolean(user.id);
  return request(editing ? `/api/users/${encodeURIComponent(user.id)}` : '/api/users', {
    method: editing ? 'PUT' : 'POST',
    body: JSON.stringify(user)
  });
}

export async function deleteUser(id) {
  return request(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
