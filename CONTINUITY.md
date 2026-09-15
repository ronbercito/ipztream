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
- Cada entrada de bitácora debe indicar etapa, motivo, archivos afectados y resultado esperado.
- La arquitectura debe mantenerse modular: cada menú principal tendrá su módulo y las opciones importantes se separarán en componentes, servicios/API y estilos cuando corresponda.
- Evitar concentrar nuevas funcionalidades en `src/main.jsx`.

## Estado de las etapas
1. Configuración — **COMPLETADA Y VALIDADA**.
2. Usuarios — **COMPLETADA Y VALIDADA**.
3. Servidores / Nodos — **COMPLETADA Y VALIDADA**.
4. Canales / Fuentes — **COMPLETADA Y VALIDADA**.
5. VOD / Series / EPG / M3U — **COMPLETADA Y VALIDADA**.
6. Paquetes / Conexiones / Dispositivos — **COMPLETADA Y VALIDADA**.
7. Logs / Auditoría / Estadísticas — **COMPLETADA Y VALIDADA**.
8. Backend real + MariaDB — **COMPLETADA Y VALIDADA**.
9. Autenticación real + RBAC — **COMPLETADA Y VALIDADA**.
10. Usuarios IPTV / Panel Cliente — **COMPLETADA Y VALIDADA**.
11. API de clientes + sesiones de aplicación — **SIGUIENTE ETAPA / PREPARADA**.

## Estado actual
- Repositorio: `ronbercito/ipztream`
- Rama: `main`
- Versión visible: `0.1.0`.
- Debian 13 / Node.js 22 / npm 10 en el entorno de prueba.
- IP de prueba: `192.168.10.220`.
- Nginx publica `/var/www/ipztream`.
- Código fuente: `/opt/ipztream`.
- Servicio: `ipztream-api`.
- MariaDB es la base principal y permanente.
- Etapas 1–10 están validadas por el usuario.

## Etapa 10 — Usuarios IPTV / Panel Cliente
**Estado:** COMPLETADA Y VALIDADA por el usuario.

Se validó el CRUD real de clientes IPTV, asociación a paquetes, vencimiento/estado, límite de conexiones, edición completa de la cuenta, contraseña IPTV desde 1 carácter, mostrar/ocultar contraseña y persistencia. Se mantiene separación entre credenciales administrativas y credenciales IPTV: administradores con política mínima de 12 caracteres y clientes IPTV con mínimo de 1 carácter, ambos almacenados mediante hash.

### Correcciones 10.1–10.5
- Se corrigió la integración de Usuarios/Paquetes con MariaDB y las rutas `/api/users`.
- Se corrigió la validación mínima de contraseña IPTV.
- Se añadió mostrar/ocultar contraseña.
- Se corrigió la normalización de vencimiento y estado.
- Se separó `hashPassword()` administrativo de `hashIptvPassword()` y se habilitó la edición completa de la cuenta IPTV.

**Respaldo:** `backup/pre-etapa-10-usuarios-iptv`.

## Etapa 11 — API de clientes + sesiones de aplicación
**Objetivo:** construir la primera capa real para que una aplicación IPTV pueda autenticarse como cliente, consultar su cuenta y trabajar con una sesión propia, separada de la autenticación administrativa del panel.

### Alcance inicial
- Login de cliente IPTV mediante usuario/contraseña.
- Sesiones de cliente persistidas y revocables en MariaDB.
- Token de sesión seguro, almacenado de forma no reversible en la base.
- Expiración de sesión y cierre de sesión.
- Endpoint de identidad `/api/client/me`.
- Validación de estado y vencimiento del cliente antes de crear/usar una sesión.
- Separación estricta entre sesiones administrativas y sesiones IPTV.
- Base para autorizar posteriormente dispositivos, conexiones y reproducción.
- Respuestas API preparadas para futuras aplicaciones web/móvil/TV.
- Auditoría de login/logout y eventos relevantes.

### Restricciones de seguridad
- La aplicación cliente no utilizará credenciales administrativas.
- No se almacenarán contraseñas IPTV en texto plano.
- No se usará `localStorage` como fuente de autoridad para autenticación.
- El backend será la autoridad para sesión, estado, vencimiento y permisos del cliente.
- No se expondrá directamente la contraseña ni el hash en ninguna respuesta API.

### Fuera de esta etapa
- Reproducción real de streams.
- Generación/entrega HLS.
- Motor de streaming.
- Límite real de conexiones simultáneas por dispositivo.
- Tokens de reproducción protegidos.
- Aplicación final para Android/TV/web.

Estos puntos se implementarán en las etapas posteriores.

## Respaldo de Etapa 11
- `backup/pre-etapa-11-api-clientes-sesiones`

## Protocolo obligatorio
1. Actualizar primero `CONTINUITY.md`.
2. Registrar la intención/corrección en `BITACORA.md`.
3. Crear respaldo cuando el cambio sea estructural.
4. Implementar.
5. Ejecutar build/verificación.
6. Probar en el contenedor.
7. Registrar resultado.
8. Publicar.
9. Informar al usuario qué cambió y cómo probarlo.
