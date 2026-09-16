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
- Versión en preparación: `0.3.11`.
- Centro de actualización validado desde panel.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3.7 — Recuperación automática
Implementado en 0.3.8 y validado en prueba real.

## 12.3.8 — Editor ancho
Implementado en 0.3.9.

## 12.3.9 — Fuentes de transmisión
Implementado en 0.3.10.

## 12.3.10 — Persistencia del estado de emisión
**Estado:** EN IMPLEMENTACIÓN.

Objetivo: una actualización del panel, reinicio del servicio, reinicio del contenedor o reinicio del servidor no debe olvidar qué canales estaban encendidos o detenidos.

### Comportamiento requerido
- Persistir por canal la intención operativa `running/stopped` en almacenamiento duradero.
- Pulsar Iniciar guarda `running` antes de lanzar FFmpeg.
- Pulsar Detener guarda `stopped` y cancela recuperación automática.
- Una caída del proveedor no cambia `running`; IPZStream sigue intentando recuperar.
- SIGTERM/SIGINT por actualización o apagado cierra FFmpeg sin convertir los canales a `stopped`.
- Al iniciar la API, restaurar automáticamente los canales guardados como `running` y administrativamente Activos.
- Si la fuente todavía no está disponible al arrancar, mantener intención `running` y entrar al ciclo de recuperación automática.
- Mantener canales detenidos manualmente apagados.

### Respaldo
`backup/pre-persistent-stream-state-2026-09-16`.

## Próxima fase
Publicar 0.3.11, actualizar exclusivamente desde el Centro de actualización y comprobar que los canales previamente iniciados vuelvan solos después del reinicio provocado por la actualización.

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
