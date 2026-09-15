# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–7 — Panel modular

### Etapa 1 — Configuración — COMPLETADA Y VALIDADA
Se creó el módulo `src/modules/settings/` con las secciones principales de configuración y persistencia inicial.

**Respaldo:** `backup/pre-etapa-1-13-configuracion`.

### Etapa 2 — Usuarios — COMPLETADA Y VALIDADA
Se creó `src/modules/users/` con filtros, CRUD, validaciones, paquetes, conexiones y persistencia inicial.

**Respaldos:** `backup/pre-etapa-2-13-usuarios`, `backup/pre-etapa-2-7-usuarios`.

**Validación:** el usuario confirmó las pruebas funcionales y de persistencia.

### Corrección — Configuración / conflicto `Settings`
Se restauró Configuración completa y se corrigió el conflicto de nombre con el icono `Settings` de lucide-react usando `SettingsIcon`.

**Respaldo:** `backup/pre-correccion-configuracion-completa`.

### Etapa 3 — Servidores / Nodos — COMPLETADA Y VALIDADA
Se creó `src/modules/nodes/`, servicio API, persistencia en MariaDB/JSON de transición y validación de IP duplicada.

**Respaldos:** `backup/pre-etapa-3-7-nodes`, `backup/pre-correccion-nodos-persistencia`.

### Etapa 4 — Canales / Fuentes — COMPLETADA Y VALIDADA
Se creó `src/modules/channels/` con CRUD, filtros, fuentes y persistencia API.

**Respaldo:** `backup/pre-etapa-4-7-channels`.

**Validación:** el usuario confirmó alta, edición, estados, eliminación, búsqueda, filtros y fuentes.

### Etapa 5 — VOD / Series / EPG / M3U — COMPLETADA Y VALIDADA
Se implementaron módulos independientes y APIs para VOD, Series, EPG y M3U.

**Respaldo:** `backup/pre-etapa-5-7-vod-series-epg-m3u`.

**Validación:** build, API y frontend confirmados por el usuario como funcionales.

### Etapa 6 — Paquetes / Conexiones / Dispositivos — COMPLETADA Y VALIDADA
Se implementaron módulos, servicios, persistencia y operaciones de gestión para los tres componentes.

**Respaldo:** `backup/pre-etapa-6-7-packages-connections-devices`.

**Validación:** el usuario confirmó que todo funciona correctamente.

### Etapa 7 — Logs / Auditoría / Estadísticas — COMPLETADA Y VALIDADA
Se implementaron Logs/Auditoría y Estadísticas. Quedaron documentados como límites pendientes la auditoría automática completa y las métricas reales de streaming.

**Respaldo:** `backup/pre-etapa-7-7-logs-auditoria-estadisticas`.

**Validación:** el usuario confirmó build, API y pruebas funcionales correctas.

## Etapa 8 — Backend real + MariaDB — COMPLETADA Y VALIDADA
La etapa comenzó con PostgreSQL, pero se corrigió la arquitectura para utilizar **MariaDB como base principal y permanente**.

**Respaldo PostgreSQL:** `backup/pre-etapa-8-backend-postgres`.
**Respaldo MariaDB:** `backup/pre-correccion-etapa-8-mariadb`.

### Corrección 8.2 — DDL MariaDB multi-sentencia
Se corrigió `server/db.js` para ejecutar cada sentencia DDL por separado y eliminar `ER_PARSE_ERROR` durante la creación del esquema.

**Respaldo:** `backup/pre-correccion-schema-mariadb-multistatements`.

**Validación:** el usuario confirmó build correcto, MariaDB activo, 11 tablas creadas, API en `127.0.0.1:3100`, `/api/health` correcto, servicio activo tras reinicio y funcionamiento general correcto.

## Etapa 9 — Autenticación real + RBAC — COMPLETADA Y VALIDADA

### Implementación y correcciones
Se implementaron autenticación administrativa, RBAC, gateway seguro, sesiones HttpOnly, bootstrap del administrador y corrección del hash de sesión mediante SHA-256.

