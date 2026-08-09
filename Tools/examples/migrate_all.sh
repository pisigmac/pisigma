#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

pisigma_db_migrate "$ROOT/Auth"
pisigma_db_migrate "$ROOT/Billing"
pisigma_db_migrate "$ROOT/Mail"
pisigma_db_migrate "$ROOT/Webhooks"
