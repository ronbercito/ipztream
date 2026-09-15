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

## Etapa 10 — Usuarios IPTV / Panel Cliente — EN PROGRESO

### Corrección 10.1 — Usuarios y paquetes
Se corrigieron resultados MariaDB, rutas `/api/users`, `user_credentials`, IDs de paquetes y comunicación del módulo Paquetes.

### Corrección 10.2 — Contraseña mínima de cliente IPTV
Se preparó la interfaz para aceptar contraseñas desde 1 carácter.

### Corrección 10.3 — Mostrar/ocultar contraseña
Se añadió el control `Eye/EyeOff` al campo de contraseña del cliente IPTV.

### Corrección 10.4 — Fecha futura mostrada como vencida y fallo al guardar
Se corrigió la normalización entre vencimiento y estado y se mejoró la propagación del error real de API.

### Corrección 10.5 — Separar política de contraseña y edición completa
**Motivo:** el usuario reportó que seguía apareciendo `La contraseña debe tener al menos 12 caracteres.` para clientes IPTV y que al editar una cuenta solo podía modificar el nombre.

**Causa:** `hashPassword()` en `server/auth.js` tenía una política global de 12 caracteres y era utilizada por credenciales IPTV. Además, `UserForm.jsx` deshabilitaba el campo `username` durante la edición.

**Cambios realizados:**
- `server/auth.js`: se conserva `hashPassword()` con mínimo de 12 caracteres para administradores y se añade `hashIptvPassword()` con mínimo de 1 carácter para clientes IPTV.
- `server/user-service.js`: creación y cambio de contraseña de clientes utilizan `hashIptvPassword()`.
- `server/user-service.js`: se mantiene la normalización de vencimiento/estado: fecha pasada = `Vencido`, fecha actual/futura = `Activo`, salvo `Suspendido`.
- `src/modules/users/components/UserForm.jsx`: el campo `Usuario` deja de estar bloqueado al editar; también se mantienen editables nombre, estado, paquete, conexiones, vencimiento y contraseña opcional.
- La contraseña IPTV continúa almacenándose como hash `scrypt`, nunca en texto plano.

**Archivos afectados:** `server/auth.js`, `server/user-service.js`, `src/modules/users/components/UserForm.jsx`.

**Resultado:** corrección publicada en `main`. Falta ejecutar build/reinicio y validar creación, cambio de contraseña de 1 carácter y edición completa de cuenta.

**Respaldo:** `backup/pre-etapa-10-usuarios-iptv`.

## Protocolo de cierre
1. Build correcto.
2. Servicio `ipztream-api` activo.
3. Persistencia MariaDB verificada.
4. CRUD de clientes funcional.
5. Credenciales seguras.
6. Paquete/vencimiento/estado/límite de conexiones validados.
7. Compatibilidad con módulos relacionados comprobada.
8. Usuario valida y entonces se registra **COMPLETADA Y VALIDADA**.
