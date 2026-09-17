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
- Versión publicada anterior: `0.3.14`.
- Versión en preparación: `0.3.15`.
- Centro de actualización validado desde panel.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3.12 — Acciones visuales y vista previa integrada
Implementado en 0.3.13.

## 12.3.13 — Política administrativa y recuperación de contraseña
Implementado en 0.3.14; validación final de acceso pendiente en instalación.

## 12.3.14 — Vista previa compatible con navegador
**Estado:** EN IMPLEMENTACIÓN.

### Motivo
La vista previa HLS puede avanzar pero quedar negra cuando el stream principal `remux-copy` conserva MPEG2VIDEO/MP2, códecs que el navegador no necesariamente decodifica.

### Objetivo
- Mantener intacta la emisión principal `remux-copy` de bajo consumo.
- Crear una salida de vista previa temporal H.264/AAC únicamente al abrir el modal.
- Detener y limpiar el proceso temporal al cerrar la vista previa.
- Servir el HLS temporal desde IPZStream y reproducirlo en el modal.
- Mostrar claramente que la vista previa usa un perfil compatible con navegador.
- No convertir permanentemente el canal ni modificar su fuente principal.

## Prueba requerida
Abrir AMERICATV SD (MPEG2VIDEO/MP2), comprobar imagen y audio en el modal, cerrar el modal y verificar que el proceso FFmpeg temporal desaparece mientras la emisión principal continúa en `remux-copy`.
