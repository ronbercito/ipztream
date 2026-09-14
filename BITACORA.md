# Bitácora de IPZStream

## 2026-09-14 — Etapa 1 — Base visual + instalador inicial
Base navegable inicial de IPZStream con sidebar oscuro, barra superior, dashboard, KPIs, gráficos, nodos, conexiones y tablas administrativas. Se preparó instalador para Debian 13 y despliegue en un contenedor Linux.

## 2026-09-14 — Corrección 1 — Instalador desde `/opt/ipztream`
El instalador intentaba copiar el proyecto sobre sí mismo. Se agregó detección de origen/destino iguales para omitir la copia cuando ya se ejecuta desde `/opt/ipztream`.

## 2026-09-14 — Mejora 1 — Botón de actualización
Se agregó el botón `Actualizar` al panel. Por ahora corresponde a la interfaz de actualización; el updater real se conectará posteriormente mediante releases controlados y firmados.

## 2026-09-14 — Etapa 2 — Panel integral y navegación
Se habilitaron Dashboard, Usuarios, Servidores/Nodos, Canales, VOD/Series, EPG, Listas M3U, Paquetes/Perfiles, Conexiones Activas, Dispositivos, Logs/Auditoría, Estadísticas y Configuración. La etapa utiliza datos demostrativos y prepara la futura conexión con API/PostgreSQL.

**Respaldo:** `src/main.jsx.bak` antes de la modificación estructural.

## 2026-09-14 — Corrección 2 — Formulario rápido
Se registró la corrección para que los formularios modales guarden directamente el valor introducido, eliminando el `prompt()` adicional.

## 2026-09-14 — Etapa 1/13 — Configuración del sistema
Se definió Configuración como centro de parámetros de IPZStream. El alcance original contemplaba General, Panel, Red/API, Seguridad, Almacenamiento, Logs y Actualizaciones, con persistencia local para parámetros visuales mientras no exista backend.

**Respaldo:** `backup/pre-etapa-1-13-configuracion`.

## 2026-09-14 — Arquitectura permanente — Módulos independientes
Cada menú principal debe funcionar como módulo independiente; las opciones importantes deben separarse en componentes, servicios/API y estilos cuando corresponda. Se evita concentrar nuevas funcionalidades en `src/main.jsx`.

Estructura objetivo:
```text
src/
├── app/
├── modules/
│   ├── dashboard/
│   ├── users/
│   ├── nodes/
│   ├── channels/
│   ├── vod/
│   ├── epg/
│   ├── m3u/
│   ├── packages/
│   ├── connections/
│   ├── devices/
│   ├── logs/
│   ├── statistics/
│   └── settings/
├── components/
├── services/
└── styles/
```

## 2026-09-14 — Etapa 2/13 — Usuarios
Se creó el módulo independiente `src/modules/users/` con `Users.jsx`, filtros, formulario, tabla, servicio y estilos. Incluye búsqueda, filtros, alta, edición, eliminación, estado, paquete, conexiones y vencimiento, preparado para API/PostgreSQL/RBAC.

**Respaldo:** `backup/pre-etapa-2-13-usuarios`.

## 2026-09-14 — Corrección 3 — Conflicto `Settings`
La compilación detectó conflicto entre el icono `Settings` de lucide-react y el componente `Settings`. Se corrigió usando `SettingsIcon`, se restauró el panel completo y se mantuvo `UsersPage` como módulo independiente.

**Resultado:** compilación e instalación en Debian 13 verificadas correctamente.

## 2026-09-14 — Corrección 4 — Configuración incompleta detectada
Durante la validación funcional el usuario confirmó que las secciones del 1 al 7 funcionan correctamente. En Configuración se detectó que solamente aparecen General y Actualizaciones, aunque el alcance de Etapa 1/13 contemplaba General, Panel, Red/API, Seguridad, Almacenamiento, Logs y Actualizaciones.

**Respaldo:** se creó `backup/pre-correccion-configuracion-completa` desde el estado actual de `main` antes de modificar la configuración.

**Corrección prevista:** restaurar Configuración como módulo independiente y completo, sin modificar Usuarios ni las demás pantallas ya validadas. Se mantendrá inicialmente persistencia local para parámetros visuales y se dejará separada la futura configuración real del servidor/backend.

**Regla:** esta entrada queda registrada antes de modificar el código.

## 2026-09-14 — Resultado Corrección 4 — Configuración restaurada
Se creó `src/modules/settings/Settings.jsx` y su hoja `src/modules/settings/settings.css`. Configuración ahora está separada del panel principal y contiene las secciones General, Panel, Red/API, Seguridad, Almacenamiento, Logs y Actualizaciones.

