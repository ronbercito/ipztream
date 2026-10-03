#!/usr/bin/env bash
set -euo pipefail

MAIN_URL="${IPZTREAM_MAIN_URL:-}"
NODE_TOKEN="${IPZTREAM_NODE_REGISTRATION_TOKEN:-}"
NODE_ID="${IPZTREAM_NODE_ID:-ipz-node-$(hostname -s)}"
NODE_NAME="${IPZTREAM_NODE_NAME:-$(hostname -f 2>/dev/null || hostname)}"
NODE_REGION="${IPZTREAM_NODE_REGION:-Local}"
NODE_ROLE="${IPZTREAM_NODE_ROLE:-sub}"
NODE_API_BASE_URL="${IPZTREAM_NODE_API_BASE_URL:-http://$(hostname -I | awk '{print $1}'):3100}"
INSTALL_DIR="${IPZTREAM_NODE_DIR:-/opt/ipztream-node}"
ENV_DIR="/etc/ipztream"
ENV_FILE="${ENV_DIR}/ipztream-node.env"

if [[ -z "${MAIN_URL}" || -z "${NODE_TOKEN}" ]]; then
  echo "Uso: IPZTREAM_MAIN_URL=http://MAIN:3100 IPZTREAM_NODE_REGISTRATION_TOKEN=TOKEN bash scripts/install-node.sh" >&2
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Ejecuta como root." >&2
  exit 1
fi

mkdir -p "${INSTALL_DIR}" "${ENV_DIR}"
cat > "${ENV_FILE}" <<EOF
IPZTREAM_MAIN_URL=${MAIN_URL%/}
IPZTREAM_NODE_REGISTRATION_TOKEN=${NODE_TOKEN}
IPZTREAM_NODE_ID=${NODE_ID}
IPZTREAM_NODE_NAME=${NODE_NAME}
IPZTREAM_NODE_REGION=${NODE_REGION}
IPZTREAM_NODE_ROLE=${NODE_ROLE}
IPZTREAM_NODE_API_BASE_URL=${NODE_API_BASE_URL}
EOF
chmod 600 "${ENV_FILE}"

cat > "${INSTALL_DIR}/heartbeat.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
source /etc/ipztream/ipztream-node.env
cpu="$(awk '/cpu /{u=$2+$4; t=$2+$4+$5; if(t>0) printf "%.0f", (u/t)*100; else print 0}' /proc/stat)"
ram="$(free | awk '/Mem:/ {if($2>0) printf "%.0f", ($3/$2)*100; else print 0}')"
disk="$(df -P / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')"
load="$(awk '{print $1}' /proc/loadavg)"
uptime_s="$(cut -d. -f1 /proc/uptime)"
payload="$(printf '{"id":"%s","name":"%s","role":"%s","ip":"%s","apiBaseUrl":"%s","region":"%s","version":"node-0.1","capabilities":["live","hls","ffmpeg"],"metrics":{"cpu":%s,"ram":%s,"disk":%s,"load":%s,"uptime":%s}}' "$IPZTREAM_NODE_ID" "$IPZTREAM_NODE_NAME" "$IPZTREAM_NODE_ROLE" "$(hostname -I | awk '{print $1}')" "$IPZTREAM_NODE_API_BASE_URL" "$IPZTREAM_NODE_REGION" "$cpu" "$ram" "$disk" "$load" "$uptime_s")"
curl -fsS -X POST "${IPZTREAM_MAIN_URL}/api/stream-nodes/register" -H "Content-Type: application/json" -H "X-IPZStream-Node-Token: ${IPZTREAM_NODE_REGISTRATION_TOKEN}" -d "$payload" >/dev/null || true
curl -fsS -X POST "${IPZTREAM_MAIN_URL}/api/stream-nodes/${IPZTREAM_NODE_ID}/heartbeat" -H "Content-Type: application/json" -H "X-IPZStream-Node-Token: ${IPZTREAM_NODE_REGISTRATION_TOKEN}" -d "$payload" >/dev/null
EOF
chmod 755 "${INSTALL_DIR}/heartbeat.sh"

cat > /etc/systemd/system/ipztream-node-heartbeat.service <<EOF
[Unit]
Description=IPZStream Node heartbeat
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
EnvironmentFile=${ENV_FILE}
ExecStart=${INSTALL_DIR}/heartbeat.sh
EOF

cat > /etc/systemd/system/ipztream-node-heartbeat.timer <<EOF
[Unit]
Description=Run IPZStream Node heartbeat every minute

[Timer]
OnBootSec=20
OnUnitActiveSec=60
AccuracySec=10
Unit=ipztream-node-heartbeat.service

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now ipztream-node-heartbeat.timer
systemctl start ipztream-node-heartbeat.service || true

echo "Nodo IPZStream configurado: ${NODE_ID} -> ${MAIN_URL%/}"
