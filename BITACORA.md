# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–7 — Panel modular

### Etapa 1 — Configuración — COMPLETADA Y VALIDADA
Se creó `src/modules/settings/` con las secciones principales de configuración y persistencia inicial.

### Etapa 2 — Usuarios — COMPLETADA Y VALIDADA
Se creó `src/modules/users/` con filtros, CRUD, validaciones, paquetes, conexiones y persistencia inicial.

### Etapa 3 — Servidores / Nodos — COMPLETADA Y VALIDADA
Se creó `src/modules/nodes/` con API y persistencia.

### Etapa 4 — Canales / Fuentes — COMPLETADA Y VALIDADA
Se creó `src/modules/channels/` con CRUD, filtros, fuentes y persistencia API.

### Etapa 5 — VOD / Series / EPG / M3U — COMPLETADA Y VALIDADA
Se implementaron módulos independientes y APIs para VOD, Series, EPG y M3U.

### Etapa 6 — Paquetes / Conexiones / Dispositivos — COMPLETADA Y VALIDADA
Se implementaron módulos, servicios y persistencia.

### Etapa 7 — Logs / Auditoría / Estadísticas — COMPLETADA Y VALIDADA
Se implementaron Logs/Auditoría y Estadísticas.

## Etapa 8 — Backend real + MariaDB — COMPLETADA Y VALIDADA
MariaDB quedó como base principal y permanente.

### Corrección 8.2 — DDL MariaDB multi-sentencia
Se corrigió `server/db.js` para ejecutar cada sentencia DDL por separado.

## Etapa 9 — Autenticación real + RBAC — COMPLETADA Y VALIDADA
Se implementaron autenticación administrativa, sesiones, roles y permisos.

### Corrección 9.1.2 — `admin_sessions.token_hash`
Se corrigió el hash de sesión para usar SHA-256 hexadecimal de 64 caracteres.

## Etapa 10 — Usuarios IPTV / Panel Cliente — COMPLETADA Y VALIDADA
Se implementó el modelo real de clientes IPTV con credenciales separadas, paquetes, vencimiento, estado, conexiones y edición completa. El usuario confirmó que funciona correctamente.

## Etapa 11 — API de clientes + sesiones de aplicación — EN IMPLEMENTACIÓN

### Objetivo
Crear la capa de autenticación y sesión específica para clientes IPTV, independiente de la autenticación administrativa, para que posteriormente una aplicación IPTV pueda iniciar sesión y consumir catálogo y reproducción de forma segura.

### Alcance
- Login IPTV mediante usuario y contraseña.
- Sesiones temporales en MariaDB.
- Token aleatorio almacenado únicamente como SHA-256.
- `/api/client/me`.
- `/api/client/logout`.
- Expiración de sesiones.
- Rechazo de clientes inválidos, vencidos o suspendidos.
- Auditoría de login/logout.
- Separación respecto a `admin_sessions`.

### Corrección 11.1 — Integración y modelo real de datos del cliente
**Motivo:** la primera implementación del servicio de clientes asumía columnas físicas (`username`, `status`, `package_id`, etc.) que no existen en la tabla `users`; IPZStream guarda esos datos dentro del campo JSON `payload`. Además, las rutas `/api/client/*` todavía no estaban integradas en `secure-entry.js` y faltaba crear automáticamente `client_sessions`.

**Archivos afectados:** `server/client-auth.js`, `server/secure-entry.js`, `database/schema.sql`.

**Objetivo:** adaptar la autenticación al modelo JSON real de MariaDB, crear la tabla de sesiones automáticamente, integrar login/me/logout en el gateway público y mantener la separación de la autenticación administrativa.

**Resultado esperado:** un cliente real creado desde el panel podrá autenticarse mediante `/api/client/login`, consultar `/api/client/me`, cerrar sesión y quedar rechazado posteriormente con el mismo token. La respuesta nunca expondrá `password_hash`.

**Respaldo:** `backup/pre-etapa-11-api-clientes-sesiones`.
