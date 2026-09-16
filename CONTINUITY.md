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
11. API de clientes + sesiones de aplicación — **COMPLETADA Y VALIDADA**.
12. Motor de streaming real + integración de fuentes — **EN IMPLEMENTACIÓN**.

## Estado actual
- Repositorio: `ronbercito/ipztream`
- Rama: `main`
- Versión instalada por panel: `0.3.0`.
- Debian 13 / Node.js 22 / npm 10 en el entorno de prueba.
- IP de prueba: `192.168.10.220`.
- Nginx publica `/var/www/ipztream`.
- Código fuente: `/opt/ipztream`.
- Servicio: `ipztream-api`.
- MariaDB es la base principal y permanente.
- El Centro de actualización instala revisiones completas desde el panel.

## Etapa 12 — Motor de streaming real + integración de fuentes
**Estado técnico:** EN IMPLEMENTACIÓN.

### 12.3 — Canales reales: HTTP/M3U + Astra Cesbo
**Estado:** EN IMPLEMENTACIÓN.

Se habilitaron fuentes HTTP/HTTPS/HLS, origen Astra Cesbo por HTTP, tipo M3U/M3U8, prioridad/respaldo y controles del motor FFmpeg/HLS.

### 12.3.1 — UX del editor + salud y tiempo activo
**Estado:** EN IMPLEMENTACIÓN.

**Objetivo:** reemplazar el editor comprimido por un modal amplio, ordenado y amigable, manteniendo la geometría del panel. El editor separará Información del canal y Fuentes de transmisión, mostrará ayuda contextual y hará visible la prioridad de cada fuente.

Al registrar un canal, la tabla debe mostrar una opción/estado operacional que permita comprobar si la emisión realmente está funcionando. Para una emisión activa se mostrará:
- indicador verde `Funcionando`;
- tiempo activo calculado desde `startedAt` del proceso real FFmpeg;
- acceso al HLS cuando esté disponible;
- estado `Iniciando`, `Detenido` o `Error` cuando corresponda;
- actualización periódica del estado sin necesidad de recargar toda la página.

El tiempo activo representa la sesión actual del proceso de streaming; al detener/reiniciar el canal vuelve a comenzar.

## Próxima fase
Validar desde el panel un canal HTTP/HLS real y después un canal publicado por Astra Cesbo.

## Respaldos
- `backup/pre-etapa-12-streaming-real`
- `backup/pre-update-panel-only-2026-09-16`
- `backup/pre-channels-real-sources-2026-09-16`

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
