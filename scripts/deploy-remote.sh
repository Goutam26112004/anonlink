#!/bin/bash
set -e

REMOTE_DIR="/home/ubuntu/anon-chat-platform"
BACKUP_DIR="/home/ubuntu/anonlink-backups"
COMPOSE_FILE="docker-compose.prod.yml"
IMAGES_TAR="images.tar"
HEALTH_TIMEOUT=60
HEALTH_INTERVAL=3

log() { echo "[$(date '+%H:%M:%S')] $1"; }

# Rollback function
rollback() {
  log "ROLLING BACK to previous images ..."
  if [ -f "$BACKUP_DIR/images.tar" ]; then
    docker load -i "$BACKUP_DIR/images.tar"
    docker-compose -f "$COMPOSE_FILE" up -d --force-recreate
    log "Rollback complete. Checking health ..."
    check_health
    log "ROLLBACK DONE"
  else
    log "ERROR: No backup found at $BACKUP_DIR/images.tar"
    exit 1
  fi
}

# Health check function
check_health() {
  local elapsed=0
  while [ $elapsed -lt $HEALTH_TIMEOUT ]; do
    if curl -sf http://localhost:4000/health > /dev/null 2>&1 && \
       curl -sf http://localhost:3000 > /dev/null 2>&1; then
      log "Health check PASSED"
      return 0
    fi
    sleep $HEALTH_INTERVAL
    elapsed=$((elapsed + HEALTH_INTERVAL))
    log "Waiting for services ... ($elapsed/${HEALTH_TIMEOUT}s)"
  done
  log "Health check FAILED after ${HEALTH_TIMEOUT}s"
  return 1
}

# Parse arguments
if [ "$1" = "--rollback" ]; then
  cd "$REMOTE_DIR"
  rollback
  exit 0
fi

cd "$REMOTE_DIR"

# Ensure .env exists
if [ ! -f .env ]; then
  log "ERROR: .env file not found at $REMOTE_DIR/.env"
  log "Copy .env.production.example to .env and fill in secrets"
  exit 1
fi

# Backup current images
log "[1/5] Backing up current images ..."
mkdir -p "$BACKUP_DIR"
docker save anonlink-backend:latest anonlink-frontend:latest > "$BACKUP_DIR/images.tar" 2>/dev/null || log "No existing images to backup (first deploy)"

# Load new images
log "[2/5] Loading new images from $IMAGES_TAR ..."
docker load -i "$IMAGES_TAR"

# Stop old containers
log "[3/5] Stopping old containers ..."
docker-compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

# Start new containers
log "[4/5] Starting containers from pre-built images ..."
docker-compose -f "$COMPOSE_FILE" up -d

# Health check
log "[5/5] Running health checks (timeout: ${HEALTH_TIMEOUT}s) ..."
if check_health; then
  log "========================================="
  log "  DEPLOY SUCCESS: All services healthy"
  log "========================================="
  rm -f "$IMAGES_TAR"
else
  log "========================================="
  log "  DEPLOY FAILED: Rolling back ..."
  log "========================================="
  rollback
  exit 1
fi
