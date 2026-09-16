# IPZStream — Continuidad del proyecto

## Propósito
IPZStream es una plataforma propia de gestión y distribución de streaming, inspirada en capacidades de paneles IPTV existentes, pero desarrollada con arquitectura, código e interfaz propios.

## Reglas de trabajo obligatorias
- Este repositorio es independiente de Z-Hub.
- GitHub se utilizará para desarrollo, pruebas, control de versiones y releases.
- Las instalaciones de clientes deberán recibir builds/releases controlados mediante un sistema propio de actualización; los clientes no deberán depender del repositorio fuente.
- **ANTES DE CADA ETAPA:** actualizar primero este documento `CONTINUITY.md` con el estado y objetivo de la siguiente etapa.
- Antes de cambios estructurales importantes se debe crear un respaldo o punto de restauración.
- Los cambios se implementan por etapas, probando cada etapa antes de continuar.
- No generar nuevos mockups salvo que el usuario los solicite explícitamente.
- **BITÁCORA PRIMERO:** después de actualizar Continuidad, toda mejora, corrección o cambio debe registrarse en `BITACORA.md`; después se modifica el código y se publica la actualización.
- La arquitectura debe mantenerse modular.

## Estado actual
- Repositorio: `ronbercito/ipztream`
- Rama: `main`
- Versión actual publicada: `0.3.5`.
- Centro de actualización validado desde panel.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3 — Canales reales HTTP/M3U + Astra Cesbo
Fuentes HTTP/HTTPS/HLS, Astra Cesbo por HTTP, M3U/M3U8, prioridad/respaldo y controles FFmpeg/HLS habilitados.

## 12.3.2 — Editor definitivo ancho y organizado por pestañas
Editor ancho con pestañas, información general, fuentes, estado/monitoreo y opciones avanzadas implementado.

## 12.3.3 — Prueba real de fuente antes de guardar
Implementada y validada con una fuente real: estado Activa y tiempo de respuesta devueltos por ffprobe sin guardar el canal.

## 12.3.4 — Diagnóstico multimedia al probar una fuente
Implementado en 0.3.5: bitrate, resolución, códecs, audio y FPS reales cuando ffprobe los reporta.

## 12.3.5 — Autoarranque y monitoreo operativo del canal
**Estado:** EN IMPLEMENTACIÓN.

Objetivo aprobado: un canal guardado como `Activo` y con una fuente válida debe iniciar automáticamente su emisión. La tabla debe reflejar el estado operativo real del motor.

### Comportamiento
- Al crear un canal activo, iniciar FFmpeg automáticamente después de guardarlo.
- Al editar un canal activo, reiniciar su emisión para aplicar la fuente/configuración nueva.
- Al desactivar un canal, detener la emisión; al volver a activarlo, iniciarla.
- Mostrar `Funcionando`, `Iniciando`, `Detenido` o `Error` según el proceso real.
- Mostrar tiempo activo desde el último inicio exitoso.
- Contabilizar reinicios del proceso por canal durante la vida del servicio y exponer el contador en la tabla.
- Conservar el control manual iniciar/detener.
- No marcar un canal como funcionando si FFmpeg no está realmente activo.

### Respaldo
`backup/pre-channel-autostart-monitoring-2026-09-16`.

## Próxima fase
Publicar la mejora, actualizar desde Centro de actualización y validar creación, edición, desactivación, autoarranque, uptime y contador de reinicios con canales reales.

## Protocolo obligatorio
1. Actualizar `CONTINUITY.md`.
2. Registrar en `BITACORA.md`.
3. Crear respaldo si corresponde.
4. Implementar.
5. Verificar/build.
6. Probar.
7. Registrar resultado.
8. Publicar.
9. Probar mediante Centro de actualización.
