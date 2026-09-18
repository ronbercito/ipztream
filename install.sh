#!/usr/bin/env bash
set -euo pipefail

APP_NAME="ipztream"
APP_DIR="/opt/${APP_NAME}"
WEB_DIR="/var/www/${APP_NAME}"
STREAM_DIR="/var/lib/${APP_NAME}/streams"
NGINX_SITE="/etc/nginx/sites-available/${APP_NAME}"
API_SERVICE="/etc/systemd/system/${APP_NAME}-api.service"
ENV_DIR="/etc/${APP_NAME}"
ENV_FILE="${ENV_DIR}/${APP_NAME}-api.env"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_NAME="${IPZTREAM_DB_NAME:-ipztream}"
DB_USER="${IPZTREAM_DB_USER:-ipztream}"
DB_HOST="${IPZTREAM_DB_HOST:-127.0.0.1}"
DB_PORT="${IPZTREAM_DB_PORT:-3306}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Ejecuta este instalador como root."
  exit 1
fi

if [[ -r /etc/os-release ]]; then
  . /etc/os-release
else
  echo "No se pudo detectar el sistema operativo."
  exit 1
fi
if [[ "${ID:-}" != "ubuntu" && "${ID:-}" != "debian" ]]; then
  echo "Sistema no soportado automáticamente: ${PRETTY_NAME:-desconocido}."
  echo "IPZStream soporta Ubuntu LTS modernas y Debian moderno."
  exit 1
fi
echo "==> Sistema detectado: ${PRETTY_NAME:-$ID}"
if [[ "${ID}" == "ubuntu" ]]; then
  case "${VERSION_ID:-}" in
    20.04|22.04|24.04|24.10|25.04|25.10|26.04) ;;
    *) echo "AVISO: Ubuntu ${VERSION_ID:-desconocido} no está en la matriz validada; se comprobarán dependencias antes de continuar." ;;
  esac
fi

if [[ ! -f "${SOURCE_DIR}/package.json" ]]; then
  echo "No se encontró package.json. Ejecuta el instalador desde la raíz del proyecto IPZStream."
  exit 1
fi

if [[ ! "${DB_NAME}" =~ ^[A-Za-z0-9_]+$ || ! "${DB_USER}" =~ ^[A-Za-z0-9_]+$ ]]; then
  echo "DB_NAME y DB_USER solo pueden contener letras, números y guion bajo."
  exit 1
fi

if [[ ! "${DB_HOST}" =~ ^[A-Za-z0-9_.:-]+$ || ! "${DB_PORT}" =~ ^[0-9]+$ ]]; then
  echo "Configuración de MariaDB no válida."
  exit 1
fi

echo "==> Instalando dependencias del sistema..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl gnupg nginx mariadb-server mariadb-client ffmpeg

if ! command -v node >/dev/null 2>&1 || ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) < 20)' ; then
  echo "==> Instalando Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

node --version
npm --version
ffmpeg -version | head -n 1

if [[ "${SOURCE_DIR}" == "${APP_DIR}" ]]; then
  echo "==> El instalador ya se está ejecutando desde ${APP_DIR}; se omite la copia del proyecto."
else
  echo "==> Copiando IPZStream a ${APP_DIR}..."
  rm -rf "${APP_DIR}"
  mkdir -p "${APP_DIR}"
  cp -a "${SOURCE_DIR}/." "${APP_DIR}/"
fi

cd "${APP_DIR}"
echo "==> Instalando dependencias y generando build..."
npm install
npm run build

if [[ ! -d dist ]]; then
  echo "El build no generó el directorio dist."
  exit 1
fi

echo "==> Preparando MariaDB..."
systemctl enable --now mariadb
mariadb-admin ping --silent

DB_PASSWORD="$(node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))")"

if ! mariadb -Nse "SELECT 1 FROM mysql.user WHERE User='${DB_USER}' AND Host='${DB_HOST}'" | grep -q '^1$'; then
  mariadb -e "CREATE USER '${DB_USER}'@'${DB_HOST}' IDENTIFIED BY '${DB_PASSWORD}';"
else
  mariadb -e "ALTER USER '${DB_USER}'@'${DB_HOST}' IDENTIFIED BY '${DB_PASSWORD}';"
fi

mariadb -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mariadb -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'${DB_HOST}'; FLUSH PRIVILEGES;"

mkdir -p "${ENV_DIR}"
cat > "${ENV_FILE}" <<EOF
IPZTREAM_DB_HOST=${DB_HOST}
IPZTREAM_DB_PORT=${DB_PORT}
IPZTREAM_DB_NAME=${DB_NAME}
IPZTREAM_DB_USER=${DB_USER}
IPZTREAM_DB_PASSWORD=${DB_PASSWORD}
IPZTREAM_DB_POOL_SIZE=10
IPZTREAM_SESSION_TTL=28800
IPZTREAM_COOKIE_SECURE=false
IPZTREAM_STREAM_ROOT=${STREAM_DIR}
IPZTREAM_FFMPEG_BIN=/usr/bin/ffmpeg
EOF
chown root:www-data "${ENV_FILE}"
chmod 640 "${ENV_FILE}"

