#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

pisigma_log info "Applying local migrations..."
for svc in Auth Billing Mail Webhooks Storage Notifications FeatureFlags Analytics; do
  dir="$ROOT/$svc"
  [[ -d "$dir" ]] || continue
  pisigma_db_migrate "$dir"
done
pisigma_log info "Done"
