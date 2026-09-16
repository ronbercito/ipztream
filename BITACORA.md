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
El Centro de actualización fue convertido en un instalador real controlado desde el panel.

### Corrección 12.2.2 — Validación real de actualización solo desde el panel
**Resultado:** VALIDADA. El servidor pasó de `0.2.0` a `0.2.1`, commit `3069700c8c57`, usando el botón del Centro de actualización. Se corrigieron previamente permisos de `www-data` sobre código, `dist`, web root y cache npm.

### Implementación 12.3 — Canales reales HTTP/M3U + Astra Cesbo
**Motivo:** convertir `Canales / Fuentes` de CRUD genérico con fallback ficticio a administración de entradas reales para el motor de streaming.

**Respaldo:** `backup/pre-channels-real-sources-2026-09-16`, basado en `0.2.1` / `3069700`.

**Archivos previstos:**
- `src/modules/channels/Channels.jsx`
- `src/modules/channels/components/ChannelForm.jsx`
- `src/modules/channels/components/ChannelTable.jsx`
- `src/modules/channels/components/SourceEditor.jsx`
- `src/modules/channels/services/channelsApi.js`
- `src/modules/channels/styles/channels.css`
- backend/API de canales y streaming que resulte necesario.

**Primera entrega:**
- quitar seed/fallback ficticio;
- fuente URL directa HTTP/HTTPS/HLS;
- tipo de origen Astra Cesbo consumido mediante stream HTTP;
- tipo M3U/M3U8 preparado para importación;
- prioridad y respaldo por fuente;
- controles reales de streaming/HLS por canal;
- persistencia MariaDB y validación del backend.

**Resultado esperado:** crear desde el panel un canal con URL HTTP/HLS o una URL de stream publicada por Astra Cesbo, guardarlo en MariaDB y utilizarlo como entrada real del motor de streaming de IPZStream.

**Estado:** EN IMPLEMENTACIÓN.
