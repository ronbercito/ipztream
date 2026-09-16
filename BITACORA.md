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
**Motivo:** la referencia aprobada incluye controles por fuente para comprobar la señal antes de guardar. La implementación actual todavía no realiza esa comprobación.

**Respaldo:** `backup/pre-source-probe-2026-09-16`.

**Archivos previstos:**
- `server/source-probe.js`
- `server/secure-entry.js`
- `src/modules/channels/services/channelsApi.js`
- `src/modules/channels/components/SourceEditor.jsx`
- `src/modules/channels/styles/channels.css`
- `package.json`

**Resultado esperado:** `Probar` ejecuta una comprobación temporal real mediante ffprobe, devuelve estado y latencia sin guardar el canal; la tarjeta muestra Activa/Error/Sin señal y tiempo de respuesta. `Editar` y `Eliminar` quedan disponibles por fuente.

**Estado:** EN IMPLEMENTACIÓN.
