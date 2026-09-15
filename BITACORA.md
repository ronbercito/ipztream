# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–7 — Panel modular

### Etapa 1 — Configuración — COMPLETADA Y VALIDADA
Se creó `src/modules/settings/` con las secciones principales de configuración y persistencia inicial.

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
Se implementaron Logs/Auditoría y Estadísticas.

**Respaldo:** `backup/pre-etapa-7-7-logs-auditoria-estadisticas`.

**Validación:** el usuario confirmó build, API y pruebas funcionales correctas.

## Etapa 8 — Backend real + MariaDB — COMPLETADA Y VALIDADA
MariaDB quedó como base principal y permanente.

**Respaldo PostgreSQL:** `backup/pre-etapa-8-backend-postgres`.
**Respaldo MariaDB:** `backup/pre-correccion-etapa-8-mariadb`.

### Corrección 8.2 — DDL MariaDB multi-sentencia
Se corrigió `server/db.js` para ejecutar cada sentencia DDL por separado.

**Respaldo:** `backup/pre-correccion-schema-mariadb-multistatements`.

## Etapa 9 — Autenticación real + RBAC — COMPLETADA Y VALIDADA
Se implementaron autenticación administrativa, sesiones, roles, permisos y protección de API.

**Respaldo:** `backup/pre-etapa-9-auth-rbac`.

### Corrección 9.1.2 — `admin_sessions.token_hash`
Se corrigió el hash de sesión para usar SHA-256 hexadecimal de 64 caracteres.

**Respaldo:** `backup/pre-correccion-etapa-9-session-token-hash`.

**Commit:** `6faa83cc3f74c413d490fd1da95d553bd06787bc`.

**Validación:** login, `/api/auth/me`, logout y protección de `/api/nodes` fueron confirmados por el usuario.

## Etapa 10 — Usuarios IPTV / Panel Cliente — EN PROGRESO

### Inicio de etapa
**Motivo:** transformar el módulo administrativo de usuarios existente en una base real para clientes IPTV y preparar la futura autenticación de aplicaciones, dispositivos, sesiones y streaming real.

**Respaldo:** `backup/pre-etapa-10-usuarios-iptv`.

### Corrección 10.1 — Usuarios y paquetes
Se corrigieron resultados MariaDB, rutas `/api/users`, `user_credentials`, generación de IDs de paquetes y comunicación del módulo Paquetes.

### Corrección 10.2 — Contraseña mínima de cliente IPTV
Se modificó la validación de cliente para permitir desde 1 carácter y mantener el hash seguro.

### Corrección 10.3 — Mostrar/ocultar contraseña
Se añadió el control `Eye/EyeOff` al campo de contraseña del cliente IPTV.

### Corrección 10.4 — Fecha futura mostrada como vencida y fallo al guardar
Se corrigió la normalización entre vencimiento y estado, y se mejoró la visualización del error real de API durante el guardado.

### Corrección 10.5 — Separar política de contraseña y permitir edición completa
**Motivo:** el usuario reportó que continúa apareciendo `La contraseña debe tener al menos 12 caracteres.` para clientes IPTV y que al editar una cuenta solo puede modificar el nombre.

**Causa:** `server/auth.js` tiene una política global de 12 caracteres dentro de `hashPassword()`, utilizada también por `server/user-service.js`. Esto impide que el cliente IPTV use el mínimo solicitado de 1 carácter. Además, `UserForm.jsx` tiene `username` explícitamente deshabilitado.

**Objetivo:**
- Mantener mínimo de 12 caracteres exclusivamente para cuentas administrativas.
- Crear una función de hash independiente para credenciales IPTV con mínimo de 1 carácter.
- Usar esa función en creación y cambio de contraseña de clientes.
- Permitir editar usuario, nombre, estado, paquete, máximo de conexiones, vencimiento y contraseña opcional.
- Mantener el usuario protegido contra credenciales en texto plano.

**Archivos afectados previstos:** `server/auth.js`, `server/user-service.js`, `src/modules/users/components/UserForm.jsx`.

**Resultado esperado:** cliente IPTV con contraseña de 1 carácter aceptado; administrador continúa con política de 12; edición completa de la cuenta disponible.

**Respaldo:** `backup/pre-etapa-10-usuarios-iptv`.

## Protocolo de cierre
1. Build correcto.
2. Servicio `ipztream-api` activo.
3. Persistencia MariaDB verificada.
4. CRUD de clientes funcional.
5. Credenciales seguras.
6. Paquete/vencimiento/estado/límite de conexiones validados.
7. Compatibilidad con módulos relacionados comprobada.
8. Usuario valida y entonces se registra **COMPLETADA Y VALIDADA**.
