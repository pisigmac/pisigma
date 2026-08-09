#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

for svc in Auth Billing Mail Webhooks Storage Notifications FeatureFlags Analytics AuditLogs Localization Search Scheduler MediaProcessing SSO RBAC; do
  dir="$ROOT/$svc"
  [[ -d "$dir" ]] || continue
  pisigma_security_check "$dir"
done