**Respaldo:** `backup/pre-etapa-9-auth-rbac` y `backup/pre-correccion-etapa-9-session-token-hash`.

### Validación final
El usuario confirmó login, `/api/auth/me`, logout y protección de `/api/nodes` sin sesión.

**ESTADO FINAL: ETAPA 9 — COMPLETADA Y VALIDADA.**

## Etapa 10 — Usuarios IPTV / Panel Cliente — IMPLEMENTADA, PENDIENTE DE VALIDACIÓN

### Inicio de etapa
**Motivo:** transformar el módulo administrativo de usuarios existente en una base real para clientes IPTV y preparar desde ahora la futura autenticación de aplicaciones, dispositivos, sesiones y streaming real.

**Respaldo:** `backup/pre-etapa-10-usuarios-iptv`.

### Implementación 10.1 — Modelo y API de clientes IPTV
Se añadió `server/user-service.js` como servicio independiente de clientes.

Implementado:
- CRUD real de `/api/users` y `/api/users/:id`.
- Persistencia en MariaDB.
- Tabla `user_credentials` separada del payload del cliente.
- Hash de contraseña mediante `scrypt`.
- La API nunca devuelve el hash de contraseña.
- Validación de usuario y duplicados.
- Validación de nombre.
- Asociación real con paquetes existentes.
- Vencimiento en formato ISO `AAAA-MM-DD`.
- Estado `Activo`, `Suspendido` o `Vencido`.
- Detección automática de vencimiento al consultar.
- Máximo de conexiones limitado por el paquete.
- Indicador `passwordConfigured` sin revelar credenciales.
- Cambio de contraseña durante edición.
- Eliminación de credenciales al borrar cliente.
- Desasociación de dispositivos que pertenecían al usuario eliminado.

### Implementación 10.2 — Gateway y RBAC
`server/secure-entry.js` intercepta las rutas de clientes antes de la API administrativa genérica y las ejecuta mediante `user-service.js`.

`server/auth.js` ahora aplica permisos específicos también a `/api/users/:id`:
- `GET` → `users.view`
- `POST` → `users.create`
- `PUT` → `users.update`
- `DELETE` → `users.delete`

### Implementación 10.3 — Panel administrativo de clientes
`src/modules/users/` dejó de usar `localStorage` como persistencia principal.

Ahora:
- carga clientes desde `/api/users`;
- carga paquetes desde `/api/packages`;
- crea/edita/elimina mediante API;
- exige contraseña inicial de mínimo 12 caracteres;
- permite cambio de contraseña al editar;
- selecciona paquetes reales;
- limita conexiones al máximo del paquete;
- filtra por paquetes existentes;
- muestra errores provenientes del backend;
- mantiene la separación entre UI y servicio API.

### Implementación 10.4 — Esquema
`database/schema.sql` fue actualizado a v3 e incluye `user_credentials` con relación a `users` y eliminación en cascada.

**Archivos principales afectados:**
- `server/user-service.js`
- `server/secure-entry.js`
- `server/auth.js`
- `database/schema.sql`
- `src/modules/users/Users.jsx`
- `src/modules/users/components/UserForm.jsx`
- `src/modules/users/components/UserFilters.jsx`
- `src/modules/users/services/usersApi.js`

### Resultado técnico
La implementación quedó publicada en `main` y comparada contra el punto de respaldo de Etapa 10. El cambio comprende 10 archivos y mantiene intacta la arquitectura administrativa existente.

**Pendiente:** instalación/build y validación funcional en el entorno Debian del usuario. No se marca la etapa como completada hasta que el usuario confirme las pruebas.

## Protocolo de cierre
1. Build correcto.
2. Servicio `ipztream-api` activo.
3. Persistencia MariaDB verificada.
4. CRUD de clientes funcional.
5. Credenciales seguras.
6. Paquete/vencimiento/estado/límite de conexiones validados.
7. Compatibilidad con módulos relacionados comprobada.
8. Usuario valida y entonces se registra **COMPLETADA Y VALIDADA**.
