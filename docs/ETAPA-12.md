# Etapa 12 — Motor de streaming real + integración de fuentes

## Objetivo
Primera cadena de streaming real de IPZStream:

`Fuente real -> FFmpeg -> HLS -> HTTP`

No se utiliza un reproductor ni una fuente simulada para representar el estado del stream.

## Componentes

### `server/stream-manager.js`
Gestiona procesos FFmpeg por canal:
- inicio
- detención
- reinicio
- estado del proceso
- PID
- errores
- últimas líneas de log
- salida HLS
- limpieza del directorio de salida antes de iniciar

Cada proceso recibe argumentos construidos por IPZStream. No se ejecutan comandos mediante shell.

### API administrativa
Todas estas rutas requieren sesión administrativa.

```text
GET  /api/streams
GET  /api/streams/:channelId
POST /api/streams/:channelId/start
POST /api/streams/:channelId/stop
POST /api/streams/:channelId/restart
```

Permisos usados:
- GET: `channels.view`
- POST: `channels.update`

Esto permite que un operador pueda consultar el estado, mientras que las acciones de control quedan reservadas a roles con capacidad de actualización de canales.

## Fuente
El motor utiliza la primera fuente activa válida del canal, ordenada por `priority`.

Protocolos aceptados:
- HTTP
- HTTPS
- RTMP
- RTMPS
- RTSP

La URL se valida mediante `URL` y el protocolo permitido antes de ejecutar FFmpeg.

## Salida HLS

Por defecto:

```text
/var/lib/ipztream/streams/<channelId>/index.m3u8
/var/lib/ipztream/streams/<channelId>/segment_000001.ts
...
```

La URL pública inicial es:

```text
/streams/<channelId>/index.m3u8
```

La salida usa segmentos HLS temporales y una ventana limitada de segmentos. FFmpeg genera la playlist y los segmentos; Nginx publica únicamente el árbol `/streams/` configurado por el instalador.

## Instalación
El instalador incorpora el paquete Debian `ffmpeg`, disponible en Debian 13/Trixie. citeturn1search0

También configura:
- `IPZTREAM_STREAM_ROOT`
- `IPZTREAM_FFMPEG_BIN=/usr/bin/ffmpeg`
- directorio de salida propiedad de `www-data`
- ubicación `/streams/` en Nginx

## Prueba administrativa
Después de instalar:

```bash
curl -i -c /tmp/ipz-admin.cookie \
  -H "Content-Type: application/json" \
  -d '{"username":"ADMIN","password":"PASSWORD"}' \
  http://127.0.0.1:3100/api/auth/login
```

Consultar motor:

```bash
curl -i -b /tmp/ipz-admin.cookie \
  http://127.0.0.1:3100/api/streams
```

Debe devolver la versión de FFmpeg y la lista de procesos administrados.

Para iniciar un canal real:

```bash
curl -i -b /tmp/ipz-admin.cookie \
  -X POST \
  http://127.0.0.1:3100/api/streams/CHANNEL_ID/start
```

Consultar estado:

```bash
curl -i -b /tmp/ipz-admin.cookie \
  http://127.0.0.1:3100/api/streams/CHANNEL_ID
```

Cuando el estado sea `running`, comprobar la playlist:

```bash
curl -i http://127.0.0.1/streams/CHANNEL_ID/index.m3u8
```

Detener:

```bash
curl -i -b /tmp/ipz-admin.cookie \
  -X POST \
  http://127.0.0.1:3100/api/streams/CHANNEL_ID/stop
```

## Referencia técnica
FFmpeg documenta el muxer HLS y las opciones `hls_time`, `hls_list_size`, `hls_segment_filename` y `hls_flags`, incluyendo `delete_segments`, `independent_segments` y `temp_file`. citeturn0search0turn0search1

## Limitaciones de esta etapa
- El estado de los procesos se mantiene en memoria y se reconstruye al reiniciar el servicio.
- Todavía no existe autorecuperación/restart automático de fuentes caídas.
- Todavía no hay multi-bitrate/adaptive HLS.
- La protección de URLs HLS para clientes se implementará posteriormente.
- El control real de conexiones simultáneas y sesiones de reproducción queda para etapas posteriores.
- La interfaz de streamer se implementará en una etapa posterior.
