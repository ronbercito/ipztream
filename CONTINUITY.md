# IPZStream — Continuidad del proyecto

## Propósito
IPZStream es una plataforma propia de gestión y distribución de streaming, inspirada en capacidades de paneles IPTV existentes, pero desarrollada con arquitectura, código e interfaz propios.

## Reglas de trabajo obligatorias
- Este repositorio es independiente de Z-Hub.
- GitHub se utilizará para desarrollo, pruebas, control de versiones y releases.
- Las instalaciones de clientes deberán recibir builds/releases controlados mediante un sistema propio de actualización; los clientes no deberán depender del repositorio fuente.
- **ANTES DE CADA ETAPA:** actualizar primero este documento `CONTINUITY.md` con el estado y objetivo de la siguiente etapa.
- Antes de cambios estructurales importantes se debe crear un respaldo o punto de restauración.
- Los cambios se implementan por etapas, probando cada etapa antes de continuar.
- No generar nuevos mockups salvo que el usuario los solicite explícitamente.
- **BITÁCORA PRIMERO:** después de actualizar Continuidad, toda mejora, corrección o cambio debe registrarse en `BITACORA.md`; después se modifica el código y se publica la actualización.
- Cada entrada de bitácora debe indicar etapa, motivo, archivos afectados y resultado esperado.
- La arquitectura debe mantenerse modular: cada menú principal tendrá su módulo y las opciones importantes se separarán en componentes, servicios/API y estilos cuando corresponda.
- Evitar concentrar nuevas funcionalidades en `src/main.jsx`.

## Estado de las etapas
1. Configuración — **COMPLETADA Y VALIDADA**.
2. Usuarios — **COMPLETADA Y VALIDADA**.
3. Servidores / Nodos — **COMPLETADA Y VALIDADA**.
4. Canales / Fuentes — **COMPLETADA Y VALIDADA**.
5. VOD / Series / EPG / M3U — **COMPLETADA Y VALIDADA**.
6. Paquetes / Conexiones / Dispositivos — **COMPLETADA Y VALIDADA**.
7. Logs / Auditoría / Estadísticas — **COMPLETADA Y VALIDADA**.
8. Backend real + MariaDB — **COMPLETADA Y VALIDADA**.
9. Autenticación real + RBAC — **COMPLETADA Y VALIDADA**.
10. Usuarios IPTV / Panel Cliente — **COMPLETADA Y VALIDADA**.
11. API de clientes + sesiones de aplicación — **COMPLETADA Y VALIDADA**.
12. Motor de streaming real + integración de fuentes — **EN IMPLEMENTACIÓN**.

## Estado actual
- Repositorio: `ronbercito/ipztream`
- Rama: `main`
- Versión visible: `0.2.0`.
- Debian 13 / Node.js 22 / npm 10 en el entorno de prueba.
- IP de prueba: `192.168.10.220`.
- Nginx publica `/var/www/ipztream`.
- Código fuente: `/opt/ipztream`.
- Servicio: `ipztream-api`.
- MariaDB es la base principal y permanente.
- Etapas 1–11 están validadas por el usuario.

## Etapa 12 — Motor de streaming real + integración de fuentes
**Estado técnico:** EN IMPLEMENTACIÓN.

### Objetivo
Iniciar el primer motor de streaming real de IPZStream. La etapa no debe crear una simulación de reproducción: debe preparar una fuente real, un proceso de ingesta/transcodificación controlado por el servidor y una salida HLS reproducible por HTTP.

### Correcciones implementadas
- 12.1 — Servido HLS HTTP controlado en `server/secure-entry.js`.
- 12.2 — Centro de actualización administrativo real.
- 12.2.1 — Terminación del Centro de actualización con metadatos de versión, changelog, estados, bloqueo por cambios locales, confirmación, feedback de instalación y estilos propios.

### Corrección 12.2.1 — Centro de actualización completo
**Objetivo:** que el botón `Actualizar` funcione como un centro administrativo completo y no como un modal visual.

