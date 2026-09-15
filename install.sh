#!/usr/bin/env bash
set -euo pipefail

APP_NAME="ipztream"
APP_DIR="/opt/${APP_NAME}"
WEB_DIR="/var/www/${APP_NAME}"
NGINX_SITE="/etc/nginx/sites-available/${APP_NAME}"
API_SERVICE="/etc/systemd/system/${APP_NAME}-api.service"
ENV_DIR="/etc/${APP_NAME}"
ENV_FILE="${ENV_DIR}/${APP_NAME}-api.env"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_NAME="${IPZTREAM_DB_NAME:-ipztream}"
DB_USER="${IPZTREAM_DB_USER:-ipztream}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Ejecuta este instalador como root."
  exit 1
fi

if [[ ! -f "${SOURCE_DIR}/package.json" ]]; then
  echo "No se encontró package.json. Ejecuta el instalador desde la raíz del proyecto IPZStream."
  exit 1
fi

echo "==> Instalando dependencias del sistema..."
apt-get update
apt-get install -y ca-certificates curl nginx postgresql postgresql-client

if ! command -v node >/dev/null 2>&1 || ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) < 20)' ; then
  echo "==> Instalando Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

node --version
npm --version

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

echo "==> Preparando PostgreSQL..."
systemctl enable --now postgresql

if ! runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  DB_PASSWORD="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)"
  runuser -u postgres -- psql -v ON_ERROR_STOP=1 -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';"
else
  DB_PASSWORD="$(awk -F= '/^DATABASE_URL=/{sub(/^.*:\/\//,"");sub(/@.*$/,"");print}' "${ENV_FILE}" 2>/dev/null || true)"
  if [[ -z "${DB_PASSWORD}" ]]; then
    DB_PASSWORD="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)"
  fi
  runuser -u postgres -- psql -v ON_ERROR_STOP=1 -c "ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';"
fi

if ! runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  runuser -u postgres -- createdb -O "${DB_USER}" "${DB_NAME}"
else
  runuser -u postgres -- psql -v ON_ERROR_STOP=1 -c "ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};"
fi

mkdir -p "${ENV_DIR}"
cat > "${ENV_FILE}" <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}
IPZTREAM_DB_POOL_SIZE=10
EOF
chown root:www-data "${ENV_FILE}"
chmod 640 "${ENV_FILE}"

# Los JSON se conservan como respaldo/fuente de migración inicial.
mkdir -p "${APP_DIR}/data"
chown -R www-data:www-data "${APP_DIR}/data"

echo "==> Instalando servicio de API..."
cp "${APP_DIR}/deploy/ipztream-api.service" "${API_SERVICE}"
systemctl daemon-reload
systemctl enable "${APP_NAME}-api"
systemctl restart "${APP_NAME}-api"

for attempt in {1..15}; do
  if curl -fsS "http://127.0.0.1:3100/api/health" | grep -q '"ok":true'; then
    break
  fi
  sleep 1
done

if ! curl -fsS "http://127.0.0.1:3100/api/health" | grep -q '"ok":true'; then
  echo "La API de IPZStream no inició correctamente."
  systemctl status "${APP_NAME}-api" --no-pager || true
  journalctl -u "${APP_NAME}-api" -n 50 --no-pager || true
  exit 1
fi

echo "==> Verificando migración inicial..."
curl -fsS "http://127.0.0.1:3100/api/nodes" >/dev/null
curl -fsS "http://127.0.0.1:3100/api/channels" >/dev/null
curl -fsS "http://127.0.0.1:3100/api/packages" >/dev/null


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

echo
echo "=============================================="
echo " IPZStream instalado correctamente"
echo " URL: http://<IP_DEL_CONTENEDOR>/"
echo " API: http://127.0.0.1:3100 (solo local)"
echo " PostgreSQL: ${DB_NAME} / ${DB_USER}"
echo " Config DB: ${ENV_FILE}"
echo " Archivos: ${APP_DIR}"
echo " Web: ${WEB_DIR}"
echo "=============================================="
