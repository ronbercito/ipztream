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


### 14.2.1 — Fidelidad visual XUI en todas las opciones
Se amplía el criterio de aceptación: Streams/Canales y los módulos posteriores deberán reproducir de forma muy cercana la experiencia visual del XUI de referencia: densidad, distribución, iconos equivalentes, colores/estados, acciones, modales y reproductor. La implementación seguirá siendo propia y no reutilizará assets propietarios.


### 14.2.2 — Primera reconstrucción clásica Streams publicada
Se publicó la consola Streams con cabecera/panel/toolbar de alta densidad, filtros tipo tabla administrativa, alta individual existente, nueva alta múltiple en modal propio, selección masiva y controles operativos reales Iniciar/Detener/Reiniciar. Se añadió cliente API para el endpoint restart ya existente en secure-entry. El reproductor mantiene HLS.js y preview temporal, con presentación oscura/clásica integrada.

No se modificó el motor FFmpeg ni el modelo de datos en este bloque. La validación de build queda a cargo del Centro de actualización del servidor de desarrollo.


### 14.2.3 — Refinamiento visual Streams
La captura real mostró tabla excesivamente pequeña y mucho espacio sin jerarquía visual. Se ajustará la escala de filas/textos, cabecera, toolbar, badges de estado, acciones cuadradas e información operativa. Se añadirá Restart visible por fila y se reforzará el modal de preview estilo reproductor clásico, sin cambiar FFmpeg.


### 14.2.3 — Refinamiento publicado
Aplicado ajuste de escala del listado instalado: títulos, toolbar, filas, textos y acciones ganan legibilidad conservando densidad clásica. Cada stream incorpora Restart explícito además de Start/Stop, Watch, Power, Edit y Delete. Watch Stream fue reforzado como player 16:9 oscuro con cabecera/estado clásico. Pendiente validar visualmente desde el Centro de actualización.

### 15.1 — Fundación main/sub propia
Se inicia implementación segura para reactivar IPZStream sin empezar de cero y sin introducir código heredado directamente. Se documenta el mapa funcional de los paquetes `main_xtreamcodes_reborn` y `sub_xtreamcodes_reborn` como referencia arquitectónica.

Implementado en rama `feature/ipztream-main-sub-foundation`: versión 0.4.1, endpoints base para nodos streaming, registro inicial de nodos secundarios, heartbeat con métricas y normalización ampliada de `nodes`. La tabla existente `nodes` se conserva como almacenamiento JSON compatible, evitando migraciones destructivas.

Regla aplicada: primero continuidad/bitácora, luego código. No se incorporan PHP ofuscados, binarios ni assets de Xtream Codes Reborn.

### 15.2 — Instalador de nodo y consola Servidores
Se implementa el siguiente bloque main/sub: instalador base de nodo secundario, bypass seguro en `secure-entry` para registro/heartbeat por token, navegación real hacia `NodesPage` y UI de Servidores/Load Balancers con rol, capacidades, métricas y última señal.

La implementación mantiene código propio IPZStream y evita copiar PHP/binarios de los paquetes de referencia. El nodo secundario queda preparado como servicio systemd liviano que reporta heartbeat al main; la ejecución distribuida de streams queda para el siguiente bloque.


### 15.3 — Persistencia real de nodos en MariaDB — INICIADA
Respaldo creado: `backup/pre-stream-node-persistence-0.4.3-20261002`.

Objetivo autorizado:
- crear tablas `stream_nodes` y `stream_node_heartbeats`;
- migrar nodos existentes sin pérdida;
- usar esas tablas en `/api/stream-nodes`;
- mantener `/api/nodes` como compatibilidad sobre la misma fuente;
- registrar cada heartbeat y conservar métricas actuales;
- marcar offline automáticamente por timeout configurable;
- evitar que una reinstalación con el mismo IP deje un ID distinto que provoque 404 en heartbeat;
- dejar preparada la base para scheduler, balanceo y agente real del subnodo.

