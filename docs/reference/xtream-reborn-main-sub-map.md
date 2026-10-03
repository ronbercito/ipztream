# IPZStream Reference Map: Xtream Reborn Main/Sub

Este documento registra el inventario funcional usado como referencia para IPZStream. No autoriza copiar codigo ofuscado, binarios, mecanismos de licencia ni assets propietarios.

## Paquetes revisados

| Paquete | Rol observado | Uso en IPZStream |
|---|---|---|
| `main_xtreamcodes_reborn.tar.gz` | Servidor principal con panel, APIs completas, base de datos, crons, nginx/php/ffmpeg y herramientas | Referencia para control central, panel, usuarios, canales, bouquets, EPG y auditoria |
| `sub_xtreamcodes_reborn.tar.gz` | Nodo secundario/balanceador orientado a streaming, system API, nginx/php/ffmpeg, crons y monitores | Referencia para nodos streaming, heartbeat, metricas y ejecucion distribuida |

## Separacion funcional

### Main / Control central

Responsabilidades propias de IPZStream:

- Panel administrativo.
- API central.
- MariaDB principal.
- Usuarios/lineas.
- Canales/streams.
- Categorias, bouquets y EPG.
- Registro de nodos.
- Asignacion de canales a nodos.
- Auditoria y logs.
- Centro de actualizacion.
- Politicas de seguridad y licenciamiento futuro.

### Sub / Nodo streaming

Responsabilidades propias de IPZStream Node:

- Identidad de nodo.
- Registro contra main.
- Heartbeat periodico.
- Reporte de CPU/RAM/disco/carga.
- Capacidades declaradas: live, vod, timeshift, ffmpeg, hls, rtmp.
- Estado operativo: online, degraded, offline, maintenance.
- Futuro: ejecutar streams asignados por main.
- Futuro: publicar HLS/segmentos y reportar errores de fuente.

## Componentes legados observados

| Area | Archivos observados | Equivalente IPZStream |
|---|---|---|
| API de cliente | `player_api.php` | API cliente propia y segura |
| API de panel | `panel_api.php` | API admin Node.js |
| API de sistema | `system_api.php` | `/api/stream-nodes/*` y futura API de nodo |
| Streaming | `wwwdir/streaming/*` | `server/stream-manager.js` y workers futuros |
| Monitores | `tools/stream_monitor.php`, `watchdog_data.php` | watchdog propio con Node.js/systemd |
| Crons | `crons/*` | jobs propios, systemd timers o worker interno |
| Infra | nginx, nginx_rtmp, php-fpm, ffmpeg | dependencias del sistema y configuracion propia |

## Decision de implementacion

IPZStream no importara el arbol legado dentro del runtime ni del instalador. La migracion sera por capacidades:

1. Nodo streaming registrable.
2. Heartbeat y metricas.
3. UI de servidores/load balancers.
4. Asignacion de streams a nodo.
5. Worker de ejecucion por nodo.
6. Scheduler y failover.
7. Compatibilidad de API cliente cuando corresponda.

## Entrega 15.1

Primera base tecnica:

- Extender modelo JSON de `nodes`.
- Crear endpoint `GET /api/stream-nodes`.
- Crear endpoint `POST /api/stream-nodes/register`.
- Crear endpoint `POST /api/stream-nodes/:id/heartbeat`.
- Requerir `IPZTREAM_NODE_REGISTRATION_TOKEN` para registro/heartbeat.
- Mantener `/api/nodes` compatible con la UI existente.
