# PiSigma Future Microservices Roadmap

> **Status**: Planning  
> **Current Services**: 25 (live on `main`)  
> **Proposed New Services**: 21  
> **Total After Completion**: 46  
> **Breaking Changes to Existing Services**: ❌ None — all new modules are standalone

---

## ⚠️ Important: Zero Impact on Existing Services

All 21 proposed modules are **independently deployable microservices**. No existing service code, ports, endpoints, or SDK clients will be modified. Each new module gets its own:

- Top-level directory (e.g. `RateLimiter/`)
- Dedicated port
- `GET /health` endpoint
- Typed client SDK class in `Tools/sdk/index.ts`
- Unit test suite

---

## 🏗️ Proposed Modules by Category

### 1. Infrastructure & DevOps Layer

#### RateLimiter (Priority: 🥇)
- **Port**: `8811`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaRateLimiter`
- **What It Solves**: API throttling, sliding window, token bucket, IP/user-based rate limits
- **Who Needs It**: Every API consumer, backend developers
- **Key Endpoints**:
  - `POST /v1/ratelimit/check` — Check if request is within rate limit
  - `POST /v1/ratelimit/config` — Configure rate limit rules per route/user
  - `GET /v1/ratelimit/stats` — View current rate limit consumption stats
- **Complements**: All existing services (optional middleware layer)

#### ConfigVault (Priority: 🥉)
- **Port**: `8812`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaConfigVault`
- **What It Solves**: Centralized secrets rotation, environment config management, versioned config snapshots
- **Who Needs It**: DevOps, SREs, platform engineers
- **Key Endpoints**:
  - `GET /v1/config/:namespace/:key` — Retrieve config value
  - `PUT /v1/config/:namespace/:key` — Set/update config value
  - `POST /v1/config/rotate` — Rotate secrets with zero-downtime
  - `GET /v1/config/:namespace/snapshot` — Export full config snapshot
- **Complements**: All services (optional config source)