La implementación se hará primero en rama `feature/ipztream-stream-node-persistence`. No se considera lista para producción hasta validar build, sintaxis y una prueba real con MariaDB.

#### Resultado de implementación
Quedó implementada la base 15.3 para versión `0.4.3`:
- tablas dedicadas de nodos/heartbeats + migración única desde `nodes`;
- API canónica y compatibilidad sin doble fuente de verdad;
- offline automático y retención;
- historial de heartbeat;
- permisos correctos para `stream-nodes`;
- corrección del gateway que antes descartaba el body de registro/heartbeat;
- token de nodos generado/preservado por el instalador Main;
- subnodo con métricas más reales, JSON seguro e ID canónico;
- UI sin nodos demo falsos cuando la API falla/viene vacía.

Validación técnica en checkout limpio:
`node --check` backend/gateway OK · `bash -n` instaladores OK · `npm run build` OK (Vite 8.3.2, 1933 módulos).

Estado: **código listo para merge y prueba real de MariaDB/subnodo; producción todavía no aprobada**.


#### Integración en main
PR #3 **Persist stream nodes and heartbeats in MariaDB** mezclado correctamente.
- Merge commit: `31864aa1ec6cf6aa81c4fe72f4da5f2cb5216286`.
- Versión en `main`: `0.4.3`.
- Backup previo: `backup/pre-stream-node-persistence-0.4.3-20261002`.
- La prueba real Main + MariaDB + subnodo sigue pendiente antes de considerar producción.


## 0.4.4 — UI Streams más viva, clara y profesional
Se aplica directamente al panel la mejora visual solicitada: colores más vivos, mayor contraste, iconos claros y coloridos, letras más fuertes y nítidas y mejor jerarquía del módulo Streams/Canales.

Cambios:
- tarjetas reales para Total de Streams, Funcionando, Con error y Detenidos;
- nueva cabecera Streams / Canales;
- búsqueda y filtros más legibles;
- acciones por stream con colores claramente diferenciados;
- filas, nombres, estados y métricas operativas con mayor tamaño útil;
- sidebar y topbar global con más contraste;
- polling real de estados cada 3 segundos preservado.

El cambio es frontend. No altera el trabajo 0.4.3 de nodos, MariaDB, FFmpeg/HLS ni la API. Versión: `0.4.4`.


## 0.4.5 — Streams alineado con el diseño aprobado
A partir de la comparación lado a lado se confirma que 0.4.4 tenía los colores correctos, pero todavía conservaba demasiada estructura del listado anterior. Se implementa una segunda corrección enfocada en proporciones y flujo.

Implementado:
- resumen superior compacto;
- filtros Estado / Servidor / Tipo / Categoría;
- selector funcional de columnas opcionales;
- tabla de operación con servidor, estado, bitrate, resolución y clientes;
- acciones simplificadas y menú secundario;
- drawer lateral por stream;
- preview HLS embebido en el drawer;
- medición real de la fuente con `/api/source-probe` al abrir detalle;
- pestañas de resumen, medición actual, clientes y logs;
- historial operativo real en el drawer;
- sin valores ficticios: métricas no disponibles muestran `—` o un mensaje de telemetría pendiente;
- versión `0.4.5`.

No se modifica la lógica del motor de streaming ni el trabajo Main/Sub 0.4.3/0.4.4.


## 0.4.6 — Streams: colores sólidos + Bitrate/Resolución cada 5 s
Se corrige el acabado visual de la pantalla instalada y se elimina la dependencia de abrir el detalle para obtener información multimedia.

