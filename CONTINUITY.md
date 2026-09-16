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
- Versión en preparación: `0.3.10`.
- Centro de actualización validado desde panel.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3.7 — Recuperación automática ante caída del proveedor
Implementado en 0.3.8 y validado en prueba real.

## 12.3.8 — Corrección visual del editor ancho
Implementado en 0.3.9 para Información general.

## 12.3.9 — Corrección visual de Fuentes de transmisión
**Estado:** EN IMPLEMENTACIÓN.

La pestaña Fuentes conserva toda la funcionalidad pero sus elementos no tienen el acabado visual aprobado: encabezado, acciones, tarjeta de fuente, campos y ejemplos aparecen desalineados/compactados. Se restaurará una composición amplia y ordenada sin modificar la lógica de prueba de señal ni el motor de streaming.

### Objetivo visual
- Encabezado claro con título/ayuda y botón Agregar fuente alineado a la derecha.
- Aviso de prioridad en una banda informativa independiente.
- Cada fuente ocupa una tarjeta horizontal amplia; número, Principal/Respaldo, estado y acciones en una cabecera limpia.
- Tipo, URL, protocolo, prioridad y tiempo de respuesta alineados en una sola grilla en escritorio.
- Botones Probar, Editar y Eliminar con estilo consistente.
- Resultados multimedia de Probar conservan bitrate, resolución, video, audio, canales y FPS.
- Ejemplos de URL en bloque inferior legible y separado.
- Sin scroll horizontal ni controles nativos desalineados.

## Próxima fase
Publicar 0.3.10 y validar visualmente Fuentes de transmisión desde Centro de actualización.

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
