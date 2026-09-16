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
- Versión publicada anterior: `0.3.11`.
- Versión en preparación: `0.3.12`.
- Centro de actualización validado desde panel.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3.10 — Persistencia del estado de emisión
Implementado en 0.3.11. Persiste intención running/stopped y restaura canales al reinicio.

## 12.3.11 — Perfil Remux/Copy de bajo consumo
**Estado:** EN IMPLEMENTACIÓN.

### Problema
El motor actual transcodifica siempre video con libx264 y audio AAC. Esto consume CPU y puede empeorar fuentes MPEG-2/MPEG-TS que Astra Cesbo y VLC reproducen correctamente.

### Objetivo
- Cambiar el perfil predeterminado a **Remux/Copy**, sin recodificar video ni audio.
- Conservar códec original mediante `-c:v copy -c:a copy`.
- Mantener salida HLS/MPEG-TS y recuperación automática.
- Añadir tolerancia para timestamps/discontinuidades habituales en streams MPEG-TS usando generación/corrección de timestamps y evitando timestamps negativos.
- Mantener reconexión HTTP.
- No introducir transcodificación automática ni elevar CPU de forma innecesaria.
- Exponer en estado del stream el perfil `remux-copy` para diagnóstico.

### Compatibilidad esperada
MPEG-2 Video, H.264/AVC, H.265/HEVC y audio MP2/MP3/AAC/AC3/E-AC3 podrán atravesar el motor sin recodificación cuando FFmpeg/HLS admita el flujo recibido. Casos incompatibles deberán reportar error y recuperación, no activar transcodificación silenciosa.

## Prueba requerida
Actualizar desde panel, iniciar primero un canal MPEG-2 que presentaba intermitencia, comparar reproducción y CPU, luego verificar un canal H.264. Confirmar también recuperación al cortar/restablecer Astra.

## Próxima fase
Validar 0.3.12 en el contenedor de pruebas antes de agregar perfiles opcionales adicionales.
