#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MAIN_URL="${IPZTREAM_MAIN_URL:-}"
NODE_TOKEN="${IPZTREAM_NODE_REGISTRATION_TOKEN:-}"
NODE_ID="${IPZTREAM_NODE_ID:-ipz-node-$(hostname -s)}"
NODE_NAME="${IPZTREAM_NODE_NAME:-$(hostname -f 2>/dev/null || hostname)}"
NODE_REGION="${IPZTREAM_NODE_REGION:-Local}"
NODE_ROLE="${IPZTREAM_NODE_ROLE:-sub}"
NODE_IP="${IPZTREAM_NODE_IP:-$(hostname -I | awk '{print $1}')}"
NODE_AGENT_PORT="${IPZTREAM_NODE_AGENT_PORT:-3200}"
NODE_API_BASE_URL="${IPZTREAM_NODE_API_BASE_URL:-http://${NODE_IP}:${NODE_AGENT_PORT}}"
NODE_CAPACITY="${IPZTREAM_NODE_CAPACITY:-Auto}"
INSTALL_DIR="${IPZTREAM_NODE_DIR:-/opt/ipztream-node}"
STATE_DIR="/var/lib/ipztream-node"
STREAM_DIR="${STATE_DIR}/streams"
ENV_DIR="/etc/ipztream"
ENV_FILE="${ENV_DIR}/ipztream-node.env"
AGENT_USER="ipztream-node"

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
if [[ ! "${NODE_AGENT_PORT}" =~ ^[0-9]+$ ]] || (( NODE_AGENT_PORT < 1 || NODE_AGENT_PORT > 65535 )); then
  echo "IPZTREAM_NODE_AGENT_PORT no válido." >&2
  exit 1
fi
if [[ ! -f "${SOURCE_ROOT}/server/node-agent.js" || ! -f "${SOURCE_ROOT}/server/node-stream-runtime.js" ]]; then
  echo "Faltan server/node-agent.js o server/node-stream-runtime.js. Ejecuta este instalador desde un checkout IPZStream 0.4.7 o superior." >&2
  exit 1
fi

if [[ -r /etc/os-release ]]; then . /etc/os-release; fi
if ! command -v node >/dev/null 2>&1 || ! command -v ffmpeg >/dev/null 2>&1 || ! command -v curl >/dev/null 2>&1 || ! command -v python3 >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    echo "==> Instalando dependencias del agente SUB..."
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs ffmpeg curl python3
  else
    echo "Faltan Node.js/FFmpeg/curl/python3 y no se encontró apt-get." >&2
    exit 1
  fi
fi
for command in node ffmpeg curl python3 free df awk systemctl; do
  command -v "${command}" >/dev/null 2>&1 || { echo "Falta dependencia requerida: ${command}" >&2; exit 1; }
done
if ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) < 20)'; then
  if ! command -v apt-get >/dev/null 2>&1; then
    echo "Node.js 20+ es requerido para el agente SUB." >&2
    exit 1
  fi
  echo "==> Actualizando Node.js a 22 LTS..."
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl gnupg
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
fi

if ! id -u "${AGENT_USER}" >/dev/null 2>&1; then
  useradd --system --home "${STATE_DIR}" --create-home --shell /usr/sbin/nologin "${AGENT_USER}"
fi
mkdir -p "${INSTALL_DIR}" "${ENV_DIR}" "${STREAM_DIR}"
install -m 0644 "${SOURCE_ROOT}/server/node-agent.js" "${INSTALL_DIR}/node-agent.js"
install -m 0644 "${SOURCE_ROOT}/server/node-stream-runtime.js" "${INSTALL_DIR}/node-stream-runtime.js"
cat > "${INSTALL_DIR}/package.json" <<'EOF'
{"type":"module","private":true}
EOF
chown -R root:root "${INSTALL_DIR}"
chown -R "${AGENT_USER}:${AGENT_USER}" "${STATE_DIR}"
chmod 750 "${STATE_DIR}" "${STREAM_DIR}"

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
IPZTREAM_NODE_AGENT_HOST=0.0.0.0
IPZTREAM_NODE_AGENT_PORT=${NODE_AGENT_PORT}
IPZTREAM_NODE_SYNC_INTERVAL_MS=${IPZTREAM_NODE_SYNC_INTERVAL_MS:-15000}
IPZTREAM_NODE_STREAM_ROOT=${STREAM_DIR}
IPZTREAM_NODE_STATE_FILE=${STATE_DIR}/desired-streams.json
IPZTREAM_FFMPEG_BIN=/usr/bin/ffmpeg
EOF
chown root:"${AGENT_USER}" "${ENV_FILE}"
chmod 640 "${ENV_FILE}"

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
  if (( total_delta <= 0 )); then echo 0; else awk -v total="${total_delta}" -v idle="${idle_delta}" 'BEGIN { printf "%.1f", ((total-idle)/total)*100 }'; fi
}
sync_canonical_id() {
  local canonical_id="$1"
  if [[ -n "${canonical_id}" && "${canonical_id}" != "${IPZTREAM_NODE_ID}" ]]; then
    sed -i "s#^IPZTREAM_NODE_ID=.*#IPZTREAM_NODE_ID=${canonical_id}#" /etc/ipztream/ipztream-node.env
    IPZTREAM_NODE_ID="${canonical_id}"
    systemctl try-restart ipztream-node-agent.service >/dev/null 2>&1 || true
  fi
}

