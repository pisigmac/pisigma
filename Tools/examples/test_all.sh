#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

pisigma_test_all \
  "$ROOT/Auth" \
  "$ROOT/Billing" \
  "$ROOT/Mail" \
  "$ROOT/Webhooks"