mkdir -p "${APP_DIR}/data" "${STREAM_DIR}"
chown -R www-data:www-data "${APP_DIR}/data" "${STREAM_DIR}"
chmod 750 "${STREAM_DIR}"

echo "==> Instalando servicio de API seguro..."
cp "${APP_DIR}/deploy/ipztream-api.service" "${API_SERVICE}"
systemctl daemon-reload
systemctl enable "${APP_NAME}-api"
systemctl restart "${APP_NAME}-api"

# El administrador inicial se crea una sola vez y su contraseña no se guarda en el env del servicio.
set -a
source "${ENV_FILE}"
set +a
admin_count="$(mariadb -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" -Nse "SELECT COUNT(*) FROM \`${DB_NAME}\`.admin_users" 2>/dev/null || echo 0)"
if [[ "${admin_count}" == "0" ]]; then
  ADMIN_USER="${IPZTREAM_ADMIN_USER:-admin}"
  if [[ -n "${IPZTREAM_ADMIN_PASSWORD:-}" ]]; then
    ADMIN_PASSWORD="${IPZTREAM_ADMIN_PASSWORD}"
  else
    ADMIN_PASSWORD="$(node -e "console.log(require('node:crypto').randomBytes(18).toString('base64url'))")"
  fi
  IPZTREAM_ADMIN_USER="${ADMIN_USER}" IPZTREAM_ADMIN_PASSWORD="${ADMIN_PASSWORD}" node server/bootstrap-admin.js
  echo
  echo "=============================================="
  echo " Credenciales iniciales de IPZStream"
  echo " Usuario: ${ADMIN_USER}"
  echo " Contraseña: ${ADMIN_PASSWORD}"
  echo " GUÁRDALAS: no se vuelven a mostrar."
  echo "=============================================="
  echo
fi

# Verificación de API y autenticación.
api_ok=0
for attempt in {1..20}; do
  if curl -fsS "http://127.0.0.1:3100/api/health" | grep -q '"ok":true' && curl -fsS "http://127.0.0.1:3100/api/health" | grep -q '"database":"mariadb"'; then
    api_ok=1
    break
  fi
  sleep 1
done

if [[ "${api_ok}" -ne 1 ]]; then
  echo "ERROR: la API de IPZStream no inició correctamente o no pudo conectarse a MariaDB."
  systemctl status "${APP_NAME}-api" --no-pager -l || true
  journalctl -u "${APP_NAME}-api" -n 80 --no-pager || true
  systemctl status mariadb --no-pager -l || true
  exit 1
fi

health="$(curl -fsS "http://127.0.0.1:3100/api/health")"
echo "API OK: ${health}"

if curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:3100/api/nodes" | grep -q '^401$'; then
  echo "Autenticación OK: /api/nodes está protegido."
else
  echo "ERROR: /api/nodes no está protegido correctamente."
  exit 1
fi

if ! /usr/bin/ffmpeg -version >/dev/null 2>&1; then
  echo "ERROR: FFmpeg no está disponible."
  exit 1
fi

# Verifica que las tablas de datos sigan accesibles internamente en MariaDB.
if ! mariadb -Nse "SELECT COUNT(*) FROM \`${DB_NAME}\`.nodes;" | grep -q '^[0-9][0-9]*$'; then
  echo "ERROR: no se pudo consultar la tabla nodes en MariaDB."
  exit 1
fi

echo "==> Publicando panel web..."
rm -rf "${WEB_DIR}"
mkdir -p "${WEB_DIR}"
cp -a dist/. "${WEB_DIR}/"
chown -R www-data:www-data "${WEB_DIR}"

cat > "${NGINX_SITE}" <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /var/www/ipztream;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /streams/ {
        alias /var/lib/ipztream/streams/;
        add_header Cache-Control "no-store" always;
        add_header Access-Control-Allow-Origin "*" always;
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|svg|png|jpg|jpeg|webp|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        try_files $uri =404;
    }
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sfn "${NGINX_SITE}" "/etc/nginx/sites-enabled/${APP_NAME}"
nginx -t
systemctl enable nginx
systemctl restart nginx

curl -fsS "http://127.0.0.1:3100/api/health" >/dev/null
curl -fsS "http://127.0.0.1/" >/dev/null

echo
echo "=============================================="
echo " IPZStream instalado correctamente"
echo " URL: http://<IP_DEL_CONTENEDOR>/"
echo " API pública: http://127.0.0.1:3100 (gateway seguro)"
echo " API interna: 127.0.0.1:3101 (no expuesta)"
echo " HLS: /streams/"
echo " FFmpeg: /usr/bin/ffmpeg"
echo " MariaDB: ${DB_NAME} / ${DB_USER}"
echo " Config DB: ${ENV_FILE}"
echo " Archivos: ${APP_DIR}"
echo " Web: ${WEB_DIR}"
echo "=============================================="
