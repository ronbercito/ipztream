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
- Cada entrada de bitácora debe indicar etapa, motivo, archivos afectados y resultado esperado.
- La arquitectura debe mantenerse modular.

## Estado actual
- Repositorio: `ronbercito/ipztream`
- Rama: `main`
- Versión actual: `0.3.1`.
- Centro de actualización validado desde panel.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3 — Canales reales HTTP/M3U + Astra Cesbo
Fuentes HTTP/HTTPS/HLS, Astra Cesbo por HTTP, M3U/M3U8, prioridad/respaldo y controles FFmpeg/HLS habilitados.

## 12.3.2 — Editor definitivo ancho y organizado por pestañas
**Estado:** EN IMPLEMENTACIÓN.

El usuario aprobó explícitamente el diseño visual ancho mostrado como referencia y pidió implementarlo con los mismos colores, contraste, temática, opciones y orden general, sin generar más imágenes.

### Diseño aprobado
- Modal significativamente más ancho y aprovechando el espacio horizontal disponible.
- Cabecera limpia `Editar canal / Agregar canal`.
- Navegación superior por pestañas: `Información general`, `Fuentes de transmisión`, `Estado y monitoreo` y `Opciones avanzadas`.
- Información general: nombre, número, categoría, estado y logo, con campos grandes y legibles.
- Fuentes: tarjetas amplias, URL sin compresión, tipo, protocolo, prioridad y estado.
- Mantener fuente principal y respaldos.
- Estado/monitoreo: estado real del proceso, tiempo activo, HLS y error cuando exista.
- Opciones avanzadas: espacio preparado para comportamiento futuro sin inventar parámetros de streaming no implementados.
- Footer fijo y claro con Cancelar/Guardar.
- Responsive: en pantallas medianas las pestañas siguen siendo utilizables y el contenido pasa a una sola columna cuando sea necesario.

### Respaldo
`backup/pre-channel-editor-tabs-2026-09-16` creado antes de esta corrección.

## Próxima fase
Actualizar por panel, validar visualmente el editor definitivo y luego probar un canal HTTP/HLS real y Astra Cesbo.

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
