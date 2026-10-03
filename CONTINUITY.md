# IPZStream — Continuidad del proyecto

## Propósito
IPZStream es una plataforma propia de gestión y distribución de streaming, desarrollada con arquitectura, código e interfaz propios.

## Reglas de trabajo obligatorias
- Este repositorio es independiente de Z-Hub.
- GitHub se utilizará para desarrollo, pruebas, control de versiones y releases.
- Las instalaciones reciben builds/releases controlados mediante el actualizador propio.
- **ANTES DE CADA ETAPA:** actualizar primero `CONTINUITY.md`.
- Antes de cambios estructurales importantes crear respaldo.
- Implementar y probar por etapas.
- No generar mockups salvo solicitud explícita.
- **BITÁCORA PRIMERO:** después de Continuidad registrar en `BITACORA.md`; después modificar código y publicar.
- Mantener arquitectura modular.

## Estado actual
- Repositorio: `ronbercito/ipztream` (actualmente público).
- Rama: `main`.
- Versión instalada estable en servidor: `0.3.16`.
- Próxima línea de desarrollo: Etapa 13 — modernización funcional.
- El Centro de actualización está validado de extremo a extremo: Git → npm → Vite → publicación → reinicio.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3.15 — Reproducción HLS real en navegador
FFmpeg de preview funciona y genera H.264/AAC, manifiesto y segmentos. Se implementó hls.js, token efímero y corrección del query del token. Validación final pendiente después de instalar 0.3.16.

## 12.3.16 — Bloqueos del actualizador
El error JSX anterior fue corregido. El journal del servidor reveló un segundo bloqueo real en Vite: `EACCES: permission denied, unlink '/opt/ipztream/dist/assets/index-CZCy5gXN.js'`.

### Causa validada
El servicio `ipztream-api` ejecuta el actualizador como `www-data`, pero un build manual previo ejecutado como `root` dejó artefactos dentro de `/opt/ipztream/dist` sin permisos de escritura/eliminación para `www-data`. Vite intenta limpiar `dist` antes del build y falla; el rollback también intenta reconstruir y falla por el mismo artefacto.

### Corrección
- Recuperación única del servidor: devolver propiedad de `/opt/ipztream/dist` a `www-data:www-data`.
- Endurecer `update-service.js` para eliminar `dist` antes de cada build desde el propio actualizador, evitando reutilizar artefactos viejos cuando sean eliminables por el usuario de servicio.
- Los builds manuales futuros, si fueran imprescindibles, deben ejecutarse como `www-data`, no como root.
- No cambiar el repositorio por este problema: público/privado no afecta este EACCES.

## Prueba requerida
Corregir propiedad de `dist`, pulsar Actualizar ahora y comprobar: Git → npm → build → publicación → reinicio → 0.3.16. Después validar preview AMERICATV SD/ESPN 2.


## Etapa 13 — Modernización funcional inspirada en panel de referencia XUI 1.5.13
Se incorpora como referencia de análisis el repositorio `ronbercito/ipprueba`. El objetivo NO es copiar literalmente su código ni su interfaz, sino inventariar capacidades y reimplementarlas con arquitectura propia de IPZStream (React/Vite + Node + MariaDB), manteniendo seguridad, modularidad y actualización panel-first.

### Inventario inicial confirmado
El panel de referencia contiene módulos separados para administración, reseller, player, Ministra/MAG, contenido, crons y servicios. En administración se observan áreas funcionales para streams/canales, creación masiva, orden de canales, bouquets, EPG, servidores, conexiones activas, backups, caché, logs y dashboard. En reseller existen líneas, actividad de líneas, conexiones activas, streams, usuarios, MAG, películas, radios y tickets.

### Restricción técnica encontrada
Una parte importante de los PHP principales no es UTF-8 legible desde GitHub y parece distribuida en formato codificado/binario. Por tanto, no se basará IPZStream en copiar ese código. Se usarán nombres de módulos, flujos observables y comportamiento funcional como referencia para diseñar implementación propia.

### Plan de modernización
- 13.1: mapa funcional XUI → IPZStream y prioridades.
- 13.2: gestión avanzada de canales/streams y acciones masivas.
- 13.3: categorías, bouquets y ordenación.
- 13.4: EPG y asociación de canales.
- 13.5: servidores/nodos y estado operativo.
- 13.6: conexiones activas, sesiones y estadísticas.
- 13.7: líneas/clientes y perfiles de acceso.
- 13.8: compatibilidad MAG/Ministra donde corresponda.
- 13.9: VOD/radio y biblioteca.
- 13.10: logs, auditoría, backups y herramientas operativas.
- 13.11: dashboard moderno unificado.

