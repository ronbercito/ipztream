# IPZTream — Continuidad del proyecto

## Propósito
IPZTream es una plataforma propia de gestión y distribución de streaming, inspirada en capacidades de paneles IPTV existentes, pero desarrollada con arquitectura, código e interfaz propios.

## Reglas de trabajo obligatorias
- Este repositorio es independiente de Z-Hub.
- GitHub se utilizará para desarrollo, pruebas, control de versiones y releases.
- Las instalaciones de clientes deberán recibir builds/releases controlados mediante un sistema propio de actualización.
- Antes de cambios estructurales importantes se debe crear un respaldo o punto de restauración.
- Los cambios se implementan por etapas, probando cada etapa antes de continuar.
- No generar nuevos mockups salvo que el usuario los solicite explícitamente.
- **BITÁCORA PRIMERO:** toda mejora, corrección o cambio debe registrarse primero en `BITACORA.md`; después se modifica el código y se publica la actualización.
- Cada entrada de bitácora debe indicar etapa, motivo, archivos afectados y resultado esperado.

## Dirección del producto
Objetivo: construir una plataforma moderna, segura, modular y escalable para administración de streaming, usuarios, contenido, nodos, monitoreo, licencias y actualizaciones.

## Arquitectura objetivo
- Panel administrativo web
- API/backend
- Base de datos
- Gestión de usuarios y permisos
- Gestión de streams/contenido
- Agentes/nodos de streaming
- Monitoreo y logs
- Licenciamiento
- Sistema de releases y actualización
- Instalador para despliegues controlados

## Etapas generales
1. Arquitectura y convenciones
2. Backend/API
3. Panel administrativo
4. Usuarios, roles y permisos
5. Streams y fuentes
6. VOD/series/EPG
7. Nodos y balanceo
8. Monitoreo y observabilidad
9. Seguridad
10. Licenciamiento
11. Actualizador/release manager
12. Instalador
13. Pruebas en Proxmox
14. Preparación para producción

## Estado actual
- Repositorio: `ronbercito/ipztream`
- Rama principal: `main`
- Base visual aprobada: dashboard IPZStream mostrado por el usuario.
- Base inicial a construir: shell del panel + dashboard visual + instalador para un contenedor Linux.

## Referencia visual aprobada
La interfaz debe seguir el concepto mostrado por el usuario: sidebar azul oscuro, barra superior, búsqueda global, dashboard claro, tarjetas KPI, gráficos, panel de estado de nodos, tabla de conexiones recientes, tablas administrativas, filtros, estados mediante badges y acciones rápidas. La prioridad es que se sienta como un producto profesional y no como una plantilla genérica.

## Protocolo de cambios
1. Registrar primero la mejora/corrección en `BITACORA.md`.
2. Implementar el cambio.
3. Verificar que la estructura/código sea consistente.
4. Registrar el resultado en la bitácora.
5. Enviar la actualización al repositorio.
6. Informar al usuario qué se cambió y cómo probarlo.

## Próximo paso
Etapa 1: crear la base visual de IPZStream y un instalador inicial para desplegarla en un único contenedor Linux.
