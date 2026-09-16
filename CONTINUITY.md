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
- Versión actual publicada: `0.3.4`.
- Centro de actualización validado desde panel.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3 — Canales reales HTTP/M3U + Astra Cesbo
Fuentes HTTP/HTTPS/HLS, Astra Cesbo por HTTP, M3U/M3U8, prioridad/respaldo y controles FFmpeg/HLS habilitados.

## 12.3.2 — Editor definitivo ancho y organizado por pestañas
Editor ancho con pestañas, información general, fuentes, estado/monitoreo y opciones avanzadas implementado.

## 12.3.3 — Prueba real de fuente antes de guardar
Implementada y validada con una fuente real: estado Activa y tiempo de respuesta devueltos por ffprobe sin guardar el canal.

## 12.3.4 — Diagnóstico multimedia al probar una fuente
**Estado:** EN IMPLEMENTACIÓN.

Objetivo aprobado: al pulsar `Probar`, además de estado y latencia, mostrar información técnica real de la señal obtenida por ffprobe.

### Datos a mostrar
- Bitrate total cuando la fuente lo reporte.
- Resolución del video, por ejemplo `1920 × 1080`.
- Códec de video, por ejemplo `H.264`.
- Códec de audio, por ejemplo `MP2`, `AAC` o el valor real recibido.
- Cantidad/configuración de canales de audio cuando esté disponible.
- FPS calculado desde la tasa de cuadros reportada por ffprobe.
- Los campos no disponibles deben mostrar `—`; nunca se deben inventar valores.
- La información se muestra dentro de la misma tarjeta de fuente, debajo del resultado de la prueba, sin modificar ni guardar el canal.

## Próxima fase
Publicar la mejora, actualizar desde Centro de actualización y validar los metadatos contra una fuente real de Astra/HTTP-HLS.

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
