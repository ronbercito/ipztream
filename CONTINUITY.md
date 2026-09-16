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
- Versión en preparación: `0.3.8`.
- Centro de actualización validado desde panel.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3.5 — Autoarranque y monitoreo operativo
Implementado: guardado activo inicia FFmpeg, estado real y uptime visibles.

## 12.3.6 — Historial operativo
Implementado en 0.3.7: historial de inicio/reinicio y borrado manual sin detener la emisión.

## 12.3.7 — Recuperación automática ante caída del proveedor
**Estado:** EN IMPLEMENTACIÓN.

Objetivo: si Astra/HTTP/proveedor deja de entregar señal y FFmpeg termina, IPZStream no debe requerir intervención manual. Debe conservar el canal activo, esperar y reintentar automáticamente hasta que la fuente vuelva a responder.

### Comportamiento
- Una salida inesperada de FFmpeg deja el canal en estado de recuperación, no abandonado definitivamente.
- Reintento automático periódico mientras el canal administrativo siga `Activo`.
- Al recuperar respuesta de la fuente, levantar FFmpeg automáticamente.
- Cada intento que realmente vuelva a lanzar FFmpeg se registra como `Reinicio` con fecha/hora y aumenta el contador.
- Un `Detener` manual o desactivar el canal cancela los reintentos automáticos.
- Evitar bucles agresivos: usar retardo entre intentos.
- Mantener el último error visible mientras se espera recuperación.

### Respaldo
`backup/pre-stream-auto-recovery-2026-09-17`.

## Próxima fase
Actualizar desde el panel y validar cortando temporalmente una señal de Astra y restaurándola sin tocar IPZStream.

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
