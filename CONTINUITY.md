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
- Versión actual publicada: `0.3.6`.
- Centro de actualización validado desde panel.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3 — Canales reales HTTP/M3U + Astra Cesbo
Fuentes HTTP/HTTPS/HLS, Astra Cesbo por HTTP, M3U/M3U8, prioridad/respaldo y controles FFmpeg/HLS habilitados.

## 12.3.2 — Editor definitivo ancho y organizado por pestañas
Editor ancho con pestañas, información general, fuentes, estado/monitoreo y opciones avanzadas implementado.

## 12.3.3 — Prueba real de fuente antes de guardar
Implementada y validada con una fuente real.

## 12.3.4 — Diagnóstico multimedia al probar una fuente
Implementado en 0.3.5.

## 12.3.5 — Autoarranque y monitoreo operativo del canal
Implementado y validado en 0.3.6: guardado activo inicia FFmpeg, estado real y uptime visibles.

## 12.3.6 — Historial y reinicio del contador operativo
**Estado:** EN IMPLEMENTACIÓN.

Objetivo aprobado: la columna de reinicios debe permitir consultar cuándo inició/reinició el canal y reiniciar manualmente ese historial para comenzar una medición nueva.

### Comportamiento
- Registrar cada inicio con fecha/hora y tipo (`Inicio` o `Reinicio`).
- El contador debe representar los reinicios registrados desde el último borrado manual.
- Añadir acción visible para abrir el historial del canal.
- Mostrar un registro ordenado con fecha/hora de cada evento.
- Añadir botón `Borrar historial` con confirmación; al borrarlo contador e historial vuelven a cero sin detener el canal.
- El canal que ya está funcionando debe continuar funcionando después de limpiar el historial.

## Próxima fase
Publicar la mejora y validarla desde Centro de actualización con un canal real.

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
