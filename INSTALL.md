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
curl http://127.0.0.1:3100/api/nodes
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
