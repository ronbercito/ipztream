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
- Repositorio: `ronbercito/ipztream` (privado).
- Rama: `main`.
- Versión instalada estable en servidor: `0.3.15`.
- Versión en preparación: `0.3.16`.
- El deploy key privado de `www-data` funciona: el Centro de actualización completa `fetch` y `pull` de `origin/main`.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3.12 — Acciones visuales y vista previa integrada
Implementado en 0.3.13.

## 12.3.13 — Política administrativa y recuperación de contraseña
Implementado en 0.3.14. Acceso administrativo recuperado en instalación; queda pendiente endurecer el flujo local de recuperación para no depender del entorno manual.

## 12.3.14 — Vista previa compatible con navegador
Implementado inicialmente en 0.3.15 con conversión temporal H.264/AAC.

## 12.3.15 — Reproducción HLS real en navegador
**Estado:** EN IMPLEMENTACIÓN — corrección 0.3.16.

### Diagnóstico HLS validado
- FFmpeg de preview funciona y genera H.264/AAC, `index.m3u8` y segmentos MPEG-TS.
- Se implementó token efímero para desacoplar el preview de la cookie administrativa.
- Se corrigió la construcción del cache-buster para conservar `?token=...` y añadir `&t=...`.

## 12.3.16 — Bloqueo del actualizador por error de sintaxis JSX
**Diagnóstico validado por journal:** el actualizador privado funciona correctamente hasta `git pull` y `npm install`. El fallo ocurre en `npm run build`: Vite informa `Expected } but found Identifier` en `src/modules/channels/components/ChannelTable.jsx`.

### Causa
En el botón para cerrar el historial quedó JSX inválido: `onClick={()=>setHistoryId(null) title="Cerrar historial"` carece de la llave de cierre `}` después de `setHistoryId(null)`.

### Corrección inmediata
- Corregir el JSX a `onClick={()=>setHistoryId(null)} title="Cerrar historial"`.
- No modificar la autenticación del repositorio privado: está validada.
- Mantener rollback automático del actualizador.
- Respaldo previo: `backup/pre-channel-table-build-fix-2026-09-17`.

## Prueba requerida
Desde el Centro de actualización: comprobar → pull privado → npm install → build Vite → publicación → reinicio. Debe instalar 0.3.16 sin rollback. Después probar AMERICATV SD y ESPN 2 en Chrome/Edge; el modal debe pasar de `Preparando` a `Reproduciendo`, mostrar imagen/audio y liberar FFmpeg temporal al cerrar.
