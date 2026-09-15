# IPZStream — Continuidad del proyecto

## Propósito
IPZStream es una plataforma propia de gestión y distribución de streaming, inspirada en capacidades de paneles IPTV existentes, pero desarrollada con arquitectura, código e interfaz propios.

## Reglas de trabajo obligatorias
- Este repositorio es independiente de Z-Hub.
- GitHub se utilizará para desarrollo, pruebas, control de versiones y releases.
- Las instalaciones de clientes deberán recibir builds/releases controlados mediante un sistema propio de actualización; los clientes no deberán depender del repositorio fuente.
- **ANTES DE CADA ETAPA:** actualizar primero este documento `CONTINUITY.md` con el estado y objetivo de la siguiente etapa.
- Antes de cambios estructurales importantes se debe crear un respaldo o punto de restauración.
- Los cambios se implementan por etapas, probando cada etapa antes de continuar.
- No generar nuevos mockups salvo que el usuario los solicite explícitamente.
- **BITÁCORA PRIMERO:** después de actualizar Continuidad, toda mejora, corrección o cambio debe registrarse en `BITACORA.md`; después se modifica el código y se publica la actualización.
- Cada entrada de bitácora debe indicar etapa, motivo, archivos afectados y resultado esperado.
- La arquitectura debe mantenerse modular: cada menú principal tendrá su módulo y las opciones importantes se separarán en componentes, servicios/API y estilos cuando corresponda.
- Evitar concentrar nuevas funcionalidades en `src/main.jsx`.

## Estado de las etapas
1. Configuración — **COMPLETADA Y VALIDADA**.
2. Usuarios — **COMPLETADA Y VALIDADA**.
3. Servidores / Nodos — **COMPLETADA Y VALIDADA**.
4. Canales / Fuentes — **COMPLETADA Y VALIDADA**.
5. VOD / Series / EPG / M3U — **COMPLETADA Y VALIDADA**.
6. Paquetes / Conexiones / Dispositivos — **COMPLETADA Y VALIDADA**.
7. Logs / Auditoría / Estadísticas — **COMPLETADA Y VALIDADA**.
8. Backend real + MariaDB — **COMPLETADA Y VALIDADA**.
9. Autenticación real + RBAC — **IMPLEMENTADA, PENDIENTE DE VALIDACIÓN DEL USUARIO**.

## Estado actual
- Repositorio: `ronbercito/ipztream`
- Rama: `main`
- Versión visible: `0.1.0`.
- Debian 13 / Node.js 22 / npm 10 en el entorno de prueba.
- IP de prueba: `192.168.10.220`.
- Nginx publica `/var/www/ipztream`.
- Código fuente: `/opt/ipztream`.
- Servicio: `ipztream-api`.
- MariaDB es la base principal y permanente.
- Etapas 1–8 están validadas por el usuario.

## Etapa 9 — Estado técnico implementado
- `server/auth.js` contiene hashing `scrypt`, roles, permisos, sesiones y consultas de identidad.
- `server/secure-entry.js` funciona como gateway de autenticación delante de la API existente.
- La API interna usa `127.0.0.1:3101`; el gateway ocupa `127.0.0.1:3100`.
- `/api/health` queda público.
- `/api/auth/login`, `/api/auth/me` y `/api/auth/logout` gestionan la sesión administrativa.
- Los endpoints administrativos requieren sesión y permiso RBAC.
- La sesión se almacena mediante cookie `HttpOnly`, `SameSite=Strict` y expiración configurable.
- MariaDB añade tablas `admin_roles`, `admin_permissions`, `admin_role_permissions`, `admin_users` y `admin_sessions`.
- Roles iniciales: `superadmin`, `admin`, `operator`, `viewer`.
- `server/bootstrap-admin.js` permite crear el primer administrador una sola vez; la contraseña inicial no se guarda en el env del servicio.
- `install.sh` integra el bootstrap inicial y comprueba que `/api/nodes` devuelve `401` sin sesión.
- `src/auth-guard.js` impide cargar el panel hasta validar una sesión y ofrece cierre de sesión.
- `index.html` carga `src/auth-guard.js` como punto de entrada.

## Corrección activa de Etapa 9 — Hash de sesión demasiado largo
**Estado:** CORRECCIÓN EN PROCESO / PENDIENTE DE VALIDACIÓN.

Durante el primer intento de login, MariaDB rechazó la creación de la sesión con `ER_DATA_TOO_LONG` en `admin_sessions.token_hash`. El código derivaba 64 bytes con `scrypt` y los convertía a hexadecimal, generando 128 caracteres, mientras la columna `token_hash` está definida como `CHAR(64)`.

**Objetivo:** mantener `token_hash` en `CHAR(64)` y almacenar un digest hexadecimal de 64 caracteres, adecuado para el token aleatorio de sesión, evitando ampliar innecesariamente la columna.

**Cambio previsto:** usar un hash SHA-256 del token de sesión para `token_hash`, centralizando la operación en la función de hashing de sesión para login, recuperación de sesión y logout.

**Archivo afectado:** `server/auth.js`.

**Respaldo:** `backup/pre-correccion-etapa-9-session-token-hash`.

**Criterio de cierre:** build correcto, login crea la sesión sin error, `/api/auth/me` reconoce la sesión y logout la invalida.

## Validación pendiente de Etapa 9
En el contenedor se debe comprobar, como mínimo:
1. `git pull origin main`.
2. `bash install.sh`.
3. Build sin errores.
4. Servicio activo.
5. MariaDB con las tablas RBAC.
6. Credenciales iniciales mostradas por el instalador.
7. `/api/health` responde `200`.
8. `/api/nodes` sin sesión responde `401`.
9. Login devuelve sesión.
10. `/api/auth/me` devuelve usuario, rol y permisos.
11. Logout invalida la sesión.
12. El panel web muestra login y después permite entrar al panel.
13. Un usuario con permisos limitados recibe `403` al intentar una operación no autorizada.

## Respaldos
- `backup/pre-etapa-1-13-configuracion`
- `backup/pre-etapa-2-13-usuarios`
- `backup/pre-correccion-configuracion-completa`
- `backup/pre-etapa-2-7-usuarios`
- `backup/pre-etapa-3-7-nodes`
- `backup/pre-correccion-nodos-persistencia`
- `backup/pre-etapa-4-7-channels`
- `backup/pre-etapa-5-7-vod-series-epg-m3u`
- `backup/pre-etapa-6-7-packages-connections-devices`
- `backup/pre-etapa-7-7-logs-auditoria-estadisticas`
- `backup/pre-etapa-8-backend-postgres`
- `backup/pre-correccion-etapa-8-mariadb`
- `backup/pre-correccion-schema-mariadb-multistatements`
- `backup/pre-etapa-9-auth-rbac`
- `backup/pre-correccion-etapa-9-session-token-hash`

## Próxima fase
La siguiente etapa no se inicia hasta cerrar y validar la Etapa 9. Después se podrá avanzar a administración avanzada de usuarios/permisos, auditoría asociada a identidad, telemetría real, sesiones de streaming, licenciamiento y updater firmado.

## Protocolo obligatorio
1. Actualizar primero `CONTINUITY.md`.
2. Registrar la intención/corrección en `BITACORA.md`.
3. Crear respaldo cuando el cambio sea estructural.
4. Implementar.
5. Ejecutar build/verificación.
6. Probar en el contenedor.
7. Registrar resultado.
8. Publicar.
9. Informar al usuario qué cambió y cómo probarlo.
