#!/usr/bin/env bash
# PiSigma shared shell utilities.
# Source this file from project scripts; do not execute directly.

set -euo pipefail

PISIGMA_DEV_DIR="${PISIGMA_DEV_DIR:-$PWD/.pisigma/dev}"

pisigma_log() {
  local level="$1"
  shift
  local msg="$*"
  local color=""
  local reset="\033[0m"
  case "$level" in
    info)  color="\033[0;34m" ;;
    warn)  color="\033[0;33m" ;;
    error) color="\033[0;31m" ;;
    *)     color="" ;;
  esac
  echo -e "${color}[pisigma:${level}]${reset} ${msg}" >&2
}

pisigma_require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    pisigma_log error "Required command not found: $cmd"
    exit 1
  fi
}

pisigma_ensure_dir() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    mkdir -p "$dir"
    pisigma_log info "Created directory: $dir"
  fi
}

pisigma_load_env() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    pisigma_log warn "Env file not found: $file"
    return 1
  fi
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    export "$line" || true
  done < "$file"
}

pisigma_copy_env_example() {
  local src="$1"
  local dst="${2:-${src%.example}}"
  if [[ ! -f "$src" ]]; then
    pisigma_log error "Source env example not found: $src"
    return 1
  fi
  if [[ -f "$dst" ]]; then
    pisigma_log info "Env file already exists: $dst"
    return 0
  fi
  cp "$src" "$dst"
  pisigma_log info "Created env file: $dst"
}

pisigma_validate_env() {
  local missing=()
  for var in "$@"; do
    if [[ -z "${!var:-}" ]]; then
      missing+=("$var")
    fi
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    pisigma_log error "Missing required environment variables: ${missing[*]}"
    exit 1
  fi
}

pisigma_run_in_dir() {
  local dir="$1"
  shift
  (cd "$dir" && "$@")
}

pisigma_start_service() {
  local name="$1"
  local dir="$2"
  shift 2
  pisigma_ensure_dir "$PISIGMA_DEV_DIR"
  local pidfile="$PISIGMA_DEV_DIR/$name.pid"
  if [[ -f "$pidfile" ]] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    pisigma_log warn "Service already running: $name"
    return 0
  fi
  local original_dir="$PWD"
  cd "$dir" || { pisigma_log error "Cannot cd to $dir"; return 1; }
  setsid nohup bash -c "tail -f /dev/null | exec $*" >/dev/null 2>&1 &
  local pid=$!
  disown $pid 2>/dev/null || true
  cd "$original_dir" || true
  echo "$pid" > "$pidfile"
  printf '%s\n' "${name}|${dir}|$*|$(date +%s)" >> "$PISIGMA_DEV_DIR/registry"
  pisigma_log info "Started $name (pid $pid)"
}

pisigma_stop_service() {
  local name="$1"
  local pidfile="$PISIGMA_DEV_DIR/$name.pid"
  if [[ ! -f "$pidfile" ]]; then
    pisigma_log warn "No PID file for service: $name"
    return 1
  fi
  local pid
  pid="$(cat "$pidfile")"
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    pisigma_log info "Stopped $name (pid $pid)"
  else
    pkill -f "$name" 2>/dev/null || true
    pisigma_log warn "Service stopped: $name"
  fi
  rm -f "$pidfile"
}

