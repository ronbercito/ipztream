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
**Motivo:** las acciones de la tabla son poco distinguibles y la vista previa abre el HLS como una página independiente.

**Implementación:** colores semánticos para editar, iniciar/detener, vista previa, activar/desactivar y eliminar; tooltips al pasar el mouse; icono MonitorPlay para vista previa; modal integrado con reproductor de video HLS y fallback del elemento video del navegador.

**Prueba:** abrir vista previa desde la fila sin salir del panel y comprobar tooltips/colores.

**Versión:** 0.3.13.

**Estado:** EN IMPLEMENTACIÓN.
