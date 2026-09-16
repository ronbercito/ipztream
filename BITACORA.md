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
- Se añadieron endpoints administrativos de streams y auditoría.

### Corrección 12.1 — Servido HLS desde Secure Entry
Durante la prueba real se comprobó que FFmpeg generaba correctamente la playlist y segmentos, pero `/streams/...` respondía `404` porque `secure-entry.js` no tenía una ruta para servir los archivos HLS. Se añadió una capa HTTP HLS limitada y autenticada.

### Corrección 12.2 — Centro de actualización del panel
**Motivo:** el botón `Actualizar` era solamente visual y no consultaba ni instalaba versiones reales.

**Respaldo:** `backup/pre-update-center-2026-09-15`.

**Implementación inicial:** servicio Git controlado, permiso RBAC `system.update`, API autenticada y módulo React.

**Estado inicial:** implementación publicada; validación del contenedor pendiente.

### Corrección 12.2.1 — Centro de actualización completo
**Motivo:** durante el uso del módulo se comprobó que la primera versión no presentaba suficiente información al administrador y no funcionaba como un centro de actualización terminado.

**Respaldo:** `backup/pre-update-center-complete-2026-09-16`.

**Archivos modificados:**
- `server/update-service.js`
- `src/modules/system-update/UpdateCenter.jsx`
- `src/modules/system-update/UpdateCenter.css`
- `package.json`
- `CONTINUITY.md`

**Mejoras:**
- Versión real de `package.json` visible en el panel.
- Commit instalado y commit remoto.
- Rama y remote configurados.
- Servicio administrado mostrado.
- Fecha/hora de comprobación.
- Estado claro: actualizado o actualización disponible.
- Changelog con commit, autor y fecha.
- Bloqueo explícito por cambios locales.
- Confirmación antes de instalar.
- Mensajes de descarga, instalación, build y reinicio.
- Recarga automática del panel después del reinicio.
- Estilos propios del módulo.
- Conservación del RBAC y de los comandos fijos del backend.
- Versión de IPZStream elevada a `0.2.0` para que el panel deje de mostrar una versión estática anterior.

**Protecciones:** no se reciben comandos desde el navegador; se utiliza `execFile`, `git pull --ff-only`, bloqueo por árbol sucio y rollback del commit si instalación/build falla.

**Resultado esperado:** al pulsar `Actualizar`, el administrador debe ver siempre el estado real del servidor. Si no hay cambios, debe mostrar claramente que está actualizado. Si existen commits nuevos, debe mostrarlos y habilitar `Actualizar ahora`. Si hay cambios locales, debe bloquear la operación y explicar el motivo.

**Estado:** IMPLEMENTACIÓN PUBLICADA — **VALIDACIÓN REAL EN EL CONTENEDOR PENDIENTE**.

### Referencia técnica
El muxer HLS de FFmpeg genera una playlist y segmentos, y permite controlar el tamaño de la ventana, duración de segmentos y eliminación de segmentos antiguos mediante sus opciones HLS.
