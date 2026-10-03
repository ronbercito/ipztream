# Instalación inicial de IPZStream

## Objetivo
Desplegar IPZStream en un contenedor Linux para pruebas en Proxmox, con panel web, API local y **MariaDB como persistencia principal**.

## Requisitos
- Contenedor LXC con acceso de red.
- Root o sudo.
- 1 vCPU mínimo; 2 vCPU recomendado.
- 2 GB RAM recomendado.
- 8 GB de almacenamiento recomendado para pruebas.

## Instalación desde el repositorio de desarrollo
Desde la raíz del repositorio:

```bash
bash install.sh
```

El instalador:
1. Instala Nginx, MariaDB y Node.js 22.
2. Copia el proyecto a `/opt/ipztream`.
3. Ejecuta `npm install` y `npm run build`.
4. Crea la base y usuario MariaDB locales.
5. Genera credenciales y las guarda en `/etc/ipztream/ipztream-api.env` con permisos restringidos.
6. Inicia `ipztream-api` después de MariaDB.
7. Al primer arranque, la API crea las tablas e importa los datos JSON existentes si las tablas están vacías.
8. Publica `dist/` en `/var/www/ipztream`.
9. Configura Nginx para servir el panel y enviar `/api/` a la API local.
10. Verifica que la API responda correctamente antes de mostrar el mensaje final de instalación exitosa.

Después abre:

```text
http://IP_DEL_CONTENEDOR/
```

## Verificación rápida

```bash
systemctl status mariadb --no-pager
systemctl status ipztream-api --no-pager
systemctl status nginx --no-pager
curl http://127.0.0.1:3100/api/health
curl -b cookies.txt http://127.0.0.1:3100/api/stream-nodes
curl http://127.0.0.1:3100/api/channels
curl http://127.0.0.1:3100/api/packages
```

El health check debe responder con `ok: true` y `database: mariadb`.

## MariaDB
La API utiliza `IPZTREAM_DB_HOST`, `IPZTREAM_DB_PORT`, `IPZTREAM_DB_NAME`, `IPZTREAM_DB_USER` e `IPZTREAM_DB_PASSWORD` desde `/etc/ipztream/ipztream-api.env`.

Los archivos de `data/*.json` se conservan como respaldo y fuente de migración inicial; después de migrar, las operaciones de la API escriben en MariaDB.

El esquema documentado está en `database/schema.sql`.

## PostgreSQL
PostgreSQL no forma parte de la arquitectura de persistencia de IPZStream. La implementación anterior de la Etapa 8 fue provisional y fue reemplazada por MariaDB.

## Nota de producción
Esta etapa ya permite una prueba operativa con persistencia real, pero todavía no es el instalador comercial definitivo. Faltan autenticación/RBAC, motor real de streaming, telemetría, licenciamiento, releases firmados y endurecimiento de seguridad.

## Actualización futura
La actualización de clientes se implementará mediante el sistema propio de releases/updater. GitHub seguirá siendo desarrollo/release y no debe ser un requisito para clientes finales.


## Nodos Main/Sub

Desde 0.4.3 los nodos usan tablas dedicadas `stream_nodes` y `stream_node_heartbeats`. La tabla legacy `nodes` se conserva únicamente para compatibilidad/migración.

El Main guarda en `/etc/ipztream/ipztream-api.env`:
- `IPZTREAM_NODE_REGISTRATION_TOKEN`: secreto de registro/heartbeat; no se imprime durante la instalación.
- `IPZTREAM_NODE_OFFLINE_AFTER_SECONDS`: timeout para marcar un nodo sin heartbeat como fuera de línea; default 150 s.
- `IPZTREAM_NODE_HEARTBEAT_RETENTION_DAYS`: retención del histórico de métricas; default 7 días.

Para instalar un subnodo, obtén el token de forma segura en el Main y úsalo solo en el servidor autorizado. El agente reporta cada 60 segundos y el Main conserva el último estado y el histórico acotado de heartbeats.


## Agente SUB real — 0.4.5

Desde 0.4.5 el instalador de subnodo instala dos servicios:
- `ipztream-node-agent.service`: API de control y runtime FFmpeg/HLS del SUB.
- `ipztream-node-heartbeat.timer`: telemetría y presencia hacia el Main.

El agente escucha por defecto en TCP `3200` y el Main usa `channel.nodeId` para decidir si ejecuta un canal localmente o en un SUB/EDGE. El formulario de canal muestra los nodos registrados.

Variables principales del SUB:
- `IPZTREAM_NODE_AGENT_PORT` (default 3200)
- `IPZTREAM_NODE_API_BASE_URL` (default `http://IP_SUB:3200`)
- `IPZTREAM_NODE_STREAM_ROOT`
- `IPZTREAM_NODE_REGISTRATION_TOKEN`

La prueba con un segundo servidor real sigue pendiente por decisión del operador. Por ello 0.4.5 es una base de desarrollo validada por build/sintaxis, no una aprobación de producción distribuida.

El puerto del agente debe ser alcanzable **desde el Main hacia el SUB**. No se abre firewall automáticamente.
