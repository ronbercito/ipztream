# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–11
Completadas y validadas.

## Etapa 12 — Motor de streaming real + integración de fuentes — EN IMPLEMENTACIÓN

### Mejora 12.3.6 — Historial operativo
Implementado en 0.3.7.

### Mejora 12.3.7 — Recuperación automática del stream
Implementado en 0.3.8. Validación real confirmada: al cortar la fuente y devolverla, IPZStream reanuda el canal automáticamente y registra el reinicio.

### Corrección 12.3.8 — Restaurar diseño del editor de canales
**Motivo:** después de las últimas actualizaciones el modal ancho sigue presente, pero los controles de Información general/Logo aparecen con estilos nativos y dimensiones incorrectas, generando amontonamiento y scroll horizontal.

**Alcance:** corregir exclusivamente presentación CSS del editor: layout ancho, campos, selects, tarjetas, logo y comportamiento responsive. No modificar el motor FFmpeg, recuperación automática ni historial operativo.

**Versión prevista:** 0.3.9.

**Estado:** EN IMPLEMENTACIÓN.
