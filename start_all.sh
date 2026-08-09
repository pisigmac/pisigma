#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

: > "$PISIGMA_DEV_DIR/registry" 2>/dev/null || true

pisigma_log info "Starting PiSigma services..."
pisigma_require_cmd docker
pisigma_require_cmd npm

pisigma_start_service "auth"          "$ROOT/Auth"          "docker compose up -d"
pisigma_wait_for_url "http://127.0.0.1:8090/health" 60

pisigma_start_service "billing"       "$ROOT/Billing"       "npm run dev"
pisigma_start_service "mail"          "$ROOT/Mail"          "npm run dev"
pisigma_start_service "webhooks"      "$ROOT/Webhooks"      "npm run dev"
pisigma_start_service "storage"       "$ROOT/Storage"       "npm run dev"
pisigma_start_service "notifications" "$ROOT/Notifications" "npm run dev"
pisigma_start_service "featureflags"  "$ROOT/FeatureFlags"  "npm run dev"
pisigma_start_service "analytics"     "$ROOT/Analytics"     "npm run dev"
pisigma_start_service "auditlogs"     "$ROOT/AuditLogs"     "npm run dev"
pisigma_start_service "localization"  "$ROOT/Localization"  "npm run dev"
pisigma_start_service "mediaprocessing" "$ROOT/MediaProcessing" "npm run dev"
pisigma_start_service "discounts"     "$ROOT/Discounts"     "npm run dev"
pisigma_start_service "inventory"     "$ROOT/Inventory"     "npm run dev"
pisigma_start_service "sso"           "$ROOT/SSO"           "npm run dev"
pisigma_start_service "rbac"          "$ROOT/RBAC"          "npm run dev"

pisigma_service_status
