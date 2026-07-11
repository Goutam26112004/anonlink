# Developer Guide: Getting Started & Handover

This guide explains how to install, run, verify, and maintain the AnonLink workspace.

---

## 1. Local Setup & Installation

### Prerequisites
* **Node.js**: v20 or later
* **Docker & Docker Compose**: For local services (PostgreSQL, Redis, CoTURN)
* **PostgreSQL / Redis** (Optional): If running native database instances locally

### Install Dependencies
Run npm installation in the root folder to set up workspace dependencies:
```bash
npm install
```

### Setup Local Environment
Copy env templates to build targets:
```bash
cp backend/.env.example backend/.env
cp .env.production .env
```
Update parameters inside `backend/.env` with your preferred database configurations.

---

## 2. Running the Project

### Docker-Based Execution (Recommended)
Build and launch all services simultaneously:
```bash
docker-compose up --build
```
This starts:
* **anon-chat-db**: PostgreSQL database (port 5432)
* **anon-chat-redis**: Redis cache (port 6379)
* **anon-chat-backend**: Node server (port 4000)
* **anon-chat-frontend**: Next.js client (port 3000)
* **anon-chat-nginx**: Reverse proxy mapping ports 80/443
* **anon-chat-coturn**: STUN/TURN server

### Native Development Run
To run the components natively (ensure local PostgreSQL and Redis are running):
```bash
# In terminal 1 (Backend)
cd backend
npx prisma generate
npm run dev

# In terminal 2 (Frontend)
cd frontend
npm run dev
```

---

## 3. Database Sync & Migrations
Synchronize your local or container database using Prisma:
```bash
# Push schema updates
cd backend
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

---

## 4. Run Automated Test Suite
To execute the integration tests locally:
```bash
# Verify onboarding validation, permissions matrix, media expiry, and subscription math
npx tsx tests/onboarding.test.ts
npx tsx tests/permissions.test.ts
npx tsx tests/tempMedia.test.ts
npx tsx tests/subscription.test.ts
```

---

## 5. Deployment Guide
Deploy to the target VM using SSH:
1. Ensure the private key (`~/.ssh/anonlink.key`) is present.
2. Run `./scripts/deploy.sh` to build locally and deploy to VM.
3. Use `./scripts/deploy.sh --dry-run` to preview without changes.
4. Use `./scripts/deploy.sh --service backend` to deploy only backend.

---

## 6. Troubleshooting & Debugging

### Port Conflict Errors
* **Symptom**: `Bind for 0.0.0.0:80 failed: port is already allocated` or `5432 failed`.
* **Fix**: Locate and stop local processes using the target ports:
  ```bash
  sudo systemctl stop postgresql
  sudo systemctl stop nginx
  ```

### Database Synchronization Failures
* **Symptom**: `relation "users" does not exist` or Prisma schema conflicts.
* **Fix**: Force database push inside the container:
  ```bash
  docker compose exec backend npx prisma db push --accept-data-loss
  ```
* **Verify**: Check schemas and table lists via `psql`:
  ```bash
  docker exec -it anon-chat-db psql -U anonuser -d anondb -c "\dt"
  ```
