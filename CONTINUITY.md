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

## Estado de las etapas
1. Configuración — **COMPLETADA Y VALIDADA**.
2. Usuarios — **COMPLETADA Y VALIDADA**.
3. Servidores / Nodos — **COMPLETADA Y VALIDADA**.
4. Canales / Fuentes — **COMPLETADA Y VALIDADA**.
5. VOD / Series / EPG / M3U — **COMPLETADA Y VALIDADA**.
6. Paquetes / Conexiones / Dispositivos — **COMPLETADA Y VALIDADA**.
7. Logs / Auditoría / Estadísticas — **COMPLETADA Y VALIDADA**.
8. Backend real + MariaDB — **COMPLETADA Y VALIDADA**.
9. Autenticación real + RBAC — **COMPLETADA Y VALIDADA**.
10. Usuarios IPTV / Panel Cliente — **IMPLEMENTADA, PENDIENTE DE VALIDACIÓN**.

## Estado actual
- Repositorio: `ronbercito/ipztream`
- Rama: `main`
- Versión visible: `0.1.0`.
- Debian 13 / Node.js 22 / npm 10 en el entorno de prueba.
- IP de prueba: `192.168.10.220`.
- Nginx publica `/var/www/ipztream`.
- Código fuente: `/opt/ipztream`.
- Servicio: `ipztream-api`.
- MariaDB es la base principal y permanente.
- Etapas 1–9 están validadas por el usuario.

## Etapa 10 — Usuarios IPTV / Panel Cliente
**Estado técnico:** implementación inicial terminada; pendiente de validación funcional. Se detectó una corrección necesaria durante la primera prueba del usuario.

### Corrección 10.1 — Usuarios y paquetes
**Problemas reportados:** al abrir Usuarios aparece `result.map is not a function`; además, al crear un cliente se exige un paquete, pero el módulo Paquetes no permite completar la creación.

**Causa identificada:** `server/user-service.js` utiliza el contrato `{ rows, rowCount }` de `pool.query()` pero `getPackages()` intentaba ejecutar `.map()` directamente sobre el objeto de respuesta. Además, el servicio de usuarios no quedó conectado de forma completa al enrutador interno de `/api/users`, por lo que el CRUD real no estaba disponible de extremo a extremo.

**Objetivo de la corrección:** normalizar el acceso a resultados MariaDB, registrar/asegurar `user_credentials` al iniciar la API, conectar correctamente las rutas CRUD de clientes al servicio de usuarios y revisar la comunicación del módulo Paquetes para que pueda crear/editar/eliminar paquetes desde el panel autenticado.

**Resultado esperado:** Usuarios carga sin excepción, los paquetes se consultan correctamente, un paquete puede crearse y luego seleccionarse al crear un cliente, y el CRUD de clientes persiste en MariaDB sin contraseñas en texto plano.

**Archivos previstos:** `server/user-service.js`, `server/index.js`, `server/secure-entry.js` si fuera necesario, `src/modules/packages/services/packagesApi.js` si fuera necesario, y documentación de etapa.

**Respaldo existente:** `backup/pre-etapa-10-usuarios-iptv`.

### Corrección 10.2 — Contraseña de cliente IPTV
**Motivo:** al crear o editar un usuario IPTV, la validación actual exige una contraseña de 10–12 caracteres. El usuario solicita que la contraseña tenga únicamente un mínimo de 1 carácter.

**Objetivo:** cambiar la validación de credenciales del cliente IPTV para aceptar contraseñas desde 1 carácter, tanto en la interfaz como en el backend, sin alterar el almacenamiento seguro mediante hash.

**Archivos previstos:** `server/user-service.js`, `src/modules/users/components/UserForm.jsx` y cualquier servicio/API de usuarios que contenga la validación equivalente.

**Resultado esperado:** una contraseña de 1 carácter sea aceptada al crear/editar un cliente IPTV y continúe almacenándose como hash, sin contraseña en texto plano.

**Respaldo existente:** `backup/pre-etapa-10-usuarios-iptv`.

### Pendiente de validación
- Build.
- Reinicio del servicio.
- Creación de paquete.
- Carga de Usuarios.
- Creación de cliente asociado a paquete.
- Creación/edición de cliente con contraseña de 1 carácter.
- Persistencia y edición.

**No se marca la Etapa 10 como completada hasta la validación del usuario.**

## Próxima fase
Después de cerrar Etapa 10, Etapa 11 será la API/autenticación de clientes y sesiones de aplicación.

## Respaldos
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
- `backup/pre-etapa-8-backend-postgres`
- `backup/pre-correccion-etapa-8-mariadb`
- `backup/pre-correccion-schema-mariadb-multistatements`
- `backup/pre-etapa-9-auth-rbac`
- `backup/pre-correccion-etapa-9-session-token-hash`
- `backup/pre-etapa-10-usuarios-iptv`

## Protocolo obligatorio
1. Actualizar primero `CONTINUITY.md`.
2. Registrar la intención/corrección en `BITACORA.md`.
3. Crear respaldo cuando el cambio sea estructural.
4. Implementar.
5. Ejecutar build/verificación.
6. Probar en el contenedor.
7. Registrar resultado.
8. Publicar.
9. Informar al usuario qué cambió y cómo probarlo.