Implementado:
- mayor contraste general y colores sólidos;
- iconos y estados más resaltantes;
- toolbar compacta y alineada con la referencia;
- botón Añadir Stream integrado en la toolbar;
- acciones de fila con relleno sólido;
- `probeChannelSource` automático para los primeros 25 streams visibles;
- hasta 4 mediciones concurrentes para limitar carga;
- actualización de bitrate, resolución y FPS cada 5 s;
- bloqueo de ciclos superpuestos cuando ffprobe tarda más que el intervalo;
- cache de última medición válida;
- drawer sincronizado con las métricas automáticas;
- indicador visual “Bitrate / Resolución · actualización automática cada 5 s”.

Versión preparada: `0.4.6`.


## 15.4 — Agente real SUB y control remoto — INICIADA
Se autoriza continuar aunque la prueba física Main+SUB de 15.3 quede pendiente.

Alcance 0.4.7:
- agente Node.js para SUB/EDGE;
- ejecución FFmpeg/HLS local en el SUB;
- API remota autenticada para start/stop/restart/status;
- cliente/orquestador en MAIN;
- selección real de nodo por canal;
- sincronización de asignaciones;
- persistencia de streams deseados en el agente;
- protección frente a mover/desactivar/eliminar un canal mientras está marcado como running;
- instalador SUB convertido en servicio systemd real.

No se cerrará 15.3 ni se declarará producción hasta disponer del segundo servidor real.


### 15.4 — resultado técnico 0.4.7
Se implementó el agente real SUB/EDGE y el control remoto de streams.

Incluye:
- start/stop/restart/status remoto;
- FFmpeg/HLS ejecutado por el agente;
- persistencia de streams deseados;
- sincronización de asignaciones desde Main;
- selección real de nodo en el canal;
- estado local/remoto en Streams;
- servicio systemd dedicado;
- validación de URL/host del agente;
- timeout de comandos remotos;
- corrección del header de autenticación de nodos;
- se mantienen intactos el diseño y las métricas automáticas cada 5 s de 0.4.6.

Pruebas aisladas: sintaxis OK, build OK (1942 módulos), health del agente OK y token autenticado OK. El runner no tiene FFmpeg; la ejecución HLS real y Main+SUB físico quedan pendientes para cuando haya segundo servidor.

Estado: **0.4.7 preparado para integración, no declarado producción distribuida**.


#### Integración 15.4 en main
PR #8 **Add real SUB node agent and distributed stream control** mezclado correctamente.
- Merge commit: `c9c1955a78a842c5ea64ffb291d14a94965a287b`.
- Versión: `0.4.7`.
- Backup previo: `backup/pre-subnode-agent-0.4.7-20261003`.
- La prueba física con un segundo servidor continúa pendiente por decisión del operador.
- No declarar streaming distribuido en producción hasta completar Main + SUB real.


## 0.4.8 — Corrección de 128 Kbps en Bitrate
Se corrige el caso donde streams 720p/1080p mostraban 128 Kbps porque ese valor correspondía únicamente a la pista AAC.

Ahora:
- ffprobe muestrea paquetes reales;
- se suman bytes de video, audio, subtítulos y datos;
- el cálculo usa la duración real de la muestra;
- el valor principal representa el bitrate total combinado;
- el drawer expone también bitrate de video y audio por separado;
- la actualización automática cada 5 s se mantiene;
- si la medición real no es válida, se evita mostrar un fallback engañoso de solo audio.

Versión preparada: `0.4.8`.


## 15.5 — Scheduler y balanceo automático de nodos — INICIADA
Se continúa después de 0.4.8 dejando pendiente la prueba física con segundo servidor.

Alcance aprobado para 0.4.9:
- scheduler en MAIN con cálculo de nodo recomendado;
- selección por disponibilidad, estado operativo, CPU, RAM y streams activos;
- filtros opcionales por región;
- planificación previa sin modificar canales;
- aplicación explícita del plan;
- exclusión de nodos Fuera de línea/Mantenimiento;
- exclusión de streams cuyo estado deseado sea running;
- no mover canales ya asignados salvo solicitud explícita;
- auditoría de las asignaciones automáticas;
- sin start/stop/restart automático durante esta etapa.

