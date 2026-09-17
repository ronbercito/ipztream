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
- Versión publicada anterior: `0.3.13`.
- Versión en preparación: `0.3.14`.
- Centro de actualización validado desde panel.
- Etapa 12 — Motor de streaming real + integración de fuentes: **EN IMPLEMENTACIÓN**.

## 12.3.12 — Acciones visuales y vista previa integrada
Implementado en 0.3.13.

## 12.3.13 — Política administrativa y recuperación de contraseña
**Estado:** EN IMPLEMENTACIÓN.

### Objetivo
- Cambiar el mínimo de contraseña administrativa de 12 a 8 caracteres.
- Mantener hash scrypt y el resto de la autenticación sin cambios.
- Incorporar una utilidad local de recuperación para cambiar la contraseña de un administrador existente sin borrar canales, usuarios IPTV ni configuración.
- La utilidad debe invalidar las sesiones administrativas existentes después del cambio.
- La contraseña nueva se introduce en el servidor y no queda escrita en el repositorio.

## Prueba requerida
Ejecutar la utilidad local sobre el usuario `admin`, establecer la nueva contraseña elegida por el administrador y comprobar un inicio de sesión nuevo.
