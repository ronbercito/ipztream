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
8. Backend real + MariaDB — **COMPLETADA Y VALIDADA**.
9. Autenticación real + RBAC — **EN PROGRESO**.

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
- Las etapas 1–8 fueron implementadas y validadas por el usuario.
- **MariaDB es la base de datos principal y permanente definida para IPZStream.**
- La implementación PostgreSQL de la Etapa 8 fue reemplazada y no forma parte de la arquitectura operativa.
- La corrección 8.2 eliminó el fallo de inicialización provocado por múltiples sentencias DDL enviadas en una sola consulta.
- En la validación real, MariaDB creó correctamente las 11 tablas: `audit_logs`, `channels`, `connections`, `devices`, `epg`, `m3u`, `nodes`, `packages`, `series`, `users` y `vod`.
- La API responde correctamente en `127.0.0.1:3100` y `/api/health` confirma `database: mariadb`.
- El servicio `ipztream-api` permanece activo después de reinicio y la API continúa respondiendo correctamente.

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
- `backup/pre-correccion-schema-mariadb-multistatements`
- `backup/pre-etapa-9-auth-rbac`

## Referencia visual aprobada
Sidebar azul oscuro, barra superior, búsqueda global, dashboard claro, tarjetas KPI, gráficos, estado de nodos, tablas administrativas, filtros, badges y acciones rápidas. No generar nuevos mockups salvo solicitud explícita.

## Etapa 9 — Autenticación real + RBAC
### Estado
**EN PROGRESO — INICIO REGISTRADO**

### Objetivo
Construir la primera capa de seguridad real de IPZStream sobre el backend/MariaDB ya validado, sin romper los módulos administrativos existentes.

### Alcance de esta etapa
- Usuarios administrativos reales almacenados en MariaDB.
- Hash seguro de contraseñas; nunca guardar contraseñas en texto plano.
- Login y logout del panel.
- Sesiones/tokens con expiración y validación en backend.
- Roles y permisos RBAC.
- Protección de endpoints administrativos.
- Identidad del usuario disponible para auditoría.
- Preparar permisos por módulo para ampliaciones posteriores.
- Mantener separadas autenticación, autorización, acceso a datos y UI.

### Criterios de diseño
- No usar `localStorage` como fuente de verdad para autenticación.
- Las credenciales y secretos deben permanecer en backend/variables de entorno.
- El frontend no debe contener contraseñas ni secretos del servidor.
- Los endpoints protegidos deben rechazar solicitudes no autenticadas.
- Los permisos deben evaluarse en backend, no únicamente ocultando botones en React.
- No modificar innecesariamente los contratos existentes de los módulos ya validados.

### Archivos previstos
Se podrán crear/modificar únicamente los archivos necesarios, previsiblemente `server/index.js`, `server/db.js`, `database/schema.sql`, módulos nuevos bajo `src/modules/auth/` o componentes relacionados, servicios de autenticación y documentación/configuración. La estructura final se confirmará durante la implementación.

### Respaldo
`backup/pre-etapa-9-auth-rbac`.

### Resultado esperado
Al finalizar la etapa, IPZStream deberá disponer de un acceso administrativo real con identidad, roles y permisos validados por backend/MariaDB, con endpoints protegidos y auditoría preparada para registrar el actor autenticado.

## Fases posteriores
1. Administración avanzada de usuarios y permisos.
2. Auditoría asociada a usuario/rol/IP/sesión.
3. Health checks y telemetría real de nodos/streams.
4. Motor real de sesiones y reproducción.
5. Licenciamiento.
6. Releases/updater firmado para clientes.
7. Endurecimiento y protección del código en instalaciones finales.

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
