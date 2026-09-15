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

## Estado de las etapas del panel
1. Configuración — **COMPLETADA**.
2. Usuarios — **COMPLETADA Y VALIDADA**.
3. Servidores / Nodos — **COMPLETADA Y VALIDADA**.
4. Canales / Fuentes — **COMPLETADA Y VALIDADA**.
5. VOD / Series / EPG / M3U — **COMPLETADA Y VALIDADA**.
6. Paquetes / Conexiones / Dispositivos — **COMPLETADA Y VALIDADA**.
7. Logs / Auditoría / Estadísticas — **COMPLETADA Y VALIDADA**.
8. Backend real + PostgreSQL — **EN CORRECCIÓN: migración de PostgreSQL a MariaDB**.

## Estado actual
- Repositorio: `ronbercito/ipztream`
- Rama principal: `main`
- Versión visible actual: `0.1.0`
- Entorno de prueba: Debian 13 en contenedor.
- Node.js: `v22.23.2`.
- npm: `10.9.8`.
- IP de prueba: `192.168.10.220`.
- URL de prueba: `http://192.168.10.220`.
- Nginx publica el panel desde `/var/www/ipztream`.
- Código fuente: `/opt/ipztream`.
- Servicio API: `ipztream-api`.
- Las etapas 1–7 del panel fueron implementadas y validadas por el usuario.
- La Etapa 8 introdujo PostgreSQL de forma provisional; esa decisión queda corregida. **La base de datos objetivo y permanente de IPZStream será MariaDB.**
- La validación de la Etapa 8 queda bloqueada hasta completar la sustitución de PostgreSQL por MariaDB y verificar instalación, API, migración y persistencia.
- El updater real, autenticación/RBAC completo, motor de streaming y telemetría avanzada todavía serán fases posteriores.

## Respaldos importantes
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
- Se creará un nuevo respaldo antes de modificar la implementación de persistencia de la Etapa 8.

## Referencia visual aprobada
Sidebar azul oscuro, barra superior, búsqueda global, dashboard claro, tarjetas KPI, gráficos, estado de nodos, tablas administrativas, filtros, badges y acciones rápidas. No generar nuevos mockups salvo solicitud explícita.

## Etapa 8 — Corrección — Backend real + MariaDB
**Motivo:** la implementación de Etapa 8 utilizó PostgreSQL, pero la arquitectura definida para IPZStream debe utilizar MariaDB como base de datos principal. Además, el instalador informó éxito aunque la API no llegó a escuchar en el puerto 3100, por lo que la validación de instalación también debe endurecerse.

### Objetivo inmediato
- Sustituir PostgreSQL por MariaDB en la capa de persistencia del backend.
- Mantener las respuestas y endpoints actuales compatibles con el frontend.
- Crear el esquema inicial de MariaDB para las entidades existentes.
- Migrar automáticamente los datos JSON iniciales cuando las tablas estén vacías, sin sobrescribir datos existentes.
- Preparar conexión mediante variables de entorno y servicio systemd.
- Eliminar la dependencia operativa de `pg`/PostgreSQL.
- Corregir el instalador para que falle claramente si la API no inicia o `/api/health` no responde correctamente.

### Alcance de esta corrección
Archivos esperados: `server/db.js`, `server/index.js`, `database/schema.sql`, `package.json`, `deploy/ipztream-api.service`, `install.sh`, `INSTALL.md` y cualquier archivo adicional estrictamente necesario para MariaDB.

### Criterio de éxito
La Etapa 8 no se cerrará hasta que el usuario pueda instalar/actualizar en Debian 13, comprobar MariaDB activa, comprobar `ipztream-api` activo, obtener `/api/health` correctamente, verificar migración de datos y confirmar persistencia CRUD después de reinicios.

## Próximas fases después de validar Etapa 8
1. Autenticación real y RBAC.
2. Usuarios migrados completamente al backend.
3. Auditoría asociada a usuario/rol/IP/sesión.
4. Health checks y telemetría real de nodos/streams.
5. Motor real de sesiones y reproducción.
6. Licenciamiento.
7. Releases/updater firmado para clientes.
8. Endurecimiento y protección del código en instalaciones finales.

## Protocolo obligatorio por etapa
1. **Actualizar primero `CONTINUITY.md`.**
2. Registrar la intención/corrección en `BITACORA.md`.
3. Crear respaldo cuando el cambio sea estructural.
4. Implementar el cambio.
5. Ejecutar build/verificación.
6. Probar en el contenedor cuando corresponda.
7. Registrar el resultado final en la bitácora.
8. Publicar la actualización.
9. Informar al usuario qué se cambió y cómo probarlo.
