# PiSigma Shared Dev Tools & SDK Gateway

Reusable shell utilities, security compliance tools, and unified Client SDKs for PiSigma / PlexApps projects.

## Quick Start in a New Project

1. Copy the `Tools/` directory into your project root.
2. Copy the example caller scripts you need from `Tools/examples/` to your project root.
3. Edit the service list in each caller script.
4. Import client SDKs directly in your application code:

```typescript
import { createPisigmaClient } from 'pisigma/Tools/sdk'

const pisigma = createPisigmaClient({
  host: 'http://127.0.0.1',
  apiKey: process.env.PISIGMA_API_KEY,
})

// Direct access to all 12 microservices:
await pisigma.auth.login({ email: 'user@example.com', password: 'secretpassword' })
await pisigma.storage.getPresignedUploadUrl({ filename: 'file.png', mime_type: 'image/png', size_bytes: 2048 })
await pisigma.flags.isEnabled('new_ui_dashboard', 'usr_100')
await pisigma.analytics.track({ event_name: 'button_clicked' })
```

---

## Language Interoperability & REST API Access

While TypeScript/JavaScript projects use the unified `createPisigmaClient` SDK, **all 12 microservices are language-agnostic HTTP REST services**.

Applications written in Python, Go, Rust, Java, C#, PHP, Swift, Kotlin, or Flutter can interact directly over HTTP JSON:

- `GET /health` — Service health & status.
- `POST /v1/uploads/presigned` — Generate presigned upload URL (Storage).
- `POST /v1/push/send` — Send push notification payload (Notifications).
- `POST /v1/evaluate` — Evaluate feature flags (FeatureFlags).
- `POST /v1/events` — Ingest telemetry event (Analytics).
- `POST /v1/search` — Search query index (Search).
- `POST /v1/jobs/schedule` — Schedule background task (Scheduler).
- `POST /v1/audit-logs` — Record audit log entry (AuditLogs).
- `GET /v1/geoip` — Lookup IP location (Localization).

---

## Library API (`Tools/shell-lib/common.sh`)

Source the library in any bash script:

```bash
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"
```

### Logging / Safety
- `pisigma_log <info|warn|error> "message"`
- `pisigma_require_cmd <cmd>`
- `pisigma_trap_exit <callback>`

### Environment Files
- `pisigma_load_env <file>`
- `pisigma_copy_env_example <src> [dst]`
- `pisigma_validate_env <var>...`

### Service Lifecycle
- `pisigma_start_service <name> <dir> <cmd...>`
- `pisigma_stop_service <name>`
- `pisigma_stop_all`
- `pisigma_service_status`

### Health & Network
- `pisigma_wait_for_url <url> [timeout_secs]`
- `pisigma_check_service_health <name> <url>`
- `pisigma_port_open <port> [host]`
- `pisigma_kill_on_port <port>`

### Test Runners
- `pisigma_run_tests <dir>`
- `pisigma_test_all <dir>...`

### Database Helpers
- `pisigma_db_migrate <dir>`
- `pisigma_db_reset <dir>`

### Security & Compliance
- `pisigma_audit_deps <dir> [--fix]` — runs `npm audit` (or `pip-audit`/`safety`). Pass `--fix` to auto-remediate npm vulnerabilities.
- `pisigma_audit_all [--fix] <dir>...` — runs dependency audit across multiple directories.
- `pisigma_scan_secrets [dir]` — scans codebase and git index for secret leaks (AWS keys, private RSA/SSH keys, hardcoded API tokens, committed `.env` files).
- `pisigma_typecheck <dir>` — runs TypeScript strict type checking (`npx tsc --noEmit` or `npm run typecheck`).
- `pisigma_security_check [dir]` — checks static security patterns (`eval()`, unescaped dynamic evaluation, `target="_blank"` without `rel="noopener noreferrer"`) and runs typechecks.
- `pisigma_check_outdated <dir>` — runs `npm outdated` to track stale packages.

### Dependency & Environment Management
- `pisigma_bootstrap_shared_venv [path]` — bootstraps a single central Python virtual environment for shared dependencies.
- `pisigma_create_deduped_venv <target_dir>` — creates a project `.venv` with `.pth` linking to `shared_venv`, ensuring zero duplicate disk space.
- `pisigma_bootstrap_node_workspace [dir]` — hoists shared npm dependencies (`hono`, `vitest`, `typescript`, `wrangler`) to root `node_modules`.
- `pisigma_bootstrap_pnpm [dir]` — bootstraps pnpm workspace using global hardlink store.
- `pisigma_report_disk_usage [dir]` — reports real-time `node_modules` and `venv` disk consumption per microservice.
- `pisigma_prune_caches [dir]` — prunes `.wrangler`, `__pycache__`, `.pytest_cache`, and build artifacts.