Se incorporaron controles para identidad, idioma, zona horaria, formato de fecha, sesión, preferencias del panel, red/API, HTTPS, rutas de almacenamiento, retención de logs y canal de actualización. Los parámetros visuales se guardan inicialmente en `localStorage`.

`src/main.jsx` mantiene la navegación existente e integra `SettingsPage` sin modificar el módulo de Usuarios ni las demás pantallas validadas.

**Resultado de validación:** el usuario confirmó que el menú de opciones de Configuración ya aparece correctamente.

## 2026-09-14 — Etapa 2/7 — Usuarios — Inicio de consolidación
**Motivo:** comenzar la segunda de las siete subetapas actuales del panel, tomando el módulo de Usuarios existente y consolidándolo sin afectar Dashboard, Configuración ni las demás pantallas ya validadas.

**Estado inicial:** el módulo disponía de búsqueda, filtros, alta, edición, eliminación, estado, paquete, conexiones y vencimiento, pero utilizaba datos de demostración en memoria y no tenía persistencia temporal entre recargas.

**Objetivo de esta etapa:**
- Mantener `src/modules/users/` completamente independiente.
- Añadir persistencia local temporal mientras no exista backend.
- Reforzar validaciones y normalización del formulario.
- Mantener `usersApi.js` separado y preparado para API real.
- No introducir todavía PostgreSQL, autenticación real ni RBAC; esas capacidades se conectarán cuando exista backend.

**Archivos modificados:**
- `src/modules/users/Users.jsx`
- `src/modules/users/components/UserForm.jsx`
- `src/modules/users/styles/users.css`

**Respaldo:** `backup/pre-etapa-2-7-usuarios` creado antes de modificar el código.

**Implementación realizada:**
- Persistencia temporal mediante `localStorage` con clave versionada.
- Recuperación segura de datos al cargar el módulo.
- Normalización de usuario, conexiones máximas y fecha de vencimiento.
- Validación de usuario, nombre y rango de conexiones.
- Detección de nombres de usuario duplicados.
- Mensaje visual de validación dentro del formulario.
- Eliminación actualizada para indicar que afecta la persistencia local de demostración.

**Estado:** implementación completada en `main`.

## 2026-09-14 — Resultado Etapa 2/7 — Usuarios — VALIDADA
El usuario completó satisfactoriamente la prueba funcional completa del módulo:
1. Crear usuario: OK.
2. Recargar página: OK.
3. Usuario permanece después de recargar: OK.
4. Editar usuario: OK.
5. Recargar después de editar: OK.
6. Buscar usuario: OK.
7. Usuario duplicado: validación OK.
8. Cantidad de conexiones inválida: validación OK; se confirmó máximo de 99 conexiones.
9. Eliminar usuario: OK.
10. Recargar y confirmar eliminación: OK.

**Resultado:** Etapa 2/7 cerrada y validada por el usuario. No se detectaron regresiones en las funciones probadas.

**Siguiente etapa:** Etapa 3/7 — Servidores / Nodos.

## 2026-09-14 — Etapa 3/7 — Servidores / Nodos — INICIO
**Motivo:** comenzar la tercera de las siete subetapas actuales del panel, consolidando el menú Servidores / Nodos como módulo independiente sin afectar Usuarios, Configuración ni las demás pantallas ya validadas.

**Objetivo:**
- Crear `src/modules/nodes/` independiente.
- Separar interfaz, componentes, servicio y estilos.
- Permitir alta y eliminación de nodos en persistencia local temporal.
- Mostrar estado, IP, región, CPU, RAM y capacidad.
- Incorporar búsqueda y filtros básicos.
- Preparar `nodesApi.js` para futura API real.
- Mantener datos de demostración mientras no exista backend.
- No introducir todavía PostgreSQL, autenticación real, RBAC ni comunicación real con agentes.

**Respaldo:** `backup/pre-etapa-3-7-nodes` creado antes de modificar código.

**Archivos previstos:**
- `src/modules/nodes/Nodes.jsx`
- `src/modules/nodes/components/NodeFilters.jsx`
- `src/modules/nodes/components/NodeForm.jsx`
- `src/modules/nodes/components/NodeTable.jsx`
- `src/modules/nodes/services/nodesApi.js`
- `src/modules/nodes/styles/nodes.css`
- `src/main.jsx` únicamente para integrar la ruta/módulo.

**Resultado esperado:** el menú Servidores / Nodos deja de depender de `ModulePage` genérico y dispone de una estructura preparada para administrar nodos reales posteriormente.

**Regla:** esta entrada queda registrada antes de modificar el código.

