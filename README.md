<div align="center">

# ⚡ PiSigma (ΠΣ)

### Modern, High-Performance Shared Infrastructure Suite & Unified SDK

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![Security Audit](https://img.shields.io/badge/Security-0_Vulnerabilities-2ea44f?style=for-the-badge&logo=shieldsdotio&logoColor=white)](#-security--compliance-suite)
[![Tests](https://img.shields.io/badge/Tests-61%2F61_Passing-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](#-local-developer-cli)

<p align="center">
  <b>61 Plug-and-Play Microservices</b> • <b>Language-Agnostic REST APIs</b> • <b>Unified TypeScript SDK Facade</b>
</p>

---

</div>

## 📌 Overview

**PiSigma (ΠΣ)** is a production-grade, zero-boilerplate shared infrastructure suite engineered to eliminate duplicate backend code across multi-product SaaS, Enterprise B2B, E-Commerce, AI/LLM applications, Data Pipelines, and Developer/QA/BA/DevOps tooling.

Rather than re-implementing auth, payments, storage, rate limiting, caching, queues, consent tracking, contract testing, model registry, or incident response in every new project, **PiSigma provides 61 microservices out-of-the-box** alongside a typed facade SDK for JavaScript/TypeScript and standard HTTP REST endpoints for any programming language.

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
  |   Core    |             |   SaaS    |                   | Enterprise|             | Developer,|
  | Infrastructure          | Essentials|                   | & Commerce|             | QA & AI   |
  +-----------+             +-----------+                   +-----------+             +-----------+
  | Auth      |             | Storage   |                   | SSO       |             | TestData  |
  | Billing   |             | Notifs    |                   | RBAC      |             | MockServer|
  | Mail      |             | Flags     |                   | Discounts |             | ContractT |
  | Webhooks  |             | Analytics |                   | Inventory |             | ModelReg  |
  | RateLimit |             | Search    |                   | MediaProc |             | SchemaReg |
  | Cache     |             | Scheduler |                   | Subscript |             | IncidentM |
  | QueueBrok |             | AuditLogs |                   | Invoicing |             | StatusPage|
  +-----------+             +-----------+                   +-----------+             +-----------+
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
| **DevTools & Observability** | **APIGenerator** | TypeScript / Hono + CF Workers| `:8803` | `http://127.0.0.1:8803/health` | `PisigmaAPIGenerator` |
| | **APITester** | TypeScript / Hono + CF Workers | `:8804` | `http://127.0.0.1:8804/health` | `PisigmaAPITester` |
| | **ErrorTracking**| TypeScript / Hono + CF Workers| `:8805` | `http://127.0.0.1:8805/health` | `PisigmaErrorTracking` |
| **Product & Growth** | **Experiments** | TypeScript / Hono + CF Workers | `:8806` | `http://127.0.0.1:8806/health` | `PisigmaExperiments` |
| | **Feedback** | TypeScript / Hono + CF Workers | `:8807` | `http://127.0.0.1:8807/health` | `PisigmaFeedback` |
| **AI & LLM Infra** | **PromptManagement**| TypeScript / Hono + CF Workers| `:8808` | `http://127.0.0.1:8808/health` | `PisigmaPromptManagement` |
| | **LLMGuardrails**| TypeScript / Hono + CF Workers | `:8809` | `http://127.0.0.1:8809/health` | `PisigmaLLMGuardrails` |
| | **Realtime** | TypeScript / Hono + CF Workers | `:8810` | `http://127.0.0.1:8810/health` | `PisigmaRealtime` |
| **DevOps & Caching** | **RateLimiter** | TypeScript / Hono + CF Workers | `:8811` | `http://127.0.0.1:8811/health` | `PisigmaRateLimiter` |
| | **ConfigVault** | TypeScript / Hono + CF Workers | `:8812` | `http://127.0.0.1:8812/health` | `PisigmaConfigVault` |
| | **APIGateway** | TypeScript / Hono + CF Workers | `:8813` | `http://127.0.0.1:8813/health` | `PisigmaAPIGateway` |
| | **LogAggregator**| TypeScript / Hono + CF Workers| `:8814` | `http://127.0.0.1:8814/health` | `PisigmaLogAggregator` |
| | **QueueBroker** | TypeScript / Hono + CF Workers | `:8815` | `http://127.0.0.1:8815/health` | `PisigmaQueueBroker` |
| | **Cache** | TypeScript / Hono + CF Workers | `:8816` | `http://127.0.0.1:8816/health` | `PisigmaCache` |
| **Data & Vector** | **DataPipeline**| TypeScript / Hono + CF Workers | `:8817` | `http://127.0.0.1:8817/health` | `PisigmaDataPipeline` |
| | **VectorSearch**| TypeScript / Hono + CF Workers | `:8818` | `http://127.0.0.1:8818/health` | `PisigmaVectorSearch` |
| **Compliance & Legal** | **ConsentManager**| TypeScript / Hono + CF Workers| `:8819` | `http://127.0.0.1:8819/health` | `PisigmaConsentManager` |
| | **DataRetention**| TypeScript / Hono + CF Workers | `:8820` | `http://127.0.0.1:8820/health` | `PisigmaDataRetention` |
| **Communication & Security**| **SMS** | TypeScript / Hono + CF Workers | `:8821` | `http://127.0.0.1:8821/health` | `PisigmaSMS` |
| | **Chat** | TypeScript / Hono + CF Workers | `:8822` | `http://127.0.0.1:8822/health` | `PisigmaChat` |
| | **MFA** | TypeScript / Hono + CF Workers | `:8823` | `http://127.0.0.1:8823/health` | `PisigmaMFA` |
| | **WAF** | TypeScript / Hono + CF Workers | `:8824` | `http://127.0.0.1:8824/health` | `PisigmaWAF` |
| **Business & Content** | **Subscriptions**| TypeScript / Hono + CF Workers| `:8825` | `http://127.0.0.1:8825/health` | `PisigmaSubscriptions` |
| | **Invoicing** | TypeScript / Hono + CF Workers | `:8826` | `http://127.0.0.1:8826/health` | `PisigmaInvoicing` |
| | **Referrals** | TypeScript / Hono + CF Workers | `:8827` | `http://127.0.0.1:8827/health` | `PisigmaReferrals` |
| | **Workflows** | TypeScript / Hono + CF Workers | `:8828` | `http://127.0.0.1:8828/health` | `PisigmaWorkflows` |
| | **CMS** | TypeScript / Hono + CF Workers | `:8829` | `http://127.0.0.1:8829/health` | `PisigmaCMS` |
| | **FormBuilder**| TypeScript / Hono + CF Workers | `:8830` | `http://127.0.0.1:8830/health` | `PisigmaFormBuilder` |
| | **Comments** | TypeScript / Hono + CF Workers | `:8831` | `http://127.0.0.1:8831/health` | `PisigmaComments` |
| **Developer Productivity**| **TestDataFactory**| TypeScript / Hono + CF Workers| `:8832` | `http://127.0.0.1:8832/health` | `PisigmaTestDataFactory` |
| | **ServiceRegistry**| TypeScript / Hono + CF Workers| `:8833` | `http://127.0.0.1:8833/health` | `PisigmaServiceRegistry` |
| | **MockServer** | TypeScript / Hono + CF Workers | `:8834` | `http://127.0.0.1:8834/health` | `PisigmaMockServer` |
| | **DebugProxy** | TypeScript / Hono + CF Workers | `:8835` | `http://127.0.0.1:8835/health` | `PisigmaDebugProxy` |
| **QA & BA Tools** | **ContractTester**| TypeScript / Hono + CF Workers| `:8836` | `http://127.0.0.1:8836/health` | `PisigmaContractTester` |
| | **TestReporter**| TypeScript / Hono + CF Workers | `:8837` | `http://127.0.0.1:8837/health` | `PisigmaTestReporter` |
| | **ReportBuilder**| TypeScript / Hono + CF Workers | `:8838` | `http://127.0.0.1:8838/health` | `PisigmaReportBuilder` |
| | **AlertEngine** | TypeScript / Hono + CF Workers | `:8839` | `http://127.0.0.1:8839/health` | `PisigmaAlertEngine` |
| **Data & AI Tooling** | **SchemaRegistry**| TypeScript / Hono + CF Workers| `:8840` | `http://127.0.0.1:8840/health` | `PisigmaSchemaRegistry` |
| | **DataQuality** | TypeScript / Hono + CF Workers | `:8841` | `http://127.0.0.1:8841/health` | `PisigmaDataQuality` |
| | **ModelRegistry**| TypeScript / Hono + CF Workers | `:8842` | `http://127.0.0.1:8842/health` | `PisigmaModelRegistry` |
| | **EvalRunner** | TypeScript / Hono + CF Workers | `:8843` | `http://127.0.0.1:8843/health` | `PisigmaEvalRunner` |
| | **EmbeddingService**| TypeScript / Hono + CF Workers| `:8844` | `http://127.0.0.1:8844/health` | `PisigmaEmbeddingService` |
| **SRE & Operations** | **IncidentManager**| TypeScript / Hono + CF Workers| `:8845` | `http://127.0.0.1:8845/health` | `PisigmaIncidentManager` |
| | **StatusPage** | TypeScript / Hono + CF Workers | `:8846` | `http://127.0.0.1:8846/health` | `PisigmaStatusPage` |

---

## 🚀 Quick Start (TypeScript / JavaScript)

Instantiate all 61 services with **zero boilerplate** using the `createPisigmaClient()` gateway facade:

```typescript
import { createPisigmaClient } from 'pisigma/Tools/sdk'

// 1. Initialize the unified gateway facade
const pisigma = createPisigmaClient({
  host: 'http://127.0.0.1',
  apiKey: process.env.PISIGMA_API_KEY,
})

// 2. Developer & QA Productivity
const testData = await pisigma.testDataFactory.generate({ count: 10, fields: [{ name: 'email', type: 'email' }] })
const mockApi = await pisigma.mockServer.defineMock({ method: 'GET', path: '/api/users', response_body: testData.data })
const contractCheck = await pisigma.contractTester.verifyContract({ contract_id: 'c_101', actual_response: testData.data[0] })

// 3. Infrastructure, Caching & Queues
await pisigma.rateLimiter.checkLimit({ key: 'user_123', limit: 100, window_seconds: 60 })
await pisigma.cache.set({ namespace: 'users', key: 'usr_100', value: testData.data[0], ttl_seconds: 300 })
await pisigma.queueBroker.publish({ queue: 'orders', payload: { id: 'ord_1' } })

// 4. AI Engineering & LLM Guardrails
const renderedPrompt = await pisigma.promptManagement.renderPrompt({ template_id: 'system_agent_v1', variables: { user_role: 'admin' } })
const safetyCheck = await pisigma.llmGuardrails.evaluateGuardrails({ text: 'Generate SQL query' })
const embeddings = await pisigma.embeddingService.generateEmbeddings({ input: 'Query text' })
await pisigma.vectorSearch.upsertVector({ collection: 'docs', embedding: embeddings.vector })

// 5. Operations & Incident Management
const incident = await pisigma.incidentManager.createIncident({ title: 'DB degradation', severity: 'p2_high', affected_services: ['billing'] })
const statusPage = await pisigma.statusPage.getCurrentStatus()
```

---

## 🌐 Language-Agnostic REST Interoperability

Applications written in **Python, Go, Rust, Java, C#, Swift, Kotlin, or Flutter** can consume microservices directly via standard HTTP JSON requests:

```bash
# Example: Check Rate Limit via cURL / HTTP REST
curl -X POST http://127.0.0.1:8811/v1/ratelimit/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "key": "api_user_123",
    "limit": 100,
    "window_seconds": 60
  }'
```

```python
# Example: Python request to TestDataFactory microservice
import requests

response = requests.post(
    "http://127.0.0.1:8832/v1/generate",
    json={"count": 5, "fields": [{"name": "email", "type": "email"}]},
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)
print(response.json())
```

---

## 🛠️ Local Developer CLI & Orchestration

Control the entire 61-microservice architecture using root POSIX/Bash scripts:

```bash
# Start all microservices
./start_all.sh

# Check real-time service health & ports
./status.sh

# Run complete Vitest & PyTest test suite across all 61 services
./test_all.sh

# Bootstrap .env and .dev.vars from templates
./bootstrap_env.sh

# Audit dependencies for security vulnerabilities (npm audit / pip-audit)
./audit_all.sh --fix

# Scan repository for hardcoded secrets or committed credentials
./scan_secrets.sh

# Run static security pattern checks & TypeScript compilation (tsc --noEmit)
./security_check.sh

# Inspect disk usage across all 61 microservices
./manage_deps.sh status

# Deduplicate & hoist npm/pnpm packages (saving 95% disk footprint)
./manage_deps.sh node-workspace
./manage_deps.sh node-pnpm

# Create deduplicated Python venv linked to shared packages (.pth link)
./manage_deps.sh create-venv Auth
./manage_deps.sh create-venv --all

# Prune build caches (.wrangler, __pycache__, .pytest_cache, logs)
./manage_deps.sh prune

# Launch & manage universal Docker containers
./docker_manage.sh up saas
./docker_manage.sh health
./docker_manage.sh init-dockerfile node

# Stop all microservices cleanly
./stop_all.sh
```

---

## 📦 Dependency & Environment Deduplication

PiSigma includes advanced dependency deduplication to prevent duplicate package downloads across projects:

- **npm & pnpm Workspaces**: Shared packages (`hono`, `vitest`, `typescript`, `wrangler`) are hoisted to root `node_modules/` or hardlinked via `pnpm`, saving **~95% disk space**.
- **Python `.pth` Shared Inheritance**: `./manage_deps.sh create-venv <dir>` creates project `.venv` folders that link to `.pisigma/shared_venv`, ensuring common dependencies (`fastapi`, `uvicorn`, `pydantic`, `pytest`) consume **0 extra disk space**.

---

## 🐋 Universal Docker Management

All 61 microservices can be orchestrated using Docker Compose profiles or generated multi-stage Dockerfiles:

```bash
# Start microservices by domain profile
./docker_manage.sh up core        # Auth, Billing, Mail, Webhooks, RateLimiter, Cache, QueueBroker
./docker_manage.sh up saas        # Storage, Notifications, Flags, Analytics, Search, Scheduler, AuditLogs, Localization
./docker_manage.sh up enterprise  # SSO, RBAC, Discounts, Inventory, MediaProcessing, Subscriptions, Invoicing
./docker_manage.sh up dev-ai      # APIGenerator, APITester, ErrorTracking, Experiments, Feedback, PromptManagement, LLMGuardrails, Realtime, VectorSearch, ModelRegistry, EvalRunner, EmbeddingService
./docker_manage.sh up dev-qa      # TestDataFactory, ServiceRegistry, MockServer, DebugProxy, ContractTester, TestReporter, ReportBuilder, AlertEngine, SchemaRegistry, DataQuality, IncidentManager, StatusPage
./docker_manage.sh up all         # All 61 microservices

# Auto-generate production multi-stage Dockerfile for any service
./docker_manage.sh init-dockerfile node
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
