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

## Etapa 11 — API de clientes + sesiones de aplicación — COMPLETADA Y VALIDADA
Se implementó login IPTV, sesiones en MariaDB, `/api/client/me`, logout, expiración y separación de sesiones administrativas. Las pruebas reales confirmaron login 200, `/me` 200, logout 200 y `/me` posterior 401.

## Etapa 12 — Motor de streaming real + integración de fuentes — EN IMPLEMENTACIÓN

### Objetivo
Iniciar el primer motor de streaming real de IPZStream. No se utilizarán simulaciones: una fuente real configurada en un canal deberá poder ser procesada por FFmpeg y convertirse en una salida HLS reproducible.

### Implementación realizada
**Archivos principales:**
- `server/stream-manager.js`
- `server/secure-entry.js`
- `install.sh`
- `docs/ETAPA-12.md`

**Cambios:**
- Se creó un gestor modular de procesos FFmpeg.
- Se incorporó inicio, detención y reinicio por canal.
- Se incorporó estado real: `starting`, `running`, `stopping`, `stopped`, `error`.
- Se registran PID, tiempos, código de salida y últimas líneas de error/log.
- Se selecciona la fuente activa de menor prioridad numérica del canal.
- Se validan protocolos HTTP, HTTPS, RTMP, RTMPS y RTSP.
- Los argumentos de FFmpeg se pasan directamente a `spawn()` sin shell.
- Se genera HLS por canal con `index.m3u8` y segmentos `.ts`.
- Se evita iniciar dos procesos simultáneos para el mismo canal.
- El apagado del servicio intenta detener los procesos FFmpeg activos.
- Se añadieron endpoints administrativos:
  - `GET /api/streams`
  - `GET /api/streams/:channelId`
  - `POST /api/streams/:channelId/start`
  - `POST /api/streams/:channelId/stop`
  - `POST /api/streams/:channelId/restart`
- Las consultas usan `channels.view` y las acciones usan `channels.update`.
- Se registran las acciones de control en `audit_logs`.
- El instalador instala FFmpeg y configura el directorio `/var/lib/ipztream/streams`.
- Nginx queda preparado para publicar `/streams/`.

### Respaldo
`backup/pre-etapa-12-streaming-real`.

### Estado de validación
**IMPLEMENTACIÓN PUBLICADA — VALIDACIÓN EN EL CONTENEDOR PENDIENTE.**

La validación debe comprobar:
1. FFmpeg instalado y ejecutable.
2. API `/api/streams` devuelve versión de FFmpeg.
3. Un canal con fuente real inicia FFmpeg.
4. El estado cambia a `running`.
5. Aparece `index.m3u8` y segmentos HLS.
6. La playlist responde por HTTP.
7. El proceso puede detenerse y queda en `stopped`.
8. Una fuente inválida produce estado/error controlado.
9. No se pueden iniciar dos procesos simultáneos para el mismo canal.

### Corrección 12.1 — Servido HLS desde Secure Entry
Durante la prueba real se comprobó que FFmpeg generaba correctamente la playlist y segmentos, pero `/streams/...` respondía `404` porque `secure-entry.js` no tenía una ruta para servir los archivos HLS.

Se añadió una capa HTTP HLS limitada a `index.m3u8` y `segment_XXXXXX.ts`, con:
- autenticación mediante la sesión administrativa existente;
- validación estricta del `channelId` y nombre de archivo;
- resolución confinada a `IPZTREAM_STREAM_ROOT`;
- comprobación de que el stream esté en `starting` o `running`;
- tipos MIME específicos para playlist y segmentos;
- soporte `GET` y `HEAD`;
- caché corta para segmentos y sin caché para la playlist.

### Respaldo de la corrección
Backup realizado en el servidor antes de la modificación:
`/opt/ipztream/backups/etapa-12/secure-entry.js.pre-hls-http`

### Resultado de implementación
La corrección quedó publicada en `main` en el commit `dfd24c07c1007b19554a9330dfc6010dbe3d2b23`.

### Pendiente de validación
Debe actualizarse el servidor con este commit y comprobar `200 OK` para `index.m3u8` y segmentos, seguido de las pruebas de stop/restart y procesos huérfanos.

### Corrección 12.2 — Centro de actualización del panel
**Motivo:** el botón `Actualizar` del panel era solamente visual: abría un modal y simulaba una comprobación mediante `setTimeout`, sin consultar el servidor ni instalar una versión real.

**Respaldo:** rama `backup/pre-update-center-2026-09-15` creada antes de los cambios.

**Implementación publicada:**
- `server/update-service.js`: consulta de HEAD/origin, detección de cambios locales, listado de commits, actualización `git pull --ff-only`, instalación de dependencias, build y reinicio controlado del servicio.
- `server/auth.js`: permiso RBAC `system.update`, disponible para superadmin/admin.
- `server/secure-entry.js`: `GET /api/update/status` y `POST /api/update/install`, con autenticación, RBAC y auditoría.
- `src/modules/system-update/UpdateCenter.jsx`: interfaz real de comprobación, cambios disponibles, bloqueo por cambios locales y acción de instalación.
- `src/main.jsx`: el botón `Actualizar` ahora utiliza el módulo real en lugar del modal simulado.

**Protecciones:** no se reciben comandos desde el navegador; el servidor utiliza comandos fijos mediante `execFile`, bloquea la instalación si existen cambios locales y revierte el código si `npm install` o `npm run build` falla. La consulta no ejecuta `pull`, build ni reinicio más allá del `git fetch` necesario para conocer el origen.

**Commits de implementación:**
- `39461ab67126c648cd461b4538fc5b8508c1c21b` — servicio de actualización.
- `076ae4d4f9a46d5e33e08b6aa2b630809d8df968` — permiso RBAC.
- `0f7114b78a953f719b786502615fd29bc52a499b` — API segura.
- `bcf284ebb1ea37dd237db97628eda3a78ce8920` — UI modular.
- `fadb76e356c9782ec60f5596e8a85ffd96b65231` — integración del botón.

**Estado:** IMPLEMENTACIÓN PUBLICADA — **VALIDACIÓN EN EL CONTENEDOR PENDIENTE**. No se declara build ni reinicio verificados hasta ejecutarlos realmente en el servidor.

### Referencia técnica
El muxer HLS de FFmpeg genera una playlist y segmentos, y permite controlar el tamaño de la ventana, duración de segmentos y eliminación de segmentos antiguos mediante sus opciones HLS.
