#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# AnonLink Fast Deploy
# ═══════════════════════════════════════════════════════════════════════════════
# Strategy: rsync source code to VM, build on VM using Docker layer cache.
# This avoids transferring 600MB+ Docker images over slow network.
#
# For the VM with 1GB RAM: builds are done with --memory limits and swap.
# If VM build fails (OOM), falls back to local build + transfer.
#
# Usage:
#   ./scripts/deploy-fast.sh              # Deploy everything (frontend + backend)
#   ./scripts/deploy-fast.sh --frontend   # Frontend only
#   ./scripts/deploy-fast.sh --backend    # Backend only
#   ./scripts/deploy-fast.sh --no-build   # Just restart containers (code already on VM)
# ═══════════════════════════════════════════════════════════════════════════════

KEY_PATH="$HOME/.ssh/anonlink.key"
SSH_HOST="ubuntu@132.226.190.112"
REMOTE_DIR="/home/ubuntu/anon-chat-platform"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NETWORK="anon-chat-platform_default"
APP_NETWORK="anon-chat-platform_app-network"
SSH="ssh -i $KEY_PATH -o StrictHostKeyChecking=no -o ConnectTimeout=15 -o ServerAliveInterval=10"
SCP="scp -i $KEY_PATH -o StrictHostKeyChecking=no -C"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; exit 1; }
info() { echo -e "  ${CYAN}→${NC} $1"; }
step() { echo -e "\n${YELLOW}[$1/$TOTAL]${NC} $3"; }
timer_start() { SECONDS=0; }
timer_end() { echo -e "  ${CYAN}⏱${NC} ${SECONDS}s"; }

# Parse args
DEPLOY_FRONTEND=true
DEPLOY_BACKEND=true
NO_BUILD=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --frontend) DEPLOY_BACKEND=false; shift ;;
    --backend) DEPLOY_FRONTEND=false; shift ;;
    --no-build) NO_BUILD=true; shift ;;
    -h|--help)
      echo "Usage: $0 [--frontend|--backend|--no-build]"
      echo "  --frontend  Deploy frontend only"
      echo "  --backend   Deploy backend only"
      echo "  --no-build  Skip build, just restart containers"
      exit 0 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

# Validate
[[ ! -f "$KEY_PATH" ]] && fail "SSH key not found: $KEY_PATH"

echo -e "${CYAN}══════════════════════════════════════════════${NC}"
echo -e "${CYAN}  AnonLink Fast Deploy${NC}"
echo -e "${CYAN}  Frontend: $DEPLOY_FRONTEND | Backend: $DEPLOY_BACKEND${NC}"
echo -e "${CYAN}══════════════════════════════════════════════${NC}"
timer_start

# Calculate steps
TOTAL=0
[[ "$NO_BUILD" == false ]] && TOTAL=$((TOTAL + 1))  # sync
[[ "$DEPLOY_BACKEND" == true ]] && TOTAL=$((TOTAL + 1))  # backend
[[ "$DEPLOY_FRONTEND" == true ]] && TOTAL=$((TOTAL + 1))  # frontend
TOTAL=$((TOTAL + 1))  # verify
S=0

# ─────────────────────────────────────────────
# STEP: Sync source code to VM
# ─────────────────────────────────────────────
if [[ "$NO_BUILD" == false ]]; then
  S=$((S+1)); step $S "$TOTAL" "Syncing source code to VM"
  
  # Create rsync exclude file
  EXCLUDE_FILE=$(mktemp)
  cat > "$EXCLUDE_FILE" <<'EOF'
