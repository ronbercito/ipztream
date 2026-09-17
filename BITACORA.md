# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–11
Completadas y validadas.

## Etapa 12 — Motor de streaming real + integración de fuentes — EN IMPLEMENTACIÓN

### Mejora 12.3.10 — Persistencia del estado
Implementado en 0.3.11.

### Mejora 12.3.11 — Remux/Copy de bajo consumo
Implementado en 0.3.12.

### Mejora 12.3.12 — Acciones visuales + reproductor emergente
Implementado en 0.3.13.

### Corrección 12.3.13 — Recuperación de contraseña administrativa
Implementado en 0.3.14.

### Corrección 12.3.14 — Preview H.264/AAC bajo demanda
Implementado en 0.3.15.

### Corrección 12.3.15 — HLS.js + token efímero
Implementado para 0.3.16; validación final pendiente.

### Corrección 12.3.16 — Query del token HLS
Corregida construcción de URL para conservar `token` y agregar `t` con `&`.

### Corrección 12.3.17 — Sintaxis JSX bloqueaba Vite
Corregido `ChannelTable.jsx`. Respaldo: `backup/pre-channel-table-build-fix-2026-09-17`.

### Corrección 12.3.18 — Permisos del actualizador
Se diagnosticaron dos bloqueos `EACCES`: primero en `/opt/ipztream/dist` durante el build y después en `/var/www/ipztream` durante la publicación. Ambos provenían de artefactos creados anteriormente como `root`, mientras el actualizador funciona como `www-data`.

Se corrigió la propiedad de ambos árboles a `www-data:www-data`, se verificó escritura de `www-data` en REPO y WEB, y se endureció el updater para limpiar `dist` antes de construir.

**Resultado validado:** la actualización desde el Centro de actualización completó correctamente Git → npm → Vite → publicación web → reinicio. El flujo panel-first queda operativo.

### Corrección 12.3.19 — Preview sigue en “Preparando” después de 0.3.16
**Estado al cierre de sesión:** el modal abre con perfil `preview-h264-aac`, pero el reproductor permanece en `0:00 / Preparando`.

**Validado en servidor:** FFmpeg temporal sí funciona. Para `channel-afc9ccb0-a5e5-42c9-a328-abd8fbbe3be9` se generan continuamente segmentos `.ts` y `index.m3u8`. El manifiesto HLS es válido (`EXTM3U`, versión 6, target duration 2, media sequence y segmentos de ~2 s). No aparecieron errores `preview/token/401/403/404/hls` en el journal consultado.

**Conclusión actual:** fuente → FFmpeg → conversión H.264/AAC → archivos HLS funciona. El problema pendiente está en la última ruta de entrega/reproducción: endpoint `/previews/...` con token → hls.js → elemento `<video>` del navegador.

**Siguiente prueba al retomar:** Chrome DevTools → Network → filtrar `m3u8`, cerrar y volver a abrir Preview, inspeccionar la petición `/previews/.../index.m3u8?token=...` y registrar `Status Code` + `Request URL`. Según el resultado, revisar token/endpoint o eventos/error de hls.js.

**Versión instalada:** 0.3.16.

**Estado general:** EN IMPLEMENTACIÓN — continuar desde diagnóstico del navegador; no volver a tocar FFmpeg ni permisos salvo nueva evidencia.
