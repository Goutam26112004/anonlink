# AnonLink — Full Setup Log

Generated: 2026-07-11

## System

| Tool | Version |
|------|---------|
| OS | Zorin OS (Ubuntu 24.04 noble) |
| Node.js | v20.20.2 |
| npm | (bundled with Node) |
| Docker | 29.6.1 |
| Docker Compose | v5.3.1 |
| Git | 2.43.0 |

## Steps Executed

### STEP 1 — System Setup
- Added Nodesource repo for Node.js v20
- Added Docker official repo
- Installed: `docker-ce`, `docker-ce-cli`, `containerd.io`, `docker-buildx-plugin`, `docker-compose-plugin`, `nodejs`
- User added to `docker` group

### STEP 2 — Clone
- `git clone https://github.com/Goutam26112004/anonlink.git ~/Code/anonlink`

### STEP 3 — SSH Key
- Key placed at `~/.ssh/anonlink.key`
- Permissions set to `600` (`chmod 600`)

### STEP 4 — SSH Test
- `ssh -i ~/.ssh/anonlink.key ubuntu@132.226.190.112 "echo SSH_OK"` → **SSH_OK**

### STEP 5 — Dependencies
- `rm -rf node_modules package-lock.json && npm install` (Node v20, no engine warnings)

### STEP 6 — Scripts Executable
- `chmod +x scripts/deploy.sh scripts/deploy-remote.sh`

### STEP 7 — Config Changes Made
| File | Change |
|------|--------|
| `docker-compose.dev.yml` | Already correct (db, redis, coturn only) |
| `docker-compose.prod.yml` | Already correct (image tags, no build) |
| `nginx/nginx.conf` | **Fixed**: `host.docker.internal:4000` → `backend:4000`, `host.docker.internal:3000` → `frontend:3000` |
| `scripts/deploy-remote.sh` | **Fixed**: `docker-compose` → `docker compose` (3 occurrences) |

### STEP 8 — Dry Run
`./scripts/deploy.sh --dry-run` — Output shown, no errors.

### STEP 9 — Local Dev Containers
`docker compose -f docker-compose.dev.yml up -d`

| Container | Status | Ports |
|-----------|--------|-------|
| anon-chat-db | Up (healthy) | 5432 |
| anon-chat-redis | Up (healthy) | 6379 |
| anon-chat-coturn | Up | 3478 |

## Quick Start (Future Sessions)

```bash
# Everything below assumes you're in ~/Code/anonlink

# 1. Start local dev services
docker compose -f docker-compose.dev.yml up -d

# 2. Run dev servers locally (backend + frontend)
# cd backend && npm run dev   (requires terminal 1)
# cd frontend && npm run dev  (requires terminal 2)

# 3. Deploy to VM
./scripts/deploy.sh          # Build + deploy all
./scripts/deploy.sh --dry-run  # Preview only
./scripts/deploy.sh --service backend  # Deploy only backend

# 4. SSH to VM directly
ssh -i ~/.ssh/anonlink.key ubuntu@132.226.190.112
```
