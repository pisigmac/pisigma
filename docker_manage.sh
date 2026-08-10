#!/usr/bin/env bash
# Universal Docker Management CLI
# Usage:
#   ./docker_manage.sh up [profile]       - Start Docker Compose services (default profile: all)
#   ./docker_manage.sh down               - Stop & remove Docker Compose containers & networks
#   ./docker_manage.sh health [url]       - Check container health status
#   ./docker_manage.sh init-dockerfile    - Generate multi-stage Dockerfile (node/python)
#   ./docker_manage.sh clean              - Run deep Docker image & container cleanup

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

action="${1:-up}"
param2="${2:-}"

case "$action" in
  up)
    profile="${param2:-all}"
    pisigma_docker_compose_up "$ROOT" "$profile"
    ;;
  down)
    pisigma_docker_compose_down "$ROOT"
    ;;
  health)
    url="${param2:-http://127.0.0.1:8090/health}"
    pisigma_docker_healthcheck "container" "$url" 30
    ;;
  init-dockerfile)
    lang="${param2:-node}"
    pisigma_docker_generate_dockerfile "$lang" "$ROOT"
    ;;
  clean)
    pisigma_docker_clean_all
    ;;
  *)
    echo "Usage: ./docker_manage.sh {up [profile]|down|health [url]|init-dockerfile [node|python]|clean}"
    exit 1
    ;;
esac
