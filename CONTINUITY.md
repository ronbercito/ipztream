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

## Plan actual de 7 subetapas del panel
1. **Configuración** — **COMPLETADA.**
2. **Usuarios** — **COMPLETADA Y VALIDADA.**
3. **Servidores / Nodos** — **COMPLETADA Y VALIDADA.**
4. **Canales / Fuentes** — **COMPLETADA Y VALIDADA.**
5. **VOD / Series / EPG / M3U** — **COMPLETADA Y VALIDADA.**
6. **Paquetes / Conexiones / Dispositivos** — **COMPLETADA Y VALIDADA.**
7. **Logs / Auditoría / Estadísticas** — **COMPLETADA Y VALIDADA.**

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
- Las siete subetapas del panel actual fueron implementadas y validadas por el usuario.
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
- `backup/pre-etapa-7-7-logs-auditoria-estadisticas`

## Referencia visual aprobada
La interfaz debe seguir el concepto aprobado por el usuario: sidebar azul oscuro, barra superior, búsqueda global, dashboard claro, tarjetas KPI, gráficos, panel de estado de nodos, tablas administrativas, filtros, badges y acciones rápidas. No generar nuevos mockups salvo solicitud explícita.

## Estado posterior a las 7 subetapas
El bloque inicial de construcción del panel administrativo quedó cerrado. Las siete etapas fueron implementadas y validadas en el contenedor Debian 13.

### Capacidades cerradas
- Configuración.
- Usuarios.
- Servidores / Nodos.
- Canales / Fuentes.
- VOD / Series / EPG / M3U.
- Paquetes / Conexiones / Dispositivos.
- Logs / Auditoría / Estadísticas.

### Pendientes de fases posteriores
- Backend integral con PostgreSQL.
- Autenticación robusta y RBAC completo.
- Auditoría centralizada real desde backend.
- Telemetría y health checks reales de streams/nodos.
- Motor real de sesiones y métricas de streaming.
- Licenciamiento.
- Sistema de releases/updater firmado para instalaciones de clientes.
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

## Próximo paso recomendado
Antes de agregar más funciones visuales al panel, definir la siguiente fase arquitectónica: **Backend real + PostgreSQL + autenticación/RBAC + auditoría centralizada**, preservando los módulos actuales como capa de presentación y administración.
