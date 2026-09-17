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
- Repositorio: `ronbercito/ipztream` (actualmente público).
- Rama: `main`.
- Versión instalada estable en servidor: `0.3.15`.
- Versión en preparación: `0.3.16`.
- El Centro de actualización completa `fetch`, `pull` y `npm install`.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3.15 — Reproducción HLS real en navegador
FFmpeg de preview funciona y genera H.264/AAC, manifiesto y segmentos. Se implementó hls.js, token efímero y corrección del query del token. Validación final pendiente después de instalar 0.3.16.

## 12.3.16 — Bloqueos del actualizador
El error JSX anterior fue corregido. El journal del servidor reveló un segundo bloqueo real en Vite: `EACCES: permission denied, unlink '/opt/ipztream/dist/assets/index-CZCy5gXN.js'`.

### Causa validada
El servicio `ipztream-api` ejecuta el actualizador como `www-data`, pero un build manual previo ejecutado como `root` dejó artefactos dentro de `/opt/ipztream/dist` sin permisos de escritura/eliminación para `www-data`. Vite intenta limpiar `dist` antes del build y falla; el rollback también intenta reconstruir y falla por el mismo artefacto.

### Corrección
- Recuperación única del servidor: devolver propiedad de `/opt/ipztream/dist` a `www-data:www-data`.
- Endurecer `update-service.js` para eliminar `dist` antes de cada build desde el propio actualizador, evitando reutilizar artefactos viejos cuando sean eliminables por el usuario de servicio.
- Los builds manuales futuros, si fueran imprescindibles, deben ejecutarse como `www-data`, no como root.
- No cambiar el repositorio por este problema: público/privado no afecta este EACCES.

## Prueba requerida
Corregir propiedad de `dist`, pulsar Actualizar ahora y comprobar: Git → npm → build → publicación → reinicio → 0.3.16. Después validar preview AMERICATV SD/ESPN 2.
