#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

for svc in Auth Billing Mail Webhooks; do
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
