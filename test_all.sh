#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

pisigma_test_all \
  "$ROOT/Auth" \
  "$ROOT/Billing" \
  "$ROOT/Mail" \
  "$ROOT/Webhooks" \
  "$ROOT/Storage" \
  "$ROOT/Notifications" \
  "$ROOT/FeatureFlags" \
  "$ROOT/Analytics" \
  "$ROOT/AuditLogs" \
  "$ROOT/Localization" \
  "$ROOT/MediaProcessing" \
  "$ROOT/Discounts" \
  "$ROOT/Inventory" \
  "$ROOT/SSO" \
  "$ROOT/RBAC" \
  "$ROOT/PromptManagement" \
  "$ROOT/LLMGuardrails" \
  "$ROOT/APIGenerator" \
  "$ROOT/APITester" \
  "$ROOT/ErrorTracking" \
  "$ROOT/Experiments" \
  "$ROOT/Feedback" \
  "$ROOT/Realtime"

