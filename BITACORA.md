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
**Motivo:** el editor 0.3.1 mejoró la presentación, pero en la resolución real del usuario continúa demasiado angosto y los campos se comprimen. El usuario aprobó una referencia visual concreta y pidió implementarla, sin más mockups.

**Respaldo:** `backup/pre-channel-editor-tabs-2026-09-16`.

**Archivos a modificar:**
- `src/modules/channels/components/ChannelForm.jsx`
- `src/modules/channels/components/SourceEditor.jsx`
- `src/modules/channels/styles/channels.css`
- `package.json`

**Resultado esperado:** modal ancho, pestañas superiores, campos cómodos, fuentes sin amontonamiento, mismo lenguaje azul/blanco del panel, monitoreo real separado y footer fijo. No se eliminan opciones existentes.

**Estado:** EN IMPLEMENTACIÓN.