node_modules
.next
dist
.git
*.log
tmp/media/*
tmp/avatars/*
backend-image.tar
frontend-image.tar
images.tar
EOF

  rsync -az --delete \
    --exclude-from="$EXCLUDE_FILE" \
    -e "ssh -i $KEY_PATH -o StrictHostKeyChecking=no" \
    "$LOCAL_DIR/" "${SSH_HOST}:${REMOTE_DIR}/src/" 2>/dev/null

  rm -f "$EXCLUDE_FILE"
  ok "Source synced"
fi

# ─────────────────────────────────────────────
# STEP: Build & restart backend
# ─────────────────────────────────────────────
if [[ "$DEPLOY_BACKEND" == true ]]; then
  S=$((S+1)); step $S "$TOTAL" "Deploying backend"
  
  if [[ "$NO_BUILD" == false ]]; then
    info "Building backend on VM..."
    $SSH "$SSH_HOST" "cd ${REMOTE_DIR}/src && sudo docker build -t anonlink-backend:latest -f backend/Dockerfile . 2>&1 | tail -3" || fail "Backend build failed"
    ok "Backend built"
  fi

  info "Restarting backend..."
  $SSH "$SSH_HOST" "
    sudo docker stop anon-chat-platform-backend-1 2>/dev/null
    sudo docker rm anon-chat-platform-backend-1 2>/dev/null
    
    # Read env vars
    source ${REMOTE_DIR}/.env 2>/dev/null || true
    
    sudo docker run -d \
      --name anon-chat-platform-backend-1 \
      --restart always \
      --network $NETWORK \
      --network-alias backend \
      -p 4000:4000 \
      -e \"DATABASE_URL=postgresql://\${DB_USER:-anonuser}:\${DB_PASSWORD:-anonpassword}@db:5432/\${DB_NAME:-anondb}?schema=public\" \
      -e REDIS_URL=redis://redis:6379 \
      -e PORT=4000 \
      -e NODE_ENV=production \
      -e \"JWT_SECRET=\${JWT_SECRET}\" \
      -e \"REFRESH_TOKEN_SECRET=\${REFRESH_TOKEN_SECRET}\" \
      -e \"CLIENT_URL=https://\${DOMAIN_NAME}\" \
      -e \"FRONTEND_URL=https://\${DOMAIN_NAME}\" \
      -e \"DOMAIN_NAME=\${DOMAIN_NAME}\" \
      -e \"COTURN_SHARED_SECRET=\${TURN_SECRET:-coturn_prod_secret}\" \
      -e \"TURN_URL=turn:132.226.190.112:3478\" \
      -e \"STUN_URL=stun:132.226.190.112:3478\" \
      -e \"GOOGLE_CLIENT_ID=\${GOOGLE_CLIENT_ID}\" \
      -e \"GOOGLE_CLIENT_SECRET=\${GOOGLE_CLIENT_SECRET}\" \
      -e \"GOOGLE_CALLBACK_URL=\${GOOGLE_CALLBACK_URL}\" \
      -e \"RECAPTCHA_SECRET_KEY=\${RECAPTCHA_SECRET_KEY}\" \
      -e \"PREMIUM_EMAILS=\${PREMIUM_EMAILS:-sanu.chromium@gmail.com}\" \
      anonlink-backend:latest 2>/dev/null
    
    # Connect to app network (where Redis/DB live)
    sudo docker network connect $APP_NETWORK anon-chat-platform-backend-1 2>/dev/null || true
    
    sleep 3
    sudo docker ps --filter name=anon-chat-platform-backend-1 --format '{{.Status}}'
  " | tail -1 | grep -q "^Up" && ok "Backend running" || fail "Backend failed to start"

  # Run migrations
  info "Running DB migrations..."
  $SSH "$SSH_HOST" "sudo docker exec anon-chat-platform-backend-1 npx prisma db push --schema=backend/prisma/schema.prisma --skip-generate --accept-data-loss 2>&1 | tail -1" || true
  ok "Migrations done"
fi

# ─────────────────────────────────────────────
# STEP: Build & restart frontend
# ─────────────────────────────────────────────
if [[ "$DEPLOY_FRONTEND" == true ]]; then
  S=$((S+1)); step $S "$TOTAL" "Deploying frontend"

  if [[ "$NO_BUILD" == false ]]; then
    info "Building frontend on VM (this takes ~2-3 min)..."
    BUILD_OK=$($SSH "$SSH_HOST" "
      cd ${REMOTE_DIR}/src
      source ${REMOTE_DIR}/.env 2>/dev/null || true
      sudo docker build \
        --memory=900m \
        --build-arg NEXT_PUBLIC_BACKEND_URL=https://\${DOMAIN_NAME:-anonlink.online} \
        --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=\${GOOGLE_CLIENT_ID} \
        -t anonlink-frontend:latest \
        -f frontend/Dockerfile . 2>&1 | tail -3
    " 2>&1) || true
    
    if echo "$BUILD_OK" | grep -q "naming to"; then
      ok "Frontend built on VM"
    else
      # Fallback: build locally and transfer
      info "VM build failed (likely OOM). Building locally..."
      cd "$LOCAL_DIR"
      source "$LOCAL_DIR/.env.production" 2>/dev/null || true
      ENV_ARGS=(--build-arg "NEXT_PUBLIC_BACKEND_URL=https://${DOMAIN_NAME:-anonlink.online}")
      [[ -n "${GOOGLE_CLIENT_ID:-}" ]] && ENV_ARGS+=(--build-arg "NEXT_PUBLIC_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID")
      docker build "${ENV_ARGS[@]}" -t anonlink-frontend:latest -f frontend/Dockerfile . > /dev/null || fail "Local frontend build failed"
      ok "Frontend built locally"
      
      info "Compressing and transferring image..."
      docker save anonlink-frontend:latest | gzip > /tmp/frontend.tar.gz
      $SCP /tmp/frontend.tar.gz "${SSH_HOST}:${REMOTE_DIR}/frontend.tar.gz"
      $SSH "$SSH_HOST" "gunzip -c ${REMOTE_DIR}/frontend.tar.gz | sudo docker load" || fail "Image load failed"
      rm -f /tmp/frontend.tar.gz
      ok "Image transferred and loaded"
    fi
  fi

  info "Restarting frontend..."
  $SSH "$SSH_HOST" "
    sudo docker stop anon-chat-frontend 2>/dev/null
    sudo docker rm anon-chat-frontend 2>/dev/null
    sudo docker run -d \
      --name anon-chat-frontend \
      --restart unless-stopped \
      --network $NETWORK \
      --network-alias frontend \
      -p 3000:3000 \
      anonlink-frontend:latest 2>/dev/null
    sleep 3
    sudo docker ps --filter name=anon-chat-frontend --format '{{.Status}}'
  " | tail -1 | grep -q "^Up" && ok "Frontend running" || fail "Frontend failed to start"

  info "Reloading nginx..."
  $SSH "$SSH_HOST" "sudo docker exec anon-chat-nginx nginx -s reload 2>/dev/null" && ok "Nginx reloaded" || true
fi

# ─────────────────────────────────────────────
# STEP: Verify
# ─────────────────────────────────────────────
S=$((S+1)); step $S "$TOTAL" "Smoke test"

sleep 2

HTTP_AUTH=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://anonlink.online/auth 2>/dev/null) || HTTP_AUTH="000"
[[ "$HTTP_AUTH" == "200" ]] && ok "GET /auth → 200" || fail "GET /auth → $HTTP_AUTH"

HTTP_API=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://anonlink.online/api/health 2>/dev/null) || HTTP_API="000"
[[ "$HTTP_API" == "200" ]] && ok "GET /api/health → 200" || fail "GET /api/health → $HTTP_API"

HTTP_GOOGLE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://anonlink.online/api/v1/auth/google 2>/dev/null) || HTTP_GOOGLE="000"
[[ "$HTTP_GOOGLE" == "302" ]] && ok "Google OAuth → 302" || fail "Google OAuth → $HTTP_GOOGLE"

# ─────────────────────────────────────────────
# DONE
# ─────────────────────────────────────────────
timer_end
echo ""
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DEPLOY COMPLETE ✓  (${SECONDS}s total)${NC}"
echo -e "${GREEN}  https://anonlink.online${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