### Estado previo que se conserva
Versión instalada validada: 0.3.16. El actualizador desde panel funciona de extremo a extremo. El preview H.264/AAC genera HLS correctamente, pero la reproducción web sigue pendiente de diagnóstico en la petición m3u8/token/hls.js.


## Directriz Etapa 13 — Fidelidad funcional XUI + compatibilidad Ubuntu
El objetivo aprobado es que la gestión de canales/streams conserve la mayor cantidad posible de capacidades y flujo operativo reconocible del panel XUI de referencia, pero con implementación propia, interfaz modernizada y mejoras de usabilidad. Se extraerá el inventario funcional completo relacionado con canales antes de cerrar el diseño de IPZStream.

La plataforma debe evitar dependencias rígidas de una única versión de Ubuntu. Instalador, servicios y runtime se diseñarán con detección de distribución/versión, comprobación de dependencias y rutas compatibles. Objetivo de soporte: Ubuntu LTS modernas, incluyendo Ubuntu 24.04, y mantener portabilidad hacia versiones Ubuntu que todavía puedan ejecutar de forma segura las dependencias requeridas por IPZStream. No se prometerá compatibilidad universal con versiones EOL si Node.js, MariaDB, FFmpeg, Nginx u otras dependencias ya no las soportan.

### 13.2 — Canales/Streams: alcance ampliado
Antes de implementar se inventariarán del panel de referencia todas las funciones visibles relacionadas con canales: alta individual y masiva, fuentes, servidores, perfiles/transcodificación, categorías, EPG, logos, orden, estado, acciones start/stop/restart, monitorización, conexiones, edición masiva, importación y herramientas relacionadas. La nueva UI buscará familiaridad funcional con XUI sin reutilizar literalmente su código ni assets propietarios.


## Decisión de migración funcional completa
Se autoriza trasladar a IPZStream, mediante reimplementación propia, prácticamente todo el modelo funcional útil del panel de referencia. La referencia deja de limitarse a canales: se utilizará para reconstruir progresivamente administración, streams, canales creados, creación masiva, bouquets, ordenación, EPG, servidores, conexiones, usuarios/líneas, reseller, MAG/Ministra, VOD, radio, player, logs, tickets, backups, cache, herramientas, monitorización y dashboard.

La migración NO consistirá en introducir los PHP/binarios heredados dentro de IPZStream. Cada capacidad se implementará y mantendrá en nuestro código React/Vite + Node.js + MariaDB, conservando compatibilidad con el actualizador panel-first y permitiendo mejorar diseño, seguridad, rendimiento y soporte Ubuntu.

La sección Canales será el primer módulo de migración profunda y servirá como patrón arquitectónico para los demás módulos.


## Mega actualización 0.4.0 — autorización de construcción
Se autoriza consolidar la Etapa 13 como una actualización mayor instalable desde el Centro de actualización. Respaldo previo creado: `backup/pre-mega-update-0.4.0-2026-09-17`.

La versión 0.4.0 será la base moderna de IPZStream. El alcance de esta entrega prioriza una reconstrucción amplia del módulo Canales/Streams inspirada funcionalmente en XUI: administración avanzada, selección múltiple y acciones masivas, alta masiva, categorías/bouquets, EPG por canal, perfiles de salida/transcodificación, asignación de nodo, múltiples fuentes/failover, monitorización, control start/stop/restart, preview, ordenación y metadatos. Se mantendrá compatibilidad con los canales existentes mediante valores por defecto.

El instalador también se endurecerá para detectar Ubuntu y soportar Ubuntu LTS modernas, con Ubuntu 24.04 como objetivo prioritario, sin reutilizar binarios heredados de XUI. La actualización debe seguir siendo panel-first y conservar datos existentes.


### 0.4.0 — implementación publicada en repositorio
Primera ola de la mega actualización incorporada a `main`: versión 0.4.0, modelo de canal ampliado, alta masiva, selección y operaciones masivas, campos de nodo/bouquet/EPG/perfil/formato/orden/notas y detección de Ubuntu/Debian en instalador. Los datos antiguos siguen siendo compatibles mediante normalización con valores por defecto.

Esta entrega establece la base sobre la que continuarán bouquets, EPG, nodos y demás módulos XUI modernizados sin importar código PHP/binarios heredados.


