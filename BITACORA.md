# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–11
Completadas y validadas.

## Etapa 12 — Motor de streaming real + integración de fuentes — EN IMPLEMENTACIÓN

### Mejora 12.3.5 — Autoarranque y monitoreo operativo
Implementado en 0.3.6.

### Mejora 12.3.6 — Historial operativo
Implementado en 0.3.7: registro de Inicio/Reinicio y limpieza manual del contador sin detener el canal.

### Mejora 12.3.7 — Recuperación automática del stream
**Motivo:** prueba real con Astra: al cortar la señal, FFmpeg/IPZStream se detiene; al restaurar Astra, IPZStream no vuelve a levantar el canal por sí solo.

**Respaldo:** `backup/pre-stream-auto-recovery-2026-09-17`.

**Implementación:** el gestor mantendrá intención de ejecución por canal. Ante salida inesperada de FFmpeg programará reintentos con retardo. Cada nuevo lanzamiento automático contará como Reinicio. Detención manual/desactivación cancelará la recuperación.

**Resultado esperado:** cortar Astra provoca caída/error temporal; al volver la fuente, IPZStream recupera automáticamente el canal sin pulsar iniciar.

**Versión prevista:** 0.3.8.

**Estado:** EN IMPLEMENTACIÓN.
