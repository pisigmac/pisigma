#!/usr/bin/env bash
# PiSigma Package & Environment Management CLI
# Usage:
#   ./manage_deps.sh status              - Show disk usage of node_modules, venv, and caches
#   ./manage_deps.sh prune               - Clean .wrangler, __pycache__, .pytest_cache, logs
#   ./manage_deps.sh shared-venv         - Create/update single shared Python virtualenv (.pisigma/shared_venv)
#   ./manage_deps.sh create-venv <dir>   - Create deduplicated project venv linked to shared packages
#   ./manage_deps.sh dedupe              - Clean npm cache and report optimization opportunities

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

action="${1:-status}"
target="${2:-}"

case "$action" in
  status)
    pisigma_report_disk_usage "$ROOT"
    ;;
  prune)
    pisigma_prune_caches "$ROOT"
    ;;
  shared-venv)
    pisigma_bootstrap_shared_venv "$ROOT/.pisigma/shared_venv"
    ;;
  create-venv)
    if [[ -z "$target" ]]; then
      pisigma_log error "Please specify target project directory (e.g. ./manage_deps.sh create-venv Auth)"
      exit 1
    fi
    if [[ "$target" == "--all" ]]; then
      for dir in "$ROOT"/*; do
        if [[ -d "$dir" && (-f "$dir/pyproject.toml" || -f "$dir/requirements.txt") ]]; then
          pisigma_create_deduped_venv "$dir" "pth" "$ROOT"
        fi
      done
    else
      pisigma_create_deduped_venv "$ROOT/$target" "pth" "$ROOT"
    fi
    ;;
  dedupe)
    pisigma_log info "Cleaning global npm cache and running npm package deduplication..."
    npm cache clean --force 2>/dev/null || true
    for dir in "$ROOT"/*; do
      if [[ -f "$dir/package.json" ]]; then
        pisigma_log info "Deduplicating packages in $(basename "$dir")..."
        (cd "$dir" && npm dedupe >/dev/null 2>&1 || true)
      fi
    done
    pisigma_log info "NPM package deduplication complete."
    ;;
  *)
    echo "Usage: ./manage_deps.sh {status|prune|shared-venv|create-venv <dir|--all>|dedupe}"
    exit 1
    ;;
esac
