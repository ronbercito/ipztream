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
- El backend completo con PostgreSQL, autenticación/RBAC y API integral todavía no está conectado.
- El updater real se implementará posteriormente mediante releases controlados y firmados.

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

## Referencia visual aprobada
Sidebar azul oscuro, barra superior, búsqueda global, dashboard claro, tarjetas KPI, gráficos, estado de nodos, tablas administrativas, filtros, badges y acciones rápidas. No generar nuevos mockups salvo solicitud explícita.

## Pendientes de fases posteriores
- Backend integral con PostgreSQL.
- Autenticación robusta y RBAC completo.
- Auditoría centralizada real desde backend.
- Telemetría y health checks reales de streams/nodos.
- Motor real de sesiones y métricas de streaming.
- Licenciamiento.
- Releases/updater firmado para instalaciones de clientes.
- Endurecimiento de seguridad y protección del código en instalaciones de clientes.

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

## Próxima etapa en curso: Etapa 8 — Backend real + PostgreSQL
**Objetivo:** iniciar la transición de la capa demo/local a una arquitectura operativa real, manteniendo los módulos actuales como frontend administrativo.

### Alcance de Etapa 8
- Incorporar PostgreSQL como persistencia principal.
- Preparar esquema inicial para usuarios, paquetes, nodos, canales, fuentes, contenido, conexiones, dispositivos y auditoría.
- Crear una capa backend modular sin depender de JSON como persistencia principal.
- Mantener compatibilidad controlada con los datos actuales para facilitar la migración.
- Exponer API REST preparada para autenticación y RBAC posteriores.
- Centralizar errores y validaciones básicas.
- Preparar migración segura de los datos actuales hacia PostgreSQL.
- No introducir todavía motor real de streaming ni licenciamiento.

**Resultado esperado:** IPZStream ejecutándose en el contenedor con PostgreSQL como base real y el panel operando progresivamente sobre una API persistente.
