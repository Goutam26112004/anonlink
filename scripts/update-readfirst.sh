#!/bin/bash
# scripts/update-readfirst.sh
# Refreshes readfirst.md with live site status and VM data
# Usage: ./scripts/update-readfirst.sh [--skip-vm]
set -euo pipefail

SKIP_VM=false
[[ "${1:-}" == "--skip-vm" ]] && SKIP_VM=true

TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M UTC')
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
READFIRST="$LOCAL_DIR/readfirst.md"
PY_SCRIPT="$LOCAL_DIR/scripts/update_readfirst.py"

echo "=== Updating readfirst.md ==="

# Live site checks
echo "Checking live site..."
LANDING_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://anonlink.online 2>/dev/null || echo "FAIL")
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://anonlink.online/api/health 2>/dev/null || echo "FAIL")
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://anonlink.online/health 2>/dev/null || echo "FAIL")
SSL_EXPIRY=$(echo | openssl s_client -servername anonlink.online -connect anonlink.online:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "unknown")

# VM data
VM_UPTIME="?"
VM_LOAD="?"
VM_DISK="?"
VM_MEM="?"

if [[ "$SKIP_VM" == false && -f "$HOME/.ssh/anonlink.key" ]]; then
  echo "Fetching VM data..."
  SSH_CMD="ssh -i $HOME/.ssh/anonlink.key -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@132.226.190.112"
  VM_UPTIME=$($SSH_CMD "uptime -p" 2>/dev/null || echo "UNREACHABLE")
  VM_LOAD=$($SSH_CMD "cat /proc/loadavg | cut -d' ' -f1-3" 2>/dev/null || echo "?")
  VM_DISK=$($SSH_CMD "df -h / | tail -1 | awk '{print \$3 \"/\" \$2 \" (\" \$5 \")\"}'" 2>/dev/null || echo "?")
  VM_MEM=$($SSH_CMD "free -h | grep Mem | awk '{print \$3 \"/\" \$2}'" 2>/dev/null || echo "?")
  echo "VM data collected"
else
  echo "Skipping VM data"
fi

# Git info
GIT_HEAD=$(git -C "$LOCAL_DIR" log --oneline -1 2>/dev/null || echo "unknown")

# Build status strings
LANDING_STATUS="❌ $LANDING_CODE"; [[ "$LANDING_CODE" == "200" ]] && LANDING_STATUS="✅ UP"
API_STATUS="❌ $API_HEALTH"; [[ "$API_HEALTH" == "200" ]] && API_STATUS="✅ UP"
HEALTH_STATUS="❌ $HEALTH_CODE"; [[ "$HEALTH_CODE" == "200" ]] && HEALTH_STATUS="✅ UP"

# Run Python updater
python3 "$PY_SCRIPT" \
  "$READFIRST" "$TIMESTAMP" \
  "$LANDING_STATUS" "$API_STATUS" "$HEALTH_STATUS" \
  "$SSL_EXPIRY" "$GIT_HEAD" \
  "$VM_UPTIME" "$VM_LOAD" "$VM_DISK" "$VM_MEM"

echo "=== readfirst.md updated at $TIMESTAMP ==="
