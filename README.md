<div align="center">

# ⚡ PiSigma (ΠΣ)

### Modern, High-Performance Shared Infrastructure Suite & Unified SDK

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![Security Audit](https://img.shields.io/badge/Security-0_Vulnerabilities-2ea44f?style=for-the-badge&logo=shieldsdotio&logoColor=white)](#-security--compliance-suite)
[![Tests](https://img.shields.io/badge/Tests-125%2F125_Passing-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](#-local-developer-cli)

<p align="center">
  <b>25 Plug-and-Play Microservices</b> • <b>Language-Agnostic REST APIs</b> • <b>Unified TypeScript SDK Facade</b>
</p>

---

</div>

## 📌 Overview

**PiSigma (ΠΣ)** is a production-grade, zero-boilerplate shared infrastructure suite engineered to eliminate duplicate backend code across multi-product SaaS, Enterprise B2B, E-Commerce, AI/LLM applications, and Developer/QA tooling.

Rather than re-implementing auth, payments, storage presigning, push notifications, feature flags, audit logging, single sign-on, prompt engineering, or A/B testing in every new project, **PiSigma provides 25 microservices out-of-the-box** alongside a typed facade SDK for JavaScript/TypeScript and standard HTTP REST endpoints for any programming language.

```
                                +-----------------------------------+
                                |    Your Application / Frontend    |
                                +-----------------------------------+
                                                  |
                                                  v
                                    +---------------------------+
                                    |    createPisigmaClient()  |
                                    |    Unified SDK Facade     |
                                    +---------------------------+
                                                  |
        +-------------------------+---------------+---------------+-------------------------+
        |                         |                               |                         |
  +-----v-----+             +-----v-----+                   +-----v-----+             +-----v-----+
  |   Core    |             |   SaaS    |                   | Enterprise|             |  Dev, AI  |
  | Services  |             | Essentials|                   | & E-Comm  |             | & Realtime|
  +-----------+             +-----------+                   +-----------+             +-----------+
  | Auth      |             | Storage   |                   | SSO       |             | APIGenerat|
  | Billing   |             | Notifs    |                   | RBAC      |             | APITester |
  | Mail      |             | Flags     |                   | Discounts |             | ErrorTrack|
  | Webhooks  |             | Analytics |                   | Inventory |             | Experiment|
  +-----------+             | Search    |                   | MediaProc |             | Feedback  |
                            | Scheduler |                   +-----------+             | PromptMgmt|
                            | AuditLogs |                                             | LLMGuard  |
                            | Localiz   |                                             | Realtime  |
                            +-----------+                                             +-----------+
```

---

## 🏛️ Infrastructure Microservices Matrix

Every service runs as an isolated microservice exposing `GET /health` and standardized HTTP JSON REST endpoints:

| Category | Service | Tech Stack | Port | Health Endpoint | Client SDK Class |
|---|---|---|---|---|---|
| **Core Infrastructure** | **Auth** | Python / FastAPI + Postgres | `:8090` | `http://127.0.0.1:8090/health` | `PisigmaAuth` |
| | **Billing** | TypeScript / Hono + CF Workers | `:8787` | `http://127.0.0.1:8787/health` | `PisigmaBilling` |
| | **Mail** | TypeScript / Hono + CF Workers | `:8787` | `http://127.0.0.1:8787/health` | `PisigmaMail` |
| | **Webhooks** | TypeScript / Hono + CF Workers | `:8787` | `http://127.0.0.1:8787/health` | `PisigmaWebhooks` |
| **SaaS Essentials** | **Storage** | TypeScript / Hono + CF Workers | `:8790` | `http://127.0.0.1:8790/health` | `PisigmaStorage` |
| | **Notifications**| TypeScript / Hono + CF Workers | `:8791` | `http://127.0.0.1:8791/health` | `PisigmaNotifications` |
| | **FeatureFlags** | TypeScript / Hono + CF Workers | `:8792` | `http://127.0.0.1:8792/health` | `PisigmaFeatureFlags` |
| | **Analytics** | TypeScript / Hono + CF Workers | `:8793` | `http://127.0.0.1:8793/health` | `PisigmaAnalytics` |
| | **Search** | TypeScript / Hono + CF Workers | `:8794` | `http://127.0.0.1:8794/health` | `PisigmaSearch` |
| | **Scheduler** | TypeScript / Hono + CF Workers | `:8795` | `http://127.0.0.1:8795/health` | `PisigmaScheduler` |
| | **AuditLogs** | TypeScript / Hono + CF Workers | `:8796` | `http://127.0.0.1:8796/health` | `PisigmaAuditLogs` |
| | **Localization** | TypeScript / Hono + CF Workers | `:8797` | `http://127.0.0.1:8797/health` | `PisigmaLocalization` |
| **Enterprise & Commerce**| **SSO** | TypeScript / Hono + CF Workers | `:8798` | `http://127.0.0.1:8798/health` | `PisigmaSSO` |
| | **RBAC** | TypeScript / Hono + CF Workers | `:8799` | `http://127.0.0.1:8799/health` | `PisigmaRBAC` |
| | **Discounts** | TypeScript / Hono + CF Workers | `:8800` | `http://127.0.0.1:8800/health` | `PisigmaDiscounts` |
| | **Inventory** | TypeScript / Hono + CF Workers | `:8801` | `http://127.0.0.1:8801/health` | `PisigmaInventory` |
| | **MediaProcessing**| TypeScript / Hono + CF Workers| `:8802` | `http://127.0.0.1:8802/health` | `PisigmaMediaProcessing` |
| **Developer & QA** | **APIGenerator** | TypeScript / Hono + CF Workers| `:8803` | `http://127.0.0.1:8803/health` | `PisigmaAPIGenerator` |
| | **APITester** | TypeScript / Hono + CF Workers | `:8804` | `http://127.0.0.1:8804/health` | `PisigmaAPITester` |
| | **ErrorTracking**| TypeScript / Hono + CF Workers| `:8805` | `http://127.0.0.1:8805/health` | `PisigmaErrorTracking` |
| **Product & Analytics** | **Experiments** | TypeScript / Hono + CF Workers | `:8806` | `http://127.0.0.1:8806/health` | `PisigmaExperiments` |
| | **Feedback** | TypeScript / Hono + CF Workers | `:8807` | `http://127.0.0.1:8807/health` | `PisigmaFeedback` |
| **AI & Realtime** | **PromptManagement**| TypeScript / Hono + CF Workers| `:8808` | `http://127.0.0.1:8808/health` | `PisigmaPromptManagement` |
| | **LLMGuardrails**| TypeScript / Hono + CF Workers | `:8809` | `http://127.0.0.1:8809/health` | `PisigmaLLMGuardrails` |
| | **Realtime** | TypeScript / Hono + CF Workers | `:8810` | `http://127.0.0.1:8810/health` | `PisigmaRealtime` |

---

## 🚀 Quick Start (TypeScript / JavaScript)

Instantiate all 25 services with **zero boilerplate** using the `createPisigmaClient()` gateway facade:

```typescript
import { createPisigmaClient } from 'pisigma/Tools/sdk'

// 1. Initialize the unified gateway facade
const pisigma = createPisigmaClient({
  host: 'http://127.0.0.1',
  apiKey: process.env.PISIGMA_API_KEY,
})

// 2. Developer & QA Productivity
const mockApi = await pisigma.apiGenerator.registerSchema({ resource: 'users', fields: ['name', 'email'] })
const testResult = await pisigma.apiTester.runTest({ target_url: 'http://127.0.0.1:8803/v1/generator/mock/users', expected_status: 200 })
await pisigma.errorTracking.capture({ error_message: 'Database connection timeout', stack_trace: 'Error at db.ts:42' })

// 3. AI Engineering & LLM Guardrails
const renderedPrompt = await pisigma.promptManagement.renderPrompt({ template_id: 'system_agent_v1', variables: { user_role: 'admin' } })
const safetyCheck = await pisigma.llmGuardrails.evaluateGuardrails({ text: 'Generate SQL query' })

// 4. Product Experiments & Feedback
const variant = await pisigma.experiments.getVariant({ experiment_key: 'new_checkout_flow', user_id: 'usr_100' })
await pisigma.feedback.submitFeedback({ user_id: 'usr_100', rating: 5, comment: 'Awesome UI!' })

// 5. Realtime & WebSockets
await pisigma.realtime.publishMessage({ channel: 'room_1', payload: { event: 'user_joined', user_id: 'usr_100' } })
```

---

## 🌐 Language-Agnostic REST Interoperability

Applications written in **Python, Go, Rust, Java, C#, Swift, Kotlin, or Flutter** can consume microservices directly via standard HTTP JSON requests:

```bash
# Example: Evaluate AI LLM Guardrails via cURL / HTTP REST
curl -X POST http://127.0.0.1:8809/v1/guardrails/evaluate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "text": "User input prompt text to inspect for PII and safety"
  }'
```

```python
# Example: Python request to PromptManagement microservice
import requests

response = requests.post(
    "http://127.0.0.1:8808/v1/prompts/render",
    json={"template_id": "customer_support_v2", "variables": {"name": "Alice"}},
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)
print(response.json())
```

---

## 🛠️ Local Developer CLI & Orchestration

Control the entire 25-microservice architecture using root POSIX/Bash scripts:

```bash
# Start all 25 microservices
./start_all.sh

# Check real-time service health & ports
./status.sh

# Run complete Vitest & PyTest test suite (125/125 passing)
./test_all.sh

# Bootstrap .env and .dev.vars from templates
./bootstrap_env.sh

# Audit dependencies for security vulnerabilities (npm audit / pip-audit)
./audit_all.sh --fix

# Scan repository for hardcoded secrets or committed credentials
./scan_secrets.sh

# Run static security pattern checks & TypeScript compilation (tsc --noEmit)
./security_check.sh

# Inspect disk usage, prune build caches (.wrangler/__pycache__), & deduplicate packages
./manage_deps.sh status
./manage_deps.sh prune
./manage_deps.sh shared-venv

# Stop all microservices cleanly
./stop_all.sh
```

---

## 🛡️ Security & Compliance Suite

PiSigma includes built-in security auditing guardrails:

- 🔒 **Zero Dependency Vulnerabilities**: Clean `npm audit` reports across all microservices.
- 🔑 **Automated Secret Scanner (`./scan_secrets.sh`)**: Prevents AWS keys, RSA private keys, or committed `.env` files from leaking.
- 🎯 **TypeScript Strict Mode (`./security_check.sh`)**: Enforces zero missing return types or unhandled promises (`tsc --noEmit`).
- 🛑 **Static Code Security Analyzer**: Scans for `eval()`, unescaped dynamic scripts, or unsecure target links.

---

## 📄 License

Internal infrastructure suite for PiSigma / PlexApps platforms. All rights reserved.
