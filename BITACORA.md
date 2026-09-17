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

### Corrección 12.3.15 — HLS.js + entrega autenticada del preview
FFmpeg temporal y token efímero implementados en 0.3.16.

### Corrección 12.3.16 — Query del token HLS mal formada
**Hallazgo:** el backend devuelve `hlsUrl=/previews/.../index.m3u8?token=<token>`. El frontend añadía el cache-buster con otro signo `?`: `${preview.hlsUrl}?t=...`. Esto convertía el valor real de `token` en `<token>?t=...`, provocando rechazo del token y dejando hls.js en reintentos mientras el modal mostraba `Preparando`.

**Corrección:** construir la URL con `new URL(..., window.location.origin)` y `searchParams.set('t', Date.now())`, conservando intacto el parámetro `token`.

**Versión:** 0.3.16.

**Estado:** EN IMPLEMENTACIÓN — pendiente prueba real después de publicar/build.
