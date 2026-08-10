# PiSigma Agent Guide

This repository contains shared infrastructure services for PiSigma / PlexApps products.

## Services Matrix

| Service       | Stack                              | Local start command      | Health endpoint                 | Client SDK Class |
|---------------|------------------------------------|--------------------------|---------------------------------|------------------|
| Auth          | Python/FastAPI + Postgres          | `docker compose up -d`   | http://127.0.0.1:8090/health    | `PisigmaAuth` |
| Billing       | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8787/health    | `PisigmaBilling` |
| Mail          | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8787/health    | `PisigmaMail` |
| Webhooks      | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8787/health    | `PisigmaWebhooks` |
| Storage       | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8790/health    | `PisigmaStorage` |
| Notifications | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8791/health    | `PisigmaNotifications` |
| FeatureFlags  | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8792/health    | `PisigmaFeatureFlags` |
| Analytics      | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8793/health    | `PisigmaAnalytics` |
| Search        | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8794/health    | `PisigmaSearch` |
| Scheduler     | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8795/health    | `PisigmaScheduler` |
| AuditLogs     | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8796/health    | `PisigmaAuditLogs` |
| Localization  | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8797/health    | `PisigmaLocalization` |
| SSO           | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8798/health    | `PisigmaSSO` |
| RBAC          | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8799/health    | `PisigmaRBAC` |
| MediaProcessing | TypeScript/Hono + Cloudflare Workers | `npm run dev`         | http://127.0.0.1:8802/health    | `PisigmaMediaProcessing` |
| Discounts     | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8800/health    | `PisigmaDiscounts` |
| Inventory     | TypeScript/Hono + Cloudflare Workers | `npm run dev`           | http://127.0.0.1:8801/health    | `PisigmaInventory` |
| PromptManagement | TypeScript/Hono + Cloudflare Workers | `npm run dev`        | http://127.0.0.1:8808/health    | `PisigmaPromptManagement` |
| LLMGuardrails | TypeScript/Hono + Cloudflare Workers | `npm run dev`         | http://127.0.0.1:8809/health    | `PisigmaLLMGuardrails` |
| Experiments   | TypeScript/Hono + Cloudflare Workers | `npm run dev`         | http://127.0.0.1:8806/health    | `PisigmaExperiments` |
| Feedback      | TypeScript/Hono + Cloudflare Workers | `npm run dev`         | http://127.0.0.1:8807/health    | `PisigmaFeedback` |
| Realtime      | TypeScript/Hono + Cloudflare Workers | `npm run dev`         | http://127.0.0.1:8810/health    | `PisigmaRealtime` |
| APIGenerator  | TypeScript/Hono + Cloudflare Workers | `npm run dev`         | http://127.0.0.1:8803/health    | `PisigmaAPIGenerator` |
| APITester     | TypeScript/Hono + Cloudflare Workers | `npm run dev`         | http://127.0.0.1:8804/health    | `PisigmaAPITester` |
| ErrorTracking | TypeScript/Hono + Cloudflare Workers | `npm run dev`         | http://127.0.0.1:8805/health    | `PisigmaErrorTracking` |

## Language & Interoperability Architecture

- **Language-Agnostic REST APIs**: Every service exposes standard HTTP JSON endpoints. Non-JavaScript codebases (Python, Go, Rust, Java, C#, Swift, Kotlin, Flutter) can consume services directly via HTTP requests.
- **Unified TypeScript SDK**: JavaScript, Node.js, React, Vue, Next.js, Cloudflare Worker, Bun, and Deno applications import typed clients via `Tools/sdk/index.ts`.
- **Shared Shell Tools**: `Tools/shell-lib/common.sh` provides POSIX/Bash logging, lifecycle orchestration, health waiting, secret scanning, dependency auditing, and security checks.

## Shared Dev Tools & Root Scripts

- `./start_all.sh` — start all 12 microservices.
- `./stop_all.sh` — stop all services.
- `./status.sh` — show running/stopped state.
- `./test_all.sh` — run test suites for all 12 services.
- `./migrate_all.sh` — apply local dev migrations.
- `./bootstrap_env.sh` — copy `.env.example` to `.env` / `.dev.vars` where missing.
- `./audit_all.sh` — audit npm/python dependencies for vulnerabilities (pass `--fix` to auto-remediate).
- `./scan_secrets.sh` — scan repository for hardcoded secrets, tokens, or committed `.env` files.
- `./security_check.sh` — run static frontend security checks and TypeScript typechecks (`tsc --noEmit`).
- `./manage_deps.sh` — inspect disk usage (`status`), prune `.wrangler`/`__pycache__` build caches (`prune`), deduplicate packages (`dedupe`), or bootstrap a single shared Python venv (`shared-venv`).


## Service Conventions

When adding a new service:

1. Create a top-level directory, e.g. `MyService/`.
2. Use one of the supported stacks:
   - **Node/Wrangler:** `package.json` with `dev`, `deploy`, `db:local`, `db:remote`, `typecheck`, `test`.
   - **Python:** `pyproject.toml` with a CLI entry under `[project.scripts]`.
   - **Docker:** `docker-compose.yml` if the service needs containers.
3. Add `.env.example`.
4. Expose `GET /health`.
5. Provide a typed client SDK class in `src/client.ts` or `client.ts` and re-export in `Tools/sdk/index.ts`.
6. Add the service to root scripts (`start_all.sh`, `stop_all.sh`, `test_all.sh`, etc.).
7. Update this `AGENTS.md` if conventions change.

## Environment Conventions

- Auth uses `.env`.
- Cloudflare Worker services use `.dev.vars` for local secrets and `.env`/wrangler vars for non-secret config; keep `.env.example` as the template.
- Never commit real secrets.

## Copying Utilities to Another Project

1. Copy `Tools/` to the new project root.
2. Copy the example caller scripts you need from `Tools/examples/`.
3. Edit the service list in each caller script.
4. Import client SDK classes from `Tools/sdk/index.ts`.
