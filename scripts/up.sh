#!/usr/bin/env bash
set -e

# PlateWise AI — Full Stack Containerized Start Script
# Builds and launches all 3 services: postgres, backend, frontend in Docker containers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

echo "=========================================================="
echo " Starting PlateWise AI — All Services in Docker Compose"
echo " Services: PostgreSQL (5432), FastAPI (8000), Next.js (3000)"
echo "=========================================================="

exec docker compose up --build
