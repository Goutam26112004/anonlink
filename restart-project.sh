#!/bin/bash
# ── AnonLink Master Restart Script ──

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🧹 1. Removing incorrect root lockfile (if present)..."
rm -f ~/package-lock.json || true

echo "🧹 2. Clearing Next.js frontend cache..."
rm -rf "$PROJECT_DIR/frontend/.next" || true

echo "🧹 3. Killing competing backend and frontend processes..."
pkill -f tsx || true
pkill -f index.ts || true
pkill -f next || true

# Give processes a moment to release ports
sleep 1

echo "🚀 4. Launching Backend in a new terminal window..."
if command -v gnome-terminal &>/dev/null; then
  gnome-terminal --title="AnonLink Backend" -- bash -c "cd '$PROJECT_DIR' && bash start-backend.sh; exec bash"
else
  xterm -title "AnonLink Backend" -e "cd '$PROJECT_DIR' && bash start-backend.sh; exec bash" &
fi

echo "🚀 5. Launching Frontend in a new terminal window..."
if command -v gnome-terminal &>/dev/null; then
  gnome-terminal --title="AnonLink Frontend" -- bash -c "cd '$PROJECT_DIR' && bash start-frontend.sh; exec bash"
else
  xterm -title "AnonLink Frontend" -e "cd '$PROJECT_DIR' && bash start-frontend.sh; exec bash" &
fi

echo "✨ All cleanups completed! Both terminals are now starting up. Check http://localhost:3000!"
