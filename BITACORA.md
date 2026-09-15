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

**Resultado esperado:** los tres menús quedan separados, funcionales y preparados para evolucionar hacia backend real sin mezclar lógica de negocio con la UI.

**Respaldo previsto antes del cambio estructural:** `backup/pre-etapa-6-7-packages-connections-devices`.

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