#### APIGateway (Priority: 🥉)
- **Port**: `8813`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaAPIGateway`
- **What It Solves**: Unified entry point, request routing, auth middleware injection, request/response transformation
- **Who Needs It**: Backend developers, DevOps
- **Key Endpoints**:
  - `POST /v1/gateway/routes` — Register upstream service route
  - `GET /v1/gateway/routes` — List all registered routes
  - `ANY /proxy/*` — Dynamic proxy to upstream services
- **Complements**: All services (sits in front as reverse proxy)

#### LogAggregator (Priority: 🥉)
- **Port**: `8814`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaLogAggregator`
- **What It Solves**: Centralized structured logging, log search, retention policies, log level filtering
- **Who Needs It**: DevOps, SREs, backend developers
- **Key Endpoints**:
  - `POST /v1/logs/ingest` — Ingest structured log entries
  - `POST /v1/logs/search` — Search logs by service, level, timestamp range
  - `GET /v1/logs/stats` — Aggregated log metrics (error rates, volume)
  - `POST /v1/logs/retention` — Configure log retention policies
- **Complements**: ErrorTracking (optional log source)

#### QueueBroker (Priority: 🥇)
- **Port**: `8815`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaQueueBroker`
- **What It Solves**: Async job queues, dead-letter queues, retry policies with exponential backoff, pub/sub fanout
- **Who Needs It**: Backend developers, DevOps
- **Key Endpoints**:
  - `POST /v1/queue/publish` — Publish message to a named queue
  - `POST /v1/queue/subscribe` — Register webhook subscriber for a queue
  - `GET /v1/queue/:name/stats` — Queue depth, processing rate, DLQ count
  - `POST /v1/queue/:name/retry` — Retry failed messages from dead-letter queue
- **Complements**: Mail, Webhooks, Notifications, Scheduler (optional async backend)

---

### 2. Caching & Data Layer

#### Cache (Priority: 🥇)
- **Port**: `8816`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaCache`
- **What It Solves**: Key-value TTL cache, cache invalidation, read-through patterns, namespace isolation
- **Who Needs It**: Backend developers, frontend developers
- **Key Endpoints**:
  - `GET /v1/cache/:namespace/:key` — Get cached value
  - `PUT /v1/cache/:namespace/:key` — Set cached value with TTL
  - `DELETE /v1/cache/:namespace/:key` — Invalidate specific cache entry
  - `DELETE /v1/cache/:namespace` — Flush entire namespace
  - `GET /v1/cache/:namespace/stats` — Cache hit/miss ratio, memory usage
- **Complements**: All services (universal caching layer)

#### DataPipeline (Priority: 🥉)
- **Port**: `8817`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaDataPipeline`
- **What It Solves**: ETL jobs, data import/export, CSV/JSON/Parquet transformations, scheduled data syncs
- **Who Needs It**: Data engineers, BAs
- **Key Endpoints**:
  - `POST /v1/pipeline/jobs` — Create ETL job definition
  - `POST /v1/pipeline/jobs/:id/run` — Trigger pipeline execution
  - `GET /v1/pipeline/jobs/:id/status` — Check job execution status
  - `POST /v1/pipeline/transform` — Ad-hoc data transformation (CSV → JSON, etc.)
- **Complements**: Analytics (optional data source)

#### VectorSearch (Priority: 🥉)
- **Port**: `8818`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaVectorSearch`
- **What It Solves**: Semantic search, embeddings storage, cosine/dot-product similarity, RAG retrieval for AI apps
- **Who Needs It**: AI engineers, ML engineers
- **Key Endpoints**:
  - `POST /v1/vectors/upsert` — Store embedding vectors with metadata
  - `POST /v1/vectors/query` — Semantic similarity search (top-K nearest)
  - `DELETE /v1/vectors/:id` — Remove vector entry
  - `GET /v1/vectors/collections` — List vector collections
- **Complements**: Search (semantic layer), PromptManagement (RAG context)

---

### 3. Compliance & Governance

#### ConsentManager (Priority: 🥈)
- **Port**: `8819`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaConsentManager`
- **What It Solves**: GDPR/CCPA consent tracking, cookie preference management, data subject access requests (DSAR)
- **Who Needs It**: Legal teams, compliance officers, product managers
- **Key Endpoints**:
  - `POST /v1/consent/record` — Record user consent decision
  - `GET /v1/consent/:userId` — Retrieve user's current consent state
  - `POST /v1/consent/dsar` — Submit data subject access request
  - `GET /v1/consent/policies` — List active consent policies
- **Complements**: Auth (user identity), AuditLogs (consent audit trail)

#### DataRetention (Priority: 🥈)
- **Port**: `8820`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaDataRetention`
- **What It Solves**: Automated data lifecycle policies, archival schedules, right-to-erasure execution, retention reporting
- **Who Needs It**: Compliance officers, DPOs, data engineers
- **Key Endpoints**:
  - `POST /v1/retention/policies` — Create data retention policy
  - `GET /v1/retention/policies` — List active retention policies
  - `POST /v1/retention/execute` — Trigger retention policy execution (archive/delete)
  - `POST /v1/retention/erasure` — Execute right-to-erasure for a specific user
- **Complements**: ConsentManager (consent-driven retention), AuditLogs (erasure audit trail)

---

### 4. Communication

#### SMS (Priority: 🥈)
- **Port**: `8821`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaSMS`
- **What It Solves**: SMS sending via Twilio/Vonage/MessageBird, OTP delivery, delivery receipts, template management
- **Who Needs It**: All apps with auth/verification, marketing teams
- **Key Endpoints**:
  - `POST /v1/sms/send` — Send SMS message
  - `POST /v1/sms/otp/generate` — Generate and send OTP via SMS
  - `POST /v1/sms/otp/verify` — Verify OTP code
  - `GET /v1/sms/delivery/:id` — Check delivery receipt status
- **Complements**: Auth (OTP verification), Notifications (SMS channel), MFA (SMS factor)

#### Chat (Priority: 🥉)
- **Port**: `8822`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaChat`
- **What It Solves**: In-app messaging, threaded conversations, read receipts, typing indicators, message search
- **Who Needs It**: Product teams, community platforms, customer support
- **Key Endpoints**:
  - `POST /v1/chat/channels` — Create chat channel/room
  - `POST /v1/chat/messages` — Send message to channel
  - `GET /v1/chat/channels/:id/messages` — Retrieve message history
  - `POST /v1/chat/messages/:id/read` — Mark message as read
- **Complements**: Realtime (WebSocket delivery), Notifications (unread alerts)

---

### 5. Security

#### MFA (Priority: 🥈)
- **Port**: `8823`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaMFA`
- **What It Solves**: Multi-factor authentication — TOTP (Google Authenticator), SMS codes, WebAuthn/passkeys, backup codes
- **Who Needs It**: Security teams, compliance, all apps with sensitive data
- **Key Endpoints**:
  - `POST /v1/mfa/totp/setup` — Generate TOTP secret and QR code URI
  - `POST /v1/mfa/totp/verify` — Verify TOTP code
  - `POST /v1/mfa/webauthn/register` — Register WebAuthn credential
  - `POST /v1/mfa/webauthn/verify` — Verify WebAuthn assertion
  - `POST /v1/mfa/backup-codes/generate` — Generate one-time backup codes
- **Complements**: Auth (second factor verification), SMS (SMS-based MFA)

#### WAF (Priority: 🥉)
- **Port**: `8824`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaWAF`
- **What It Solves**: IP blocking/allowlisting, geo-fencing, request payload filtering, bot detection, brute-force protection
- **Who Needs It**: DevOps, security teams, SREs
- **Key Endpoints**:
  - `POST /v1/waf/evaluate` — Evaluate incoming request against WAF rules
  - `POST /v1/waf/rules` — Create WAF rule (IP block, geo-fence, pattern match)
  - `GET /v1/waf/rules` — List active WAF rules
  - `GET /v1/waf/threats` — View blocked threat summary
- **Complements**: APIGateway (pre-routing filter), RateLimiter (brute-force layer)

---

### 6. Business Logic

#### Subscriptions (Priority: 🥈)
- **Port**: `8825`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaSubscriptions`
- **What It Solves**: Recurring billing cycles, plan upgrades/downgrades, trial management, grace periods, dunning
- **Who Needs It**: SaaS founders, product managers, finance teams
- **Key Endpoints**:
  - `POST /v1/subscriptions/create` — Create new subscription for a user
  - `POST /v1/subscriptions/:id/upgrade` — Upgrade/downgrade subscription plan
  - `POST /v1/subscriptions/:id/cancel` — Cancel subscription (immediate or end-of-period)
  - `GET /v1/subscriptions/:id` — Retrieve subscription details & billing history
  - `POST /v1/subscriptions/webhook` — Handle payment provider webhook (Stripe, Paddle)
- **Complements**: Billing (payment execution), Invoicing (invoice generation)

#### Invoicing (Priority: 🥈)
- **Port**: `8826`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaInvoicing`
- **What It Solves**: PDF invoice generation, tax line items, payment reconciliation, credit notes, multi-currency
- **Who Needs It**: Finance teams, e-commerce, SaaS
- **Key Endpoints**:
  - `POST /v1/invoices/create` — Generate invoice with line items
  - `GET /v1/invoices/:id/pdf` — Download invoice as PDF
  - `POST /v1/invoices/:id/send` — Email invoice to customer
  - `GET /v1/invoices/summary` — Revenue summary & outstanding amounts
- **Complements**: Billing (payment source), Subscriptions (recurring invoices), Mail (delivery)

#### Referrals (Priority: 🥉)
- **Port**: `8827`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaReferrals`
- **What It Solves**: Affiliate tracking, referral code generation, commission calculation, payout tracking
- **Who Needs It**: Growth teams, marketing, SaaS founders
- **Key Endpoints**:
  - `POST /v1/referrals/codes` — Generate referral code for user
  - `POST /v1/referrals/track` — Track referral conversion event
  - `GET /v1/referrals/:userId/stats` — View referral performance metrics
  - `GET /v1/referrals/payouts` — Calculate pending commission payouts
- **Complements**: Analytics (conversion tracking), Billing (commission payout)

#### Workflows (Priority: 🥉)
- **Port**: `8828`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaWorkflows`
- **What It Solves**: Visual workflow engine, approval chains, conditional branching, state machines, trigger-action automation
- **Who Needs It**: BAs, product managers, operations teams
- **Key Endpoints**:
  - `POST /v1/workflows/define` — Define workflow with states and transitions
  - `POST /v1/workflows/:id/trigger` — Trigger workflow execution
  - `GET /v1/workflows/:id/status` — Check workflow execution state
  - `POST /v1/workflows/:id/approve` — Approve/reject pending approval step
- **Complements**: Scheduler (time-based triggers), Notifications (approval alerts)

---

### 7. Content & UX

#### CMS (Priority: 🥉)
- **Port**: `8829`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaCMS`
- **What It Solves**: Headless content management, versioned content delivery, draft/publish lifecycle, content types
- **Who Needs It**: Content teams, marketing, product managers
- **Key Endpoints**:
  - `POST /v1/cms/content` — Create content entry
  - `GET /v1/cms/content/:slug` — Retrieve published content by slug
  - `PUT /v1/cms/content/:id/publish` — Publish draft content
  - `GET /v1/cms/content/:id/versions` — List content version history
- **Complements**: Storage (media assets), Localization (translated content), Search (content indexing)

#### FormBuilder (Priority: 🥉)
- **Port**: `8830`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaFormBuilder`
- **What It Solves**: Dynamic form schema generation, validation rules, submission storage, conditional logic
- **Who Needs It**: Product teams, BAs, no-code builders
- **Key Endpoints**:
  - `POST /v1/forms/create` — Create form schema with fields and validation
  - `GET /v1/forms/:id` — Retrieve form schema for rendering
  - `POST /v1/forms/:id/submit` — Submit form response
  - `GET /v1/forms/:id/responses` — List form submissions
- **Complements**: Feedback (survey forms), Analytics (form conversion tracking)

#### Comments (Priority: 🥉)
- **Port**: `8831`
- **Stack**: TypeScript / Hono + Cloudflare Workers
- **SDK Class**: `PisigmaComments`
- **What It Solves**: Threaded comments on any resource, moderation queue, reactions/emoji, mention notifications
- **Who Needs It**: Community platforms, e-commerce, content sites
- **Key Endpoints**:
  - `POST /v1/comments` — Post a comment on a resource
  - `GET /v1/comments/:resourceId` — Retrieve comment thread for a resource
  - `POST /v1/comments/:id/react` — Add reaction to a comment
  - `POST /v1/comments/:id/moderate` — Approve/flag/delete comment
- **Complements**: Notifications (mention alerts), Realtime (live comment updates)

---

## 📊 Port Allocation Map

| Port Range | Category | Services |
|---|---|---|
| `8811–8815` | Infrastructure & DevOps | RateLimiter, ConfigVault, APIGateway, LogAggregator, QueueBroker |
| `8816–8818` | Caching & Data | Cache, DataPipeline, VectorSearch |
| `8819–8820` | Compliance & Governance | ConsentManager, DataRetention |
| `8821–8822` | Communication | SMS, Chat |
| `8823–8824` | Security | MFA, WAF |
| `8825–8828` | Business Logic | Subscriptions, Invoicing, Referrals, Workflows |
| `8829–8831` | Content & UX | CMS, FormBuilder, Comments |

---

## 🔗 Dependency Map (Optional Future Integrations)

These integrations are **optional** — no existing service code needs modification:

```
MFA ──────────► Auth (second factor verification)
SMS ──────────► Auth (OTP), Notifications (SMS channel), MFA (SMS factor)
Subscriptions ─► Billing (payment execution)
Invoicing ────► Billing (payment source), Mail (invoice delivery)
VectorSearch ─► Search (semantic layer), PromptManagement (RAG context)
QueueBroker ──► Mail, Webhooks, Notifications, Scheduler (async backend)
WAF ──────────► APIGateway (pre-routing filter)
Cache ────────► All services (universal caching layer)
```

---

## 📋 Implementation Priority

### Phase 1 — Critical Infrastructure (🥇)
| # | Module | Justification |
|---|---|---|
| 1 | **RateLimiter** | Every API needs throttling — biggest gap today |
| 2 | **Cache** | Most requested infra primitive after storage |
| 3 | **QueueBroker** | Async processing is critical for email, webhooks, billing |

### Phase 2 — Security & Business (🥈)
| # | Module | Justification |
|---|---|---|
| 4 | **MFA** | Auth exists but lacks 2FA — security compliance gap |
| 5 | **SMS** | OTP delivery, transactional SMS — complements Mail service |
| 6 | **Subscriptions** | Billing exists but lacks recurring subscription lifecycle |
| 7 | **Invoicing** | PDF invoices are needed for every SaaS and e-commerce product |
| 8 | **ConsentManager** | GDPR/CCPA compliance is legally required in EU/US markets |
| 9 | **DataRetention** | Required for SOC2, HIPAA, and right-to-erasure compliance |

### Phase 3 — Extended Platform (🥉)
| # | Module | Justification |
|---|---|---|
| 10 | **VectorSearch** | AI/RAG apps need embeddings storage |
| 11 | **ConfigVault** | Centralized secrets management for multi-service deployments |
| 12 | **APIGateway** | Unified entry point for large-scale deployments |
| 13 | **LogAggregator** | Centralized logging for observability |
| 14 | **DataPipeline** | ETL for data engineering workflows |
| 15 | **WAF** | Web application firewall for production security |
| 16 | **Workflows** | State machines and approval chains for BAs |
| 17 | **Chat** | In-app messaging for community/support products |
| 18 | **Referrals** | Affiliate & growth marketing |
| 19 | **CMS** | Headless content management |
| 20 | **FormBuilder** | Dynamic form generation |
| 21 | **Comments** | Threaded discussions on any resource |

---

> **Note**: All 21 modules follow the same conventions as existing services — Hono + Cloudflare Workers, `GET /health`, typed SDK client, vitest test suite. No changes to any of the current 25 microservices are required.
