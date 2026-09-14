# IPZTream — Continuidad del proyecto

## Propósito
IPZStream es una plataforma propia de gestión y distribución de streaming, inspirada en capacidades de paneles IPTV existentes, pero desarrollada con arquitectura, código e interfaz propios.

## Reglas de trabajo obligatorias
- Este repositorio es independiente de Z-Hub.
- GitHub se utilizará para desarrollo, pruebas, control de versiones y releases.
- Las instalaciones de clientes deberán recibir builds/releases controlados mediante un sistema propio de actualización; los clientes no deberán depender del repositorio fuente.
- Antes de cambios estructurales importantes se debe crear un respaldo o punto de restauración.
- Los cambios se implementan por etapas, probando cada etapa antes de continuar.
- No generar nuevos mockups salvo que el usuario los solicite explícitamente.
- **BITÁCORA PRIMERO:** toda mejora, corrección o cambio debe registrarse primero en `BITACORA.md`; después se modifica el código y se publica la actualización.
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

Ejemplo de estructura de un módulo:
```text
src/modules/users/
├── Users.jsx
├── components/
│   ├── UserTable.jsx
│   ├── UserForm.jsx
│   └── UserFilters.jsx
├── services/
│   └── usersApi.js
└── styles/
    └── users.css
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

Estas etapas son la hoja de ruta general del producto. El trabajo actual puede dividirse en subetapas numeradas, como la planificación 1/13 utilizada para completar progresivamente los módulos del panel.

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
- Build de producción validado con Vite.
- Instalador validado desde `/opt/ipztream` sin intentar copiar el proyecto sobre sí mismo.
- Dashboard y navegación principal funcionales.
- Las pantallas probadas por el usuario del 1 al 7 funcionan correctamente.
- Usuarios funciona con módulo independiente en `src/modules/users/`.
- Configuración fue separada en `src/modules/settings/` para evitar volver a concentrarla en `src/main.jsx`.
- Configuración incluye General, Panel, Red/API, Seguridad, Almacenamiento, Logs y Actualizaciones, con persistencia inicial en `localStorage`.
- La configuración real del servidor/backend, autenticación/RBAC, PostgreSQL, API, auditoría y updater real todavía no están conectados.
- El botón `Actualizar` del panel todavía es una interfaz de actualización; el updater real se implementará posteriormente mediante releases controlados y firmados.

## Respaldos importantes
- `backup/pre-etapa-1-13-configuracion`
- `backup/pre-etapa-2-13-usuarios`
- `backup/pre-correccion-configuracion-completa`
- Se han utilizado copias previas de `src/main.jsx` antes de modificaciones estructurales.

## Referencia visual aprobada
La interfaz debe seguir el concepto mostrado por el usuario: sidebar azul oscuro, barra superior, búsqueda global, dashboard claro, tarjetas KPI, gráficos, panel de estado de nodos, tablas administrativas, filtros, estados mediante badges y acciones rápidas. La prioridad es que se sienta como un producto profesional y no como una plantilla genérica.

No generar nuevos mockups salvo solicitud explícita; utilizar la referencia visual ya aprobada y corregir iterativamente sobre ella.

## Estado de validación actual
### Validado
- Instalación en Debian 13.
- `npm install` sin vulnerabilidades reportadas.
- `npm run build` exitoso.
- Publicación mediante Nginx exitosa.
- Navegación general del panel.
- Usuarios: funciones principales probadas por el usuario.
- Módulos del menú del 1 al 7: funcionamiento confirmado por el usuario.

### Pendiente inmediato
- Ejecutar `git pull` en el contenedor para obtener la restauración completa de Configuración.
- Ejecutar `npm run build`.
- Ejecutar `bash install.sh`.
- Validar visual y funcionalmente las siete secciones de Configuración.
- Registrar el resultado final en `BITACORA.md`.
- Solo después de cerrar esta validación continuar con la siguiente subetapa.

## Protocolo de cambios
1. Registrar primero la mejora/corrección en `BITACORA.md`.
2. Crear respaldo cuando el cambio sea estructural.
3. Implementar el cambio.
4. Ejecutar build/verificación.
5. Probar en el contenedor cuando corresponda.
6. Registrar el resultado en la bitácora.
7. Publicar la actualización.
8. Informar al usuario qué se cambió y cómo probarlo.

## Próximo paso
Cerrar la validación de la Corrección 4 de Configuración en el contenedor. Después de confirmar que las siete secciones funcionan, continuar con la siguiente subetapa del plan 1/13, manteniendo la arquitectura modular y sin alterar las funcionalidades ya validadas.