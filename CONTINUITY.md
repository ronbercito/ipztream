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
- Versión publicada anterior: `0.3.12`.
- Versión en preparación: `0.3.13`.
- Centro de actualización validado desde panel.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3.10 — Persistencia del estado
Implementado en 0.3.11.

## 12.3.11 — Remux/Copy de bajo consumo
Implementado en 0.3.12 para evitar transcodificación por defecto.

## 12.3.12 — Acciones visuales y vista previa integrada
**Estado:** EN IMPLEMENTACIÓN.

### Objetivo
- Dar identidad visual por color a las acciones de cada canal.
- Mostrar tooltip descriptivo al pasar el mouse: Editar, Iniciar/Detener, Vista previa, Activar/Desactivar y Eliminar.
- Sustituir el icono de enlace externo por un icono específico de monitor/vista previa.
- La vista previa no abrirá una pestaña o página completa.
- Al pulsar Vista previa se abrirá una ventana modal dentro de Canales/Fuentes.
- El modal reproducirá el HLS generado por IPZStream, manteniendo al usuario en el panel.
- Incluir nombre del canal, estado y cierre claro del reproductor.

## Prueba requerida
Actualizar desde panel, comprobar colores/tooltips y abrir Vista previa de un canal en funcionamiento sin abandonar la pantalla Canales/Fuentes.