cpu="$(cpu_sample)"
ram="$(free | awk '/Mem:/ {if($2>0) printf "%.1f", ($3/$2)*100; else print 0}')"
disk="$(df -P / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')"
load="$(awk '{print $1}' /proc/loadavg)"
uptime_s="$(cut -d. -f1 /proc/uptime)"
active_streams="$(pgrep -u ipztream-node -fc '[f]fmpeg' 2>/dev/null || true)"
active_streams="${active_streams:-0}"
node_ip="${IPZTREAM_NODE_IP:-$(hostname -I | awk '{print $1}')}"
export cpu ram disk load uptime_s active_streams node_ip

payload="$(python3 - <<'PY'
import json, os
def num(name, default=0):
    try: return float(os.environ.get(name, default))
    except Exception: return default
payload={
  "id":os.environ["IPZTREAM_NODE_ID"],
  "name":os.environ["IPZTREAM_NODE_NAME"],
  "role":os.environ.get("IPZTREAM_NODE_ROLE","sub"),
  "ip":os.environ["node_ip"],
  "apiBaseUrl":os.environ.get("IPZTREAM_NODE_API_BASE_URL",""),
  "region":os.environ.get("IPZTREAM_NODE_REGION","Local"),
  "capacity":os.environ.get("IPZTREAM_NODE_CAPACITY","Auto"),
  "version":"node-agent-0.4.7",
  "capabilities":["live","hls","ffmpeg","remux","transcode"],
  "metrics":{"cpu":num("cpu"),"ram":num("ram"),"disk":num("disk"),"load":num("load"),"activeStreams":int(num("active_streams")),"uptime":int(num("uptime_s"))}
}
print(json.dumps(payload,separators=(",",":")))
PY
)"

heartbeat_tmp="$(mktemp)"
trap 'rm -f "${heartbeat_tmp}"' EXIT
heartbeat_code="$(curl -sS -o "${heartbeat_tmp}" -w '%{http_code}' -X POST "${IPZTREAM_MAIN_URL}/api/stream-nodes/${IPZTREAM_NODE_ID}/heartbeat" \
  -H "Content-Type: application/json" -H "X-IPZStream-Node-Token: ${IPZTREAM_NODE_REGISTRATION_TOKEN}" -d "${payload}" || true)"

if [[ "${heartbeat_code}" == "404" ]]; then
  register_response="$(curl -fsS -X POST "${IPZTREAM_MAIN_URL}/api/stream-nodes/register" \
    -H "Content-Type: application/json" -H "X-IPZStream-Node-Token: ${IPZTREAM_NODE_REGISTRATION_TOKEN}" -d "${payload}")"
  canonical_id="$(printf '%s' "${register_response}" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("canonicalId") or d.get("node",{}).get("id") or "")' 2>/dev/null || true)"
  sync_canonical_id "${canonical_id}"
  curl -fsS -X POST "${IPZTREAM_MAIN_URL}/api/stream-nodes/${IPZTREAM_NODE_ID}/heartbeat" \
    -H "Content-Type: application/json" -H "X-IPZStream-Node-Token: ${IPZTREAM_NODE_REGISTRATION_TOKEN}" -d "${payload}" >/dev/null
elif [[ "${heartbeat_code}" == "200" ]]; then
  canonical_id="$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(d.get("canonicalId") or d.get("node",{}).get("id") or "")' "${heartbeat_tmp}" 2>/dev/null || true)"
  sync_canonical_id "${canonical_id}"
else
  cat "${heartbeat_tmp}" >&2 || true
  echo "Heartbeat rechazado por Main (HTTP ${heartbeat_code})." >&2
  exit 1
fi
EOF
chmod 755 "${INSTALL_DIR}/heartbeat.sh"

cat > /etc/systemd/system/ipztream-node-agent.service <<EOF
[Unit]
Description=IPZStream Node Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${AGENT_USER}
Group=${AGENT_USER}
WorkingDirectory=${INSTALL_DIR}
EnvironmentFile=${ENV_FILE}
ExecStart=/usr/bin/node ${INSTALL_DIR}/node-agent.js
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=${STATE_DIR}

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/ipztream-node-heartbeat.service <<EOF
[Unit]
Description=IPZStream Node heartbeat
After=network-online.target ipztream-node-agent.service
Wants=network-online.target ipztream-node-agent.service

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
systemctl enable --now ipztream-node-agent.service
systemctl enable --now ipztream-node-heartbeat.timer
systemctl start ipztream-node-heartbeat.service

agent_ok=0
for _ in {1..15}; do
  if curl -fsS "http://127.0.0.1:${NODE_AGENT_PORT}/health" >/dev/null; then agent_ok=1; break; fi
  sleep 1
done
if [[ "${agent_ok}" -ne 1 ]]; then
  echo "ERROR: ipztream-node-agent no respondió." >&2
  systemctl status ipztream-node-agent.service --no-pager -l || true
  journalctl -u ipztream-node-agent.service -n 80 --no-pager || true
  exit 1
fi

echo "Nodo IPZStream configurado: ${NODE_ID} -> ${MAIN_URL%/}"
echo "Agente: ${NODE_API_BASE_URL} · heartbeat cada 60 s"
echo "Asegura conectividad TCP desde el Main hacia el puerto ${NODE_AGENT_PORT} del SUB."