## 2026-09-14 — Corrección Etapa 3/7 — Nodos: persistencia compartida + duplicados
**Motivo:** durante la prueba funcional el usuario detectó dos problemas reales del diseño actual. Primero, un cambio realizado en Servidores / Nodos en un navegador/perfil no aparece en otro navegador/cuenta. Segundo, al intentar agregar una IP duplicada la interfaz solamente parpadea y no muestra el error de manera clara.

**Causa identificada:** el módulo actual utiliza `localStorage` como persistencia principal. `localStorage` pertenece al navegador/perfil y no es una fuente de datos compartida entre usuarios o navegadores. Además, la validación de IP duplicada devuelve `false` desde `Nodes.jsx`, pero el formulario no queda con un estado de error suficientemente visible y persistente.

**Respaldo:** `backup/pre-correccion-nodos-persistencia` creado antes de la corrección.

**Corrección prevista:**
- Incorporar una capa API/backend compartida para Nodos, manteniendo `nodesApi.js` separado de la UI.
- Evitar que los componentes de tabla y formulario conozcan detalles de persistencia.
- Mantener compatibilidad local temporal mientras la API no esté disponible.
- Mostrar el error de IP duplicada dentro del formulario, sin cerrar ni parpadear.
- Impedir el cierre del formulario cuando el guardado es rechazado por validación.
- Preparar la prueba con dos navegadores/perfiles sobre la misma instalación.

**Archivos afectados esperados:** módulo de Nodos, servicio API, backend/API inicial y configuración de instalación/proxy si es necesaria.

**Resultado esperado:** los nodos pasan a tener una fuente compartida y el intento de IP duplicada muestra un mensaje visible y mantiene el formulario abierto para corregirlo.

**Regla:** esta entrada queda registrada antes de modificar el código.

## 2026-09-14 — Resultado Etapa 3/7 — Nodos — VALIDADA
La corrección de persistencia y validación fue implementada y probada por el usuario. Nodos ahora utiliza una API compartida como fuente principal, con persistencia en `data/nodes.json`, servicio `ipztream-api` y proxy `/api/` de Nginx. `localStorage` queda solamente como compatibilidad/fallback temporal.

Pruebas confirmadas por el usuario:
- Entrar a Servidores / Nodos: OK.
- Agregar un nodo: OK.
- Confirmar que aparece: OK.
- El nodo creado aparece en otro navegador/cuenta: OK.
- Intentar registrar nuevamente la misma IP: OK.
- Mensaje visible de IP duplicada: OK.
- El formulario permanece abierto sin parpadear ni cerrarse: OK.
- Cambiar la IP y guardar correctamente: OK.

**Resultado:** Etapa 3/7 cerrada y validada. No se detectaron regresiones en las funciones probadas.

## 2026-09-14 — Etapa 4/7 — Canales / Fuentes — INICIO
**Motivo:** comenzar la cuarta de las siete subetapas actuales del panel, reemplazando la pantalla genérica de Canales por un módulo independiente para administrar canales y sus fuentes de streaming.

**Objetivo:**
- Crear `src/modules/channels/` como módulo independiente.
- Separar `Channels.jsx`, componentes, servicio/API y estilos.
- Implementar listado, alta y edición de canales.
- Permitir activar/desactivar canales.
- Incorporar búsqueda y filtros por estado/grupo.
- Administrar identidad del canal: nombre, número, logo y grupo/categoría.
- Permitir una o varias fuentes por canal.
- Registrar URL, protocolo/tipo, estado y prioridad de cada fuente.
- Utilizar persistencia compartida mediante API desde el inicio para no repetir la limitación de `localStorage` de Nodos.
- Mantener el diseño preparado para health checks, failover, nodos y fuentes reales posteriores.
- Mantener `src/main.jsx` solamente como punto de integración, sin trasladar lógica de negocio al archivo principal.

**Alcance que NO se implementa todavía:** reproductor completo, transcodificación, health check real de cada stream, PostgreSQL, autenticación/RBAC y balanceo real. Se dejarán preparados mediante interfaces de servicio para etapas posteriores.

**Estructura prevista:**
```text
src/modules/channels/
├── Channels.jsx
├── components/
│   ├── ChannelFilters.jsx
│   ├── ChannelForm.jsx
│   ├── ChannelTable.jsx
│   └── SourceEditor.jsx
├── services/
│   └── channelsApi.js
└── styles/
    └── channels.css
```

**Respaldo:** `backup/pre-etapa-4-7-channels` creado antes de modificar código estructural mediante una rama de restauración sobre el estado previo de la etapa.

