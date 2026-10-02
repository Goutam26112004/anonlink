#!/bin/bash
set -euo pipefail

KEY_PATH="$HOME/.ssh/anonlink.key"
SSH_HOST="ubuntu@132.226.190.112"
REMOTE_DIR="/home/ubuntu/anon-chat-platform"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IMAGES_TAR="images.tar"
NETWORK_NAME="anon-chat-platform_default"
SSH_OPTS="-i $KEY_PATH -o StrictHostKeyChecking=no -o ConnectTimeout=10"

SERVICE="all"
SKIP_BUILD=false
DRY_RUN=false

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; GRAY='\033[0;37m'; MAGENTA='\033[0;35m'; NC='\033[0m'
ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; exit 1; }
info() { echo -e "  ${CYAN}→${NC} $1"; }
step() { echo -e "\n${YELLOW}[$1/$2]${NC} $3"; }

while [[ $# -gt 0 ]]; do
  case $1 in
    --service) SERVICE="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help)
      echo "Usage: $0 [--service all|backend|frontend] [--skip-build] [--dry-run]"
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

ssh_cmd() { ssh $SSH_OPTS "$SSH_HOST" "$@" 2>&1; }

if [[ ! -f "$KEY_PATH" ]]; then fail "SSH key not found at $KEY_PATH"; fi

if [[ "$DRY_RUN" == false && "$SKIP_BUILD" == false ]]; then
  if ! command -v docker &>/dev/null; then fail "Docker not found."; fi
fi

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  AnonLink Deploy (Local Build -> VM Load)${NC}"
echo -e "${CYAN}============================================${NC}"
[[ "$DRY_RUN" == true ]] && echo -e "${MAGENTA}  MODE: DRY RUN${NC}" && echo ""

TOTAL_STEPS=7
C=0

if [[ "$DRY_RUN" == true ]]; then
  echo -e "${GRAY}Would build and deploy images for: $SERVICE${NC}"
  echo -e "${GRAY}Each VM step is isolated with verification.${NC}"
  echo -e "${GRAY}Post-deploy: smoke test (HTTP 200 + Google OAuth 302)${NC}"
  exit 0
fi

cleanup() { rm -f "$LOCAL_DIR/$IMAGES_TAR"; }
trap cleanup EXIT

# ─────────────────────────────────────────────
# BUILD
# ─────────────────────────────────────────────
if [[ "$SKIP_BUILD" == false ]]; then
  C=$((C+1)); step $C $TOTAL_STEPS "Building images"

  if [[ "$SERVICE" == "all" || "$SERVICE" == "backend" ]]; then
    info "Building backend ..."
    docker build -t anonlink-backend:latest -f "$LOCAL_DIR/backend/Dockerfile" "$LOCAL_DIR" > /dev/null && ok "Backend built" || fail "Backend build failed"
  fi

  if [[ "$SERVICE" == "all" || "$SERVICE" == "frontend" ]]; then
    info "Building frontend ..."
    ENV_ARGS=()
    ENV_FILE="$LOCAL_DIR/.env.production"
    if [[ -f "$ENV_FILE" ]]; then
      while IFS= read -r line; do
        [[ "$line" =~ ^GOOGLE_CLIENT_ID=(.+)$ ]] && ENV_ARGS+=(--build-arg "NEXT_PUBLIC_GOOGLE_CLIENT_ID=${BASH_REMATCH[1]}")
        [[ "$line" =~ ^DOMAIN_NAME=(.+)$ ]] && ENV_ARGS+=(--build-arg "NEXT_PUBLIC_BACKEND_URL=https://${BASH_REMATCH[1]}")
      done < "$ENV_FILE"
    fi
    docker build "${ENV_ARGS[@]}" -t anonlink-frontend:latest -f "$LOCAL_DIR/frontend/Dockerfile" "$LOCAL_DIR" > /dev/null && ok "Frontend built" || fail "Frontend build failed"
  fi
else
  info "Skipping build (--skip-build)"
fi

# ─────────────────────────────────────────────
# SAVE
# ─────────────────────────────────────────────
C=$((C+1)); step $C $TOTAL_STEPS "Saving images to tarball"
case "$SERVICE" in
  all)      docker save anonlink-backend:latest anonlink-frontend:latest -o "$LOCAL_DIR/$IMAGES_TAR" ;;
  backend)  docker save anonlink-backend:latest -o "$LOCAL_DIR/$IMAGES_TAR" ;;
  frontend) docker save anonlink-frontend:latest -o "$LOCAL_DIR/$IMAGES_TAR" ;;
