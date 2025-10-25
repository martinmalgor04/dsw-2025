#!/usr/bin/env bash
set -euo pipefail

# Obtener directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

# Cargar configuración desde .env si existe
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
elif [ -f "$SCRIPT_DIR/env.example" ]; then
    echo "⚠️  Usando configuración de ejemplo. Copia env.example a .env para personalizar."
    source "$SCRIPT_DIR/env.example"
else
    echo "❌ No se encontró archivo de configuración. Crea .env basado en env.example"
    exit 1
fi

usage() {
  cat <<USAGE
Operate Backend (microservices)

Usage:
  $(basename "$0") install        # Install and build shared + services
  $(basename "$0") build          # Build all microservices
  $(basename "$0") test           # Run unit tests for services
  $(basename "$0") start          # Start services (dev mode, parallel)
  $(basename "$0") stop           # Stop dev processes (pkill node)
  $(basename "$0") up             # Docker compose up (microservices)
  $(basename "$0") down           # Docker compose down

ENV expectations per service:
  - services/shipping-service/.env
  - services/stock-integration-service/.env
  - services/config-service/.env
USAGE
}

install_shared() {
  pushd "$BACKEND_DIR/shared/database" >/dev/null
  npm install && npm run build
  popd >/dev/null

  pushd "$BACKEND_DIR/shared/types" >/dev/null
  npm install && npm run build
  popd >/dev/null

  pushd "$BACKEND_DIR/shared/utils" >/dev/null
  npm install && npm run build
  popd >/dev/null
}

install_services() {
  for svc in shipping-service stock-integration-service config-service; do
    pushd "$BACKEND_DIR/services/$svc" >/dev/null
    npm install
    popd >/dev/null
  done
}

build_services() {
  for svc in shipping-service stock-integration-service config-service; do
    pushd "$BACKEND_DIR/services/$svc" >/dev/null
    npm run build
    popd >/dev/null
  done
}

test_services() {
  for svc in shipping-service stock-integration-service config-service; do
    pushd "$BACKEND_DIR/services/$svc" >/dev/null
    npm test || true
    popd >/dev/null
  done
}

start_dev() {
  # Start in background panes
  pushd "$BACKEND_DIR/services/config-service" >/dev/null
  npm run start:dev &
  popd >/dev/null

  pushd "$BACKEND_DIR/services/stock-integration-service" >/dev/null
  npm run start:dev &
  popd >/dev/null

  pushd "$BACKEND_DIR/services/shipping-service" >/dev/null
  npm run start:dev &
  popd >/dev/null

  echo "Started services in background. Use '$(basename "$0") stop' to kill."
}

stop_dev() {
  pkill -f "node .*start:dev" || true
  pkill -f "nest start --watch" || true
  echo "Stopped dev processes."
}

compose_up() {
  pushd "$BACKEND_DIR" >/dev/null
  docker compose -f docker-compose.microservices.yml up -d --build
  popd >/dev/null
}

compose_down() {
  pushd "$BACKEND_DIR" >/dev/null
  docker compose -f docker-compose.microservices.yml down
  popd >/dev/null
}

cmd="${1:-help}"
case "$cmd" in
  install)
    install_shared
    install_services
    ;;
  build)
    build_services
    ;;
  test)
    test_services
    ;;
  start)
    start_dev
    ;;
  stop)
    stop_dev
    ;;
  up)
    compose_up
    ;;
  down)
    compose_down
    ;;
  *)
    usage
    ;;
esac