pisigma_stop_all() {
  if [[ ! -d "$PISIGMA_DEV_DIR" ]]; then
    return 0
  fi
  for pidfile in "$PISIGMA_DEV_DIR"/*.pid; do
    [[ -f "$pidfile" ]] || continue
    local name
    name="$(basename "$pidfile" .pid)"
    pisigma_stop_service "$name"
  done
}

pisigma_service_status() {
  local root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
  
  printf "\n%-20s | %-10s | %-6s | %-32s | %-8s\n" "SERVICE" "STATUS" "PORT" "HEALTH ENDPOINT" "PID"
  printf "%s\n" "---------------------+------------+--------+----------------------------------+---------"
  
  local found=0
  for dir in "$root_dir"/*/; do
    [[ -d "$dir" ]] || continue
    local sname
    sname="$(basename "$dir")"
    [[ "$sname" == "docs" || "$sname" == "node_modules" || "$sname" == "Tools" || "$sname" == "brain" ]] && continue
    
    local port=""
    if [[ -f "$dir/package.json" ]]; then
      port="$(grep -oE '\--port [0-9]+' "$dir/package.json" 2>/dev/null | head -n 1 | awk '{print $2}' || true)"
    fi
    if [[ -z "$port" && -f "$dir/wrangler.toml" ]]; then
      port="$(grep -oE 'port\s*=\s*[0-9]+' "$dir/wrangler.toml" 2>/dev/null | head -n 1 | awk -F'=' '{print $2}' | tr -d ' ' || true)"
    fi
    if [[ -z "$port" ]]; then
      case "$sname" in
        Auth) port="8090" ;;
        Billing|Mail|Webhooks) port="8787" ;;
        Storage) port="8790" ;;
        Notifications) port="8791" ;;
        FeatureFlags) port="8792" ;;
        Analytics) port="8793" ;;
        Search) port="8794" ;;
        Scheduler) port="8795" ;;
        AuditLogs) port="8796" ;;
        Localization) port="8797" ;;
        SSO) port="8798" ;;
        RBAC) port="8799" ;;
        Discounts) port="8800" ;;
        Inventory) port="8801" ;;
        MediaProcessing) port="8802" ;;
        APIGenerator) port="8803" ;;
        APITester) port="8804" ;;
        ErrorTracking) port="8805" ;;
        Experiments) port="8806" ;;
        Feedback) port="8807" ;;
        PromptManagement) port="8808" ;;
        LLMGuardrails) port="8809" ;;
        Realtime) port="8810" ;;
        RateLimiter) port="8811" ;;
        ConfigVault) port="8812" ;;
        APIGateway) port="8813" ;;
        LogAggregator) port="8814" ;;
        QueueBroker) port="8815" ;;
        Cache) port="8816" ;;
        DataPipeline) port="8817" ;;
        VectorSearch) port="8818" ;;
        ConsentManager) port="8819" ;;
        DataRetention) port="8820" ;;
        SMS) port="8821" ;;
        Chat) port="8822" ;;
        MFA) port="8823" ;;
        WAF) port="8824" ;;
        Subscriptions) port="8825" ;;
        Invoicing) port="8826" ;;
        Referrals) port="8827" ;;
        Workflows) port="8828" ;;
        CMS) port="8829" ;;
        FormBuilder) port="8830" ;;
        Comments) port="8831" ;;
        TestDataFactory) port="8832" ;;
        ServiceRegistry) port="8833" ;;
        MockServer) port="8834" ;;
        DebugProxy) port="8835" ;;
        ContractTester) port="8836" ;;
        TestReporter) port="8837" ;;
        ReportBuilder) port="8838" ;;
        AlertEngine) port="8839" ;;
        SchemaRegistry) port="8840" ;;
        DataQuality) port="8841" ;;
        ModelRegistry) port="8842" ;;
        EvalRunner) port="8843" ;;
        EmbeddingService) port="8844" ;;
        IncidentManager) port="8845" ;;
        StatusPage) port="8846" ;;
        *) port="-" ;;
      esac
    fi

    local health_url="http://127.0.0.1:${port}/health"
    if [[ "$port" == "-" ]]; then
      health_url="-"
    fi

    local pidfile="$PISIGMA_DEV_DIR/$(echo "$sname" | tr '[:upper:]' '[:lower:]').pid"
    local pid="-"
    if [[ -f "$pidfile" ]]; then
      pid="$(cat "$pidfile" 2>/dev/null || echo "-")"
    fi

    local status="STOPPED"
    if [[ "$port" != "-" ]] && curl -sf "$health_url" >/dev/null 2>&1; then
      status="HEALTHY"
    elif [[ "$pid" != "-" ]] && kill -0 "$pid" 2>/dev/null; then
      status="RUNNING"
    fi

    local colored_status=""
    case "$status" in
      HEALTHY) colored_status="\033[0;32mHEALTHY   \033[0m" ;;
      RUNNING) colored_status="\033[0;36mRUNNING   \033[0m" ;;
      STOPPED) colored_status="\033[0;31mSTOPPED   \033[0m" ;;
      *)       colored_status="\033[0;33mUNKNOWN   \033[0m" ;;
    esac

    printf "%-20s | %b | %-6s | %-32s | %-8s\n" "$sname" "$colored_status" "$port" "$health_url" "$pid"
    found=1
  done
  
  if [[ $found -eq 0 ]]; then
    pisigma_log info "No services found"
  fi
  printf "\n"
}

