# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–11
Completadas y validadas.

## Etapa 12 — Motor de streaming real + integración de fuentes — EN IMPLEMENTACIÓN

### Mejora 12.3.10 — Persistencia del estado
Implementado en 0.3.11.

### Mejora 12.3.11 — Remux/Copy de bajo consumo
Implementado en 0.3.12.

### Mejora 12.3.12 — Acciones visuales + reproductor emergente
Implementado en 0.3.13.

### Corrección 12.3.13 — Recuperación de contraseña administrativa
**Motivo:** se requiere recuperar el acceso al usuario administrativo existente y permitir contraseñas administrativas personalizadas desde 8 caracteres.

**Implementación:** política administrativa mínima de 8 caracteres, conservando scrypt; nueva utilidad `reset-admin-password.js` para actualizar un administrador existente e invalidar sus sesiones. La contraseña nunca se almacena en el código ni en GitHub.

**Versión:** 0.3.14.

**Estado:** EN IMPLEMENTACIÓN.
