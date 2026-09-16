# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–11
Etapas 1–11 completadas y validadas. MariaDB permanece como base principal. Autenticación administrativa/RBAC y sesiones de clientes están separadas.

## Etapa 12 — Motor de streaming real + integración de fuentes — EN IMPLEMENTACIÓN

### Implementación realizada
- Gestor modular FFmpeg en `server/stream-manager.js`.
- Inicio/detención/reinicio por canal y estados reales.
- Salida HLS por canal.
- Endpoints administrativos y auditoría.
- Centro de actualización validado desde el panel.

### Implementación 12.3 — Canales reales HTTP/M3U + Astra Cesbo
Se habilitó el módulo de canales para fuentes HTTP/HTTPS/HLS, Astra Cesbo por stream HTTP y M3U/M3U8, con prioridad, persistencia MariaDB y controles del motor.

### Mejora 12.3.1 — Editor visual + estado de funcionamiento y uptime
**Motivo:** el primer editor de fuentes quedó demasiado comprimido y difícil de leer. El usuario aprobó un diseño más amplio, limpio y dividido por secciones, y solicitó ver claramente si cada canal está funcionando y cuánto tiempo lleva activo.

**Archivos:**
- `CONTINUITY.md`
- `BITACORA.md`
- `src/modules/channels/Channels.jsx`
- `src/modules/channels/components/ChannelForm.jsx`
- `src/modules/channels/components/SourceEditor.jsx`
- `src/modules/channels/components/ChannelTable.jsx`
- `src/modules/channels/styles/channels.css`
- `package.json`

**Resultado esperado:**
- modal de canal amplio y ordenado en dos áreas;
- fuente presentada como tarjeta legible;
- estado operacional visible por canal;
- `Funcionando` únicamente cuando el proceso real está `running`;
- tiempo activo basado en `startedAt` entregado por `stream-manager`;
- actualización automática del estado operacional;
- enlace HLS cuando exista;
- estados Iniciando/Detenido/Error diferenciados.

**Estado:** EN IMPLEMENTACIÓN.
