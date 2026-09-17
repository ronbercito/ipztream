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
**Estado:** EN IMPLEMENTACIÓN — corrección de entrega HTTP en 0.3.16.

### Diagnóstico validado
- FFmpeg de preview funciona y transcodifica la fuente a H.264/AAC.
- Se generan continuamente `index.m3u8` y segmentos MPEG-TS válidos en `/var/lib/ipztream/previews/<canal>/`.
- El acceso HTTP directo a `/previews/<canal>/index.m3u8` sin sesión devuelve `401 Autenticación requerida`.
- Para desacoplar hls.js de la cookie administrativa, el preview usará un token aleatorio efímero creado al abrir el modal.

### Objetivo
- Mantener intacta la emisión principal `remux-copy`.
- Mantener preview H.264/AAC bajo demanda.
- Reproducir mediante `hls.js` con fallback HLS nativo.
- Entregar manifiesto y segmentos con un token temporal exclusivo del preview.
- No hacer pública la ruta `/previews/`: sin token válido debe responder 401.
- Incluir el token en las referencias de segmentos del manifiesto servido para que hls.js pueda solicitarlos.
- Invalidar el token, detener FFmpeg y borrar los archivos al cerrar el modal.
- Mantener la corrección de permisos de `/var/lib/ipztream/previews` como requisito del actualizador/instalador.

## Prueba requerida
Abrir ESPN 2 y AMERICATV SD desde Chrome/Edge, comprobar imagen y audio en el modal, cerrar el modal y verificar que el proceso FFmpeg temporal desaparece mientras la emisión principal continúa en `remux-copy`. Confirmar además que una URL `/previews/...` sin token no entrega el contenido.
