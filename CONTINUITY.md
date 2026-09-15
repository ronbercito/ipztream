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
11. API de clientes + sesiones de aplicación — **EN IMPLEMENTACIÓN**.

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
- Etapas 1–10 están validadas por el usuario.

## Etapa 11 — API de clientes + sesiones de aplicación
**Estado técnico:** EN IMPLEMENTACIÓN.

### Objetivo
Construir la identidad y sesión específica de los clientes IPTV, separada de la autenticación administrativa existente. Esta capa será utilizada posteriormente por la aplicación IPTV y por las APIs de catálogo/reproducción.

### Alcance
- Login de cliente IPTV mediante usuario y contraseña.
- Sesiones de cliente almacenadas de forma segura en MariaDB.
- Token de sesión no reutilizable como contraseña y almacenado únicamente como hash en base de datos.
- Identidad del cliente mediante `/api/client/me`.
- Logout mediante `/api/client/logout`.
- Middleware de sesión para proteger futuras rutas de aplicación.
- Rechazo de clientes inexistentes, credenciales inválidas, vencidos o suspendidos.
- Registro de login/logout en `audit_logs`.
- Expiración de sesiones.
- Mantener separadas las sesiones administrativas y las sesiones IPTV.

### No incluido todavía
- Reproducción de video.
- HLS real.
- Generación de URLs de stream.
- Control real de conexiones simultáneas.
- Aplicación móvil/TV.
- Motor de streaming.

### Archivos previstos
- `server/client-auth.js`
- `server/secure-entry.js` y/o `server/index.js`
- `server/db.js`
- `database/schema.sql`
- `src/...` únicamente si se necesita una prueba visual mínima de sesión; la app cliente completa queda para etapas posteriores.

### Resultado esperado
Un cliente IPTV creado en Etapa 10 podrá autenticarse mediante API, obtener su identidad y estado, mantener una sesión temporal y cerrarla. Las credenciales continuarán almacenándose mediante hash seguro y nunca se devolverán en las respuestas.

### Respaldo
`backup/pre-etapa-11-api-clientes-sesiones`.

## Próxima fase
Después de cerrar Etapa 11, Etapa 12 será el motor de streaming real e integración de fuentes de reproducción.

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