### 0.4.0 — hotfix del actualizador por ENOTEMPTY npm
La primera instalación 0.4.0 alcanzó correctamente `descarga Git`, pero falló en `dependencias npm` con `ENOTEMPTY` al renombrar paquetes dentro de `node_modules` (incluyendo `@types/node`, `@rolldown/binding-linux-x64-gnu` y `rolldown`). El rollback Git funcionó, pero el rollback volvió a ejecutar npm sobre el mismo árbol inconsistente y falló por la misma causa.

Corrección aprobada: el actualizador debe hacer instalación reproducible desde árbol limpio cuando exista lockfile: eliminar `node_modules` y ejecutar `npm ci`. El rollback aplicará el mismo procedimiento limpio. Esto evita reutilizar un `node_modules` parcialmente mutado entre versiones.


## Etapa 14 — Reconstrucción del panel clásico XUI — INICIADA
Decisión aprobada: congelar la base IPZStream 0.4.0 como punto seguro y reconstruir el flujo visual/operativo del panel XUI 1.5.13 de referencia con alta fidelidad funcional, manteniendo implementación propia y mantenible. Respaldo previo: `backup/pre-legacy-panel-rebuild-2026-09-18`.

La referencia principal será `ronbercito/ipprueba`. Se conservarán la organización reconocible, navegación, densidad de tablas, formularios y flujo administrativo del panel clásico, pero no se copiarán PHP codificados, binarios, mecanismos de licencia ni assets propietarios. El backend seguirá siendo IPZStream (Node.js + MariaDB + FFmpeg) y la actualización seguirá siendo panel-first.

### Etapas
- 14.1: shell clásico: sidebar, topbar, dashboard y sistema visual.
- 14.2: Streams/Canales, creados, alta individual/masiva, orden y monitorización.
- 14.3: categorías y bouquets.
- 14.4: EPG.
- 14.5: servidores/load balancers.
- 14.6: líneas/usuarios/conexiones.
- 14.7: reseller.
- 14.8: MAG/Ministra, VOD, series y radio.
- 14.9: logs, backups, cache, herramientas y configuración.
- 14.10: compatibilidad/migración y endurecimiento Ubuntu 24.04.


### Hotfix previo a 14.1 — lockfile ausente/desincronizado
El servidor confirmó que el actualizador limpio ya elimina `node_modules`, pero `npm ci` falla con EUSAGE porque el repositorio no contiene un `package-lock.json` sincronizado y la instalación conserva un lockfile local antiguo al estar ignorado/no versionado. El lock local no incluye `hls.js`.

Corrección aprobada: el actualizador no debe decidir por mera existencia física de un lockfile local. Solo usará `npm ci` cuando `package-lock.json` esté controlado por Git; en caso contrario hará `npm install --package-lock=false` sobre `node_modules` limpio. Esto mantiene la solución ENOTEMPTY y evita que archivos runtime obsoletos bloqueen releases.


### Directriz visual global XUI
Por decisión del proyecto, la reconstrucción no se limitará a la organización funcional. Todas las etapas 14.x buscarán máxima familiaridad visual con XUI 1.5.13 en navegación, tablas, formularios, botones, iconografía, estados, modales y vista/reproductor, siempre mediante componentes, CSS e iconos propios o con licencia compatible. Se conservará el backend IPZStream y no se copiarán assets propietarios ni código heredado.


### Estado 14.2
Primera entrega publicada: consola Streams clásica, filtros densos, alta múltiple modal, acciones masivas y Start/Stop/Restart reales; preview/reproductor conservado y estilizado dentro del sistema clásico. Pendiente validación mediante actualización desde panel y posterior refinamiento de tabla/formulario/reproductor según comparación visual.


### 14.2.3 — Refinamiento visual validado contra instalación
Captura de la instalación 14.2 validada. Se autoriza refinamiento del listado Streams: aumentar legibilidad sin perder densidad clásica, corregir proporciones de tabla/toolbar, enriquecer columnas operativas y hacer que acciones/reproductor se perciban como una consola XUI coherente. Se preservan backend, datos y motor de streaming.

## Etapa 15 — Fundación IPZStream Main/Sub propia — INICIADA
Se retoma el proyecto paralizado `ipztream` para construir una arquitectura propia inspirada en los paquetes históricos `main_xtreamcodes_reborn` y `sub_xtreamcodes_reborn`, sin importar PHP ofuscado, binarios antiguos, mecanismos de licencia ni assets heredados.

### Decisión técnica
- `main` se modela como control central IPZStream: panel, API, base MariaDB, usuarios, canales, auditoría y orquestación.
- `sub` se modela como nodo streaming IPZStream: servidor secundario con estado, capacidades, heartbeat, métricas y futura ejecución de streams.
- La primera entrega crea inventario documental y endpoints base para registrar/listar nodos streaming sobre la tabla `nodes` existente, manteniendo compatibilidad con el panel actual.
- La comunicación main/sub será propia, tokenizada y auditable. No se ejecutará ni copiará código legado.

