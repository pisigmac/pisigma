#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

pisigma_log info "smoke test running"
pisigma_ensure_dir "$ROOT/.pisigma/test-dir"
pisigma_require_cmd bash

# Service lifecycle smoke
cleanup() { pisigma_stop_all; rm -rf "$ROOT/.pisigma"; }
pisigma_trap_exit cleanup

pisigma_start_service "smoke" "$ROOT" "sleep 60"
kill -0 "$(cat "$PISIGMA_DEV_DIR/smoke.pid")"
pisigma_service_status | grep -q "smoke: running"
pisigma_stop_service "smoke"
! kill -0 "$(cat "$PISIGMA_DEV_DIR/smoke.pid")" 2>/dev/null

# Security smoke assertions
pisigma_scan_secrets "$ROOT/Tools"
pisigma_security_check "$ROOT/Tools"

echo "OK"
