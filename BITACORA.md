# Bitácora de IPZStream

## 2026-09-15 — Etapa 9 — Autenticación real + RBAC — INICIO
**Motivo:** iniciar la capa de seguridad real sobre el backend/MariaDB ya validado.

**Objetivo:** implementar usuarios administrativos reales, contraseñas con hash seguro, login/logout, sesiones o tokens con expiración, roles y permisos RBAC, protección de endpoints y preparación de auditoría asociada a identidad.

**Criterios:** no guardar contraseñas en texto plano; no usar `localStorage` como fuente de verdad de autenticación; secretos solo en backend/variables de entorno; permisos evaluados en backend; solicitudes no autenticadas rechazadas; mantener los contratos de los módulos ya validados.

**Archivos previstos:** `server/index.js`, `server/db.js`, `database/schema.sql`, módulos/servicios de autenticación bajo `src/modules/` y configuración estrictamente necesaria.

**Respaldo:** `backup/pre-etapa-9-auth-rbac`.

**Resultado esperado:** acceso administrativo real con identidad, roles y permisos validados por backend/MariaDB y endpoints protegidos.

**Estado:** etapa iniciada; pendiente de implementación y validación en Debian 13.
