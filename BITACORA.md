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


## Etapa 13 — Modernización funcional — INICIADA

### 13.1 — Inventario del panel de referencia XUI 1.5.13
Se confirmó acceso al repositorio de referencia `ronbercito/ipprueba` y se realizó el primer inventario estructural.

**Áreas detectadas:** administración, streams/canales, creación masiva, orden de canales, bouquets, EPG, servidores, conexiones activas, dashboard, caché, backups, logs, reseller, líneas, usuarios, MAG/Ministra, player, películas, radios y tickets.

**Decisión de arquitectura:** IPZStream no copiará literalmente el código ni el diseño antiguo. Se reimplementarán las capacidades seleccionadas con código propio y el stack actual React/Vite + Node + MariaDB, mejorando UX, seguridad y mantenimiento.

**Hallazgo:** varios PHP principales del paquete de referencia no son texto UTF-8 legible desde GitHub (contenido codificado/binario), por lo que el análisis se centrará en estructura, comportamiento y flujos funcionales observables.

**Orden previsto:** mapa funcional → canales/streams → categorías/bouquets → EPG → servidores → conexiones/estadísticas → líneas/clientes → MAG/Ministra → VOD/radio → logs/backups → dashboard.

**Estado:** análisis iniciado. Antes de cada bloque de implementación se hará respaldo y se mantendrá el flujo de actualización exclusivamente desde el panel.


### 13.1.1 — Directriz de fidelidad funcional y compatibilidad Ubuntu
El alcance se amplía por decisión del proyecto: la sección de canales/streams debe recuperar del panel XUI de referencia el conjunto más completo posible de funciones y un flujo operativo familiar, pero será reimplementada con código propio y UI modernizada.

También se establece Ubuntu 24.04 como plataforma objetivo prioritaria. Instalador y runtime deberán detectar versión/distribución y validar dependencias en lugar de asumir paquetes/rutas de una sola release. Se buscará compatibilidad con Ubuntu LTS modernas y, cuando las dependencias sigan disponibles de forma segura, con otras versiones Ubuntu. Versiones EOL no se declararán compatibles sin validación real.

**Siguiente trabajo:** inventario exhaustivo de archivos/módulos de canales del repositorio de referencia y mapa campo/acción → equivalente IPZStream antes de modificar el motor actual.


### 13.1.2 — Migración funcional amplia autorizada
Se amplía el objetivo: usar el paquete XUI 1.5.13 como referencia funcional global y reconstruir en IPZStream todas las capacidades útiles que sean aplicables, no únicamente canales.

La implementación será propia y mantenible. No se incorporarán directamente los PHP codificados, binarios heredados ni assets propietarios del paquete. IPZStream será el código fuente definitivo que se continuará mejorando.

El primer bloque profundo será Canales/Streams. El inventario ya confirma piezas relacionadas como `created_channel.php`, `created_channel_mass.php`, `created_channels.php`, `channel_order.php`, bouquets, EPG, watch/monitorización y componentes de servidor/stream. Después se extenderá el mismo patrón al resto del panel.


### 13.2 — Mega actualización 0.4.0 — EN CONSTRUCCIÓN
Respaldo previo: `backup/pre-mega-update-0.4.0-2026-09-17`.

Se inicia una entrega mayor en lugar de microcambios aislados. Objetivo: convertir Canales/Streams en el primer módulo de nivel XUI reimplementado con código propio IPZStream. Incluye gestión individual/masiva, acciones operativas masivas, categorías/bouquets, EPG, nodo, perfiles, transcodificación/remux, múltiples fuentes/failover, monitorización, orden y preview.

Se preservarán los registros actuales y el motor remux/preview existente. La actualización se publicará para instalación desde el panel. También se modernizará la detección de Ubuntu/dependencias con prioridad Ubuntu 24.04 y LTS modernas.


### 13.2.1 — Primera ola 0.4.0 publicada
Implementado en `main`: versión 0.4.0; respaldo previo creado; alta masiva de hasta 500 canales por operación; selección múltiple; acciones masivas de activar, desactivar, categoría, bouquet y eliminar; API preparada también para nodo, perfil y reordenamiento; modelo de canal extendido con nodo, bouquet, EPG/TVG ID, perfil remux/transcode, formato de salida, orden y notas.

El formulario avanzado dejó de ser placeholder y ahora expone estos campos reales. El instalador detecta Ubuntu/Debian, prioriza Ubuntu 24.04/LTS modernas y verifica dependencias usando paquetes del sistema en lugar de binarios heredados.

**Instalación prevista:** exclusivamente mediante Centro de actualización del panel desde la 0.3.16. Después de instalar se validará build/publicación/reinicio y se probarán canales existentes antes de ampliar la siguiente ola.


### 13.2.2 — Diagnóstico updater 0.4.0: ENOTEMPTY
Los logs confirman que Git descargó la mega actualización, pero npm falló antes del build con `ENOTEMPTY` dentro de `/opt/ipztream/node_modules`. Reintentos afectaron distintos paquetes, confirmando árbol de dependencias inconsistente. El rollback Git sí vuelve al commit anterior, pero su npm también falla al reutilizar ese árbol.

Se aplicará hotfix en `server/update-service.js`: limpiar `node_modules` y usar `npm ci` con `package-lock.json`; fallback a `npm install` solo si no existe lockfile. El mismo build limpio se usará durante rollback.


## Etapa 14 — Panel clásico XUI — INICIADA
Se cambia el enfoque de UI: IPZStream 0.4.0 queda protegido como base funcional y se inicia una reconstrucción de alta fidelidad del flujo administrativo XUI usando código propio. Backup creado: `backup/pre-legacy-panel-rebuild-2026-09-18`.

Inventario de referencia confirmado en `ronbercito/ipprueba`: admin, reseller, player, Ministra, content, crons y herramientas; dentro de admin se confirman bouquets, orden, canales creados, alta masiva, backups, cache y otros módulos. No se migrarán binarios/PHP codificados ni mecanismos de licencia.

Primer bloque autorizado: 14.1 shell clásico (navegación, topbar, dashboard y sistema visual), seguido inmediatamente por 14.2 Streams/Canales.


### 14.1 — Shell clásico — PUBLICADO
Se reconstruyó el shell administrativo con código propio: sidebar oscuro agrupado por General/Contenido/Gestión/Sistema, topbar clásica, dashboard compacto, tarjetas operativas, estado del sistema, accesos rápidos y tabla de servidores. Se preservaron las rutas/módulos existentes y el Centro de actualización.

La navegación ahora expone de forma reconocible Streams/Canales, VOD, Series, EPG, M3U, Bouquets/Paquetes, Líneas/Usuarios, Resellers, MAG/Dispositivos, Servidores, Logs, Backups/Herramientas y Configuración. Algunos destinos comparten temporalmente módulo hasta que sus etapas específicas sean reconstruidas.

Siguiente bloque: 14.2 Streams/Canales con estructura clásica y funciones operativas reales.


### 14.1.1 — Hotfix updater por lockfile local obsoleto
Diagnóstico confirmado por journal: `npm ci` aborta con EUSAGE y reporta `Missing: hls.js@1.7.3 from lock file`. En `main` no existe `package-lock.json`, por lo que el updater estaba tomando un lockfile residual del servidor como si perteneciera al release.

Se corregirá la selección de estrategia: limpiar `node_modules`; usar `npm ci` únicamente si Git confirma que `package-lock.json` está versionado; de lo contrario usar instalación limpia sin generar/usar lockfile.
