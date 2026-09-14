# IPZTream — Continuidad del proyecto

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

## Dirección del producto
Objetivo: construir una plataforma moderna, segura, modular y escalable para administración de streaming, usuarios, contenido, nodos, monitoreo, licencias y actualizaciones.

## Arquitectura objetivo
- Panel administrativo web
- API/backend
- PostgreSQL
- Redis cuando corresponda
- Gestión de usuarios, roles y permisos/RBAC
- Gestión de streams y contenido
- Agentes/nodos de streaming
- Monitoreo y logs/auditoría
- Licenciamiento
- Sistema de releases y actualización controlada/firma
- Instalador para despliegues controlados
- Despliegues de clientes en contenedores/entornos propios sin acceso al repositorio fuente

## Arquitectura modular objetivo
```text
src/
├── app/
│   ├── App.jsx
│   ├── routes.jsx
│   └── layout/
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
│   ├── ui/
│   ├── tables/
│   ├── modals/
│   └── forms/
├── services/
│   ├── api/
│   └── auth/
└── styles/
    └── global.css
```

## Etapas generales del producto
1. Arquitectura y convenciones
2. Backend/API
3. Panel administrativo
4. Usuarios, roles y permisos
5. Streams y fuentes
6. VOD/series/EPG
7. Nodos y balanceo
8. Monitoreo y observabilidad
9. Seguridad
10. Licenciamiento
11. Actualizador/release manager
12. Instalador
13. Pruebas en Proxmox
14. Preparación para producción

Estas etapas son la hoja de ruta general del producto. El trabajo actual puede dividirse en subetapas numeradas para completar progresivamente los módulos del panel.

## Plan actual de 7 subetapas del panel
1. **Configuración** — estructura modular, secciones de configuración y persistencia inicial. **COMPLETADA.**
2. **Usuarios** — consolidar el módulo de usuarios, CRUD de demostración, filtros, validaciones, persistencia local temporal y preparación limpia para API/RBAC. **COMPLETADA Y VALIDADA.**
3. **Servidores / Nodos** — módulo independiente para alta, estado y gestión de nodos. **IMPLEMENTADA, CON CORRECCIÓN DE PERSISTENCIA/VALIDACIÓN EN CURSO.**
4. **Canales / Fuentes** — módulo independiente para canales y fuentes de streaming.
5. **VOD / Series / EPG / M3U** — separar y consolidar gestión de contenido y listas.
6. **Paquetes / Conexiones / Dispositivos** — gestión comercial y control de sesiones/dispositivos.
7. **Logs / Auditoría / Estadísticas** — observabilidad, métricas y cierre de integración visual del panel.

## Estado actual
- Repositorio: `ronbercito/ipztream`
- Rama principal: `main`
- Versión visible actual del panel: `0.1.0`
- Entorno de prueba: Debian 13 en contenedor.
- Node.js validado: `v22.23.2`.
- npm validado: `10.9.8`.
- IP de prueba actual: `192.168.10.220`.
- URL de prueba: `http://192.168.10.220`.
- Nginx publica el panel desde `/var/www/ipztream`.
- Código fuente del proyecto: `/opt/ipztream`.
- Build de producción validado antes de iniciar esta etapa.
- Instalador validado desde `/opt/ipztream` sin intentar copiar el proyecto sobre sí mismo.
- Dashboard y navegación principal funcionales.
- Usuarios funciona con módulo independiente en `src/modules/users/`.
- Usuarios validado: alta, recarga con persistencia, edición, búsqueda, detección de duplicados, validación de conexiones, eliminación y recarga final.
- Límite de conexiones validado por el usuario: máximo 99.
- Configuración está separada en `src/modules/settings/`.
- Configuración contiene General, Panel, Red/API, Seguridad, Almacenamiento, Logs y Actualizaciones.
- La configuración visual usa persistencia inicial en `localStorage`.
- El módulo de Nodos está creado en `src/modules/nodes/` y separado en componentes, servicio y estilos.
- **Incidencia detectada por el usuario:** Nodos actualmente guarda en `localStorage`, por lo que un cambio realizado en un navegador/perfil no aparece en otro navegador/cuenta.
- **Incidencia detectada por el usuario:** al intentar registrar una IP duplicada, el formulario no presenta claramente el error y la interfaz solamente parpadea/cierra el estado de forma poco visible.
- La persistencia compartida entre navegadores/cuentas requiere API/backend; `localStorage` solo sirve como persistencia temporal por navegador/perfil.
- La configuración real del servidor/backend, autenticación/RBAC, PostgreSQL, API, auditoría y updater real todavía no están conectados.
- El botón `Actualizar` del panel todavía es una interfaz de actualización; el updater real se implementará posteriormente mediante releases controlados y firmados.

## Respaldos importantes
- `backup/pre-etapa-1-13-configuracion`
- `backup/pre-etapa-2-13-usuarios`
- `backup/pre-correccion-configuracion-completa`
- `backup/pre-etapa-2-7-usuarios`
- `backup/pre-etapa-3-7-nodes`
- `backup/pre-correccion-nodos-persistencia`
- Se han utilizado copias previas de `src/main.jsx` antes de modificaciones estructurales.

## Referencia visual aprobada
La interfaz debe seguir el concepto mostrado por el usuario: sidebar azul oscuro, barra superior, búsqueda global, dashboard claro, tarjetas KPI, gráficos, panel de estado de nodos, tablas administrativas, filtros, estados mediante badges y acciones rápidas. La prioridad es que se sienta como un producto profesional y no como una plantilla genérica.

No generar nuevos mockups salvo solicitud explícita; utilizar la referencia visual ya aprobada y corregir iterativamente sobre ella.

## Estado de validación actual
### Validado
- Instalación en Debian 13.
- `npm install` sin vulnerabilidades reportadas.
- `npm run build` exitoso antes de la Etapa 3/7.
- Publicación mediante Nginx exitosa.
- Navegación general del panel.
- Usuarios: alta, edición, eliminación, búsqueda, persistencia después de recarga y validaciones probadas por el usuario.
- Límite máximo de 99 conexiones validado.
- Módulos del menú del 1 al 7: funcionamiento confirmado por el usuario.
- Configuración: el menú de opciones ya aparece correctamente tras la corrección y fue visualmente comprobado por el usuario.

### Etapa actual
**Etapa 3/7 — Servidores / Nodos: IMPLEMENTADA, CON CORRECCIÓN DE PERSISTENCIA Y UX DE VALIDACIÓN PENDIENTE.**

Se creó `src/modules/nodes/` con interfaz principal, filtros, formulario, tabla, servicio de persistencia local y estilos propios. La navegación existente integra el módulo sin convertirlo en parte del código de negocio de `main.jsx`; la carga se realiza de forma independiente.

### Corrección actual de Etapa 3/7
1. Sustituir la dependencia de `localStorage` como fuente principal de Nodos por una capa de API/backend compartida.
2. Mantener el servicio de Nodos separado para que el cambio a API real no afecte los componentes visuales.
3. Mostrar errores de validación dentro del formulario de forma persistente y visible, especialmente IP duplicada.
4. Evitar cierres/parpadeos del formulario cuando el guardado es rechazado.
5. Mantener una estrategia temporal de compatibilidad local únicamente mientras el backend compartido aún no esté disponible.
6. Validar dos navegadores/perfiles contra la misma instalación para confirmar que los cambios son compartidos.

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

## Próximo paso
Corregir la persistencia compartida y la validación visible de duplicados en **Etapa 3/7 — Servidores / Nodos**, y no avanzar a Etapa 4 hasta validar ambos comportamientos.
