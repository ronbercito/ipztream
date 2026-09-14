# Bitácora de IPZStream

## 2026-09-14 — Etapa 1 — Base visual + instalador inicial

**Motivo:** iniciar la plataforma tomando como referencia visual aprobada el dashboard mostrado por el usuario.

**Objetivo:**
- Crear la primera base navegable del panel IPZStream.
- Reproducir el lenguaje visual: sidebar oscuro, barra superior, tarjetas KPI, gráficos, nodos, conexiones y tablas administrativas.
- Preparar una base responsive para futuras pantallas.
- Crear un instalador inicial para desplegar la base en un único contenedor Linux.

**Resultado:** base visual inicial implementada en el repositorio y probada en un contenedor Debian 13. El dashboard funciona con datos demostrativos.

---

## 2026-09-14 — Corrección 1 — Instalador ejecutado desde `/opt/ipztream`

**Motivo:** durante la primera prueba real, `install.sh` intentó copiar `/opt/ipztream` sobre sí mismo.

**Corrección:** el instalador detecta cuando origen y destino son el mismo directorio y omite la copia; conserva la copia cuando el origen es externo.

**Resultado:** corrección publicada y repositorio recuperado correctamente en el contenedor.

---

## 2026-09-14 — Mejora 1 — Botón de actualización del panel

**Motivo:** agregar al panel un botón de actualización similar al flujo visual usado en Z-Hub.

**Resultado:** botón `Actualizar` agregado a la barra superior. En esta etapa refresca la vista; posteriormente se conectará al updater real mediante releases controlados y firmados.

---

## 2026-09-14 — Etapa 2 — Habilitación integral del panel y navegación de módulos

**Motivo:** el usuario solicitó habilitar el panel completo para poder avanzar con una primera versión funcional y posteriormente corregir, agregar y mejorar sobre una base ya navegable.

**Objetivo:**
- Convertir el menú lateral en navegación funcional.
- Habilitar las pantallas principales: Dashboard, Usuarios, Servidores/Nodos, Canales, VOD/Series, EPG, Listas M3U, Paquetes/Perfiles, Conexiones Activas, Dispositivos, Logs/Auditoría, Estadísticas y Configuración.
- Incorporar búsqueda, filtros, tablas, estados, acciones y formularios básicos donde corresponda.
- Mantener una única identidad visual y comportamiento responsive.
- Preparar la estructura para sustituir los datos demostrativos por API y PostgreSQL sin rehacer la interfaz.
- Mantener el botón de actualización del panel.

**Alcance de esta etapa:** interfaz funcional con datos locales demostrativos. No se simula como si existiera todavía un backend real, autenticación real, PostgreSQL o control de streams en producción. Esas piezas serán conectadas en las siguientes etapas.

**Respaldo:** se creó `src/main.jsx.bak` antes de la modificación estructural.

**Archivos principales:**
- `src/main.jsx` — navegación, módulos, tablas, filtros, formularios y acciones de interfaz.
- `src/styles.css` — estilos compartidos para navegación, módulos, tablas, formularios, modales y responsive.

**Resultado esperado:** panel completo navegable, con todas las secciones visibles y operativas a nivel de interfaz, listo para comenzar la conexión con backend/API.

---

## 2026-09-14 — Corrección 2 — Formulario rápido de creación

**Motivo:** durante la revisión estática de la primera implementación de la Etapa 2 se detectó que el formulario modal de creación abría correctamente, pero el guardado todavía dependía de un `prompt()` adicional.

**Corrección prevista:** hacer que el botón `Guardar` utilice directamente el valor introducido en el modal y agregue el registro a la tabla sin solicitar un segundo dato.

**Regla:** esta corrección queda registrada antes de modificar el código.

---

## 2026-09-14 — Etapa 1/13 — Configuración del sistema

**Motivo:** comenzar el orden de trabajo acordado por el usuario, desarrollando primero el módulo `Configuración` antes de continuar con Usuarios, Paquetes/Perfiles y el resto de módulos.

