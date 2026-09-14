# IPZTream — Continuidad del proyecto

## Propósito
IPZTream es una plataforma propia de gestión y distribución de streaming, inspirada en las capacidades de paneles IPTV existentes, pero desarrollada con arquitectura, código e interfaz propios.

## Regla de trabajo
- Este repositorio es independiente de Z-Hub.
- GitHub se utilizará principalmente para desarrollo, pruebas, control de versiones y releases.
- Las instalaciones de clientes deberán recibir builds/releases controlados mediante un sistema propio de actualización.
- Antes de cambios estructurales importantes se debe crear un respaldo o punto de restauración.
- Los cambios se implementan por etapas, probando cada etapa antes de continuar.
- No generar nuevos mockups salvo que el usuario los solicite explícitamente.

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

## Estado inicial
Repositorio localizado y confirmado como `ronbercito/ipztream`, rama principal `main`.

## Referencia visual
La interfaz debe seguir un estilo moderno de panel profesional: navegación lateral, dashboard limpio, tarjetas de métricas, tablas compactas, estados visuales claros, acciones rápidas y modo oscuro como opción. El diseño debe priorizar legibilidad y operación rápida.

## Próximo paso
Definir la estructura inicial del proyecto y el design system antes de implementar funcionalidades grandes.