pisigma_wait_for_url() {
  local url="$1"
  local timeout="${2:-30}"
  local elapsed=0
  pisigma_log info "Waiting for $url (timeout ${timeout}s)..."
  while ! curl -sf "$url" >/dev/null 2>&1; do
    if [[ $elapsed -ge $timeout ]]; then
      pisigma_log error "Timeout waiting for $url"
      return 1
    fi
    sleep 1
    ((elapsed++)) || true
  done
  pisigma_log info "$url is ready"
}

pisigma_check_service_health() {
  local name="$1"
  local url="$2"
  if curl -sf "$url" >/dev/null 2>&1; then
    pisigma_log info "$name health check passed ($url)"
  else
    pisigma_log error "$name health check failed ($url)"
    return 1
  fi
}

pisigma_port_open() {
  local port="$1"
  local host="${2:-127.0.0.1}"
  timeout 1 bash -c "cat < /dev/null > /dev/tcp/$host/$port" 2>/dev/null
}

pisigma_kill_on_port() {
  local port="$1"
  local pid=""
  if command -v lsof >/dev/null 2>&1; then
    pid="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  elif command -v fuser >/dev/null 2>&1; then
    pid="$(fuser "$port"/tcp 2>/dev/null | tr -d ' ' || true)"
  fi
  if [[ -n "$pid" ]]; then
    kill "$pid" 2>/dev/null || true
    pisigma_log info "Killed process on port $port (pid $pid)"
  else
    pisigma_log warn "No process found on port $port"
  fi
}

pisigma_detect_service_type() {
  local dir="$1"
  if [[ -f "$dir/docker-compose.yml" ]] || [[ -f "$dir/docker-compose.yaml" ]]; then
    echo "docker"
  elif [[ -f "$dir/package.json" ]]; then
    echo "node"
  elif [[ -f "$dir/pyproject.toml" ]]; then
    echo "python"
  else
    echo "unknown"
  fi
}

pisigma_run_tests() {
  local dir="$1"
  local type
  type="$(pisigma_detect_service_type "$dir")"
  case "$type" in
    node)
      if [[ -f "$dir/package.json" ]] && grep -q '"test"' "$dir/package.json"; then
        pisigma_run_in_dir "$dir" npm test
      else
        pisigma_log warn "No test script in $dir"
      fi
      ;;
    python)
      if command -v pytest >/dev/null 2>&1; then
        pisigma_run_in_dir "$dir" pytest
      else
        pisigma_log warn "pytest not found; skipping $dir"
      fi
      ;;
    *)
      pisigma_log warn "Unknown service type in $dir; skipping tests"
      ;;
  esac
}

pisigma_test_all() {
  for dir in "$@"; do
    pisigma_run_tests "$dir"
  done
}

pisigma_db_migrate() {
  local dir="$1"
  local type
  type="$(pisigma_detect_service_type "$dir")"
  case "$type" in
    node)
      if [[ -f "$dir/package.json" ]] && grep -q '"db:local"' "$dir/package.json"; then
        pisigma_run_in_dir "$dir" npm run db:local
      else
        pisigma_log warn "No db:local script in $dir"
      fi
      ;;
    python)
      if [[ -f "$dir/alembic.ini" ]]; then
        pisigma_run_in_dir "$dir" alembic upgrade head
      else
        pisigma_log warn "No alembic config in $dir; tables are created on startup"
      fi
      ;;
    *)
      pisigma_log warn "Unknown service type in $dir; skipping migration"
      ;;
  esac
}

