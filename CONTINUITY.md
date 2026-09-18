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
