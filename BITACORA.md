# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–7 — Panel modular

### Etapa 1 — Configuración — COMPLETADA Y VALIDADA
Se creó `src/modules/settings/` con las secciones principales de configuración y persistencia inicial.

### Etapa 2 — Usuarios — COMPLETADA Y VALIDADA
Se creó `src/modules/users/` con filtros, CRUD, validaciones, paquetes, conexiones y persistencia inicial.

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
Se implementaron autenticación administrativa, sesiones, roles y permisos.

### Corrección 9.1.2 — `admin_sessions.token_hash`
Se corrigió el hash de sesión para usar SHA-256 hexadecimal de 64 caracteres.

## Etapa 10 — Usuarios IPTV / Panel Cliente — COMPLETADA Y VALIDADA
Se implementó el modelo real de clientes IPTV con credenciales separadas, paquetes, vencimiento, estado, conexiones y edición completa. El usuario confirmó que funciona correctamente.

## Etapa 11 — API de clientes + sesiones de aplicación — COMPLETADA Y VALIDADA
Se implementó login IPTV, sesiones en MariaDB, `/api/client/me`, logout, expiración y separación de sesiones administrativas. Las pruebas reales confirmaron login 200, `/me` 200, logout 200 y `/me` posterior 401.

## Etapa 12 — Motor de streaming real + integración de fuentes — EN IMPLEMENTACIÓN

### Objetivo
Iniciar el primer motor de streaming real de IPZStream. No se utilizarán simulaciones: una fuente real configurada en un canal deberá poder ser procesada por FFmpeg y convertirse en una salida HLS reproducible.

### Alcance previsto
- Integrar FFmpeg como dependencia del servidor.
- Crear un servicio independiente para administrar procesos FFmpeg.
- Iniciar, detener y reiniciar streams por canal.
- Generar HLS (`index.m3u8` + segmentos) por canal.
- Consultar estado real del proceso.
- Detectar errores y terminación del proceso.
- Evitar procesos duplicados por canal.
- Registrar acciones en `audit_logs`.
- Proteger el API de control mediante autenticación/RBAC.
- Validar las fuentes y construir argumentos de FFmpeg sin shell injection.
- Mantener el diseño preparado para futuros nodos de streaming.

### Archivos/componentes previstos
- Servicio nuevo de streaming en `server/`.
- Rutas API de control integradas de forma modular.
- Configuración de salida HLS.
- Ajustes del instalador para disponer de FFmpeg.
- Ajustes de Nginx para servir exclusivamente la salida HLS de IPZStream.
- Documentación de Etapa 12 y pruebas.

### Resultado esperado
Un canal real podrá iniciar un proceso FFmpeg, generar una salida HLS verificable y reportar estado/error real. El objetivo de esta etapa es establecer la primera cadena de streaming real del proyecto, sin crear un reproductor simulado.

### Seguridad
FFmpeg será ejecutado como proceso hijo con argumentos controlados por IPZStream. No se ejecutarán comandos arbitrarios enviados por el cliente. Los identificadores de canal y rutas de salida se tratarán como datos controlados.

### Respaldo
Se creará `backup/pre-etapa-12-streaming-real` antes de los cambios estructurales de código.

**Estado:** intención registrada; implementación pendiente.