pisigma_db_reset() {
  local dir="$1"
  local type
  type="$(pisigma_detect_service_type "$dir")"
  case "$type" in
    node)
      if [[ -f "$dir/package.json" ]] && grep -q '"db:reset"' "$dir/package.json"; then
        pisigma_run_in_dir "$dir" npm run db:reset
      else
        pisigma_log warn "No db:reset script in $dir"
      fi
      ;;
    python)
      pisigma_log warn "db:reset not implemented for python services"
      ;;
    *)
      pisigma_log warn "Unknown service type in $dir; skipping db reset"
      ;;
  esac
}

pisigma_docker_clean() {
  pisigma_require_cmd docker
  docker container prune -f >/dev/null 2>&1 || true
  docker volume prune -f >/dev/null 2>&1 || true
  pisigma_log info "Cleaned stopped Docker containers and unused volumes"
}

pisigma_docker_clean_all() {
  pisigma_require_cmd docker
  pisigma_log info "Running deep Docker cleanup (containers, images, buildx cache, volumes)..."
  docker system prune -af --volumes >/dev/null 2>&1 || true
  pisigma_log info "Universal Docker cleanup complete."
}

pisigma_docker_compose_up() {
  local dir="${1:-$PWD}"
  local profile="${2:-all}"
  local flags="${3:--d}"
  pisigma_require_cmd docker
  pisigma_log info "Starting Docker Compose services in $dir (profile: $profile)..."
  if [[ -f "$dir/docker-compose.yml" || -f "$dir/docker-compose.yaml" ]]; then
    if [[ "$profile" == "all" || "$profile" == "none" ]]; then
      pisigma_run_in_dir "$dir" docker compose up $flags
    else
      pisigma_run_in_dir "$dir" docker compose --profile "$profile" up $flags
    fi
    pisigma_log info "Docker Compose up completed for $dir"
  else
    pisigma_log error "No docker-compose.yml found in $dir"
    return 1
  fi
}

pisigma_docker_compose_down() {
  local dir="${1:-$PWD}"
  pisigma_require_cmd docker
  pisigma_log info "Stopping Docker Compose services in $dir..."
  if [[ -f "$dir/docker-compose.yml" || -f "$dir/docker-compose.yaml" ]]; then
    pisigma_run_in_dir "$dir" docker compose down -v --remove-orphans
    pisigma_log info "Docker Compose down completed for $dir"
  else
    pisigma_log error "No docker-compose.yml found in $dir"
    return 1
  fi
}

pisigma_docker_healthcheck() {
  local name="$1"
  local url="$2"
  local timeout="${3:-30}"
  local elapsed=0
  pisigma_log info "Checking Docker health for $name at $url (timeout ${timeout}s)..."
  while ! curl -sf "$url" >/dev/null 2>&1; do
    if [[ $elapsed -ge $timeout ]]; then
      pisigma_log error "Docker healthcheck timeout for $name at $url"
      return 1
    fi
    sleep 1
    ((elapsed++)) || true
  done
  pisigma_log info "Docker container $name is healthy! ($url)"
}

pisigma_docker_generate_dockerfile() {
  local lang="${1:-node}"
  local target_dir="${2:-$PWD}"
  local target_file="$target_dir/Dockerfile"

  if [[ -f "$target_file" ]]; then
    pisigma_log info "Dockerfile already exists in $target_dir"
    return 0
  fi

  pisigma_log info "Generating production $lang Dockerfile in $target_dir..."

  case "$lang" in
    node)
      cat << 'EOF' > "$target_file"
# Production Multi-Stage Dockerfile for Node.js / Hono Microservices
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build 2>/dev/null || true

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app ./
USER nextjs
EXPOSE 8787
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8787/health || exit 1
CMD ["npm", "run", "dev"]
EOF
      ;;
    python)
      cat << 'EOF' > "$target_file"
