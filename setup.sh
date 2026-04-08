#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
#  ZC OCW — One-shot project setup script
#  Run once after cloning: bash setup.sh
# ─────────────────────────────────────────────────────────
set -e

echo ""
echo "🎓  ZC OCW — Project Setup"
echo "────────────────────────────────────────"

# 1. Check Node
if ! command -v node &> /dev/null; then
  echo "❌  Node.js not found. Install from https://nodejs.org (v18+)"
  exit 1
fi
echo "✅  Node $(node -v) detected"

# 2. Install deps
echo ""
echo "📦  Installing dependencies..."
npm install
echo "✅  Dependencies installed"

# 3. Create .env if missing
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "📝  Created .env from .env.example"
  echo "    ➜  Open .env and fill in your API keys before running npm run dev"
else
  echo "✅  .env already exists"
fi

# 4. Init git if not already
if [ ! -d ".git" ]; then
  git init
  git add .
  git commit -m "chore: initial ZC OCW scaffold"
  echo "✅  Git repository initialised with first commit"
else
  echo "✅  Git already initialised"
fi

echo ""
echo "────────────────────────────────────────"
echo "🚀  Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Open .env and paste your YouTube API key + Channel ID"
echo "  2. Drop logo.svg into public/"
echo "  3. Drop ocw-logo.svg into public/"
echo "  4. Run:  npm run dev"
echo ""
