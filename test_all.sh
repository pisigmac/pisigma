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
  "$ROOT/Search" \
  "$ROOT/Scheduler" \
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
  "$ROOT/Realtime" \
  "$ROOT/RateLimiter" \
  "$ROOT/Cache" \
  "$ROOT/QueueBroker" \
  "$ROOT/ConfigVault" \
  "$ROOT/APIGateway" \
  "$ROOT/LogAggregator" \
  "$ROOT/DataPipeline" \
  "$ROOT/VectorSearch" \
  "$ROOT/ConsentManager" \
  "$ROOT/DataRetention" \
  "$ROOT/SMS" \
  "$ROOT/Chat" \
  "$ROOT/MFA" \
  "$ROOT/WAF" \
  "$ROOT/Subscriptions" \
  "$ROOT/Invoicing" \
  "$ROOT/Referrals" \
  "$ROOT/Workflows" \
  "$ROOT/CMS" \
  "$ROOT/FormBuilder" \
  "$ROOT/Comments"


