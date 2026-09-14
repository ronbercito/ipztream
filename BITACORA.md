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

**Estado:** código publicado en `main`. Pendiente ejecutar `npm run build` e instalar en el contenedor para validación final.

---

## Protocolo permanente
Toda mejora o corrección futura debe seguir este orden:
1. Registrar la intención/cambio en `BITACORA.md`.
2. Crear respaldo cuando el cambio sea estructural.
3. Implementar el código.
4. Ejecutar build/verificación.
5. Registrar el resultado.
6. Publicar la actualización.
7. Informar al usuario qué cambió y cómo probarlo.
