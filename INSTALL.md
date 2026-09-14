# Instalación inicial de IPZStream

## Objetivo
Desplegar la base visual de IPZStream en un único contenedor Linux, idealmente Debian 12/Ubuntu 24.04, para pruebas en Proxmox.

## Requisitos
- Contenedor LXC con acceso de red.
- Root o sudo.
- 1 vCPU mínimo; 2 vCPU recomendado.
- 1 GB RAM mínimo; 2 GB recomendado para desarrollo.
- 4 GB de almacenamiento mínimo.

## Instalación desde el repositorio de desarrollo
Desde la raíz del repositorio:

```bash
bash install.sh
```

El instalador:
1. Instala Nginx y Node.js 22.
2. Copia el proyecto a `/opt/ipztream`.
3. Ejecuta `npm install` y `npm run build`.
4. Publica `dist/` en `/var/www/ipztream`.
5. Configura Nginx para servir el panel.

Después abre:

```text
http://IP_DEL_CONTENEDOR/
```

## Nota de producción
Este instalador es para la primera etapa y pruebas controladas. No representa todavía el instalador comercial definitivo. El futuro sistema de distribución deberá instalar paquetes/releases firmados y no requerirá entregar acceso al repositorio de desarrollo.

## Verificación

```bash
systemctl status nginx --no-pager
nginx -t
node --version
```

## Actualización futura
La actualización de clientes se implementará posteriormente mediante el sistema propio de releases/updater. No se debe convertir GitHub en un requisito de actualización para clientes finales.
