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
Implementado en 0.3.14. Acceso recuperado en instalación; queda pendiente mejorar la ejecución local segura del recuperador.

### Corrección 12.3.14 — Preview H.264/AAC bajo demanda
Implementado en 0.3.15. La conversión temporal H.264/AAC arranca, pero la prueba real en navegador deja el modal en `Preparando` porque el `<video>` directo no resuelve HLS de forma general en Chrome/Edge.

### Corrección 12.3.15 — HLS.js + preparación robusta del preview
**Motivo:** el preview H.264/AAC es HLS válido, pero el navegador de escritorio puede no soportar `.m3u8` directamente. También se detectó `EACCES` al crear `/var/lib/ipztream/previews` después de la actualización 0.3.15.

**Implementación prevista:** integrar `hls.js` con fallback HLS nativo; reintentos durante la generación inicial del manifiesto; destruir el reproductor al cerrar; mantener parada del FFmpeg temporal; preparar correctamente el directorio de previews para el usuario del servicio.

**Prueba:** ESPN 2 y AMERICATV SD deben mostrar imagen/audio dentro del modal en Chrome/Edge y liberar el preview al cerrar.

**Versión:** 0.3.16.

**Estado:** EN IMPLEMENTACIÓN.