**Backend:**
- `server/update-service.js` ahora devuelve versión de aplicación, commit instalado, commit remoto, rama, remote, servicio, fecha de comprobación, cambios disponibles, archivos locales modificados y si la instalación está permitida.
- Mantiene comandos fijos mediante `execFile`.
- Bloquea instalaciones sobre un árbol Git modificado.
- Usa `git pull --ff-only`.
- Ejecuta `npm install` y `npm run build` antes del reinicio.
- Revierte el commit si instalación/build falla.
- Reinicia `ipztream-api` únicamente después de una instalación exitosa.

**Panel:**
- `src/modules/system-update/UpdateCenter.jsx` muestra estado actual/disponible, versión, commits, rama, última comprobación y servicio.
- Lista los cambios antes de instalar.
- Muestra errores reales del API.
- Pide confirmación antes de actualizar.
- Muestra estado de instalación y recarga el panel después del reinicio.
- Informa y bloquea cuando existen cambios locales.
- `src/modules/system-update/UpdateCenter.css` contiene los estilos específicos del módulo.
- `package.json` pasa a versión visible `0.2.0`.

**Seguridad:** el navegador no puede enviar comandos arbitrarios; el backend mantiene la autorización RBAC `system.update`. El mecanismo actual está destinado a desarrollo/pruebas. Para clientes finales se deberá sustituir Git por releases/builds firmados y un canal de actualización controlado por IPZStream/PVS.

**Respaldo:** `backup/pre-update-center-complete-2026-09-16`, creado antes de esta corrección.

**Estado:** IMPLEMENTACIÓN PUBLICADA — **VALIDACIÓN REAL EN EL CONTENEDOR PENDIENTE**. No se declara el módulo validado hasta comprobar build, servicio, API y una actualización real de prueba.

### No incluido todavía
- Aplicación móvil/TV.
- Control definitivo de conexiones simultáneas.
- Balanceo entre nodos.
- DRM.
- CDN.
- Transcodificación adaptativa multi-bitrate completa.
- Motor de sesiones de reproducción del cliente.
- Producción de todos los perfiles HLS.

## Próxima fase
Después de cerrar Etapa 12, la siguiente fase continuará con HLS/reproducción y el primer flujo de canal real de extremo a extremo.

## Respaldos
- `backup/pre-etapa-1-13-configuracion`
- `backup/pre-etapa-2-13-usuarios`
- `backup/pre-correccion-configuracion-completa`
- `backup/pre-etapa-2-7-usuarios`
- `backup/pre-etapa-3-7-nodes`
- `backup/pre-correccion-nodos-persistencia`
- `backup/pre-etapa-4-7-channels`
- `backup/pre-etapa-5-7-vod-series-epg-m3u`
- `backup/pre-etapa-6-7-packages-connections-devices`
- `backup/pre-etapa-7-7-logs-auditoria-estadisticas`
- `backup/pre-etapa-8-backend-postgres`
- `backup/pre-correccion-etapa-8-mariadb`
- `backup/pre-correccion-schema-mariadb-multistatements`
- `backup/pre-etapa-9-auth-rbac`
- `backup/pre-correccion-etapa-9-session-token-hash`
- `backup/pre-etapa-10-usuarios-iptv`
- `backup/pre-etapa-11-api-clientes-sesiones`
- `backup/pre-etapa-12-streaming-real`
- `backup/pre-update-center-2026-09-15`
- `backup/pre-update-center-complete-2026-09-16`

## Protocolo obligatorio
1. Actualizar primero `CONTINUITY.md`.
2. Registrar la intención/corrección en `BITACORA.md`.
3. Crear respaldo cuando el cambio sea estructural.
4. Implementar.
5. Ejecutar build/verificación.
6. Probar en el contenedor.
7. Registrar resultado.
8. Publicar.
9. Informar al usuario qué cambió y cómo probarlo.