**Objetivo:** convertir Configuración en el centro de parámetros de IPZStream, dejando una base clara para conectar posteriormente estos valores con el backend y la base de datos.

**Alcance:**
- Identidad de la plataforma.
- Zona horaria.
- Preferencias generales del panel.
- Parámetros de interfaz y comportamiento.
- Preparación de secciones para seguridad, red, almacenamiento, logs y actualizaciones.
- Mantener separación entre configuración visual actual y configuración real del servidor, que se conectará posteriormente al backend.

**Respaldo:** se creó la rama `backup/pre-etapa-1-13-configuracion` apuntando al estado de `main` antes de esta etapa.

**Implementación:**
- `src/main.jsx` ahora contiene una pantalla de Configuración con pestañas: General, Panel, Red/API, Seguridad, Almacenamiento, Logs y Actualizaciones.
- Se añadieron controles editables para identidad, idioma, zona horaria, formato de fecha, preferencias del panel, sesión, red y almacenamiento.
- Los cambios de configuración visual se guardan localmente en `localStorage` para conservarlos entre recargas.
- Se añadieron indicadores y textos de preparación para las futuras conexiones con backend, RBAC, API, logs y updater real.
- `index.html` incorpora los estilos específicos de Configuración sin depender de una hoja externa no procesada por Vite.
- Se eliminó la hoja `src/settings.css` redundante después de integrar esos estilos correctamente.

**Verificación:** se revisaron los archivos publicados en `main` después de la implementación. La estructura React mantiene la navegación existente y la nueva pantalla de Configuración queda preparada para ser reemplazada por persistencia real cuando exista el backend.

**Nota:** todavía no se conectan estos valores al servidor ni a PostgreSQL; eso corresponde a las siguientes etapas de integración.

---

## 2026-09-14 — Arquitectura permanente — Módulos independientes por menú y opción

**Motivo:** evitar que futuras modificaciones de una sección afecten accidentalmente a otras partes de IPZStream.

**Regla arquitectónica:** cuando sea necesario, cada menú principal tendrá su propia carpeta y las opciones importantes se separarán en subcarpetas y archivos correspondientes.

**Criterios:**
- Cada menú funciona como módulo independiente.
- Componentes de una sección se mantienen dentro de su módulo cuando no son reutilizables.
- Servicios/API de cada módulo se separan de la interfaz.
- Estilos específicos pueden permanecer dentro del módulo.
- Los componentes realmente compartidos se mantienen en `src/components/`.
- La lógica global de aplicación permanece fuera de los módulos.
- Se evita concentrar nuevas funcionalidades en `src/main.jsx`.

**Estructura objetivo:**
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

**Regla:** esta arquitectura se aplicará progresivamente sin romper las funcionalidades ya existentes.

---

## 2026-09-14 — Etapa 2/13 — Usuarios

**Motivo:** iniciar el módulo de Usuarios después de Configuración, aplicando la arquitectura modular independiente acordada.

**Objetivo:** construir la gestión de usuarios como módulo separado, preparado para crecer y posteriormente conectarse con API, PostgreSQL, autenticación y RBAC.

**Alcance inicial:**
- Listado de usuarios.
- Búsqueda y filtros.
- Estado del usuario.
- Paquete/perfil.
- Conexiones permitidas y activas.
- Vencimiento.
- Alta y edición desde formularios del módulo.
- Acciones por usuario.
- Base para futuras funciones de permisos, suspensión y auditoría.

**Respaldo:** se creó la rama `backup/pre-etapa-2-13-usuarios` antes de iniciar los cambios estructurales.

**Regla:** esta entrada queda registrada antes de modificar el código.

---

## Protocolo permanente
Toda mejora o corrección futura debe seguir este orden:
1. Registrar la intención/cambio en esta bitácora.
2. Crear respaldo cuando el cambio sea estructural.
3. Implementar el código.
4. Verificar el resultado.
5. Registrar el resultado de la implementación.
6. Publicar la actualización.
7. Informar al usuario qué cambió y cómo probarlo.
