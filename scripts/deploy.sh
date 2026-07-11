#!/bin/bash
set -euo pipefail

KEY_PATH="$HOME/.ssh/anonlink.key"
SSH_HOST="ubuntu@132.226.190.112"
REMOTE_DIR="/home/ubuntu/anon-chat-platform"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IMAGES_TAR="images.tar"
REMOTE_DEPLOY_SCRIPT="$REMOTE_DIR/scripts/deploy-remote.sh"

SERVICE="all"
SKIP_BUILD=false
DRY_RUN=false

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

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
MAGENTA='\033[0;35m'
NC='\033[0m'

if [[ ! -f "$KEY_PATH" ]]; then
  echo -e "${RED}ERROR: SSH key not found at $KEY_PATH${NC}"
  exit 1
fi

if [[ "$DRY_RUN" == false && "$SKIP_BUILD" == false ]]; then
  if ! command -v docker &>/dev/null; then
    echo -e "${RED}ERROR: Docker not found. Install Docker Engine first.${NC}"
    exit 1
  fi
fi

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  AnonLink Deploy (Local Build -> VM Load)${NC}"
echo -e "${CYAN}============================================${NC}"
if [[ "$DRY_RUN" == true ]]; then
  echo -e "${MAGENTA}  MODE: DRY RUN (no changes will be made)${NC}"
fi
echo ""

if [[ "$DRY_RUN" == true ]]; then
  echo -e "${GRAY}[1/6] Would build backend image (Dockerfile: ./backend)${NC}"
  echo -e "${GRAY}[2/6] Would build frontend image (Dockerfile: ./frontend)${NC}"
  echo -e "${GRAY}[3/6] Would save images to tarball${NC}"
  echo ""
  echo -e "${MAGENTA}[DRY RUN] Would transfer to VM ($SSH_HOST):${NC}"
  echo -e "${GRAY}  images.tar (pre-built Docker images)${NC}"
  echo -e "${GRAY}  docker-compose.prod.yml${NC}"
  echo -e "${GRAY}  nginx/nginx.prod.conf${NC}"
  echo -e "${GRAY}  coturn/turnserver.conf${NC}"
  echo -e "${GRAY}  scripts/deploy-remote.sh${NC}"
  echo ""
  echo -e "${MAGENTA}[DRY RUN] VM would execute:${NC}"
  echo -e "${GRAY}  1. Backup current images to ~/anonlink-backups/${NC}"
  echo -e "${GRAY}  2. docker load -i images.tar${NC}"
  echo -e "${GRAY}  3. docker compose -f docker-compose.prod.yml down${NC}"
  echo -e "${GRAY}  4. docker compose -f docker-compose.prod.yml up -d${NC}"
  echo -e "${GRAY}  5. Health check: curl localhost:4000/health + localhost:3000${NC}"
  echo -e "${GRAY}  6. Auto-rollback if health check fails after 60s${NC}"
  echo ""
  echo -e "${MAGENTA}Dry run complete. No changes made.${NC}"
  exit 0
fi

cleanup() { rm -f "$LOCAL_DIR/$IMAGES_TAR"; }
trap cleanup EXIT

if [[ "$SKIP_BUILD" == false ]]; then
  if [[ "$SERVICE" == "all" || "$SERVICE" == "backend" ]]; then
    echo -e "${YELLOW}[1/6] Building backend image locally ...${NC}"
    docker build -t anonlink-backend:latest "$LOCAL_DIR/backend"
  fi

  if [[ "$SERVICE" == "all" || "$SERVICE" == "frontend" ]]; then
    echo -e "${YELLOW}[2/6] Building frontend image locally ...${NC}"
    ENV_ARGS=()
    ENV_FILE="$LOCAL_DIR/.env.production"
    if [[ -f "$ENV_FILE" ]]; then
      while IFS= read -r line; do
        if [[ "$line" =~ ^GOOGLE_CLIENT_ID=(.+)$ ]]; then
          ENV_ARGS+=(--build-arg "NEXT_PUBLIC_GOOGLE_CLIENT_ID=${BASH_REMATCH[1]}")
        fi
        if [[ "$line" =~ ^DOMAIN_NAME=(.+)$ ]]; then
          ENV_ARGS+=(--build-arg "NEXT_PUBLIC_BACKEND_URL=https://${BASH_REMATCH[1]}")
        fi
      done < "$ENV_FILE"
    fi
    docker build "${ENV_ARGS[@]}" -t anonlink-frontend:latest "$LOCAL_DIR/frontend"
  fi
else
  echo -e "${GRAY}[1/6] Skipping builds (--skip-build)${NC}"
  echo -e "${GRAY}[2/6] Skipping builds (--skip-build)${NC}"
fi

echo -e "${YELLOW}[3/6] Saving Docker images to tarball ...${NC}"
case "$SERVICE" in
  all)      docker save anonlink-backend:latest anonlink-frontend:latest -o "$LOCAL_DIR/$IMAGES_TAR" ;;
  backend)  docker save anonlink-backend:latest -o "$LOCAL_DIR/$IMAGES_TAR" ;;
  frontend) docker save anonlink-frontend:latest -o "$LOCAL_DIR/$IMAGES_TAR" ;;
  *) echo -e "${RED}Unknown service: $SERVICE${NC}"; exit 1 ;;
esac
TAR_SIZE=$(du -m "$LOCAL_DIR/$IMAGES_TAR" | cut -f1)
echo -e "${GRAY}  Archive size: ${TAR_SIZE} MB${NC}"

echo -e "${YELLOW}[4/6] Transferring to VM ($SSH_HOST) ...${NC}"
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$LOCAL_DIR/$IMAGES_TAR" "${SSH_HOST}:${REMOTE_DIR}/"
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$LOCAL_DIR/docker-compose.prod.yml" "${SSH_HOST}:${REMOTE_DIR}/docker-compose.prod.yml"
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$LOCAL_DIR/nginx/nginx.prod.conf" "${SSH_HOST}:${REMOTE_DIR}/nginx/nginx.prod.conf"
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$LOCAL_DIR/coturn/turnserver.conf" "${SSH_HOST}:${REMOTE_DIR}/coturn/turnserver.conf"
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$LOCAL_DIR/scripts/deploy-remote.sh" "${SSH_HOST}:${REMOTE_DEPLOY_SCRIPT}"

echo -e "${YELLOW}[5/6] Deploying on VM ...${NC}"
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$SSH_HOST" "chmod +x $REMOTE_DEPLOY_SCRIPT && $REMOTE_DEPLOY_SCRIPT"

echo -e "${GRAY}[6/6] Cleaning up local tarball ...${NC}"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  DEPLOY COMPLETE: https://anonlink.online${NC}"
echo -e "${GREEN}============================================${NC}"