### Alcance 15.1
- Documento `docs/reference/xtream-reborn-main-sub-map.md`.
- Versión `0.4.1`.
- Normalización extendida de nodos: rol, endpoint API, capacidades, métricas, última señal y estado operativo.
- Endpoints base: `/api/stream-nodes`, `/api/stream-nodes/register`, `/api/stream-nodes/:id/heartbeat`.

### Pendiente
- UI clásica para servidores/load balancers.
- Instalador de nodo secundario IPZStream.
- Autenticación HMAC por nodo y rotación de token.
- Asignación real de canales a nodos y scheduler de streams distribuidos.

### 15.2 — Instalador de nodo y consola Servidores
Se continúa la fundación main/sub con el primer instalador de nodo secundario propio y la consola visual de Servidores/Load Balancers dentro del panel clásico.

#### Alcance
- Crear script `scripts/install-node.sh` para preparar un nodo secundario IPZStream sin importar binarios heredados.
- Permitir que `/api/stream-nodes/register` y `/api/stream-nodes/:id/heartbeat` pasen por `secure-entry` usando token de nodo, sin sesión administrativa.
- Conectar la navegación `Servidores` con `NodesPage` real.
- Adaptar la pantalla de nodos para roles `main/sub/edge`, capacidades, métricas, último heartbeat y endpoint API.
- Mantener compatibilidad con `/api/nodes` existente.


### 15.3 — Persistencia real de nodos en MariaDB
Respaldo previo: `backup/pre-stream-node-persistence-0.4.3-20261002`.

Se reemplaza la persistencia provisional de nodos basada en la tabla JSON genérica `nodes` por estructuras dedicadas:
- `stream_nodes`: identidad, rol, IP/host, API, región, capacidad, capacidades, versión, estado, métricas actuales y último heartbeat.
- `stream_node_heartbeats`: historial temporal de métricas por nodo para diagnóstico y futura telemetría.

Reglas:
- `/api/stream-nodes` pasa a ser la API canónica de inventario.
- `/api/nodes` se conserva como compatibilidad y usa el mismo backend dedicado, evitando dos fuentes de verdad.
- Registro y heartbeat continúan protegidos por `IPZTREAM_NODE_REGISTRATION_TOKEN`.
- Un nodo se marca automáticamente `Fuera de línea` si deja de reportar durante el umbral configurable `IPZTREAM_NODE_OFFLINE_AFTER_SECONDS`.
- Los registros históricos de heartbeat se retienen por un período configurable para evitar crecimiento ilimitado.
- Los nodos existentes en la tabla legacy `nodes` se migran de forma no destructiva al arrancar.
- La identidad del nodo debe ser estable: si un registro llega con el mismo IP/host, se reutiliza el ID existente para que una reinstalación no rompa el heartbeat.

Antes de continuar a ejecución distribuida de FFmpeg, esta etapa debe validar: alta manual, registro remoto, heartbeat, transición online→offline→online, reinicio del main y conservación de datos.

#### Implementación 0.4.3
- `server/db.js` crea y usa `stream_nodes` + `stream_node_heartbeats`.
- Migración legacy protegida por `app_meta.stream_nodes_migrated_v1`, para que un nodo eliminado no reaparezca al reiniciar.
- `/api/stream-nodes` es la API canónica; `/api/nodes` permanece como compatibilidad sobre las mismas tablas.
- GET de historial: `/api/stream-nodes/:id/heartbeats?limit=N`.
- Offline automático por timeout, con worker liviano y retención acotada de heartbeats.
- El gateway seguro reenvía correctamente el body de registro/heartbeat y RBAC asigna `stream-nodes` a permisos `nodes.*`.
- El instalador Main genera/preserva el token de nodos y configura timeout/retención.
- El instalador de subnodo mide CPU por delta real, RAM/disco/load, procesos FFmpeg activos, genera JSON seguro y adopta el ID canónico del Main.
- La UI dejó de mostrar nodos demo/localStorage como fallback operativo; si la API no tiene nodos, muestra inventario vacío real.
- Versión: `0.4.3`.

Validación aislada realizada en checkout limpio:
- `node --check` aprobado para `server/db.js`, `server/index.js`, `server/auth.js` y `server/secure-entry.js`.
- `bash -n` aprobado para `install.sh` y `scripts/install-node.sh`.
- `npm run build` aprobado con Vite 8.3.2, 1933 módulos transformados. Solo quedan warnings no bloqueantes de tamaño de bundle/directivas de lucide-react.

