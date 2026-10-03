#!/usr/bin/env bash
set -euo pipefail

MAIN_URL="${IPZTREAM_MAIN_URL:-}"
NODE_TOKEN="${IPZTREAM_NODE_REGISTRATION_TOKEN:-}"
NODE_ID="${IPZTREAM_NODE_ID:-ipz-node-$(hostname -s)}"
NODE_NAME="${IPZTREAM_NODE_NAME:-$(hostname -f 2>/dev/null || hostname)}"
NODE_REGION="${IPZTREAM_NODE_REGION:-Local}"
NODE_ROLE="${IPZTREAM_NODE_ROLE:-sub}"
NODE_IP="${IPZTREAM_NODE_IP:-$(hostname -I | awk '{print $1}')}"
NODE_API_BASE_URL="${IPZTREAM_NODE_API_BASE_URL:-http://${NODE_IP}:3100}"
NODE_CAPACITY="${IPZTREAM_NODE_CAPACITY:-Auto}"
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

if [[ ! "${NODE_ROLE}" =~ ^(sub|edge)$ ]]; then
  echo "IPZTREAM_NODE_ROLE debe ser sub o edge para un nodo remoto." >&2
  exit 1
fi

for command in curl python3 free df awk systemctl; do
  if ! command -v "${command}" >/dev/null 2>&1; then
    echo "Falta dependencia requerida: ${command}" >&2
    exit 1
  fi
done

mkdir -p "${INSTALL_DIR}" "${ENV_DIR}"
cat > "${ENV_FILE}" <<EOF
IPZTREAM_MAIN_URL=${MAIN_URL%/}
IPZTREAM_NODE_REGISTRATION_TOKEN=${NODE_TOKEN}
IPZTREAM_NODE_ID=${NODE_ID}
IPZTREAM_NODE_NAME=${NODE_NAME}
IPZTREAM_NODE_REGION=${NODE_REGION}
IPZTREAM_NODE_ROLE=${NODE_ROLE}
IPZTREAM_NODE_IP=${NODE_IP}
IPZTREAM_NODE_API_BASE_URL=${NODE_API_BASE_URL}
IPZTREAM_NODE_CAPACITY=${NODE_CAPACITY}
EOF
chmod 600 "${ENV_FILE}"

cat > "${INSTALL_DIR}/heartbeat.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
source /etc/ipztream/ipztream-node.env

cpu_sample() {
  local user1 nice1 system1 idle1 iowait1 irq1 softirq1 steal1
  local user2 nice2 system2 idle2 iowait2 irq2 softirq2 steal2
  read -r _ user1 nice1 system1 idle1 iowait1 irq1 softirq1 steal1 _ < /proc/stat
  sleep 0.2
  read -r _ user2 nice2 system2 idle2 iowait2 irq2 softirq2 steal2 _ < /proc/stat
  local idle_delta=$(( (idle2 + iowait2) - (idle1 + iowait1) ))
  local total1=$((user1 + nice1 + system1 + idle1 + iowait1 + irq1 + softirq1 + steal1))
  local total2=$((user2 + nice2 + system2 + idle2 + iowait2 + irq2 + softirq2 + steal2))
  local total_delta=$((total2 - total1))
  if (( total_delta <= 0 )); then
    echo 0
  else
    awk -v total="${total_delta}" -v idle="${idle_delta}" 'BEGIN { printf "%.1f", ((total-idle)/total)*100 }'
  fi
}

cpu="$(cpu_sample)"
ram="$(free | awk '/Mem:/ {if($2>0) printf "%.1f", ($3/$2)*100; else print 0}')"
disk="$(df -P / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')"
load="$(awk '{print $1}' /proc/loadavg)"
uptime_s="$(cut -d. -f1 /proc/uptime)"
active_streams="$(pgrep -fc '[f]fmpeg' 2>/dev/null || true)"
active_streams="${active_streams:-0}"
node_ip="${IPZTREAM_NODE_IP:-$(hostname -I | awk '{print $1}')}"
export cpu ram disk load uptime_s active_streams node_ip

