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
- Versión en preparación: `0.3.9`.
- Centro de actualización validado desde panel.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3.6 — Historial operativo
Implementado en 0.3.7.

## 12.3.7 — Recuperación automática ante caída del proveedor
Implementado en 0.3.8 y validado en prueba real: el canal vuelve cuando retorna la señal del proveedor.

## 12.3.8 — Corrección visual del editor ancho
**Estado:** EN IMPLEMENTACIÓN.

Tras 0.3.8 el editor conserva las pestañas pero perdió estilos de campos internos: inputs/selects quedaron con estilo nativo, la columna general se estrechó visualmente y la vista previa del logo se expandió de forma incorrecta. Se debe restaurar el diseño ancho aprobado sin alterar recuperación automática, historial ni controles de streaming.

### Objetivo visual
- Mantener modal ancho y cuatro pestañas.
- Información general ordenada, con Nombre en una fila y Número/Categoría/Estado en tres columnas.
- Logo en tarjeta independiente con URL y vista previa contenida, sin expandirse verticalmente.
- Inputs/selects uniformes, modernos y al 100% del espacio disponible.
- Sin scroll horizontal en escritorio.
- Mantener colores, contraste y temática ya aprobados.

## Próxima fase
Publicar 0.3.9 y validar visualmente el editor desde Centro de actualización.

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
