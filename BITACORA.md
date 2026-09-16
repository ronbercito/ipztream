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
Implementado.

### Mejora 12.3.3 — Probar fuente antes de guardar
Implementado y validado.

### Mejora 12.3.4 — Metadatos técnicos de la señal
Implementado en 0.3.5.

### Mejora 12.3.5 — Autoarranque y monitoreo operativo
Implementado en 0.3.6 y validado visualmente: canales activos arrancan al guardar, muestran FFmpeg activo y uptime.

### Mejora 12.3.6 — Historial de inicios/reinicios y borrado de medición
**Motivo:** el contador actual indica cantidad de inicios, pero no permite saber a qué hora ocurrió cada evento ni comenzar una medición nueva.

**Implementación prevista:**
- `server/stream-manager.js`: historial temporal por canal y función para limpiarlo.
- `server/secure-entry.js`: endpoint autenticado para borrar historial.
- `src/modules/channels/services/channelsApi.js`: cliente del endpoint.
- `src/modules/channels/components/ChannelTable.jsx`: botón/historial de eventos y borrado.
- `src/modules/channels/Channels.jsx`: refresco del estado después de limpiar.
- `src/modules/channels/styles/channels.css`: presentación del registro.
- `package.json`: versión 0.3.7.

**Resultado esperado:** consultar hora exacta de Inicio/Reinicio y borrar el historial/contador sin detener la emisión.

**Estado:** EN IMPLEMENTACIÓN.
