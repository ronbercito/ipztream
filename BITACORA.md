# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–11
Completadas y validadas.

## Etapa 12 — Motor de streaming real + integración de fuentes — EN IMPLEMENTACIÓN

### Mejora 12.3.6 — Historial operativo
Implementado en 0.3.7.

### Mejora 12.3.7 — Recuperación automática
Implementado en 0.3.8 y validado.

### Correcciones visuales 12.3.8 / 12.3.9
Editor y Fuentes implementados en 0.3.9/0.3.10.

### Mejora 12.3.10 — Persistencia del estado
Implementado en 0.3.11: running/stopped persistente y restauración automática.

### Mejora 12.3.11 — Remux/Copy de bajo consumo
**Motivo:** FFmpeg estaba transcodificando todos los canales a H.264/AAC. Para señales MPEG-2/MPEG-TS esto añade CPU y puede introducir comportamiento peor que la reproducción directa observada en VLC.

**Implementación:** usar stream copy para video/audio, conservar códecs de origen, reparar/generar timestamps necesarios para HLS, mantener reconexión y recuperación automática. No habrá fallback silencioso a transcodificación.

**Prueba:** canal MPEG-2 problemático + canal H.264, observando continuidad, CPU y recuperación Astra.

**Versión:** 0.3.12.

**Estado:** EN IMPLEMENTACIÓN.
