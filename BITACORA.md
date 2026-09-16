# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–11
Completadas y validadas.

## Etapa 12 — Motor de streaming real + integración de fuentes — EN IMPLEMENTACIÓN

### Mejora 12.3.6 — Historial operativo
Implementado en 0.3.7.

### Mejora 12.3.7 — Recuperación automática del stream
Implementado en 0.3.8. Validación real confirmada.

### Corrección 12.3.8 — Restaurar diseño del editor de canales
Implementado en 0.3.9 para Información general y logo.

### Corrección 12.3.9 — Restaurar diseño de Fuentes de transmisión
**Motivo:** la funcionalidad está presente, pero la pestaña aparece visualmente desarmada: acciones con estilo nativo, tarjeta demasiado angosta y ejemplos pegados.

**Alcance:** presentación CSS de SourceEditor: encabezado, aviso, tarjeta horizontal, botones, campos, estado de prueba, métricas multimedia y ejemplos. No modificar la lógica de Probar ni recuperación FFmpeg.

**Versión prevista:** 0.3.10.

**Estado:** EN IMPLEMENTACIÓN.
