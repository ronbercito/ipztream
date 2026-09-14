#!/usr/bin/env bash
set -euo pipefail

APP_NAME="ipztream"
APP_DIR="/opt/${APP_NAME}"
WEB_DIR="/var/www/${APP_NAME}"
NGINX_SITE="/etc/nginx/sites-available/${APP_NAME}"
API_SERVICE="/etc/systemd/system/${APP_NAME}-api.service"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
apt-get install -y ca-certificates curl nginx

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

echo "==> Preparando almacenamiento de la API..."
mkdir -p "${APP_DIR}/data"
touch "${APP_DIR}/data/nodes.json"
chown -R www-data:www-data "${APP_DIR}/data"

if [[ ! -f "${APP_DIR}/data/nodes.json" || ! -s "${APP_DIR}/data/nodes.json" ]]; then
  cat > "${APP_DIR}/data/nodes.json" <<'JSON'
[
  {"id":"node-01","name":"Nodo 01 - Lima","status":"En línea","ip":"192.168.10.21","region":"Lima","cpu":22,"ram":41,"capacity":"10 Gbps"},
  {"id":"node-02","name":"Nodo 02 - Arequipa","status":"En línea","ip":"192.168.10.22","region":"Arequipa","cpu":18,"ram":36,"capacity":"10 Gbps"},
  {"id":"node-03","name":"Nodo 03 - Trujillo","status":"En línea","ip":"192.168.10.23","region":"Trujillo","cpu":27,"ram":48,"capacity":"5 Gbps"},
  {"id":"node-05","name":"Nodo 05 - Piura","status":"Fuera de línea","ip":"192.168.10.25","region":"Piura","cpu":null,"ram":null,"capacity":"5 Gbps"}
]
JSON
  chown www-data:www-data "${APP_DIR}/data/nodes.json"
fi

echo "==> Instalando servicio de API..."
cp "${APP_DIR}/deploy/ipztream-api.service" "${API_SERVICE}"
systemctl daemon-reload
systemctl enable "${APP_NAME}-api"
systemctl restart "${APP_NAME}-api"

for attempt in {1..10}; do
  if curl -fsS "http://127.0.0.1:3100/api/health" >/dev/null; then
    break
  fi
  sleep 1
done

if ! curl -fsS "http://127.0.0.1:3100/api/health" >/dev/null; then
  echo "La API de IPZStream no inició correctamente."
  systemctl status "${APP_NAME}-api" --no-pager || true
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
echo " Archivos: ${APP_DIR}"
echo " Web: ${WEB_DIR}"
echo "=============================================="
