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
10. Usuarios IPTV / Panel Cliente — **EN PROGRESO**.

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
**Objetivo:** convertir la gestión de usuarios IPTV en una base real para cuentas de clientes y para la futura aplicación cliente, sin confundirlas con las cuentas administrativas `admin_users`.

### Alcance inicial
- Mantener `admin_users` exclusivamente para administración/RBAC.
- Evolucionar `users` para clientes IPTV.
- Definir identidad de cliente, credenciales, estado, paquete, vencimiento y límite de conexiones.
- Preparar dispositivos y sesiones de cliente para las siguientes etapas.
- Mantener API/servicios separados de la UI.
- Conservar compatibilidad con módulos existentes de paquetes, conexiones y dispositivos siempre que sea posible.
- No implementar todavía el motor de streaming real; esta etapa prepara su autorización y consumo futuro.

### Diseño previsto
El cliente IPTV deberá poder quedar asociado a:
- cuenta/usuario
- contraseña almacenada de forma segura
- estado
- paquete
- fecha de vencimiento
- límite de conexiones
- dispositivos autorizados
- sesiones activas

La futura autenticación de clientes será independiente de la sesión administrativa y se utilizará posteriormente por la aplicación/portal del cliente.

### Criterios de cierre de la Etapa 10
- CRUD y validaciones de clientes funcionales.
- Persistencia en MariaDB.
- Credenciales no almacenadas en texto plano.
- Paquete y vencimiento gestionables.
- Límite de conexiones validado.
- Estado de cuenta validado.
- Compatibilidad con módulos relacionados comprobada.
- Build y API funcionales.
- Usuario valida las pruebas antes de marcar la etapa como completada.

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
