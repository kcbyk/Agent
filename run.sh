#!/usr/bin/env bash
set -e

PORT=${PORT:-8000}
HOST=${HOST:-"0.0.0.0"}

echo "=================================================="
echo "🚀 OpenArena Agent OS Başlatılıyor..."
echo "📡 Sunucu: http://${HOST}:${PORT}"
echo "📁 Workspace: $(pwd)/backend/workspace"
echo "=================================================="

# Ensure workspace exists
mkdir -p backend/workspace

# Start FastAPI server
exec python3 -m uvicorn backend.main:app --host "${HOST}" --port "${PORT}"