# Production Multi-Stage Dockerfile for Python / FastAPI Microservices
FROM python:3.10-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc python3-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.10-slim AS runner
WORKDIR /app
COPY --from=builder /install /usr/local
COPY . .
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 8090
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8090/health')" || exit 1
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8090"]
EOF
      ;;
    *)
      pisigma_log error "Unsupported language for Dockerfile generation: $lang (supported: node, python)"
      return 1
      ;;
  esac
  pisigma_log info "Generated $target_file"
}


pisigma_trap_exit() {
  local callback="$1"
  trap "$callback" EXIT
}

pisigma_audit_deps() {
  local dir="$1"
  local fix_flag="${2:-}"
  local type
  type="$(pisigma_detect_service_type "$dir")"
  pisigma_log info "Auditing dependencies in $dir..."
  case "$type" in
    node)
      if [[ -f "$dir/package.json" ]]; then
        if [[ "$fix_flag" == "--fix" ]]; then
          pisigma_run_in_dir "$dir" npm audit fix || true
          pisigma_log info "Applied npm audit fix in $dir"
        else
          pisigma_run_in_dir "$dir" npm audit || {
            pisigma_log warn "Vulnerabilities detected in $dir. Run with --fix to attempt auto-remediation."
            return 1
          }
        fi
      fi
      ;;
    python)
      if command -v pip-audit >/dev/null 2>&1; then
        pisigma_run_in_dir "$dir" pip-audit || pisigma_log warn "pip-audit reported vulnerabilities in $dir"
      elif command -v safety >/dev/null 2>&1; then
        pisigma_run_in_dir "$dir" safety check || pisigma_log warn "safety reported vulnerabilities in $dir"
      else
        pisigma_log warn "No Python audit tool (pip-audit/safety) installed for $dir"
      fi
      ;;
    *)
      pisigma_log info "Skipping dependency audit for non-node/python directory: $dir"
      ;;
  esac
}

pisigma_audit_all() {
  local fix_flag=""
  if [[ "${1:-}" == "--fix" ]]; then
    fix_flag="--fix"
    shift
  fi
  local failed=0
  for dir in "$@"; do
    pisigma_audit_deps "$dir" "$fix_flag" || failed=1
  done
  return "$failed"
}

pisigma_scan_secrets() {
  local scan_dir="${1:-$PWD}"
  pisigma_log info "Scanning for secret leaks in $scan_dir..."
  local leaks=0

  # Check for committed .env files in git index
  if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    local committed_envs
    committed_envs="$(git ls-files "$scan_dir" | grep -E '\.env$|\.dev\.vars$' || true)"
    if [[ -n "$committed_envs" ]]; then
      pisigma_log error "Committed secret file(s) found in git tracking:"
      echo "$committed_envs"
      leaks=$((leaks + 1))
    fi
  fi

  # Regex patterns for sensitive tokens
  local regexes=(
    "AKIA[0-9A-Z]{16}"                          # AWS Access Key
    "-----BEGIN (RSA|OPENSSH|EC|PRIVATE) KEY-----" # Private keys
    "(api_key|secret_key|private_key|auth_token)[[:space:]]*=[[:space:]]*['\"][A-Za-z0-9_=-]{16,}['\"]" # Hardcoded secrets
  )

  for pattern in "${regexes[@]}"; do
    local matches
    matches="$(grep -rnEI --exclude-dir={.git,node_modules,.venv,.pisigma,dist,build} "$pattern" "$scan_dir" 2>/dev/null || true)"
    if [[ -n "$matches" ]]; then
      pisigma_log error "Potential secret leak pattern matched ($pattern):"
      echo "$matches"
      leaks=$((leaks + 1))
    fi
  done

  if [[ $leaks -eq 0 ]]; then
    pisigma_log info "No secret leaks detected in $scan_dir"
    return 0
  else
    pisigma_log error "Found $leaks secret leak warning(s)"
    return 1
  fi
}

