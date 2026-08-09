#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

# Clear old registry so status reflects only this run.
: > "$PISIGMA_DEV_DIR/registry" 2>/dev/null || true

pisigma_log info "Starting services..."

# Example: adapt the service list to your project.
pisigma_start_service "auth"     "$ROOT/Auth"     "docker compose up -d"
pisigma_wait_for_url "http://127.0.0.1:8090/health" 60

pisigma_start_service "billing"  "$ROOT/Billing"  "npm run dev"
pisigma_start_service "mail"     "$ROOT/Mail"     "npm run dev"
pisigma_start_service "webhooks" "$ROOT/Webhooks" "npm run dev"

pisigma_service_status