Pendiente de validación real: arrancar 0.4.3 contra MariaDB de desarrollo, instalar un subnodo autorizado y confirmar online→offline→online e historial. No declarar producción hasta completar esa prueba.


#### Integración 15.3 en main
PR #3 mezclado en `main`.
Merge commit: `31864aa1ec6cf6aa81c4fe72f4da5f2cb5216286`.
La base queda en `0.4.3`; la siguiente continuidad debe partir desde este commit y validar un subnodo real antes de avanzar al agente FFmpeg distribuido.


## 0.4.4 — Rediseño visual vivo de Streams/Canales
Se integra en el panel real el rediseño solicitado, sin usar imágenes generadas. La pantalla Streams/Canales incorpora una cabecera más clara, cuatro tarjetas de estado alimentadas por los estados reales de cada stream, filtros más legibles, tipografía de mayor peso, contraste reforzado e iconografía Lucide con colores operativos diferenciados.

La tabla conserva las funciones existentes Start/Stop/Restart, Watch, Power, Edit y Delete, pero aumenta jerarquía visual, tamaño útil de filas, lectura de estados y separación de acciones. El shell global recibe mayor contraste en sidebar/topbar y textos más nítidos.

No se modifica FFmpeg, HLS, MariaDB, el modelo de nodos 0.4.3 ni los endpoints existentes. La versión visual pasa a `0.4.4` para no colisionar con la entrega 0.4.3 de persistencia Main/Sub.


## 0.4.5 — Corrección estructural de Streams/Canales
Se corrige la diferencia visual detectada entre el panel instalado y el diseño aprobado. El cambio deja de ser solamente cosmético y reorganiza la pantalla para acercarla a la referencia real de trabajo.

Cambios principales:
- tarjetas de resumen más compactas y blancas, con iconos/acentos de color en lugar de fondos pastel completos;
- toolbar en una sola zona con búsqueda, Estado, Servidor, Tipo, Categoría y selector real de Columnas;
- tabla ampliada con Categoría, Origen, Servidor, Estado, Bitrate, Resolución, Clientes, Tiempo activo, Reinicios y Acciones;
- logos reales cuando el canal tiene `logo`, con fallback por inicial;
- acciones visibles reducidas a Start, Stop, Restart, Detalle/Preview y menú Más;
- panel lateral derecho real para detalle del canal con pestañas Resumen, Estadísticas, Clientes y Logs;
- preview HLS dentro del drawer, reutilizando el motor temporal existente;
- `ffprobe` bajo demanda al abrir el detalle para mostrar bitrate, resolución, FPS y codecs sin inventar telemetría;
- las columnas de bitrate/resolución se completan después de una medición real; clientes muestra `—` si el runtime todavía no entrega viewers por stream;
- al abrir el drawer, el contenido se comprime en escritorio y el panel pasa a overlay en resoluciones menores;
- topbar de Streams muestra auto actualización real cada 3 s.

Se preservan FFmpeg/HLS, MariaDB, Main/Sub, nodos y endpoints existentes. La versión pasa a `0.4.5`.


## 0.4.6 — Contraste sólido y telemetría multimedia cada 5 s
Se aplica la corrección visual solicitada sobre Streams/Canales para acercar aún más el panel instalado al diseño de referencia.

Cambios:
- colores más sólidos y mayor contraste en sidebar, topbar, tarjetas, tabla, badges y acciones;
- tarjetas superiores blancas con borde superior de estado e iconos de color sólido;
- título más limpio: las acciones operativas pasan a la misma toolbar que búsqueda y filtros;
- toolbar unificada con Añadir múltiples, Actualizar, Columnas y Añadir Stream;
- estados EN LÍNEA / INICIANDO / ERROR / DETENIDO con badges sólidos;
- botones Start / Stop / Restart / Preview / Más con relleno sólido e iconos blancos;
- Bitrate y Resolución ya no dependen de abrir el detalle: se consultan automáticamente mediante `/api/source-probe`;
- ciclo de telemetría multimedia cada **5 segundos**, con máximo 4 probes concurrentes y hasta 25 streams visibles por ciclo;
- si una ronda tarda más de 5 s, no se superpone otra ronda para evitar saturar FFmpeg/ffprobe;
- se conserva la última medición válida ante fallos transitorios;
- el drawer consume las mismas métricas actualizadas, por lo que bitrate/resolución permanecen sincronizados mientras está abierto;
- estado FFmpeg/HLS mantiene su polling existente de 3 s.

Versión: `0.4.6`.
