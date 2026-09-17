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
Implementado inicialmente en 0.3.15 con conversión temporal H.264/AAC.

## 12.3.15 — Reproducción HLS real en navegador
**Estado:** EN IMPLEMENTACIÓN — corrección 0.3.16.

### Diagnóstico validado
- FFmpeg de preview funciona y genera H.264/AAC, `index.m3u8` y segmentos MPEG-TS.
- Se implementó token efímero para desacoplar el preview de la cookie administrativa.
- La prueba posterior siguió en `Preparando`.
- Revisión de frontend encontró el fallo concreto: `hlsUrl` ya contiene `?token=...`, pero el cache-buster se concatenaba como otro `?t=...`. El resultado era `?token=<token>?t=<timestamp>`, por lo que el servidor recibía un token alterado y lo rechazaba.

### Corrección inmediata
- Construir la URL mediante `URL`/`URLSearchParams` para conservar `token` y añadir `t` como segundo parámetro (`&t=`).
- Mantener token temporal, hls.js, fallback nativo y limpieza del preview.
- Mantener intacta la emisión principal `remux-copy`.

## Prueba requerida
Abrir AMERICATV SD y ESPN 2 en Chrome/Edge. El modal debe pasar de `Preparando` a `Reproduciendo`, mostrar imagen/audio y liberar el FFmpeg temporal al cerrar.