**Resultado esperado:** Canales queda aislado del resto del panel, con CRUD visual funcional, fuentes administrables, validaciones visibles y persistencia compartida por API.

**Regla:** esta entrada queda registrada antes de modificar el código.

## 2026-09-14 — Implementación Etapa 4/7 — Canales / Fuentes — IMPLEMENTADA, PENDIENTE DE VALIDACIÓN
Se creó el módulo independiente `src/modules/channels/` con:
- `Channels.jsx` como orquestador de estado y operaciones.
- `components/ChannelFilters.jsx` para búsqueda y filtros.
- `components/ChannelForm.jsx` para alta/edición y validaciones.
- `components/ChannelTable.jsx` para listado y acciones.
- `components/SourceEditor.jsx` para múltiples fuentes, protocolo, estado y prioridad.
- `services/channelsApi.js` para acceso separado a `/api/channels`.
- `styles/channels.css` para estilos propios y responsive.

Se amplió `server/index.js` para crear `data/channels.json` y exponer:
- `GET /api/channels`
- `POST /api/channels`
- `PUT /api/channels/:id`
- `DELETE /api/channels/:id`

La API valida número de canal, duplicados de número, nombre/categoría, existencia de fuentes, URL de fuente y prioridad. La persistencia es compartida entre navegadores mediante el mismo backend, siguiendo el patrón validado previamente con Nodos.

`src/main.jsx` solamente integra `ChannelsPage`; la lógica del módulo permanece fuera del archivo principal.

**Respaldo creado:** rama `backup/pre-etapa-4-7-channels` sobre el estado previo de la etapa.

**Validación pendiente:** ejecutar `npm run build`, actualizar/reiniciar la API en el contenedor y probar alta, edición, activación/desactivación, fuentes múltiples, filtros, duplicado de número y persistencia desde otro navegador.

## 2026-09-14 — Corrección Etapa 4/7 — Canales: interfaz instalada desactualizada
**Motivo:** el usuario confirmó que los canales ESPN, HBO Max y TUDN aparecen en el panel, pero no se pueden editar ni realizar las acciones de gestión.

**Diagnóstico:** la implementación actual del repositorio sí contiene las acciones de `Nuevo canal`, edición, activar/desactivar y eliminar en `Channels.jsx` y `ChannelTable.jsx`. La API `GET /api/channels` también responde correctamente. La causa más probable es que el `dist` publicado en Nginx fue construido antes de sincronizar el checkout local con el commit que terminó de integrar Canales (`7c2069b`), por lo que el navegador está recibiendo una versión anterior del frontend aunque la API ya esté actualizada.

**Corrección prevista:**
- No modificar todavía la lógica del módulo.
- Sincronizar `/opt/ipztream` con `origin/main`.
- Ejecutar nuevamente `npm install` y `npm run build`.
- Publicar el `dist` actualizado en `/var/www/ipztream`.
- Mantener intactos `data/`, `data/channels.json`, `data/nodes.json` y la API existente.
- Verificar nuevamente la interfaz y sus acciones.

**Archivos involucrados:** `dist/` como artefacto de despliegue; no se modifica la lógica fuente en esta corrección salvo que la nueva prueba demuestre un fallo real del módulo.

**Respaldo:** no se requiere un nuevo respaldo estructural porque la corrección es de despliegue del build y existe `backup/pre-etapa-4-7-channels`.

**Resultado esperado:** la interfaz publicada debe mostrar y permitir Nuevo canal, Editar, Activar/Desactivar y Eliminar, además de los formularios y filtros implementados.

**Estado:** corrección registrada antes de modificar el despliegue; Etapa 4/7 continúa EN CURSO y no está validada todavía.

## 2026-09-14 — Resultado Etapa 4/7 — Canales / Fuentes — VALIDADA
Después de sincronizar el checkout con `origin/main` y reconstruir/publicar el frontend, el usuario realizó la validación funcional completa del módulo.

Pruebas confirmadas:
1. Nuevo canal: OK.
2. Editar ESPN/HBO/TUDN: OK.
3. Activar/desactivar: OK.
4. Eliminar: OK.
5. Buscar: OK.
6. Filtrar: OK.
7. Administrar fuentes: OK.

**Resultado:** Etapa 4/7 cerrada y validada por el usuario.

**Observación para mejora posterior:** el estado `Activo/Activa` utilizado por los canales y fuentes iniciales es actualmente administrativo/demo y no representa una comprobación real de conectividad. La separación entre estado administrativo y disponibilidad real/health check queda pendiente para una mejora posterior y no bloquea el cierre de esta etapa.

