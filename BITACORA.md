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
Implementado en 0.3.15. La conversión temporal H.264/AAC arranca, pero la prueba real en navegador deja el modal en `Preparando`.

### Corrección 12.3.15 — HLS.js + entrega autenticada del preview
**Diagnóstico validado:** FFmpeg temporal funciona; genera H.264/AAC, manifiesto y segmentos. La ruta HTTP `/previews/...` está detrás de la autenticación administrativa y sin credencial devuelve 401.

**Implementación 0.3.16:** integrar `hls.js`; crear token criptográfico efímero por preview; devolver `hlsUrl` con token; permitir únicamente media de preview cuyo token coincida con el preview activo; reescribir las líneas de segmentos del manifiesto para conservar el token; invalidar token y eliminar proceso/archivos al cerrar.

**Seguridad:** `/previews/...` no se vuelve pública. Un token sólo autoriza los archivos del canal/preview para el que fue emitido y existe únicamente mientras ese preview está activo.

**Respaldo:** `backup/pre-preview-auth-fix-2026-09-17`.

**Prueba:** ESPN 2 y AMERICATV SD deben mostrar imagen/audio en Chrome/Edge; cerrar el modal debe detener el FFmpeg temporal. URL sin token debe seguir siendo rechazada.

**Versión:** 0.3.16.

**Estado:** EN IMPLEMENTACIÓN.