payload="$(python3 - <<'PY'
import json, os
def num(name, default=0):
    try:
        return float(os.environ.get(name, default))
    except Exception:
        return default
payload = {
    "id": os.environ["IPZTREAM_NODE_ID"],
    "name": os.environ["IPZTREAM_NODE_NAME"],
    "role": os.environ.get("IPZTREAM_NODE_ROLE", "sub"),
    "ip": os.environ["node_ip"],
    "apiBaseUrl": os.environ.get("IPZTREAM_NODE_API_BASE_URL", ""),
    "region": os.environ.get("IPZTREAM_NODE_REGION", "Local"),
    "capacity": os.environ.get("IPZTREAM_NODE_CAPACITY", "Auto"),
    "version": "node-0.2",
    "capabilities": ["live", "hls", "ffmpeg"],
    "metrics": {
        "cpu": num("cpu"),
        "ram": num("ram"),
        "disk": num("disk"),
        "load": num("load"),
        "activeStreams": int(num("active_streams")),
        "uptime": int(num("uptime_s")),
    },
}
print(json.dumps(payload, separators=(",", ":")))
PY
)"

heartbeat_tmp="$(mktemp)"
trap 'rm -f "${heartbeat_tmp}"' EXIT
heartbeat_code="$(curl -sS -o "${heartbeat_tmp}" -w '%{http_code}' -X POST "${IPZTREAM_MAIN_URL}/api/stream-nodes/${IPZTREAM_NODE_ID}/heartbeat" \
  -H "Content-Type: application/json" \
  -H "X-IPZStream-Node-Token: ${IPZTREAM_NODE_REGISTRATION_TOKEN}" \
  -d "${payload}" || true)"

if [[ "${heartbeat_code}" == "404" ]]; then
  register_response="$(curl -fsS -X POST "${IPZTREAM_MAIN_URL}/api/stream-nodes/register" \
    -H "Content-Type: application/json" \
    -H "X-IPZStream-Node-Token: ${IPZTREAM_NODE_REGISTRATION_TOKEN}" \
    -d "${payload}")"
  canonical_id="$(printf '%s' "${register_response}" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("canonicalId") or d.get("node",{}).get("id") or "")' 2>/dev/null || true)"
  if [[ -n "${canonical_id}" && "${canonical_id}" != "${IPZTREAM_NODE_ID}" ]]; then
    sed -i "s#^IPZTREAM_NODE_ID=.*#IPZTREAM_NODE_ID=${canonical_id}#" /etc/ipztream/ipztream-node.env
    IPZTREAM_NODE_ID="${canonical_id}"
  fi
  curl -fsS -X POST "${IPZTREAM_MAIN_URL}/api/stream-nodes/${IPZTREAM_NODE_ID}/heartbeat" \
    -H "Content-Type: application/json" \
    -H "X-IPZStream-Node-Token: ${IPZTREAM_NODE_REGISTRATION_TOKEN}" \
    -d "${payload}" >/dev/null
elif [[ "${heartbeat_code}" == "200" ]]; then
  canonical_id="$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(d.get("canonicalId") or d.get("node",{}).get("id") or "")' "${heartbeat_tmp}" 2>/dev/null || true)"
  if [[ -n "${canonical_id}" && "${canonical_id}" != "${IPZTREAM_NODE_ID}" ]]; then
    sed -i "s#^IPZTREAM_NODE_ID=.*#IPZTREAM_NODE_ID=${canonical_id}#" /etc/ipztream/ipztream-node.env
    IPZTREAM_NODE_ID="${canonical_id}"
  fi
else
  cat "${heartbeat_tmp}" >&2 || true
  echo "Heartbeat rechazado por Main (HTTP ${heartbeat_code})." >&2
  exit 1
fi
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
systemctl start ipztream-node-heartbeat.service

echo "Nodo IPZStream configurado: ${NODE_ID} -> ${MAIN_URL%/}"
echo "Heartbeat: cada 60 s · offline esperado después del umbral configurado en el Main."