## 2026-09-14 — Etapa 5/7 — VOD / Series / EPG / M3U — INICIO
**Motivo:** comenzar la quinta de las siete subetapas actuales del panel, consolidando la gestión de contenido bajo demanda, series, programación EPG y listas M3U como módulos independientes.

**Objetivo:**
- Separar VOD, Series, EPG y M3U en módulos independientes.
- Separar componentes, servicios/API y estilos de cada módulo cuando corresponda.
- Revisar las pantallas genéricas existentes antes de implementar para evitar duplicaciones y regresiones.
- Mantener persistencia compartida mediante la API existente cuando se requiera guardar datos funcionales.
- Preparar modelos que puedan migrarse posteriormente a PostgreSQL sin rehacer la UI.
- Mantener `src/main.jsx` únicamente como punto de integración.

**Alcance inicial:**
- VOD: catálogo de películas, título, descripción, categoría, año, duración, poster, URL/fuente y estado administrativo.
- Series: series, temporadas y episodios, con estructura separada.
- EPG: programación por canal, inicio, fin, título, descripción y estado.
- M3U: listas, importación de contenido, identificación de canales/streams y preparación para exportación.

**No se implementa todavía:** transcodificación, reproductor completo, ingestión EPG externa, sincronización automática de M3U externos, health checks reales, PostgreSQL completo, autenticación/RBAC o balanceo de nodos.

**Archivos/módulos a revisar y crear:**
- `src/modules/vod/`
- `src/modules/series/` si la separación mejora la mantenibilidad; de lo contrario, `src/modules/vod/series/` con límites claros.
- `src/modules/epg/`
- `src/modules/m3u/`
- `src/main.jsx` solamente para integración.
- `server/index.js` y `data/` únicamente si se requiere persistencia API.

**Respaldo:** `backup/pre-etapa-5-7-vod-series-epg-m3u` creado antes de modificar la estructura de esta etapa.

**Resultado esperado:** VOD, Series, EPG y M3U dejan de depender de pantallas genéricas y quedan preparados para crecer hacia contenido real y backend persistente.

**Regla:** esta entrada queda registrada antes de modificar el código.

## 2026-09-14 — Implementación Etapa 5/7 — VOD / Series / EPG / M3U — IMPLEMENTADA, PENDIENTE DE VALIDACIÓN
Se implementó la primera versión funcional de los cuatro bloques de contenido.

**VOD / Series:**
- `src/modules/vod/Vod.jsx` y `vod.css`.
- Catálogo de películas y series en una estructura visual separada dentro del módulo.
- Alta, edición, eliminación y búsqueda.
- Campos para título, categoría, año, descripción, poster, estado y fuente; series además incluye temporadas y episodios.

**EPG:**
- `src/modules/epg/Epg.jsx` y `epg.css`.
- Alta, edición, eliminación y búsqueda de programación.
- Canal, título, inicio, fin, descripción y estado.
- Validación básica de horario mediante API.

**M3U:**
- `src/modules/m3u/M3u.jsx` y `m3u.css`.
- Alta, edición, eliminación y búsqueda de listas.
- Perfil, estado, cantidad de elementos, descripción y URL de fuente.
- Interfaz inicial de importación y preparación de exportación.

**API/backend:**
- `server/index.js` amplió la persistencia compartida con `data/vod.json`, `data/series.json`, `data/epg.json` y `data/m3u.json`.
- Endpoints CRUD: `/api/vod`, `/api/series`, `/api/epg` y `/api/m3u`.
- Validaciones básicas y persistencia mediante el mismo backend utilizado por Nodos y Canales.

**Integración:**
- `src/main.jsx` integra `VodPage`, `EpgPage` y `M3uPage` como módulos independientes.
- Las pantallas genéricas de esos tres menús dejan de utilizarse.

**Respaldo:** `backup/pre-etapa-5-7-vod-series-epg-m3u`.

**Validación pendiente:** ejecutar `npm install`, `npm run build`, reiniciar `ipztream-api`, publicar el nuevo `dist` y probar funcionalmente VOD, Series, EPG y M3U. La etapa no se considera cerrada hasta que el usuario confirme las pruebas.

---

## Protocolo permanente
Toda mejora o corrección futura debe seguir este orden:
1. Actualizar primero `CONTINUITY.md` con el estado y objetivo de la etapa.
2. Registrar la intención/corrección en `BITACORA.md`.
3. Crear respaldo cuando el cambio sea estructural.
4. Implementar el código.
5. Ejecutar build/verificación.
6. Probar en el contenedor.
7. Registrar el resultado.
8. Publicar la actualización.
9. Informar al usuario qué cambió y cómo probarlo.
