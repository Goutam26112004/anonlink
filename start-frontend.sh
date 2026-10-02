#!/bin/bash
# ── AnonLink Frontend Restart Script ──

echo "Removing incorrect root lockfile if present..."
rm -f ~/package-lock.json || true

echo "Cleaning up any existing frontend processes..."
pkill -f next || true

echo "Removing stale Next.js cache..."
rm -rf "$(dirname "$0")/frontend/.next" || true

echo "Starting frontend dev server..."
cd "$(dirname "$0")/frontend"
npm run dev
