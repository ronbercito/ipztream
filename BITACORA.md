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

### Implementación realizada
- Gestor modular FFmpeg en `server/stream-manager.js`.
- Inicio/detención/reinicio por canal y estados reales.
- Salida HLS por canal.
- Endpoints administrativos y auditoría.

### Corrección 12.1 — Servido HLS desde Secure Entry
Se añadió una capa HTTP HLS limitada y autenticada para servir playlists y segmentos generados por FFmpeg.

### Corrección 12.2 — Centro de actualización del panel
**Motivo:** el botón `Actualizar` era solamente visual y no consultaba ni instalaba versiones reales.

**Respaldo:** `backup/pre-update-center-2026-09-15`.

### Corrección 12.2.1 — Centro de actualización completo
**Respaldo:** `backup/pre-update-center-complete-2026-09-16`.

**Archivos principales:**
- `server/update-service.js`
- `src/modules/system-update/UpdateCenter.jsx`
- `src/modules/system-update/UpdateCenter.css`
- `package.json`
- `CONTINUITY.md`

**Mejoras:** versión/commit real, rama, remote, servicio, fecha de comprobación, changelog, bloqueo por cambios locales, confirmación, feedback de instalación, build, publicación web, rollback y reinicio controlado.

### Corrección 12.2.2 — Validación real de actualización solo desde el panel
**Motivo:** cerrar la prueba pendiente del centro de actualización y comprobar que las futuras revisiones de código del entorno de prueba se instalan desde el panel, sin usar terminal para hacer pull/build/publicación/reinicio.

**Estado previo comprobado por el usuario:**
- `Centro de actualización` abre correctamente.
- Versión instalada: `0.2.0`.
- Revisión instalada y disponible: `1321a1621e8c`.
- Rama: `main`; remote: `origin`; servicio: `ipztream-api`.
- El panel informa `IPZStream está actualizado`.
- Se corrigió la verificación del host SSH de GitHub para `www-data`.
- Se creó una clave Ed25519 dedicada `ipztream_update` y se registró como Deploy Key de solo lectura del repositorio privado.
- La prueba `ssh -T git@github.com` ejecutada como `www-data` autentica correctamente contra `ronbercito/ipztream`.

**Archivos afectados en esta preparación:** `CONTINUITY.md`, `BITACORA.md`; a continuación se publicará una revisión de aplicación que permita probar detección e instalación real desde el panel.

**Resultado esperado:** el panel debe detectar una revisión posterior a `1321a16`, mostrarla como disponible y, al pulsar `Actualizar`, descargarla, compilarla, publicarla y reiniciar `ipztream-api` sin intervención de terminal.

**Respaldo:** `backup/pre-update-panel-only-2026-09-16`.

**Estado:** PRUEBA REAL EN CURSO.
