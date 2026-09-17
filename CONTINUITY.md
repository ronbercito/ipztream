# IPZStream — Continuidad del proyecto

## Propósito
IPZStream es una plataforma propia de gestión y distribución de streaming, desarrollada con arquitectura, código e interfaz propios.

## Reglas de trabajo obligatorias
- Este repositorio es independiente de Z-Hub.
- GitHub se utilizará para desarrollo, pruebas, control de versiones y releases.
- Las instalaciones reciben builds/releases controlados mediante el actualizador propio.
- **ANTES DE CADA ETAPA:** actualizar primero `CONTINUITY.md`.
- Antes de cambios estructurales importantes crear respaldo.
- Implementar y probar por etapas.
- No generar mockups salvo solicitud explícita.
- **BITÁCORA PRIMERO:** después de Continuidad registrar en `BITACORA.md`; después modificar código y publicar.
- Mantener arquitectura modular.

## Estado actual
- Repositorio: `ronbercito/ipztream`
- Rama: `main`
- Versión publicada anterior: `0.3.15`.
- Versión en preparación: `0.3.16`.
- Centro de actualización validado desde panel.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3.12 — Acciones visuales y vista previa integrada
Implementado en 0.3.13.

## 12.3.13 — Política administrativa y recuperación de contraseña
Implementado en 0.3.14. Acceso administrativo recuperado en instalación; queda pendiente endurecer el flujo local de recuperación para no depender del entorno manual.

## 12.3.14 — Vista previa compatible con navegador
Implementado inicialmente en 0.3.15 con conversión temporal H.264/AAC. La prueba real confirmó que el modal queda en `Preparando` y el elemento `<video>` no inicia la reproducción en navegador de escritorio.

## 12.3.15 — Reproducción HLS real en navegador
**Estado:** EN IMPLEMENTACIÓN.

### Diagnóstico
La conversión temporal H.264/AAC elimina el problema MPEG2VIDEO/MP2, pero Chrome/Edge de escritorio no reproducen de forma general un manifiesto HLS `.m3u8` asignado directamente a `<video src>`. Además, el reproductor puede solicitar el manifiesto antes de que FFmpeg haya creado los primeros segmentos.

### Objetivo
- Mantener intacta la emisión principal `remux-copy`.
- Mantener el preview temporal H.264/AAC bajo demanda.
- Reproducir HLS mediante `hls.js` cuando el navegador no tenga HLS nativo.
- Conservar reproducción HLS nativa cuando el navegador sí la soporte.
- Esperar/reintentar mientras aparece el manifiesto inicial sin dejar el modal bloqueado permanentemente en `Preparando`.
- Destruir el reproductor y detener el FFmpeg temporal al cerrar el modal.
- Corregir la preparación de `/var/lib/ipztream/previews` para evitar el `EACCES` detectado tras actualizar a 0.3.15.

## Prueba requerida
Abrir ESPN 2 y AMERICATV SD desde Chrome/Edge, comprobar imagen y audio en el modal, cerrar el modal y verificar que el proceso FFmpeg temporal desaparece mientras la emisión principal continúa en `remux-copy`.
