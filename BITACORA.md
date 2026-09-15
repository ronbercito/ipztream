# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–7 — Panel modular

### Etapa 1 — Configuración — COMPLETADA Y VALIDADA
Se creó `src/modules/settings/` con las secciones principales de configuración y persistencia inicial.

**Respaldo:** `backup/pre-etapa-1-13-configuracion`.

### Etapa 2 — Usuarios — COMPLETADA Y VALIDADA
Se creó `src/modules/users/` con filtros, CRUD, validaciones, paquetes, conexiones y persistencia inicial.

**Respaldos:** `backup/pre-etapa-2-13-usuarios`, `backup/pre-etapa-2-7-usuarios`.

### Etapa 3 — Servidores / Nodos — COMPLETADA Y VALIDADA
Se creó `src/modules/nodes/` con API y persistencia.

### Etapa 4 — Canales / Fuentes — COMPLETADA Y VALIDADA
Se creó `src/modules/channels/` con CRUD, filtros, fuentes y persistencia API.

### Etapa 5 — VOD / Series / EPG / M3U — COMPLETADA Y VALIDADA
Se implementaron módulos independientes y APIs para VOD, Series, EPG y M3U.

### Etapa 6 — Paquetes / Conexiones / Dispositivos — COMPLETADA Y VALIDADA
Se implementaron módulos, servicios y persistencia.

### Etapa 7 — Logs / Auditoría / Estadísticas — COMPLETADA Y VALIDADA
Se implementaron Logs/Auditoría y Estadísticas.

## Etapa 8 — Backend real + MariaDB — COMPLETADA Y VALIDADA
MariaDB quedó como base principal y permanente.

### Corrección 8.2 — DDL MariaDB multi-sentencia
Se corrigió `server/db.js` para ejecutar cada sentencia DDL por separado.

## Etapa 9 — Autenticación real + RBAC — COMPLETADA Y VALIDADA
Se implementaron autenticación administrativa, sesiones, roles, permisos y protección de API.

### Corrección 9.1.2 — `admin_sessions.token_hash`
Se corrigió el hash de sesión para usar SHA-256 hexadecimal de 64 caracteres.

## Etapa 10 — Usuarios IPTV / Panel Cliente — COMPLETADA Y VALIDADA
El usuario confirmó que la etapa funciona correctamente.

### Correcciones 10.1–10.5
- Se corrigió la integración de Usuarios/Paquetes con MariaDB y las rutas `/api/users`.
- Se ajustó la contraseña IPTV a mínimo 1 carácter sin afectar la política administrativa.
- Se añadió mostrar/ocultar contraseña.
- Se corrigió la sincronización entre vencimiento y estado.
- Se separó `hashPassword()` administrativo de `hashIptvPassword()` y se habilitó la edición completa de la cuenta IPTV.

**Validación final:** CRUD, paquetes, edición completa, vencimiento/estado, contraseña IPTV, persistencia y controles del formulario confirmados por el usuario.

**Respaldo:** `backup/pre-etapa-10-usuarios-iptv`.

## Etapa 11 — API de clientes + sesiones de aplicación — INICIO

**Motivo:** con el panel administrativo y el modelo de clientes IPTV ya validados, el siguiente paso es permitir que una aplicación externa se autentique como cliente IPTV y mantenga una sesión propia. Esta capa será la base para dispositivos, autorización de reproducción y conexiones reales.

**Objetivo:** implementar autenticación de clientes IPTV independiente de la autenticación administrativa, con sesiones persistidas y revocables, identidad del cliente, validación de estado/vencimiento y auditoría.

**Alcance previsto:**
- Login de cliente IPTV.
- Sesión segura persistida en MariaDB.
- Token de sesión almacenado mediante hash.
- Expiración y logout.
- `/api/client/me` para identidad de cliente.
- Validación de `Activo`, `Vencido` y `Suspendido` en backend.
- Separación de sesiones admin/cliente.
- Auditoría de login/logout.
- Base API para futuras aplicaciones web, móvil y TV.

**Fuera de esta etapa:** reproducción real, HLS, motor de streaming, tokens de reproducción y aplicación final.

**Archivos esperados:** nuevos servicios/rutas de autenticación cliente, esquema MariaDB para sesiones IPTV, integración con `server/secure-entry.js` y documentación. Se mantendrá la arquitectura modular y se evitará concentrar lógica nueva en `main.jsx`.

**Respaldo:** `backup/pre-etapa-11-api-clientes-sesiones`.

## Protocolo de cierre
1. Build correcto.
2. Servicio `ipztream-api` activo.
3. Persistencia MariaDB verificada.
4. CRUD de clientes funcional.
5. Credenciales seguras.
6. Paquete/vencimiento/estado/límite de conexiones validados.
7. Compatibilidad con módulos relacionados comprobada.
8. Usuario valida y entonces se registra la etapa correspondiente como **COMPLETADA Y VALIDADA**.
