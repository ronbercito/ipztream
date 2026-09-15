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
**Estado técnico:** implementación inicial terminada; pendiente de instalación/build y validación funcional del usuario.

### Implementado
- `server/user-service.js`: servicio separado para clientes IPTV.
- Tabla `user_credentials` en MariaDB para mantener los hashes de contraseña fuera del payload del usuario.
- Contraseñas de cliente protegidas con el mismo esquema `scrypt` seguro utilizado por la autenticación administrativa.
- CRUD real de `/api/users` y `/api/users/:id` detrás del gateway autenticado.
- Validación de usuario, nombre, paquete, vencimiento, estado y máximo de conexiones.
- El máximo de conexiones se limita al máximo definido por el paquete.
- El estado se presenta como `Vencido` cuando la fecha ha expirado aunque el registro permanezca almacenado.
- La API nunca devuelve el hash de contraseña; solo informa `passwordConfigured`.
- Cambio de contraseña disponible al editar un cliente.
- Eliminación de cliente elimina sus credenciales y desasocia sus dispositivos existentes.
- RBAC ahora distingue `users.view`, `users.create`, `users.update` y `users.delete` también para rutas individuales.
- `src/modules/users/` dejó de depender de `localStorage` y consume la API real.
- El formulario de cliente permite seleccionar paquetes reales, vencimiento, conexiones y contraseña.
- El filtro de paquetes se genera a partir de los paquetes existentes.
- `database/schema.sql` documenta la nueva tabla de credenciales.

### Archivos principales afectados
- `server/user-service.js`
- `server/secure-entry.js`
- `server/auth.js`
- `database/schema.sql`
- `src/modules/users/Users.jsx`
- `src/modules/users/components/UserForm.jsx`
- `src/modules/users/components/UserFilters.jsx`
- `src/modules/users/services/usersApi.js`

### Pendiente de validación
1. Actualizar el servidor desde `main`.
2. Ejecutar instalación/build.
3. Confirmar que el servicio inicia y crea `user_credentials`.
4. Abrir Usuarios IPTV.
5. Crear un cliente con contraseña de 12+ caracteres.
6. Confirmar persistencia tras recargar el panel.
7. Editar paquete/vencimiento/estado/conexiones.
8. Cambiar contraseña y confirmar que no se muestra en la API.
9. Intentar usuario duplicado y comprobar rechazo.
10. Eliminar cliente y comprobar desasociación de dispositivos.
11. Confirmar que el panel administrativo sigue funcionando.

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
