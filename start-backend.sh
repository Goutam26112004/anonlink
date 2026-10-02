#!/bin/bash
# ── AnonLink Backend Restart Script ──

echo "Cleaning up any existing backend processes..."
pkill -f tsx || true
pkill -f index.ts || true

echo "Starting backend dev server..."
cd "$(dirname "$0")/backend"
npx tsx --watch src/index.ts 2>&1 | tee ../backend.log
