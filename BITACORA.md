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
