#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

pisigma_log info "Auditing PiSigma project dependencies..."
for svc in Auth Billing Mail Webhooks Storage Notifications FeatureFlags Analytics AuditLogs Localization; do
  dir="$ROOT/$svc"
  [[ -d "$dir" ]] || continue
  pisigma_audit_deps "$dir" "${1:-}"
done
