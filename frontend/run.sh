#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

if [ -f ".env" ]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${key// }" ]] && continue
    export "$key"="$value"
  done < .env
fi

FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"
FRONTEND_PORT="${FRONTEND_PORT:-4173}"

npm install -q

# Vite reads .env automatically — VITE_API_BASE is picked up at build time
npm run build

echo "[run] Frontend → http://$FRONTEND_HOST:$FRONTEND_PORT"
npm run preview -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT"