La prueba Main + MariaDB + SUB real continúa pendiente y sigue siendo requisito antes de declarar producción distribuida.


### 15.5 — resultado técnico 0.4.9
Implementación completada en rama:
- scheduler conservador de nodos;
- cálculo de carga combinando CPU, RAM, streams activos y capacidad;
- compatibilidad por capacidades/perfil del stream;
- nodos Fuera de línea/Mantenimiento excluidos;
- nodos Degradados penalizados en la puntuación;
- no se planifican ni se mueven streams con estado deseado `running`;
- por defecto no se mueven canales ya asignados;
- planificación previa y aplicación explícita;
- auditoría de cambios;
- controles en la pantalla Servidores / Load Balancers;
- versión preparada: `0.4.9`.

Validación disponible en GitHub: rama parte de `main` sin commits pendientes de base y no existe workflow CI configurado. El build/runtime deberá validarse desde el servidor de desarrollo. La prueba física con segundo servidor sigue pendiente.


## 2026-10-03 — Inicio núcleo IPTV 0.5.0
Se abre la etapa enfocada exclusivamente en servidor IPTV: canales/streams, usuarios IPTV, conexiones activas y Main/Sub. Se crea respaldo `backup/pre-iptv-core-0.5.0-20261003` y rama `feature/iptv-core-0.5.0`.

Objetivo de esta entrega: exponer autenticación y catálogo compatibles con apps IPTV comunes mediante API propia estilo Xtream, playlist M3U autenticada y reproducción live protegida, registrar sesiones activas y aplicar límites de conexiones por usuario. La reproducción real deberá validarse posteriormente en el servidor de desarrollo con un canal FFmpeg/HLS activo.


## 2026-10-03 — Núcleo IPTV 0.5.0 implementado
Se implementó la primera entrega enfocada en consumo desde apps IPTV externas: API pública estilo Xtream, playlist M3U autenticada, live HLS, compatibilidad de URL .ts, control por paquete/canales, sesiones reales de reproducción, límite de conexiones simultáneas y cierre administrativo temporal. La pantalla Paquetes permite seleccionar canales permitidos y se corrigió el alta de paquete nuevo. La pantalla Conexiones Activas pasa a leer las sesiones reales.

Se añadió prueba automática `scripts/test-iptv-client.mjs` y guía `docs/iptv-client-test.md`. La versión pasa a 0.5.0. Aún falta validación runtime en el servidor de desarrollo y reproducción desde una app externa; no se declara estable hasta completar esa prueba.


## 2026-10-03 — Inicio endurecimiento IPTV 0.5.1
Se crea respaldo `backup/pre-iptv-hardening-0.5.1-20261003` y rama `feature/iptv-hardening-0.5.1`. El trabajo queda concentrado en mejorar el servidor IPTV 0.5.x: compatibilidad de apps, EPG/XMLTV, playlists, sesiones/conexiones, diagnóstico y UX de paquetes/conexiones. No se declara producción hasta validar en servidor y app real.


## 2026-10-03 — Endurecimiento IPTV 0.5.1 implementado
Se completó la rama 0.5.1 con mejoras centradas en operación real: corrección de stream IDs públicos vs UUID internos, autoarranque HLS bajo demanda, entrega transparente de canales locales y SUB a través del MAIN, proxy de segmentos remotos, XMLTV, alias panel_api, conteo real de conexiones, límite básico de intentos fallidos, sesión estable al cambiar de canal, consola de conexiones con refresco cada 5 segundos, usuarios con conexiones reales, paquetes con selección/búsqueda masiva de canales y failover automático entre fuentes activas en MAIN y SUB.

También se agregó `.github/workflows/ci.yml` para validar sintaxis Node y build Vite en PR/push, más ampliación de `scripts/test-iptv-client.mjs`. Versión preparada: 0.5.1. Pendiente: CI del PR, merge y validación runtime en servidor/app; la prueba física del segundo SUB sigue pendiente.