esac
TAR_SIZE=$(du -m "$LOCAL_DIR/$IMAGES_TAR" | cut -f1)
ok "Archive: ${TAR_SIZE}MB"

# ─────────────────────────────────────────────
# TRANSFER
# ─────────────────────────────────────────────
C=$((C+1)); step $C $TOTAL_STEPS "Transferring to VM"
scp $SSH_OPTS "$LOCAL_DIR/$IMAGES_TAR" "${SSH_HOST}:${REMOTE_DIR}/" > /dev/null && ok "images.tar transferred" || fail "SCP failed"

# ─────────────────────────────────────────────
# LOAD IMAGE ON VM
# ─────────────────────────────────────────────
C=$((C+1)); step $C $TOTAL_STEPS "Loading image on VM"
LOAD_OUTPUT=$(ssh_cmd "sudo docker load -i ${REMOTE_DIR}/$IMAGES_TAR" 2>&1) || fail "docker load failed"
ok "Image loaded"

# ─────────────────────────────────────────────
# RESTART FRONTEND CONTAINER
# ─────────────────────────────────────────────
C=$((C+1)); step $C $TOTAL_STEPS "Restarting frontend container"

info "Stopping old container ..."
ssh_cmd "sudo docker stop anon-chat-frontend 2>/dev/null; sudo docker rm anon-chat-frontend 2>/dev/null; echo 'done'" > /dev/null || true

info "Starting new container with --network-alias frontend ..."
ssh_cmd "sudo docker run -d --name anon-chat-frontend --restart unless-stopped --network $NETWORK_NAME --network-alias frontend -p 3000:3000 anonlink-frontend:latest" > /dev/null || fail "docker run failed"

sleep 2
CONTAINER_OK=$(ssh_cmd "sudo docker ps --filter name=anon-chat-frontend --format '{{.Status}}'") || fail "Failed to check container status"
if echo "$CONTAINER_OK" | grep -q "^Up"; then
  ok "Container is Up ($(echo "$CONTAINER_OK" | head -1))"
else
  ssh_cmd "sudo docker logs --tail 20 anon-chat-frontend" || true
  fail "Container is not running. Status: $CONTAINER_OK"
fi

# ─────────────────────────────────────────────
# RELOAD NGINX
# ─────────────────────────────────────────────
C=$((C+1)); step $C $TOTAL_STEPS "Reloading nginx"
NGINX_OK=$(ssh_cmd "sudo docker exec anon-chat-nginx nginx -s reload 2>&1") || fail "nginx reload failed"
ok "nginx reloaded"

# ─────────────────────────────────────────────
# SMOKE TEST
# ─────────────────────────────────────────────
C=$((C+1)); step $C $TOTAL_STEPS "Smoke test"

info "Checking https://anonlink.online/auth ..."
HTTP_AUTH=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://anonlink.online/auth 2>/dev/null) || HTTP_AUTH="000"
if [[ "$HTTP_AUTH" == "200" ]]; then
  ok "GET /auth → 200"
else
  fail "GET /auth → $HTTP_AUTH (expected 200)"
fi

info "Checking Google OAuth redirect ..."
GOOGLE_REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" --max-time 10 "https://anonlink.online/api/v1/auth/google" --max-redirs 0 2>/dev/null) || GOOGLE_REDIRECT=""
if echo "$GOOGLE_REDIRECT" | grep -q "^https://accounts.google.com"; then
  ok "Google OAuth → 302 (accounts.google.com)"
else
  fail "Google OAuth redirect unexpected: $GOOGLE_REDIRECT"
fi

info "Checking landing page ..."
HTTP_ROOT=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://anonlink.online/ 2>/dev/null) || HTTP_ROOT="000"
if [[ "$HTTP_ROOT" == "200" ]]; then
  ok "GET / → 200"
else
  fail "GET / → $HTTP_ROOT (expected 200)"
fi

# ─────────────────────────────────────────────
# DONE
# ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  DEPLOY COMPLETE ✓${NC}"
echo -e "${GREEN}  Site: https://anonlink.online${NC}"
echo -e "${GREEN}============================================${NC}"
