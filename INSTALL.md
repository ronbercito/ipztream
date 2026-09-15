# Instalación inicial de IPZStream

## Objetivo
Desplegar IPZStream en un contenedor Linux para pruebas en Proxmox, con panel web, API local y PostgreSQL como persistencia principal.

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
1. Instala Nginx, PostgreSQL y Node.js 22.
2. Copia el proyecto a `/opt/ipztream`.
3. Ejecuta `npm install` y `npm run build`.
4. Crea la base y usuario PostgreSQL locales.
5. Genera credenciales y las guarda en `/etc/ipztream/ipztream-api.env` con permisos restringidos.
6. Inicia `ipztream-api` esperando a que PostgreSQL esté disponible.
7. Al primer arranque, la API crea las tablas e importa los datos JSON existentes si las tablas están vacías.
8. Publica `dist/` en `/var/www/ipztream`.
9. Configura Nginx para servir el panel y enviar `/api/` a la API local.

Después abre:

```text
http://IP_DEL_CONTENEDOR/
```

## Verificación rápida

```bash
systemctl status postgresql --no-pager
systemctl status ipztream-api --no-pager
systemctl status nginx --no-pager
curl http://127.0.0.1:3100/api/health
curl http://127.0.0.1:3100/api/nodes
curl http://127.0.0.1:3100/api/channels
curl http://127.0.0.1:3100/api/packages
```

El health check debe responder con `ok: true` y `database: postgresql`.

## PostgreSQL
La API utiliza `DATABASE_URL` desde `/etc/ipztream/ipztream-api.env`. Los archivos de `data/*.json` se conservan como respaldo y fuente de migración inicial; después de migrar, las operaciones de la API escriben en PostgreSQL.

El esquema documentado está en `database/schema.sql`.

## Nota de producción
Esta etapa ya permite una prueba operativa con persistencia real, pero todavía no es el instalador comercial definitivo. Faltan autenticación/RBAC, motor real de streaming, telemetría, licenciamiento, releases firmados y endurecimiento de seguridad.

## Actualización futura
La actualización de clientes se implementará mediante el sistema propio de releases/updater. GitHub seguirá siendo desarrollo/release y no debe ser un requisito para clientes finales.