pisigma_typecheck() {
  local dir="$1"
  if [[ -f "$dir/tsconfig.json" ]]; then
    pisigma_log info "Running TypeScript typecheck in $dir..."
    if [[ -f "$dir/package.json" ]] && grep -q '"typecheck"' "$dir/package.json"; then
      pisigma_run_in_dir "$dir" npm run typecheck
    elif command -v tsc >/dev/null 2>&1 || [[ -x "$dir/node_modules/.bin/tsc" ]]; then
      pisigma_run_in_dir "$dir" npx tsc --noEmit
    else
      pisigma_log warn "tsc command not found in $dir"
    fi
  else
    pisigma_log info "No tsconfig.json in $dir; skipping typecheck"
  fi
}

pisigma_security_check() {
  local dir="${1:-$PWD}"
  pisigma_log info "Running static security pattern checks in $dir..."
  local issues=0

  # Check eval / Function constructor in code files
  local eval_matches
  eval_matches="$(grep -rnEI --exclude-dir={.git,node_modules,.venv,.pisigma,dist,build,docs} --exclude={common.sh,\*.md} -E 'eval\(|new Function\(' "$dir" 2>/dev/null || true)"
  if [[ -n "$eval_matches" ]]; then
    pisigma_log warn "Risky eval() or dynamic Function constructor usage found:"
    echo "$eval_matches"
    issues=$((issues + 1))
  fi

  # Check target="_blank" without rel="noopener" in code/template files
  local blank_matches
  blank_matches="$(grep -rnEI --exclude-dir={.git,node_modules,.venv,.pisigma,dist,build,docs} --exclude={common.sh,\*.md} -E 'target="_blank"|target='"'"'_blank'"'"'' "$dir" 2>/dev/null | grep -v 'rel=' || true)"
  if [[ -n "$blank_matches" ]]; then
    pisigma_log warn "target='_blank' links missing rel='noopener noreferrer' found:"
    echo "$blank_matches"
    issues=$((issues + 1))
  fi

  # Check typecheck
  pisigma_typecheck "$dir"

  if [[ $issues -eq 0 ]]; then
    pisigma_log info "Static security pattern check passed for $dir"
    return 0
  else
    pisigma_log warn "Static security check found $issues potential issue(s)"
    return 1
  fi
}

pisigma_check_outdated() {
  local dir="$1"
  local type
  type="$(pisigma_detect_service_type "$dir")"
  if [[ "$type" == "node" ]] && [[ -f "$dir/package.json" ]]; then
    pisigma_log info "Checking outdated dependencies in $dir..."
    pisigma_run_in_dir "$dir" npm outdated || true
  fi
}

pisigma_bootstrap_shared_venv() {
  local venv_path="${1:-$PWD/.pisigma/shared_venv}"
  pisigma_log info "Bootstrapping shared Python virtual environment at $venv_path..."
  if [[ ! -d "$venv_path" ]]; then
    python3 -m venv "$venv_path"
    pisigma_log info "Created shared Python venv at $venv_path"
  fi
  "$venv_path/bin/pip" install --upgrade pip setuptools wheel >/dev/null 2>&1 || true
  if [[ -f "$PWD/Auth/requirements.txt" ]]; then
    "$venv_path/bin/pip" install -r "$PWD/Auth/requirements.txt" >/dev/null 2>&1 || true
  fi
  pisigma_log info "Shared Python virtual environment ready at $venv_path"
}

