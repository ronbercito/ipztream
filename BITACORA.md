# Bitácora de IPZStream

## 2026-09-14 — Base del proyecto e instalador
Se creó la base navegable de IPZStream con dashboard, sidebar, barra superior, KPIs y pantallas administrativas iniciales. Se preparó instalador para Debian 13 y despliegue en contenedor Linux.

## 2026-09-14 — Corrección — Instalador desde `/opt/ipztream`
Se corrigió el instalador para no copiar el proyecto sobre sí mismo cuando se ejecuta desde `/opt/ipztream`.

## 2026-09-14 — Arquitectura permanente — Módulos independientes
Se estableció como regla que cada menú principal sea un módulo independiente y que las opciones importantes se separen en componentes, servicios/API y estilos. Se evita concentrar lógica nueva en `src/main.jsx`.

## 2026-09-14 — Etapa 1/7 — Configuración — COMPLETADA
Se creó `src/modules/settings/Settings.jsx` y `src/modules/settings/settings.css` con General, Panel, Red/API, Seguridad, Almacenamiento, Logs y Actualizaciones. La persistencia visual inicial usa `localStorage` mientras no exista backend completo.

**Respaldo:** `backup/pre-etapa-1-13-configuracion`.

## 2026-09-14 — Etapa 2/7 — Usuarios — COMPLETADA Y VALIDADA
Se consolidó `src/modules/users/` con componentes, servicio y estilos. Incluye búsqueda, filtros, alta, edición, eliminación, validaciones, duplicados, límite de conexiones y persistencia temporal.

**Respaldo:** `backup/pre-etapa-2-7-usuarios`.

**Validación del usuario:** crear, recargar, editar, buscar, duplicados, conexiones inválidas, eliminar y confirmar persistencia después de recarga: todo OK.

## 2026-09-14 — Corrección — Configuración restaurada
Se detectó una versión incompleta de Configuración. Se restauró el módulo completo sin afectar Usuarios ni las pantallas validadas.

**Respaldo:** `backup/pre-correccion-configuracion-completa`.

## 2026-09-14 — Corrección — Conflicto `Settings`
Se corrigió el conflicto entre el icono `Settings` de lucide-react y el componente `Settings`, usando `SettingsIcon`. La compilación e instalación en Debian 13 quedaron verificadas.

## 2026-09-14 — Etapa 3/7 — Servidores / Nodos — COMPLETADA Y VALIDADA
Se creó `src/modules/nodes/` con componentes, servicio y estilos. Posteriormente se corrigió la persistencia para utilizar API compartida con `data/nodes.json`, servicio `ipztream-api` y proxy `/api/` de Nginx. `localStorage` queda como fallback temporal.

**Respaldos:** `backup/pre-etapa-3-7-nodes` y `backup/pre-correccion-nodos-persistencia`.

**Validación del usuario:** alta, persistencia entre navegadores, rechazo de IP duplicada, mensaje visible, formulario abierto y modificación posterior de IP: todo OK.

## 2026-09-14 — Etapa 4/7 — Canales / Fuentes — COMPLETADA Y VALIDADA
Se creó `src/modules/channels/` con filtros, formulario, tabla, editor de fuentes, servicio API y estilos. Se añadió persistencia compartida en `data/channels.json` y CRUD `/api/channels`.

**Respaldo:** `backup/pre-etapa-4-7-channels`.

**Validación del usuario:** nuevo canal, edición, activar/desactivar, eliminación, búsqueda, filtros y administración de fuentes: todo OK.

**Límite conocido:** `Activo/Activa` representa estado administrativo/demo; todavía no es un health check real del stream.

## 2026-09-14 — Etapa 5/7 — VOD / Series / EPG / M3U — COMPLETADA Y VALIDADA
Se implementaron módulos independientes para VOD/Series, EPG y M3U con CRUD, búsqueda, persistencia API y archivos de datos `data/vod.json`, `data/series.json`, `data/epg.json` y `data/m3u.json`.

**Respaldo:** `backup/pre-etapa-5-7-vod-series-epg-m3u`.

**Validación del usuario:** el usuario ejecutó build/API/frontend y confirmó que todo funciona. VOD, Series, EPG y M3U quedan cerrados y validados.

