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

**Objetivo:**
- Crear `src/modules/packages/` independiente para planes comerciales.
- Crear `src/modules/connections/` independiente para sesiones/conexiones administrativas.
- Crear `src/modules/devices/` independiente para inventario y asociación de dispositivos.
- Separar componentes, servicios/API y estilos por módulo.
- Utilizar API compartida como fuente principal, evitando depender únicamente de `localStorage`.
- Mantener `src/main.jsx` únicamente como punto de integración.

**Alcance de Paquetes:** nombre, descripción, precio, duración, límite de conexiones, estado y cantidad de usuarios asociados; alta, edición, activación/desactivación, eliminación, búsqueda y filtros.

**Alcance de Conexiones:** usuario, dispositivo, IP, nodo, canal/stream, inicio, última actividad y estado; listado, búsqueda, filtros y cierre administrativo de sesión.

**Alcance de Dispositivos:** usuario asociado, identificador, tipo, IP, nodo, última actividad y estado; listado, búsqueda, filtros y desvinculación.

**Validaciones previstas:** duplicados relevantes, datos obligatorios, persistencia después de recarga, cambios de estado y comprobación de que los datos compartidos no dependan solamente de `localStorage`.

**Límites:** conexiones y dispositivos serán inicialmente datos administrativos/de demostración; no se implementará todavía un motor real de sesiones de streaming. Tampoco facturación/pagos, RBAC completo ni PostgreSQL integral.

**Respaldo:** `backup/pre-etapa-6-7-packages-connections-devices` creado antes del cambio estructural.

## 2026-09-14 — Implementación Etapa 6/7 — Paquetes / Conexiones / Dispositivos — COMPLETADA Y VALIDADA
Se implementaron los tres módulos independientes y se integraron en `src/main.jsx`.

**Paquetes:**
- `src/modules/packages/Packages.jsx`
- `src/modules/packages/services/packagesApi.js`
- `src/modules/packages/styles/packages.css`
- CRUD mediante `/api/packages`.
- Validación de nombre duplicado, precio, duración y conexiones máximas.

**Conexiones:**
- `src/modules/connections/Connections.jsx`
- `src/modules/connections/services/connectionsApi.js`
- `src/modules/connections/styles/connections.css`
- Consulta mediante `/api/connections`.
- Cierre administrativo mediante `POST /api/connections/:id/close`.

**Dispositivos:**
- `src/modules/devices/Devices.jsx`
- `src/modules/devices/services/devicesApi.js`
- `src/modules/devices/styles/devices.css`
- Consulta mediante `/api/devices`.
- Desvinculación mediante `POST /api/devices/:id/unlink`.

**Backend:** `server/index.js` fue ampliado con persistencia JSON para `data/packages.json`, `data/connections.json` y `data/devices.json`, manteniendo la misma API compartida usada en etapas anteriores.

**Integración:** `src/main.jsx` ahora carga `PackagesPage`, `ConnectionsPage` y `DevicesPage` como módulos independientes; no se trasladó lógica de negocio al archivo principal.

**Validación del usuario:** el usuario confirmó que creación/edición/activación/desactivación/eliminación y validaciones de Paquetes funcionan; búsqueda/filtros y cierre administrativo de Conexiones funcionan; Dispositivos, búsqueda/filtros y desvinculación funcionan; persistencia y operación general confirmadas como **todo funciona**.

**Estado:** Etapa 6/7 cerrada y validada.

## 2026-09-14 — Etapa 7/7 — Logs / Auditoría / Estadísticas — INICIO
**Motivo:** completar el último bloque de las siete subetapas actuales del panel, incorporando observabilidad administrativa sin mezclarla con la lógica de los módulos ya validados.

**Regla:** esta entrada queda registrada después de actualizar `CONTINUITY.md` y antes de modificar código.

**Objetivo:**
- Crear `src/modules/logs/` independiente para consulta y filtrado de registros.
- Separar la auditoría administrativa de la presentación de Logs para poder conectar posteriormente eventos reales del backend.
- Crear `src/modules/statistics/` independiente para indicadores y resúmenes administrativos.
- Mantener componentes, servicios/API y estilos separados por módulo cuando corresponda.
- Mantener `src/main.jsx` únicamente como punto de integración.
- Persistir inicialmente mediante archivos JSON del backend y endpoints `/api/` dedicados.

**Alcance de Logs:** listado de eventos, búsqueda, filtros por nivel/módulo/fecha y visualización del detalle disponible.

**Alcance de Auditoría:** usuario, acción, módulo, fecha/hora, resultado y detalle; inicialmente orientado a acciones administrativas registradas por la aplicación.

**Alcance de Estadísticas:** indicadores administrativos derivados de usuarios, conexiones, dispositivos, nodos y contenido disponible, con resúmenes claros para el panel.

**Límites:** no se implementará todavía telemetría real de bitrate/tráfico/reproducción, motor de métricas de streaming, PostgreSQL, RBAC completo ni updater firmado. No se modificarán módulos previos salvo lo estrictamente necesario para integrar eventos.

**Resultado esperado:** disponer de Logs, Auditoría y Estadísticas funcionales y persistentes a nivel administrativo, listas para una posterior migración a PostgreSQL y métricas reales.

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
