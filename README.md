<div align="center">

# ⚡ PiSigma (ΠΣ)

### Modern, High-Performance Shared Infrastructure Suite & Unified SDK

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![Security Audit](https://img.shields.io/badge/Security-0_Vulnerabilities-2ea44f?style=for-the-badge&logo=shieldsdotio&logoColor=white)](#-security--compliance-suite)
[![Tests](https://img.shields.io/badge/Tests-83%2F83_Passing-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](#-local-developer-cli)

<p align="center">
  <b>17 Plug-and-Play Microservices</b> • <b>Language-Agnostic REST APIs</b> • <b>Unified TypeScript SDK Facade</b>
</p>

---

</div>

## 📌 Overview

**PiSigma (ΠΣ)** is a production-grade, zero-boilerplate shared infrastructure suite engineered to eliminate duplicate backend code across multi-product SaaS, Enterprise B2B, E-Commerce, and Media platforms.

Rather than re-implementing auth, payments, storage presigning, push notifications, feature flags, audit logging, or single sign-on in every new application repo, **PiSigma provides 17 microservices out-of-the-box** alongside a typed facade SDK for JavaScript/TypeScript and standard HTTP REST endpoints for any programming language.

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
  |   Core    |             |   SaaS    |                   | Enterprise|             | E-Commerce|
  | Services  |             | Essentials|                   |    B2B    |             |  & Media  |
  +-----------+             +-----------+                   +-----------+             +-----------+
  | Auth      |             | Storage   |                   | SSO       |             | Discounts |
  | Billing   |             | Notifs    |                   | RBAC      |             | Inventory |
  | Mail      |             | Flags     |                   +-----------+             | MediaProc |
  | Webhooks  |             | Analytics |                                             +-----------+
  +-----------+             | Search    |
                            | Scheduler |
                            | AuditLogs |
                            | Localiz   |
                            +-----------+
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
| **Enterprise B2B** | **SSO** | TypeScript / Hono + CF Workers | `:8798` | `http://127.0.0.1:8798/health` | `PisigmaSSO` |
| | **RBAC** | TypeScript / Hono + CF Workers | `:8799` | `http://127.0.0.1:8799/health` | `PisigmaRBAC` |
| **E-Commerce & Media** | **Discounts** | TypeScript / Hono + CF Workers | `:8800` | `http://127.0.0.1:8800/health` | `PisigmaDiscounts` |
| | **Inventory** | TypeScript / Hono + CF Workers | `:8801` | `http://127.0.0.1:8801/health` | `PisigmaInventory` |
| | **MediaProcessing**| TypeScript / Hono + CF Workers| `:8802` | `http://127.0.0.1:8802/health` | `PisigmaMediaProcessing` |

---

## 🚀 Quick Start (TypeScript / JavaScript)

Instantiate all 17 services with **zero boilerplate** using the `createPisigmaClient()` gateway facade:

```typescript
import { createPisigmaClient } from 'pisigma/Tools/sdk'

// 1. Initialize the unified gateway facade
const pisigma = createPisigmaClient({
  host: 'http://127.0.0.1',
  apiKey: process.env.PISIGMA_API_KEY,
})

// 2. SaaS Infrastructure Operations
await pisigma.auth.login({ email: 'user@example.com', password: 'secretpassword' })
await pisigma.storage.getPresignedUploadUrl({ filename: 'report.pdf', mime_type: 'application/pdf', size_bytes: 4096 })
await pisigma.flags.isEnabled('new_dashboard_v2', 'usr_100')
await pisigma.analytics.track({ event_name: 'user_subscribed', user_id: 'usr_100' })
await pisigma.scheduler.scheduleJob({ job_type: 'generate_pdf', run_at: '2026-08-10T00:00:00Z' })

// 3. Enterprise B2B Operations
await pisigma.sso.authenticate({ provider: 'okta', token: 'okta_auth_code_992' })
await pisigma.rbac.can({ role_id: 'manager', action: 'approve_expense', resource: 'finance' })

// 4. E-Commerce & Media Operations
await pisigma.discounts.evaluate({ cart_total: 150, coupon_code: 'SUMMER20' })
await pisigma.inventory.reserve({ sku: 'HEADPHONES-BLACK', quantity: 1 })
await pisigma.mediaProcessing.transform({ url: 'http://example.com/raw.jpg', preset: 'hero_banner' })
```

---

## 🌐 Language-Agnostic REST Interoperability

Applications written in **Python, Go, Rust, Java, C#, Swift, Kotlin, or Flutter** can consume microservices directly via standard HTTP JSON requests:

```bash
# Example: Generate S3/R2 presigned upload URL via cURL / HTTP REST
curl -X POST http://127.0.0.1:8790/v1/uploads/presigned \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "filename": "avatar.png",
    "mime_type": "image/png",
    "size_bytes": 102400
  }'
```

```python
# Example: Python request to FeatureFlags microservice
import requests

response = requests.post(
    "http://127.0.0.1:8792/v1/evaluate",
    json={"flag_key": "beta_feature", "user_id": "usr_9402"},
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)
print(response.json())
```

---

## 🛠️ Local Developer CLI & Orchestration

Control the entire 17-microservice architecture using root POSIX/Bash scripts:

```bash
# Start all 17 microservices
./start_all.sh

# Check real-time service health & ports
./status.sh

# Run complete Vitest & PyTest test suite (83/83 passing)
./test_all.sh

# Bootstrap .env and .dev.vars from templates
./bootstrap_env.sh

# Audit dependencies for security vulnerabilities (npm audit / pip-audit)
./audit_all.sh --fix

# Scan repository for hardcoded secrets or committed credentials
./scan_secrets.sh

# Run static security pattern checks & TypeScript compilation (tsc --noEmit)
./security_check.sh

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