**Límites conocidos:** M3U aún no sincroniza automáticamente proveedores externos, EPG no ingiere XMLTV externo y Series mantiene una estructura inicial que podrá ampliarse. No se implementan todavía reproductor, transcodificación, health checks reales, PostgreSQL, RBAC ni balanceo.

## 2026-09-14 — Etapa 6/7 — Paquetes / Conexiones / Dispositivos — INICIO
**Motivo:** comenzar la sexta de las siete subetapas actuales del panel, consolidando la gestión comercial básica de paquetes y la administración de conexiones y dispositivos.

**Regla:** esta entrada queda registrada después de actualizar `CONTINUITY.md` y antes de modificar código.

**Objetivo:** crear los tres módulos independientes con servicios/API y estilos separados, persistencia compartida y `src/main.jsx` únicamente como punto de integración.

**Alcance:** Paquetes (CRUD, estado, límites, búsqueda/filtros), Conexiones (consulta, búsqueda/filtros y cierre administrativo) y Dispositivos (consulta, búsqueda/filtros y desvinculación).

**Límites:** datos administrativos/demo; sin motor real de sesiones, facturación/pagos, RBAC completo ni PostgreSQL integral.

**Respaldo:** `backup/pre-etapa-6-7-packages-connections-devices`.

## 2026-09-14 — Implementación Etapa 6/7 — Paquetes / Conexiones / Dispositivos — COMPLETADA Y VALIDADA
Se implementaron los tres módulos independientes, APIs, persistencia JSON e integración en `src/main.jsx`.

**Validación del usuario:** creación/edición/activación/desactivación/eliminación y validaciones de Paquetes; búsqueda/filtros y cierre de Conexiones; Dispositivos, búsqueda/filtros y desvinculación; persistencia y operación general: **todo funciona**.

**Estado:** Etapa 6/7 cerrada y validada.

## 2026-09-14 — Etapa 7/7 — Logs / Auditoría / Estadísticas — INICIO
**Motivo:** completar el último bloque de las siete subetapas actuales del panel, incorporando observabilidad administrativa sin mezclarla con la lógica de los módulos ya validados.

**Objetivo:** Logs/Auditoría para consulta de eventos y filtros; Estadísticas para indicadores administrativos derivados de usuarios, conexiones, dispositivos, nodos y contenido; mantener módulos, estilos y lógica separados.

**Límites:** sin telemetría real de bitrate/tráfico/reproducción, PostgreSQL, RBAC completo ni updater firmado.

**Respaldo:** `backup/pre-etapa-7-7-logs-auditoria-estadisticas`.

## 2026-09-14 — Implementación Etapa 7/7 — Logs / Auditoría / Estadísticas — COMPLETADA Y VALIDADA
Se implementaron e integraron los módulos de Logs/Auditoría y Estadísticas.

**Logs / Auditoría:** `src/modules/logs/Logs.jsx` y `src/modules/logs/styles/logs.css`; búsqueda, filtros por nivel y módulo, detalle y contadores de registros, errores y auditorías. Persistencia administrativa inicial local.

**Estadísticas:** `src/modules/statistics/Statistics.jsx` y `src/modules/statistics/styles/statistics.css`; indicadores de usuarios, conexiones, dispositivos, nodos, canales, VOD y Series consultados mediante API.

**Integración:** `src/main.jsx` carga `LogsPage` y `StatisticsPage` como módulos independientes.

**Validación del usuario:** el usuario ejecutó la actualización en Debian 13, realizó build, reinició el servicio API, publicó el frontend y probó Logs/Auditoría/Estadísticas. Confirmó explícitamente: **“todo funciona”**.

**Estado:** Etapa 7/7 cerrada y validada.

**Límites:** la auditoría todavía no recibe automáticamente todos los eventos del backend; las estadísticas no representan bitrate, tráfico real, horas de reproducción ni disponibilidad real de streaming. PostgreSQL, RBAC completo, telemetría real y updater firmado quedan para fases posteriores.

## Protocolo obligatorio
1. Actualizar primero `CONTINUITY.md`.
2. Registrar la intención/corrección en `BITACORA.md`.
3. Crear respaldo cuando el cambio sea estructural.
4. Implementar el cambio.
5. Ejecutar build/verificación.
6. Probar en el contenedor cuando corresponda.
7. Registrar el resultado final en la bitácora.
8. Publicar la actualización.
9. Informar al usuario qué se cambió y cómo probarlo.
