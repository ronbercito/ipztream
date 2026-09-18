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
