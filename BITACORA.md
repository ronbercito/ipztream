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
Implementado en 0.3.14.

### Corrección 12.3.14 — Preview H.264/AAC bajo demanda
Implementado en 0.3.15.

### Corrección 12.3.15 — HLS.js + token efímero
Implementado para 0.3.16; validación final pendiente.

### Corrección 12.3.16 — Query del token HLS
Corregida construcción de URL para conservar `token` y agregar `t` con `&`.

### Corrección 12.3.17 — Sintaxis JSX bloqueaba Vite
Corregido `ChannelTable.jsx`. Respaldo: `backup/pre-channel-table-build-fix-2026-09-17`.

### Corrección 12.3.18 — Permisos de `dist` bloquean actualización
**Diagnóstico del servidor:** updater completa Git y npm, pero Vite falla al limpiar el directorio de salida con `EACCES: permission denied, unlink '/opt/ipztream/dist/assets/index-CZCy5gXN.js'`.

**Causa:** un build manual ejecutado como root dejó artefactos de `dist` propiedad de root; el updater corre como `www-data` y no puede eliminarlos. El mismo problema impide reconstruir durante rollback.

**Recuperación:** devolver `/opt/ipztream/dist` a `www-data:www-data` una sola vez y volver a actualizar exclusivamente desde panel.

**Prevención:** el updater limpiará `dist` antes del build. Los builds de recuperación no deben ejecutarse como root.

**Versión objetivo:** 0.3.16.

**Estado:** EN IMPLEMENTACIÓN — pendiente corrección de permisos en servidor y prueba completa del panel.
