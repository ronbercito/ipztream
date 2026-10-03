# IPZStream

Plataforma propia de gestión y distribución IPTV/streaming, construida con React/Vite, Node.js, MariaDB y FFmpeg.

## Estado actual

**Versión de desarrollo: 0.4.5**

La arquitectura Main/Sub ya dispone de:

- panel administrativo propio;
- motor FFmpeg/HLS local;
- MariaDB como persistencia principal;
- inventario de nodos `main/sub/edge`;
- tablas dedicadas `stream_nodes` y `stream_node_heartbeats`;
- heartbeat, estado offline e historial de métricas;
- agente real para subnodos;
- control start/stop/restart/status desde el Main;
- asignación de canal por `nodeId`;
- reconciliación periódica para que el Main siga siendo la autoridad del estado deseado;
- salida HLS directa desde el nodo que procesa el canal;
- instalador Main y primer instalador SUB con systemd.

La prueba física Main + SUB en dos servidores sigue pendiente. Por ello la arquitectura distribuida no se considera todavía aprobada para producción.

## Arquitectura

- **Main:** panel, API segura, MariaDB, usuarios, canales, auditoría y orquestación.
- **SUB/EDGE:** agente ligero, FFmpeg/HLS local, heartbeat y ejecución de órdenes.
- **Comunicación actual:** token compartido `IPZTREAM_NODE_REGISTRATION_TOKEN`.
- **Pendiente de seguridad:** credencial individual por nodo, rotación/revocación y firma HMAC.

IPZStream usa implementaciones propias. Los paneles históricos analizados se usan únicamente como referencia funcional/arquitectónica; no se incorporan PHP ofuscados, binarios antiguos ni mecanismos de licencia de terceros.

## Documentación

- `CONTINUITY.md` — continuidad técnica, arquitectura y etapas.
- `BITACORA.md` — registro obligatorio de cambios.
- `INSTALL.md` — instalación Main y notas de nodos.
- `docs/reference/` — mapas técnicos de referencia.

## Regla de cambios

Antes de cada bloque se crea respaldo y se actualizan continuidad/bitácora. Después se implementa, valida y recién entonces se integra en `main`.
