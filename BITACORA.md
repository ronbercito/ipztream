# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–11
Completadas y validadas.

## Etapa 12 — Motor de streaming real + integración de fuentes — EN IMPLEMENTACIÓN
- Gestor FFmpeg/HLS real.
- Inicio/detención por canal.
- Centro de actualización desde panel.
- Fuentes HTTP/HLS, Astra Cesbo por HTTP y M3U/M3U8.
- Estado real y uptime de emisión.

### Mejora 12.3.2 — Editor definitivo ancho con pestañas
Editor ancho y pestañas implementados. La corrección 0.3.3 fuerza el ancho del modal para evitar interferencia de estilos globales.

### Mejora 12.3.3 — Probar fuente antes de guardar
Implementada en 0.3.4. La prueba temporal usa ffprobe, no guarda el canal y devuelve estado real y latencia. Validada por el usuario con una fuente real activa.

### Mejora 12.3.4 — Metadatos técnicos de la señal
Implementada en 0.3.5. La prueba devuelve bitrate, resolución, códec de video/audio, canales y FPS cuando están disponibles.

### Mejora 12.3.5 — Autoarranque y monitoreo operativo
**Motivo:** actualmente guardar un canal activo no inicia la emisión; la tabla queda en `Detenido` y el tiempo activo permanece vacío hasta pulsar iniciar manualmente.

**Respaldo:** `backup/pre-channel-autostart-monitoring-2026-09-16`.

**Archivos previstos:**
- `server/stream-manager.js`
- `src/modules/channels/Channels.jsx`
- `src/modules/channels/components/ChannelTable.jsx`
- `src/modules/channels/styles/channels.css`
- `package.json`

**Resultado esperado:** crear un canal activo lo inicia automáticamente; editar un canal activo reinicia FFmpeg para aplicar cambios; desactivar detiene y activar inicia. La tabla muestra estado real, tiempo activo y cantidad de inicios/reinicios del canal.

**Estado:** EN IMPLEMENTACIÓN.