pisigma_create_deduped_venv() {
  local target_dir="$1"
  local strategy="${2:-pth}"
  local root_dir="${3:-$PWD}"
  local shared_venv="$root_dir/.pisigma/shared_venv"

  if [[ ! -d "$target_dir" ]]; then
    pisigma_log error "Target directory does not exist: $target_dir"
    return 1
  fi

  pisigma_log info "Creating deduplicated Python venv in $target_dir (strategy: $strategy)..."

  if [[ "$strategy" == "uv" ]] && command -v uv >/dev/null 2>&1; then
    uv venv "$target_dir/.venv"
    pisigma_log info "Created venv using uv hardlink cache in $target_dir/.venv"
    return 0
  fi

  pisigma_bootstrap_shared_venv "$shared_venv"

  if [[ ! -d "$target_dir/.venv" ]]; then
    python3 -m venv "$target_dir/.venv"
  fi

  local proj_sp
  proj_sp="$(find "$target_dir/.venv/lib" -type d -name "site-packages" 2>/dev/null | head -n1)"
  local shared_sp
  shared_sp="$(find "$shared_venv/lib" -type d -name "site-packages" 2>/dev/null | head -n1)"

  if [[ -n "$proj_sp" && -n "$shared_sp" ]]; then
    echo "$shared_sp" > "$proj_sp/.pisigma_shared.pth"
    pisigma_log info "Injected shared site-packages link into $proj_sp/.pisigma_shared.pth"
    pisigma_log info "Virtual environment ready in $target_dir/.venv (reusing packages from $shared_venv)"
  else
    pisigma_log warn "Could not locate site-packages in $target_dir/.venv"
  fi
}


pisigma_prune_caches() {
  local root_dir="${1:-$PWD}"
  pisigma_log info "Pruning temporary build caches, __pycache__, .pytest_cache, and .wrangler in $root_dir..."
  find "$root_dir" -type d \( -name "__pycache__" -o -name ".pytest_cache" -o -name ".wrangler" -o -name ".nyc_output" -o -name "coverage" \) -exec rm -rf {} + 2>/dev/null || true
  find "$root_dir" -type f \( -name "*.pyc" -o -name "*.pyo" -o -name "*.log" \) -delete 2>/dev/null || true
  pisigma_log info "Cache pruning complete"
}

pisigma_report_disk_usage() {
  local root_dir="${1:-$PWD}"
  pisigma_log info "Analyzing dependency disk usage across microservices in $root_dir..."
  echo ""
  printf "%-30s %-15s %-15s\n" "MICROSERVICE / PATH" "NODE_MODULES" "VENV / CACHE"
  printf "%-30s %-15s %-15s\n" "------------------------------" "---------------" "---------------"

  for dir in "$root_dir"/*; do
    [[ -d "$dir" ]] || continue
    local name
    name="$(basename "$dir")"
    [[ "$name" == "node_modules" || "$name" == ".git" || "$name" == ".pisigma" ]] && continue

    local nm_size="0 B"
    local venv_size="0 B"

    if [[ -d "$dir/node_modules" ]]; then
      nm_size="$(du -sh "$dir/node_modules" 2>/dev/null | cut -f1)"
    fi
    if [[ -d "$dir/.venv" || -d "$dir/venv" ]]; then
      venv_size="$(du -sh "$dir/.venv" "$dir/venv" 2>/dev/null | head -n1 | cut -f1)"
    fi

    if [[ "$nm_size" != "0 B" || "$venv_size" != "0 B" ]]; then
      printf "%-30s %-15s %-15s\n" "$name" "$nm_size" "$venv_size"
    fi
  done
  echo ""
}

pisigma_bootstrap_node_workspace() {
  local root_dir="${1:-$PWD}"
  pisigma_log info "Bootstrapping npm workspaces across microservices in $root_dir..."
  if [[ -f "$root_dir/package.json" ]]; then
    pisigma_run_in_dir "$root_dir" npm install --workspaces
    pisigma_log info "npm workspace bootstrapping complete. Shared packages hoisted to root node_modules."
  else
    pisigma_log error "No root package.json found in $root_dir"
    return 1
  fi
}

pisigma_bootstrap_pnpm() {
  local root_dir="${1:-$PWD}"
  pisigma_log info "Bootstrapping pnpm workspace hardlink cache in $root_dir..."
  if command -v pnpm >/dev/null 2>&1; then
    pisigma_run_in_dir "$root_dir" pnpm install
    pisigma_log info "pnpm workspace installation complete using global hardlink store."
  else
    pisigma_log warn "pnpm CLI not installed. Falling back to npm workspaces..."
    pisigma_bootstrap_node_workspace "$root_dir"
  fi
}



