#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

pisigma_log info "Bootstrapping environment files..."

for svc in Auth Billing Mail Webhooks Storage Notifications FeatureFlags Analytics AuditLogs Localization MediaProcessing SSO RBAC Discounts Inventory PromptManagement LLMGuardrails APIGenerator APITester ErrorTracking Experiments Feedback Realtime; do
  dir="$ROOT/$svc"
  [[ -d "$dir" ]] || continue
  if [[ -f "$dir/.env.example" ]]; then
    case "$svc" in
      Auth)
        pisigma_copy_env_example "$dir/.env.example" "$dir/.env"
        ;;
      *)
        pisigma_copy_env_example "$dir/.env.example" "$dir/.env"
        pisigma_copy_env_example "$dir/.env.example" "$dir/.dev.vars"
        ;;
    esac
  fi
done

pisigma_log info "Done"
