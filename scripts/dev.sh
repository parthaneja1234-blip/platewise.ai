#!/usr/bin/env bash
set -e

# PlateWise AI — Local Hybrid Dev Start Script
# Runs PostgreSQL & FastAPI backend in Docker, and Next.js frontend on host (with hot-reload)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

echo "=========================================================="
echo " Starting PlateWise AI Development Services (Backend + DB)"
echo "=========================================================="

# 1. Start postgres + backend in background with build
docker compose up -d --build postgres backend

echo "Waiting for backend service to become healthy at http://127.0.0.1:8000/health..."

MAX_ATTEMPTS=30
ATTEMPT=0
HEALTHY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -sf http://127.0.0.1:8000/health > /dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  sleep 1
done

if [ "$HEALTHY" = true ]; then
  echo "Backend is up and healthy!"
else
  echo "Backend did not respond within ${MAX_ATTEMPTS}s, check 'docker compose logs backend'."
fi

echo ""
echo "=========================================================="
echo " Launching Next.js Frontend on http://localhost:3000"
echo " (Proxies /api/* to http://127.0.0.1:8000)"
echo "=========================================================="

cd "${ROOT_DIR}/frontend"
export BACKEND_INTERNAL_URL="http://127.0.0.1:8000"
exec npm run dev
