#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

pisigma_log info "Stopping PiSigma services..."
if [ $# -gt 0 ]; then
  for service_name in "$@"; do
    # Convert name to lowercase to match pidfile naming conventions
    service_name_lower="$(echo "$service_name" | tr '[:upper:]' '[:lower:]')"
    pisigma_stop_service "$service_name_lower"
  done
else
  pisigma_stop_all
fi
