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

### Inicio
**Motivo:** establecer una capa de seguridad real sobre el backend/MariaDB ya validado.

**Respaldo:** `backup/pre-etapa-9-auth-rbac`.

### Implementación 9.1 — Backend de autenticación y gateway seguro
Se añadieron:
- `server/auth.js`: hash de contraseñas con `scrypt`, roles, permisos, sesiones, expiración y consultas de identidad.
- `server/secure-entry.js`: gateway de autenticación delante de la API existente.
- `server/bootstrap-admin.js`: creación única del primer administrador sin guardar su contraseña en el archivo de entorno.
- `admin_roles`, `admin_permissions`, `admin_role_permissions`, `admin_users` y `admin_sessions` en MariaDB.
- Roles iniciales `superadmin`, `admin`, `operator` y `viewer`.
- Permisos por módulo y operación.
- Cookie de sesión `HttpOnly`, `SameSite=Strict`, con expiración.
- `/api/auth/login`, `/api/auth/me` y `/api/auth/logout`.
- Protección de endpoints administrativos con respuesta `401` para usuarios no autenticados y `403` para permisos insuficientes.
- `install.sh` actualizado para crear el primer administrador una sola vez y verificar que `/api/nodes` queda protegido.
- El servicio systemd ejecuta `server/secure-entry.js`; la API original queda en `127.0.0.1:3101` y el gateway público en `127.0.0.1:3100`.
- `index.html` carga `src/auth-guard.js` antes del panel.
- `src/auth-guard.js` añade pantalla de login, consulta de sesión, identidad visual y cierre de sesión.

**Criterios respetados:** las contraseñas no se guardan en texto plano, la autenticación no depende de `localStorage`, los permisos se verifican en backend y el API interno no queda expuesto directamente.

### Corrección 9.1.1 — Error de sintaxis en `install.sh` — CORREGIDA
**Motivo:** durante la instalación en Debian 13, el build terminó correctamente pero `install.sh` falló con `syntax error near unexpected token '('` al llegar a la sección de creación del administrador inicial.

**Causa identificada:** la asignación de `ADMIN_PASSWORD` utilizaba una expansión de parámetro con sustitución de comando anidada y comillas complejas, innecesariamente frágil para el parser de Bash.

**Cambio realizado:** se separó la generación de la contraseña aleatoria en un bloque `if/else`, evitando la expresión anidada y manteniendo el mismo comportamiento de seguridad.

**Archivo afectado:** `install.sh`.

**Respaldo:** `backup/pre-etapa-9-auth-rbac`.

### Corrección 9.1.2 — `admin_sessions.token_hash` demasiado corto para el digest generado — CORREGIDA
**Motivo:** el primer intento de login llegó correctamente al backend de autenticación, pero MariaDB rechazó la creación de la sesión con `ER_DATA_TOO_LONG` para `admin_sessions.token_hash`.

**Causa identificada:** el token aleatorio de 32 bytes se estaba procesando con `scrypt` a 64 bytes y convirtiendo a hexadecimal, produciendo 128 caracteres. La columna está definida como `CHAR(64)`.

**Cambio realizado:** se sustituyó el hash de sesión por SHA-256 hexadecimal, que produce exactamente 64 caracteres y es apropiado para resumir un token aleatorio de alta entropía. La operación quedó centralizada para creación, lectura y destrucción de sesiones.

**Archivo afectado:** `server/auth.js`.

**Respaldo:** `backup/pre-correccion-etapa-9-session-token-hash`.

**Commit de corrección:** `6faa83cc3f74c413d490fd1da95d553bd06787bc`.

### Validación final — Etapa 9
El usuario confirmó:
- Login administrativo funcionando.
- `/api/auth/me` devuelve correctamente el usuario `admin`, rol `superadmin` y sus permisos.
- Logout funcionando.
- Después del logout, `/api/nodes` responde `{"message":"Autenticación requerida."}`, confirmando que el endpoint protegido requiere sesión.
- Después de la prueba, el usuario puede iniciar sesión nuevamente normalmente.

**Resultado:** la autenticación administrativa, gestión de sesión, logout y protección de endpoints quedaron validados. La prueba específica de un rol restringido con `403` queda como prueba complementaria futura y no bloquea el cierre de la Etapa 9.

**ESTADO FINAL: ETAPA 9 — COMPLETADA Y VALIDADA.**

## Próxima etapa
**Etapa 10 — Usuarios IPTV / Panel Cliente — PENDIENTE DE INICIO.**

Objetivo general: transformar el módulo de usuarios IPTV en una base real para clientes, considerando desde el diseño inicial cuentas de cliente, paquetes, vencimientos, dispositivos, límites de conexiones y la futura integración con streaming real y aplicación cliente.

## Protocolo de cierre
1. Build correcto.
2. Servicio `ipztream-api` activo.
3. MariaDB con tablas RBAC.
4. Primer administrador creado una sola vez.
5. `/api/health` público y funcional.
6. `/api/auth/login` funcional.
7. `/api/auth/me` funcional con sesión.
8. `/api/nodes` y otros endpoints protegidos sin sesión.
9. `403` con permisos insuficientes como prueba complementaria futura.
10. Logout invalida sesión.
11. Panel web exige login.
12. Usuario valida y entonces se registra **COMPLETADA Y VALIDADA**.
