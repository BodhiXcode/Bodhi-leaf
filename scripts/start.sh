#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

# ── Backend ──
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo "[backend] Creating virtual environment..."
  python3 -m venv "$BACKEND_DIR/.venv"
fi

echo "[backend] Installing dependencies..."
"$BACKEND_DIR/.venv/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"

echo "[backend] Starting uvicorn on http://localhost:8000 ..."
"$BACKEND_DIR/.venv/bin/uvicorn" app.main:app --reload --reload-dir "$BACKEND_DIR/app" --port 8000 --app-dir "$BACKEND_DIR" &
BACKEND_PID=$!

# ── Frontend ──
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "[frontend] Installing npm dependencies..."
  (cd "$FRONTEND_DIR" && npm install)
fi

echo "[frontend] Starting esbuild watch mode..."
(cd "$FRONTEND_DIR" && node scripts/build.mjs --watch) &
FRONTEND_PID=$!

echo ""
echo "══════════════════════════════════════════════"
echo "  Bodhi Leaf dev servers running"
echo "  Backend  → http://localhost:8000"
echo "  API docs → http://localhost:8000/docs"
echo "  Frontend → watching for changes"
echo ""
echo "  Press Ctrl+C to stop both"
echo "══════════════════════════════════════════════"
echo ""

wait
