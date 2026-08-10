#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

: > "$PISIGMA_DEV_DIR/registry" 2>/dev/null || true

pisigma_log info "Starting PiSigma services..."
pisigma_require_cmd docker
pisigma_require_cmd npm

# Function to start a single service by directory name (case insensitive/flexible matching)
start_one_service() {
  local service_name="$1"
  # Find the directory matching the service name (case-insensitive)
  local found_dir=""
  for d in */; do
    local d_clean="${d%/}"
    if [[ "${d_clean,,}" == "${service_name,,}" ]]; then
      found_dir="$d_clean"
      break
    fi
  done

  if [[ -z "$found_dir" ]]; then
    pisigma_log error "Service directory not found for: $service_name"
    return 1
  fi

  local service_dir="${ROOT}/${found_dir}"
  local service_name_lower="${found_dir,,}"
  local service_type="$(pisigma_detect_service_type "$service_dir")"

  case "$service_type" in
    node)
      pisigma_start_service "$service_name_lower" "$service_dir" "npm run dev"
      sleep 0.2
      ;;
    docker)
      pisigma_start_service "$service_name_lower" "$service_dir" "docker compose up -d"
      sleep 0.2
      ;;
    python)
      pisigma_log warn "Python service start not implemented: $service_name_lower"
      ;;
    *)
      pisigma_log warn "Unknown service type, skipping: $service_name_lower"
      ;;
  esac
}

if [ $# -gt 0 ]; then
  # If Auth is requested as one of the services, start it first and await healthcheck
  start_auth=0
  for req_service in "$@"; do
    if [[ "${req_service,,}" == "auth" ]]; then
      start_auth=1
      break
    fi
  done

  if [[ $start_auth -eq 1 ]]; then
    pisigma_start_service "auth" "$ROOT/Auth" "docker compose up -d"
    pisigma_wait_for_url "http://127.0.0.1:8090/health" 60
  fi

  for req_service in "$@"; do
    if [[ "${req_service,,}" == "auth" ]]; then
      continue # already started
    fi
    start_one_service "$req_service"
  done
else
  # Auth is started first and awaited because other services depend on it.
  pisigma_start_service "auth" "$ROOT/Auth" "docker compose up -d"
  pisigma_wait_for_url "http://127.0.0.1:8090/health" 60

  for dir in */; do
    [[ "$dir" == "docs/" || "$dir" == "node_modules/" || "$dir" == "Tools/" || "$dir" == "Auth/" ]] && continue
    pisigma_log info "working module is ${dir}"
    service_dir="${ROOT}/${dir}"
    service_name="$(basename "$service_dir" | tr '[:upper:]' '[:lower:]')"
    service_type="$(pisigma_detect_service_type "$service_dir")"
    case "$service_type" in
      node)
        pisigma_start_service "$service_name" "$service_dir" "npm run dev"
        sleep 0.2
        ;;
      docker)
        pisigma_start_service "$service_name" "$service_dir" "docker compose up -d"
        sleep 0.2
        ;;
      python)
        pisigma_log warn "Python service start not implemented: $service_name"
        ;;
      *)
        pisigma_log warn "Unknown service type, skipping: $service_name"
        ;;
    esac
  done
fi

pisigma_service_status
