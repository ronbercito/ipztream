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
8. Backend real + MariaDB — **EN CORRECCIÓN, PENDIENTE DE VALIDACIÓN**.

## Estado actual
- Repositorio: `ronbercito/ipztream`
- Rama principal: `main`
- Versión visible actual: `0.1.0`.
- Entorno de prueba: Debian 13 en contenedor.
- Node.js: `v22.23.2`.
- npm: `10.9.8`.
- IP de prueba: `192.168.10.220`.
- URL de prueba: `http://192.168.10.220`.
- Nginx publica el panel desde `/var/www/ipztream`.
- Código fuente: `/opt/ipztream`.
- Servicio API: `ipztream-api`.
- Las etapas 1–7 del panel fueron implementadas y validadas por el usuario.
- **MariaDB es la base de datos principal y permanente definida para IPZStream.**
- La implementación PostgreSQL de la Etapa 8 fue reemplazada. No debe utilizarse PostgreSQL como requisito de la aplicación.
- La instalación real confirmó que MariaDB está operativo y que las credenciales del servicio están configuradas, pero la API no inicia porque `server/db.js` intenta enviar varias sentencias `CREATE TABLE` en una sola consulta; MariaDB responde `ER_PARSE_ERROR` al comenzar la segunda sentencia.
- La API no está escuchando actualmente en `127.0.0.1:3100` mientras persista esta corrección.

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
- `backup/pre-correccion-etapa-8-mariadb`

## Referencia visual aprobada
Sidebar azul oscuro, barra superior, búsqueda global, dashboard claro, tarjetas KPI, gráficos, estado de nodos, tablas administrativas, filtros, badges y acciones rápidas. No generar nuevos mockups salvo solicitud explícita.

## Etapa 8 — Corrección — Backend real + MariaDB
**Motivo:** la implementación inicial de Etapa 8 utilizó PostgreSQL, pero la arquitectura definida para IPZStream debe utilizar MariaDB como base de datos principal. Además, el instalador debía impedir cualquier mensaje de éxito si la API no estaba operativa.

### Implementado
- `server/db.js` reemplazado por el conector oficial `mariadb`.
- Pool MariaDB y configuración mediante variables `IPZTREAM_DB_*`.
- Esquema MariaDB para nodos, canales, VOD, series, EPG, M3U, paquetes, conexiones, dispositivos, usuarios y auditoría.
- Migración inicial desde `data/*.json` cuando cada tabla está vacía.
- Conversión de consultas y placeholders a sintaxis compatible con MariaDB.
- Compatibilidad del contrato de consultas directas usado por la API (`rows`/`rowCount`).
- `/api/health` ahora reporta `database: mariadb`.
- Servicio systemd depende de `mariadb.service`.
- Instalador instala MariaDB, crea base/usuario, genera credencial y configura `/etc/ipztream/ipztream-api.env`.
- Instalador verifica explícitamente API + MariaDB antes de informar instalación exitosa y muestra diagnóstico si falla.
- Documentación `INSTALL.md` actualizada.

**Respaldo:** `backup/pre-correccion-etapa-8-mariadb`.

### Corrección actual — inicialización del esquema MariaDB
**Motivo:** la prueba real en Debian 13 mostró `ER_PARSE_ERROR` porque `createSchema()` envía múltiples `CREATE TABLE ...;` dentro de una sola llamada `mariaPool.query()`. El driver/servidor usado no está ejecutando ese lote como múltiples sentencias.

**Objetivo:** hacer que la creación del esquema sea compatible y determinista en MariaDB ejecutando cada sentencia DDL por separado, sin alterar el contrato de los endpoints ni la estructura JSON de los datos. Mantener la migración inicial y la auditoría.

**Archivos previstos:** `server/db.js`; `CONTINUITY.md` y `BITACORA.md` para trazabilidad.

**Resultado esperado:** `initDatabase()` debe completar todas las tablas sin `ER_PARSE_ERROR`, permitir que `ipztream-api` escuche en `3100` y dejar disponible `/api/health` reportando MariaDB. Después se validará CRUD y persistencia.

**Respaldo requerido antes del código:** crear un nuevo punto de restauración `backup/pre-correccion-schema-mariadb-multistatements`.

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
