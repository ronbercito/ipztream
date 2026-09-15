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

## Validación pendiente
En el servidor de pruebas ejecutar build/reinicio y probar login válido, credencial incorrecta, usuario vencido/suspendido, `/api/client/me`, logout y rechazo posterior del token.

La etapa no se considera cerrada hasta la validación del usuario.
