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
- Versión visible: `0.1.0`.
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

### Alcance de esta etapa
- Integrar FFmpeg como motor de procesamiento de fuentes.
- Crear un servicio modular de gestión de procesos de stream, separado de `server/index.js`.
- Tomar una fuente real configurada en un canal existente.
- Generar una salida HLS por canal en almacenamiento local controlado por IPZStream.
- Exponer estado real del proceso: detenido, iniciando, ejecutando, error.
- Detectar salida del proceso y registrar errores básicos.
- Evitar procesos duplicados para el mismo canal.
- Permitir iniciar/detener/reiniciar un stream desde API administrativa.
- Preparar un endpoint de estado para comprobar si el stream realmente está procesándose.
- Registrar acciones de inicio/detención/reinicio en `audit_logs`.
- Mantener la arquitectura preparada para múltiples nodos en etapas posteriores.
- Mantener separado el motor de streaming de la autenticación, catálogo y UI.

### Seguridad y operación
- FFmpeg se ejecutará como proceso hijo controlado por IPZStream, sin ejecutar comandos recibidos directamente desde el navegador.
- Las URLs de fuente deberán validarse antes de construir argumentos.
- Los identificadores de canal se tratarán como datos, no como fragmentos de shell.
- El API administrativo continuará protegido por la autenticación/RBAC existente.
- La salida HLS no deberá exponer archivos arbitrarios del sistema.

### Resultado esperado
Un canal con una fuente real podrá ser iniciado desde IPZStream, FFmpeg procesará la fuente, se generará un `index.m3u8` y segmentos HLS, el API podrá informar el estado real del proceso y el stream podrá comprobarse mediante HTTP. Si la fuente falla, IPZStream deberá detectar la terminación/error y reflejarlo como tal.

### No incluido todavía
- Aplicación móvil/TV.
- Control definitivo de conexiones simultáneas.
- Balanceo entre nodos.
- DRM.
- CDN.
- Transcodificación adaptativa multi-bitrate completa.
- Motor de sesiones de reproducción del cliente.
- Producción de todos los perfiles HLS.

### Respaldo requerido
Antes de modificar código estructural se creará `backup/pre-etapa-12-streaming-real`.

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
