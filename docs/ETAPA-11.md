# Etapa 11 — API de clientes + sesiones

## Objetivo
Preparar la autenticación de clientes IPTV para una futura aplicación de reproducción.

## Endpoints
- `POST /api/client/login`
- `GET /api/client/me`
- `POST /api/client/logout`

## Seguridad
- Las contraseñas se verifican contra el hash `scrypt` existente.
- Los tokens de sesión se generan aleatoriamente y solo su SHA-256 se almacena en MariaDB.
- La sesión usa cookie HttpOnly/SameSite y también acepta Bearer token para clientes que no utilicen cookies.
- Las sesiones expiran.
- Usuarios vencidos o suspendidos no pueden iniciar ni mantener una sesión.
- Las sesiones IPTV son independientes de `admin_sessions`.
- La información del cliente se obtiene desde el JSON `users.payload`, que es el modelo real de MariaDB de IPZStream.
- `client_sessions` tiene relación con `users` y se elimina automáticamente si el cliente es eliminado.

## Integración
El gateway `server/secure-entry.js` atiende `/api/client/*` antes de exigir la sesión administrativa. Esto permite que una aplicación IPTV tenga su propia sesión sin recibir permisos administrativos.

## Validación pendiente
En el servidor de pruebas ejecutar:
1. `git pull origin main`
2. `bash install.sh`
3. Confirmar que `ipztream-api` queda activo.
4. Crear/usar un cliente IPTV activo.
5. Probar login válido.
6. Probar `/api/client/me` con la cookie o Bearer token recibido.
7. Probar contraseña incorrecta.
8. Probar cliente suspendido/vencido.
9. Probar logout.
10. Confirmar que `/api/client/me` responde `401` después del logout.
11. Confirmar que aparece la tabla `client_sessions` y los eventos en `audit_logs`.

La etapa no se considera cerrada hasta la validación del usuario.
