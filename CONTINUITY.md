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

## Plan actual de 7 subetapas del panel
1. **Configuración** — estructura modular, secciones de configuración y persistencia inicial. **COMPLETADA.**
2. **Usuarios** — consolidar el módulo de usuarios, CRUD de demostración, filtros, validaciones, persistencia local temporal y preparación limpia para API/RBAC. **COMPLETADA Y VALIDADA.**
3. **Servidores / Nodos** — módulo independiente para alta, estado y gestión de nodos. **COMPLETADA Y VALIDADA.**
4. **Canales / Fuentes** — módulo independiente para administrar canales, fuentes de streaming, estado y parámetros de reproducción. **EN CURSO.**
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
- Usuarios funciona con módulo independiente en `src/modules/users/` y fue validado por el usuario.
- Configuración está separada en `src/modules/settings/` y fue validada visualmente.
- Nodos está separado en `src/modules/nodes/` con API compartida mínima, persistencia en `data/nodes.json`, proxy Nginx y servicio systemd `ipztream-api`.
- Nodos fue validado por el usuario: alta, persistencia compartida entre navegadores, rechazo de IP duplicada, mensaje visible, formulario abierto y corrección posterior de IP.
- `localStorage` de Nodos queda como compatibilidad/fallback temporal, no como fuente compartida principal.
- El backend real completo con PostgreSQL, autenticación/RBAC y API integral todavía no está conectado.
- El botón `Actualizar` del panel todavía es una interfaz de actualización; el updater real se implementará posteriormente mediante releases controlados y firmados.

## Respaldos importantes
- `backup/pre-etapa-1-13-configuracion`
- `backup/pre-etapa-2-13-usuarios`
- `backup/pre-correccion-configuracion-completa`
- `backup/pre-etapa-2-7-usuarios`
- `backup/pre-etapa-3-7-nodes`
- `backup/pre-correccion-nodos-persistencia`
- `backup/pre-etapa-4-7-channels`
- Se han utilizado copias previas de `src/main.jsx` antes de modificaciones estructurales.

## Referencia visual aprobada
La interfaz debe seguir el concepto mostrado por el usuario: sidebar azul oscuro, barra superior, búsqueda global, dashboard claro, tarjetas KPI, gráficos, panel de estado de nodos, tablas administrativas, filtros, estados mediante badges y acciones rápidas. La prioridad es que se sienta como un producto profesional y no como una plantilla genérica.

No generar nuevos mockups salvo solicitud explícita; utilizar la referencia visual ya aprobada y corregir iterativamente sobre ella.

## Estado de validación actual
### Validado
- Instalación en Debian 13.
- `npm install` sin vulnerabilidades reportadas.
- `npm run build` exitoso antes de iniciar esta etapa.
- Publicación mediante Nginx exitosa.
- Navegación general del panel.
- Usuarios: alta, edición, eliminación, búsqueda, persistencia después de recarga y validaciones probadas por el usuario.
- Configuración: menú de opciones completo visible y validado por el usuario.
- Nodos: alta, aparición del nodo, sincronización entre navegadores/perfiles, rechazo de duplicados, mensaje visible, formulario sin parpadeo/cierre y modificación posterior de IP; todo validado por el usuario.
- API de Canales: `GET /api/channels` responde correctamente y devuelve los canales iniciales ESPN, HBO Max y TUDN.

### Etapa actual
**Etapa 4/7 — Canales / Fuentes: EN CURSO — CORRECCIÓN DE DESPLIEGUE.**

Durante la validación el usuario confirmó que los canales iniciales aparecen, pero las acciones de edición/gestión no funcionan en la interfaz. La revisión del código del repositorio muestra que `Channels.jsx` y `ChannelTable.jsx` sí contienen las acciones de nuevo, editar, activar/desactivar y eliminar. La API también responde correctamente. Por tanto, antes de modificar la lógica del módulo se debe sincronizar el build del frontend instalado en Nginx con el código de `main`, ya que el build que se ejecutó ocurrió antes de completar la sincronización del repositorio con la implementación de Canales.

Objetivo de la corrección:
- Actualizar el checkout local al `main` que contiene la implementación completa de Canales.
- Ejecutar un nuevo `npm install`/`npm run build` cuando corresponda.
- Publicar el nuevo `dist` en `/var/www/ipztream`.
- Mantener `data/` y la persistencia de canales intactas.
- Reiniciar/verificar `ipztream-api` solamente si es necesario.
- Verificar que la interfaz muestre y permita las acciones CRUD y de estado implementadas.

No se debe marcar Etapa 4/7 como validada hasta que el usuario confirme las pruebas funcionales del panel.

## Etapa 4/7 — alcance funcional pendiente de validación
- Listado de canales.
- Alta y edición de canales.
- Activar/desactivar canal.
- Búsqueda y filtros.
- Identidad del canal: nombre, número, logo y grupo/categoría.
- Gestión de una o varias fuentes por canal.
- URL de fuente y tipo/protocolo.
- Estado de fuente y canal.
- Prioridad de fuentes para definir cuál se intenta primero.
- Validaciones de datos y mensajes visibles.
- Persistencia compartida mediante API.
- Preparación para conectar posteriormente fuentes reales, health checks, failover y agentes/nodos.

No se implementará todavía un reproductor completo, transcodificación, health check real contra cada stream ni PostgreSQL/RBAC. Esas capacidades se conectarán en etapas posteriores sobre el servicio/API ya separado.

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
Sin modificar todavía la lógica de Canales, sincronizar el build publicado con el `main` actual y repetir la validación funcional. Si después de publicar el build actualizado las acciones siguen sin responder, se hará una corrección específica del módulo siguiendo nuevamente este protocolo.
