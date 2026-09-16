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
**Motivo:** al probar una fuente activa, el usuario necesita ver no solo la latencia sino también las características reales del contenido recibido, tomando como referencia bitrate, resolución, video, audio, canales y FPS.

**Archivos a modificar:**
- `server/source-probe.js`
- `src/modules/channels/components/SourceEditor.jsx`
- `src/modules/channels/styles/channels.css`
- `package.json`

**Resultado esperado:** la misma prueba ffprobe devuelve y presenta bitrate, resolución, códec de video, códec de audio, canales de audio y FPS. Los valores ausentes se representan con `—`. No se persisten estos datos al probar.

**Estado:** EN IMPLEMENTACIÓN.
