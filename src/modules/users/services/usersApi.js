// Capa de servicio preparada para reemplazar los datos demo por API real.
export async function listUsers() {
  // TODO: conectar con GET /api/users cuando exista el backend.
  return [];
}

export async function saveUser(user) {
  // TODO: conectar con POST/PATCH /api/users.
  return user;
}

export async function deleteUser(id) {
  // TODO: conectar con DELETE /api/users/:id.
  return { id, deleted: true };
}
