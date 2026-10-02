<!-- BEGIN:deploy-workflow -->
# Deploy Workflow

## Fast Deploy (Recommended)

Use `./scripts/deploy-fast.sh` for the fastest deployment.

```bash
# Deploy everything (frontend + backend)
./scripts/deploy-fast.sh

# Frontend only
./scripts/deploy-fast.sh --frontend

# Backend only
./scripts/deploy-fast.sh --backend

# Just restart containers (no rebuild)
./scripts/deploy-fast.sh --no-build
```

### How it works:
1. **Rsync** source code to VM (~5s, only changed files)
2. **Build on VM** using Docker layer cache (skips unchanged layers)
3. **Restart** containers with correct env vars and network config
4. **Migrate** database schema if needed
5. **Smoke test** verifies site is live

### Fallback:
If VM build fails (OOM on 1GB RAM), automatically falls back to:
- Build locally → compress with gzip → SCP → docker load on VM

### VM Architecture:
- **Server**: Oracle Cloud (132.226.190.112), 2 CPU, 1GB RAM, 2GB swap
- **Networks**: `anon-chat-platform_default` (nginx/frontend/backend), `anon-chat-platform_app-network` (backend/redis/db)
- **Backend** needs BOTH networks (connected after start)
- **TURN server**: coturn at 132.226.190.112:3478, secret=`coturn_prod_secret`

---

## Legacy Deploy (Slow — image transfer)

Use `./scripts/deploy.sh --service frontend` for the old approach (local build + SCP transfer).

The script runs **isolated SSH steps** — each step is verified before the next begins:

1. **Build** — Docker build with build-args from `.env.production`
2. **Save** — `docker save` to tarball
3. **Transfer** — SCP to VM
4. **Load** — `docker load` on VM (separate SSH call)
5. **Restart** — `docker stop/rm/run` with `--network-alias frontend` (separate SSH call)
6. **Reload nginx** — `nginx -s reload` (separate SSH call)
7. **Smoke test** — `curl` verifies `/auth` returns 200, Google OAuth returns 302, `/` returns 200

## Critical: `--network-alias frontend`

The frontend container MUST be started with `--network anon-chat-platform_default --network-alias frontend` so nginx can resolve the `frontend` upstream. Without this alias, nginx will fail with `host not found in upstream "frontend"`.

## docker-compose v2

Docker Compose v2 is installed as a CLI plugin on the VM. Use `docker compose` (space, not hyphen) for backend services. Frontend is always managed manually (not via compose) to avoid the v1 `'ContainerConfig'` bug.

## Quick Reference

```bash
# Fast deploy (recommended)
./scripts/deploy-fast.sh

# Fast deploy frontend only
./scripts/deploy-fast.sh --frontend

# Fast deploy backend only
./scripts/deploy-fast.sh --backend

# Legacy deploy frontend
./scripts/deploy.sh --service frontend

# Manual container restart on VM
sudo docker stop anon-chat-frontend
sudo docker rm anon-chat-frontend
sudo docker run -d --name anon-chat-frontend --restart unless-stopped \
  --network anon-chat-platform_default --network-alias frontend \
  -p 3000:3000 anonlink-frontend:latest
sudo docker exec anon-chat-nginx nginx -s reload
```

## Verification

After deploy, the script automatically checks:
- `curl https://anonlink.online/auth` → 200
- `curl https://anonlink.online/api/v1/auth/google` → 302 to accounts.google.com
- `curl https://anonlink.online/` → 200
- `sudo docker ps` shows `anon-chat-frontend` is `Up`
<!-- END:deploy-workflow -->
