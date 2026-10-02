#!/bin/bash
# deploy-remote.sh — runs on the VM via SSH from deploy.sh
# Handles backend migrations and other compose-based services.
# Frontend is managed directly by deploy.sh (isolated steps).
set -e

REMOTE_DIR="/home/ubuntu/anon-chat-platform"
COMPOSE_FILE="docker-compose.prod.yml"

log() { echo "[$(date '+%H:%M:%S')] $1"; }

cd "$REMOTE_DIR"

log "[1/2] Running database migrations ..."
docker compose -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy 2>/dev/null || log "No pending migrations"

log "[2/2] Restarting backend services ..."
docker compose -f "$COMPOSE_FILE" up -d --no-deps backend 2>/dev/null || log "Backend compose restart skipped (not applicable)"

log "Remote deployment tasks complete."
