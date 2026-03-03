#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "═══════════════════════════════════════"
echo "  Bodhi Leaf — First-time Setup"
echo "═══════════════════════════════════════"
echo ""

# ── Backend ──
echo "[1/3] Setting up Python backend..."
cd "$ROOT_DIR/backend"
python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   → Created backend/.env from template"
fi
echo "   ✓ Python venv created, dependencies installed"

# ── Frontend ──
echo "[2/3] Setting up Node.js frontend..."
cd "$ROOT_DIR/frontend"
npm install
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   → Created frontend/.env from template"
fi
echo "   ✓ npm dependencies installed"

# ── Build frontend ──
echo "[3/3] Building frontend..."
npm run build
echo "   ✓ Extension built to frontend/dist/"

echo ""
echo "═══════════════════════════════════════"
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Add your personal AWS keys to backend/.env"
echo "     (IAM console → Users → Security credentials → Create access key)"
echo ""
echo "  2. Start dev servers:  ./scripts/start.sh"
echo ""
echo "  3. Load extension:    chrome://extensions → Load unpacked → frontend/dist/"
echo "═══════════════════════════════════════"
