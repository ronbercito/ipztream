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

## Arquitectura modular objetivo
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

## Plan actual de 7 subetapas del panel
1. **Configuración** — **COMPLETADA.**
2. **Usuarios** — **COMPLETADA Y VALIDADA.**
3. **Servidores / Nodos** — **COMPLETADA Y VALIDADA.**
4. **Canales / Fuentes** — **COMPLETADA Y VALIDADA.**
5. **VOD / Series / EPG / M3U** — **COMPLETADA Y VALIDADA.**
6. **Paquetes / Conexiones / Dispositivos** — **IMPLEMENTADA, PENDIENTE DE VALIDACIÓN.**
7. **Logs / Auditoría / Estadísticas** — pendiente.

## Estado actual
- Repositorio: `ronbercito/ipztream`
- Rama principal: `main`
- Versión visible actual del panel: `0.1.0`
- Entorno de prueba: Debian 13 en contenedor.
- Node.js validado: `v22.23.2`.
- npm validado: `10.9.8`.
- IP de prueba: `192.168.10.220`.
- URL de prueba: `http://192.168.10.220`.
- Nginx publica el panel desde `/var/www/ipztream`.
- Código fuente: `/opt/ipztream`.
- Servicio API: `ipztream-api`.
- Dashboard y navegación principal funcionales.
- Usuarios, Configuración, Nodos, Canales, VOD, Series, EPG y M3U ya fueron validados por el usuario.
- El backend completo con PostgreSQL, autenticación/RBAC y API integral todavía no está conectado.
- El updater real todavía será implementado posteriormente mediante releases controlados y firmados.

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

## Referencia visual aprobada
La interfaz debe seguir el concepto aprobado por el usuario: sidebar azul oscuro, barra superior, búsqueda global, dashboard claro, tarjetas KPI, gráficos, panel de estado de nodos, tablas administrativas, filtros, badges y acciones rápidas. No generar nuevos mockups salvo solicitud explícita.

## Etapa actual — 6/7
**Paquetes / Conexiones / Dispositivos: IMPLEMENTADA, PENDIENTE DE VALIDACIÓN FUNCIONAL.**

### Paquetes
Módulo: `src/modules/packages/`
- `Packages.jsx`
- `services/packagesApi.js`
- `styles/packages.css`
- CRUD mediante `/api/packages`.
- Validación de nombre duplicado, precio, duración y máximo de 99 conexiones.

### Conexiones
Módulo: `src/modules/connections/`
- `Connections.jsx`
- `services/connectionsApi.js`
- `styles/connections.css`
- Consulta mediante `/api/connections`.
- Cierre administrativo mediante `POST /api/connections/:id/close`.

### Dispositivos
Módulo: `src/modules/devices/`
- `Devices.jsx`
- `services/devicesApi.js`
- `styles/devices.css`
- Consulta mediante `/api/devices`.
- Desvinculación mediante `POST /api/devices/:id/unlink`.

### Backend de Etapa 6
`server/index.js` ahora mantiene `data/packages.json`, `data/connections.json` y `data/devices.json` mediante la misma persistencia JSON compartida usada en etapas anteriores.

### Integración
`src/main.jsx` importa y muestra `PackagesPage`, `ConnectionsPage` y `DevicesPage`. La lógica de negocio permanece dentro de cada módulo/servicio y no se concentra en `main.jsx`.

### Límites
- Conexiones y dispositivos son inicialmente datos administrativos/de demostración; no representan todavía sesiones reales de streaming.
- No hay facturación/pagos.
- No hay RBAC completo.
- PostgreSQL queda para la integración de backend posterior.

### Verificación pendiente
Ejecutar en el contenedor Debian 13:
1. `git pull` o sincronización con `origin/main`.
2. `npm install`.
3. `npm run build`.
4. Reiniciar `ipztream-api`.
5. Publicar el `dist` en `/var/www/ipztream`.
6. Probar Paquetes.
7. Probar Conexiones.
8. Probar Dispositivos.
9. Confirmar persistencia después de recargar.
10. Confirmar que los datos se comparten por API y no dependen de `localStorage`.

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
Validación funcional de Etapa 6/7 por el usuario. No cerrar la etapa hasta confirmar Paquetes, Conexiones y Dispositivos.
