# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–11
Completadas y validadas.

## Etapa 12 — Motor de streaming real + integración de fuentes — EN IMPLEMENTACIÓN

### Mejora 12.3.6 — Historial operativo
Implementado en 0.3.7.

### Mejora 12.3.7 — Recuperación automática del stream
Implementado en 0.3.8 y validado.

### Corrección 12.3.8 — Editor de canales
Implementado en 0.3.9.

### Corrección 12.3.9 — Fuentes de transmisión
Implementado en 0.3.10.

### Mejora 12.3.10 — Persistencia y restauración del estado de emisión
**Motivo:** el estado deseado estaba únicamente en memoria. Al actualizar IPZStream o reiniciar el servicio/contenedor, FFmpeg se cerraba y todos los canales aparecían detenidos.

**Respaldo:** `backup/pre-persistent-stream-state-2026-09-16`.

**Implementación prevista:** persistir `running/stopped` por canal; distinguir parada manual de apagado del servicio; restaurar automáticamente al arranque los canales activos que estaban configurados para emitir; conservar recuperación automática cuando el proveedor aún no responda.

**Prueba requerida:** iniciar un canal, dejar otro detenido, actualizar IPZStream desde el panel y comprobar tras el reinicio que el primero vuelve a emitir solo y el segundo continúa detenido.

**Versión:** 0.3.11.

**Estado:** EN IMPLEMENTACIÓN.
