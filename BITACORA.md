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
Implementado en 0.3.14; validación final pendiente en instalación.

### Corrección 12.3.14 — Preview H.264/AAC bajo demanda
**Motivo:** un canal MPEG2VIDEO/MP2 en `remux-copy` genera HLS válido pero el navegador muestra pantalla negra por compatibilidad de códec.

**Implementación prevista:** proceso FFmpeg temporal independiente para preview H.264/AAC; arranque al abrir modal; HLS temporal servido por IPZStream; parada y limpieza al cerrar; la emisión principal permanece `remux-copy`.

**Prueba:** AMERICATV SD MPEG2VIDEO/MP2 debe reproducir imagen/audio en el modal y liberar el proceso de preview al cerrarlo.

**Versión:** 0.3.15.

**Estado:** EN IMPLEMENTACIÓN.
