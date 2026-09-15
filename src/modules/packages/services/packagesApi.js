const api = async (path, options = {}) => {
  const res = await fetch(path, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `No se pudo completar la operación (HTTP ${res.status}).`);
  return data;
};

export const getPackages = async () => {
  const data = await api('/api/packages');
  return Array.isArray(data.packages) ? data.packages : [];
};

export const createPackage = (payload) => api('/api/packages', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const updatePackage = (id, payload) => api(`/api/packages/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(payload)
});

export const deletePackage = (id) => api(`/api/packages/${encodeURIComponent(id)}`, {
  method: 'DELETE'
});
