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
Se implementaron autenticación administrativa, sesiones, roles, permisos y protección de API.

### Corrección 9.1.2 — `admin_sessions.token_hash`
Se corrigió el hash de sesión para usar SHA-256 hexadecimal de 64 caracteres.

## Etapa 10 — Usuarios IPTV / Panel Cliente — COMPLETADA Y VALIDADA
Se implementó el modelo real de clientes IPTV con credenciales separadas, paquetes, vencimiento, estado, conexiones y edición completa. Se corrigieron las validaciones de contraseña IPTV y el formulario de edición. El usuario confirmó que funciona correctamente.

## Etapa 11 — API de clientes + sesiones de aplicación — EN IMPLEMENTACIÓN

### Objetivo
Crear la capa de autenticación y sesión específica para clientes IPTV, independiente de la autenticación administrativa, para que posteriormente una aplicación IPTV pueda iniciar sesión y consumir catálogo y reproducción de forma segura.

### Motivo
El sistema ya dispone de clientes IPTV persistidos en MariaDB y autenticación administrativa. El siguiente paso necesario antes del streaming real es que esos clientes puedan autenticarse por una API propia y mantener una sesión segura.

### Alcance registrado antes de implementar
- Login IPTV mediante usuario y contraseña.
- Sesiones persistentes temporalmente en MariaDB.
- Token aleatorio entregado al cliente y almacenado únicamente como hash.
- Endpoint `/api/client/me`.
- Endpoint `/api/client/logout`.
- Expiración de sesiones.
- Rechazo de credenciales inválidas, usuarios vencidos y suspendidos.
- Auditoría de login/logout.
- Separación completa respecto a `admin_sessions`.
- Base para futuras APIs de catálogo, dispositivos y reproducción.

### No se implementará todavía
- Motor de streaming.
- HLS.
- URLs de reproducción.
- Aplicación móvil/TV.
- Control definitivo de conexiones simultáneas.

### Archivos previstos
- `server/client-auth.js`
- `server/secure-entry.js` y/o `server/index.js`
- `server/db.js`
- `database/schema.sql`
- Documentación de etapa.

### Resultado esperado
Un cliente IPTV existente podrá hacer login, recibir una sesión segura, consultar su propia identidad/estado, cerrar sesión y ser rechazado automáticamente cuando esté vencido o suspendido. Ninguna respuesta de autenticación deberá devolver el hash o la contraseña.

### Respaldo
`backup/pre-etapa-11-api-clientes-sesiones`.
