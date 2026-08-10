# PiSigma Future Microservices Roadmap

> **Status**: Phase 1–3 ✅ Complete | Phase 4 Planning  
> **Live Services**: 46 (all on `main`)  
> **Proposed New Services (Phase 4)**: 15  
> **Total After Phase 4**: 61  
> **Breaking Changes to Existing Services**: ❌ None — all modules are standalone

---

## ✅ Phase 1–3: COMPLETED (21 services)

All 21 services from the original roadmap have been **implemented, tested, and integrated** into the unified SDK (`Tools/sdk/index.ts`). Every service passed `vitest run` via `./test_all.sh`.

### Phase 1 — Critical Infrastructure (🥇) ✅
| # | Module | Port | Status |
|---|--------|------|--------|
| 1 | **RateLimiter** | 8811 | ✅ Deployed & tested |
| 2 | **Cache** | 8816 | ✅ Deployed & tested |
| 3 | **QueueBroker** | 8815 | ✅ Deployed & tested |

### Phase 2 — Security & Business (🥈) ✅
| # | Module | Port | Status |
|---|--------|------|--------|
| 4 | **MFA** | 8823 | ✅ Deployed & tested |
| 5 | **SMS** | 8821 | ✅ Deployed & tested |
| 6 | **Subscriptions** | 8825 | ✅ Deployed & tested |
| 7 | **Invoicing** | 8826 | ✅ Deployed & tested |
| 8 | **ConsentManager** | 8819 | ✅ Deployed & tested |
| 9 | **DataRetention** | 8820 | ✅ Deployed & tested |

### Phase 3 — Extended Platform (🥉) ✅
| # | Module | Port | Status |
|---|--------|------|--------|
| 10 | **VectorSearch** | 8818 | ✅ Deployed & tested |
| 11 | **ConfigVault** | 8812 | ✅ Deployed & tested |
| 12 | **APIGateway** | 8813 | ✅ Deployed & tested |
| 13 | **LogAggregator** | 8814 | ✅ Deployed & tested |
| 14 | **DataPipeline** | 8817 | ✅ Deployed & tested |
| 15 | **WAF** | 8824 | ✅ Deployed & tested |
| 16 | **Workflows** | 8828 | ✅ Deployed & tested |
| 17 | **Chat** | 8822 | ✅ Deployed & tested |
| 18 | **Referrals** | 8827 | ✅ Deployed & tested |
| 19 | **CMS** | 8829 | ✅ Deployed & tested |
| 20 | **FormBuilder** | 8830 | ✅ Deployed & tested |
| 21 | **Comments** | 8831 | ✅ Deployed & tested |

---

## 🔗 Dependency Map (Live Integrations)

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

## 🏗️ Phase 4: Developer Experience & Productivity Services (PROPOSED)

> **Philosophy**: Every service below solves a **daily pain point** for a specific engineering persona. These are the tools developers wish they had built-in rather than cobbling together from 5 different SaaS products.

---

### 🧑‍💻 For Backend & Frontend Developers

#### 1. TestDataFactory (Priority: 🥇)
- **Port**: `8832`
- **SDK Class**: `PisigmaTestDataFactory`
- **What It Solves**: Generating realistic, deterministic test data — fake users, addresses, credit cards, products, orders — with locale support and relationship graphs. No more hand-writing 200 lines of fixture JSON.
- **Who Needs It**: Every developer writing tests, QA engineers seeding test environments
- **Key Endpoints**:
  - `POST /v1/generate` — Generate N records for a given schema/entity type
  - `POST /v1/generate/related` — Generate related entity graphs (user → orders → payments)
  - `GET /v1/schemas` — List available entity schemas
  - `POST /v1/schemas` — Define custom entity schema with constraints
  - `POST /v1/seed` — Bulk seed a target service with generated data
- **Daily Use**: Before every test run, during demo prep, onboarding new team members

#### 2. ServiceRegistry (Priority: 🥇)
- **Port**: `8833`
- **SDK Class**: `PisigmaServiceRegistry`
- **What It Solves**: Service discovery — which services are running, on which ports, what version, what health status. Replaces manually checking `status.sh` and memorising port numbers.
- **Who Needs It**: Every developer working with multiple services, DevOps, SREs
- **Key Endpoints**:
  - `POST /v1/services/register` — Register a service instance (name, port, version, metadata)
  - `GET /v1/services` — List all registered services with live health status
  - `GET /v1/services/:name` — Get specific service details + health
  - `DELETE /v1/services/:name` — Deregister a service
  - `GET /v1/services/topology` — Dependency graph of service-to-service calls
- **Daily Use**: Every time a developer starts work: "what's running? what depends on what?"

#### 3. MockServer (Priority: 🥈)
- **Port**: `8834`
- **SDK Class**: `PisigmaMockServer`
- **What It Solves**: Programmable HTTP mock server for external API dependencies (Stripe, Twilio, SendGrid, etc.). Record real API responses, replay them deterministically. No flaky tests from external API rate limits or downtime.
- **Who Needs It**: Developers writing integration tests, QA engineers
- **Key Endpoints**:
  - `POST /v1/mocks/define` — Define mock endpoint (method, path, response, latency, status code)
  - `GET /v1/mocks` — List all active mock definitions
  - `DELETE /v1/mocks/:id` — Remove a mock
  - `POST /v1/mocks/record` — Start recording real API calls for later replay
  - `GET /v1/mocks/replay/:sessionId` — Replay a recorded session
  - `ANY /proxy/*` — Dynamic mock endpoint that matches defined rules
- **Daily Use**: Every time you need to test Stripe webhooks, email delivery, or third-party API flows without hitting real APIs

#### 4. DebugProxy (Priority: 🥈)
- **Port**: `8835`
- **SDK Class**: `PisigmaDebugProxy`
- **What It Solves**: HTTP request/response inspector sitting between services. See exactly what JSON was sent between Service A and Service B, including headers, timing, and error bodies. Like Chrome DevTools Network tab but for service-to-service calls.
- **Who Needs It**: Developers debugging inter-service failures, QA reproducing bugs
- **Key Endpoints**:
  - `POST /v1/proxy/intercept` — Register an intercept rule (source service → target service)
  - `GET /v1/proxy/requests` — List captured request/response pairs with filtering
  - `GET /v1/proxy/requests/:id` — Full request/response detail (headers, body, timing)
  - `DELETE /v1/proxy/requests` — Clear captured data
  - `GET /v1/proxy/stats` — Latency percentiles, error rates between service pairs
- **Daily Use**: "Why is Billing returning 400 to Subscriptions? Let me see the actual payload."

---

### 🧪 For QA Engineers

#### 5. ContractTester (Priority: 🥇)
- **Port**: `8836`
- **SDK Class**: `PisigmaContractTester`
- **What It Solves**: API contract validation — ensure that when Service A updates its response schema, Service B (which consumes it) won't break. Catch breaking API changes before they reach production. Consumer-driven contract testing.
- **Who Needs It**: QA engineers, backend developers maintaining API compatibility
- **Key Endpoints**:
  - `POST /v1/contracts/register` — Register an API contract (provider, consumer, schema)
  - `POST /v1/contracts/verify` — Verify a provider's actual response against registered contracts
  - `GET /v1/contracts` — List all registered contracts
  - `GET /v1/contracts/breaking` — List contracts that would break with current provider state
  - `POST /v1/contracts/diff` — Compare two schema versions and report breaking changes
- **Daily Use**: Pre-merge CI check — "will my API change break any downstream consumer?"

#### 6. TestReporter (Priority: 🥈)
- **Port**: `8837`
- **SDK Class**: `PisigmaTestReporter`
- **What It Solves**: Aggregate test results across all 46+ services into a single dashboard. Track test pass rates over time, identify flaky tests, measure coverage trends. No more scrolling through 46 vitest outputs.
- **Who Needs It**: QA leads, engineering managers, developers debugging failures
- **Key Endpoints**:
  - `POST /v1/reports/ingest` — Ingest test results (JUnit XML, vitest JSON, custom format)
  - `GET /v1/reports/summary` — Aggregate pass/fail/skip across all services
  - `GET /v1/reports/flaky` — List tests that flap (pass/fail inconsistently)
  - `GET /v1/reports/trends` — Pass rate trends over time per service
  - `GET /v1/reports/coverage` — Coverage metrics per service
- **Daily Use**: Morning standup — "what broke overnight? which tests are flaky?"

---

### 📊 For Business Analysts

#### 7. ReportBuilder (Priority: 🥈)
- **Port**: `8838`
- **SDK Class**: `PisigmaReportBuilder`
- **What It Solves**: Define report templates with data source bindings, schedule report generation, export as PDF/CSV/JSON. BAs shouldn't need to write SQL or ask a developer for every weekly metric.
- **Who Needs It**: Business analysts, product managers, finance teams
- **Key Endpoints**:
  - `POST /v1/reports/templates` — Create report template (title, columns, data source, filters)
  - `POST /v1/reports/generate` — Generate report from template with parameters
  - `GET /v1/reports/:id` — Retrieve generated report
  - `GET /v1/reports/:id/export` — Export as PDF/CSV/JSON
  - `POST /v1/reports/schedule` — Schedule recurring report generation
- **Daily Use**: Weekly revenue reports, monthly user growth summaries, churn analysis

#### 8. AlertEngine (Priority: 🥈)
- **Port**: `8839`
- **SDK Class**: `PisigmaAlertEngine`
- **What It Solves**: Business rule-based alerting — "notify me when daily signups drop below 100" or "alert when error rate exceeds 5%". Threshold monitoring with escalation policies.
- **Who Needs It**: BAs, product managers, SREs, DevOps
- **Key Endpoints**:
  - `POST /v1/alerts/rules` — Create alert rule (metric, condition, threshold, channel)
  - `GET /v1/alerts/rules` — List active alert rules
  - `POST /v1/alerts/evaluate` — Manually evaluate a metric against rules
  - `GET /v1/alerts/history` — View triggered alert history
  - `POST /v1/alerts/escalation` — Define escalation policy (notify Slack → email → PagerDuty)
- **Daily Use**: Automated "something is wrong" detection before customers complain

---

### 🔬 For Data Engineers

#### 9. SchemaRegistry (Priority: 🥇)
- **Port**: `8840`
- **SDK Class**: `PisigmaSchemaRegistry`
- **What It Solves**: Centralized schema versioning for API payloads, event messages, and database models. Schema evolution with backward/forward compatibility checks. Avoids "what format is this event in?" confusion across 46 services.
- **Who Needs It**: Data engineers, backend developers, anyone producing/consuming events
- **Key Endpoints**:
  - `POST /v1/schemas/register` — Register a named schema (JSON Schema, Avro, or Protobuf-like)
  - `GET /v1/schemas/:name/versions` — List all versions of a schema
  - `GET /v1/schemas/:name/latest` — Get latest schema version
  - `POST /v1/schemas/validate` — Validate a payload against a specific schema version
  - `POST /v1/schemas/compatibility` — Check if a new schema version is backward-compatible
- **Daily Use**: Before publishing to QueueBroker — "does my event payload match the registered schema?"

#### 10. DataQuality (Priority: 🥈)
- **Port**: `8841`
- **SDK Class**: `PisigmaDataQuality`
- **What It Solves**: Data validation rules (completeness, uniqueness, range, format), anomaly detection, data profiling. Catch data issues at ingestion time rather than discovering corrupted dashboards weeks later.
- **Who Needs It**: Data engineers, BAs, anyone responsible for data accuracy
- **Key Endpoints**:
  - `POST /v1/quality/rules` — Define data quality rule (field, constraint, severity)
  - `POST /v1/quality/validate` — Validate a dataset against quality rules
  - `GET /v1/quality/profile/:dataset` — Statistical profiling (nulls, cardinality, distributions)
  - `GET /v1/quality/anomalies` — List detected data anomalies
  - `GET /v1/quality/scores` — Data quality score per dataset/service
- **Daily Use**: Pipeline validation step — "is this CSV clean enough to load into analytics?"

---

### 🤖 For AI/ML Engineers

#### 11. ModelRegistry (Priority: 🥇)
- **Port**: `8842`
- **SDK Class**: `PisigmaModelRegistry`
- **What It Solves**: ML model versioning, metadata tracking (accuracy, latency, parameters), deployment status, A/B model comparison. Like a "Git for models" — know which model version is in production and how it compares to the previous one.
- **Who Needs It**: AI/ML engineers, data scientists
- **Key Endpoints**:
  - `POST /v1/models/register` — Register a model (name, version, framework, metrics)
  - `GET /v1/models/:name/versions` — List all versions with metrics comparison
  - `POST /v1/models/:name/promote` — Promote a version to production/staging
  - `GET /v1/models/:name/active` — Get currently active model version
  - `POST /v1/models/compare` — Side-by-side metric comparison of two versions
- **Daily Use**: "Which model version is live? How does the new fine-tune compare?"

#### 12. EvalRunner (Priority: 🥈)
- **Port**: `8843`
- **SDK Class**: `PisigmaEvalRunner`
- **What It Solves**: LLM evaluation pipeline — run prompts through multiple models/versions, score outputs against ground truth, track eval metrics over time. Replaces ad-hoc Jupyter notebooks for prompt evaluation.
- **Who Needs It**: AI engineers, prompt engineers
- **Key Endpoints**:
  - `POST /v1/evals/suites` — Create evaluation suite (test cases with expected outputs)
  - `POST /v1/evals/run` — Execute eval suite against a model endpoint
  - `GET /v1/evals/results/:runId` — Get detailed eval results with scoring
  - `GET /v1/evals/trends` — Eval score trends across runs
  - `POST /v1/evals/compare` — Compare eval results between two model versions
- **Daily Use**: After every prompt tweak — "did this change improve or degrade output quality?"

#### 13. EmbeddingService (Priority: 🥈)
- **Port**: `8844`
- **SDK Class**: `PisigmaEmbeddingService`
- **What It Solves**: Centralized text/image embedding generation. One API to generate embeddings regardless of provider (OpenAI, Cohere, local model). Caches embeddings to avoid redundant API calls. Feeds VectorSearch.
- **Who Needs It**: AI engineers building RAG, semantic search, recommendation systems
- **Key Endpoints**:
  - `POST /v1/embeddings/generate` — Generate embeddings for text/images (provider-agnostic)
  - `POST /v1/embeddings/batch` — Batch embed multiple inputs
  - `GET /v1/embeddings/providers` — List available embedding providers and dimensions
  - `POST /v1/embeddings/similarity` — Compute cosine similarity between two inputs
  - `GET /v1/embeddings/cache/stats` — Cache hit rate and cost savings
- **Daily Use**: "Embed this document for RAG without worrying about which provider or caching"

---

### 🛠️ For DevOps / SREs

#### 14. IncidentManager (Priority: 🥇)
- **Port**: `8845`
- **SDK Class**: `PisigmaIncidentManager`
- **What It Solves**: Incident lifecycle tracking — create, escalate, resolve, postmortem. On-call rotation management. Integrates with AlertEngine for auto-incident creation. Replaces Slack threads as incident management.
- **Who Needs It**: SREs, DevOps, engineering managers
- **Key Endpoints**:
  - `POST /v1/incidents/create` — Create incident (severity, affected services, description)
  - `PUT /v1/incidents/:id/status` — Update incident status (investigating → identified → resolved)
  - `POST /v1/incidents/:id/timeline` — Add timeline entry to incident
  - `GET /v1/incidents/active` — List all active incidents
  - `POST /v1/incidents/:id/postmortem` — Create postmortem with root cause, action items
  - `GET /v1/incidents/oncall` — Get current on-call rotation
- **Daily Use**: "Production is down — create an incident, track the timeline, write the postmortem"

#### 15. StatusPage (Priority: 🥈)
- **Port**: `8846`
- **SDK Class**: `PisigmaStatusPage`
- **What It Solves**: Public/internal status page showing the health of all services, historical uptime, active incidents, and scheduled maintenance. Auto-polls `/health` endpoints of registered services.
- **Who Needs It**: SREs, DevOps, customer success teams, end users
- **Key Endpoints**:
  - `POST /v1/status/services` — Register a service for health monitoring
  - `GET /v1/status/current` — Current status of all monitored services
  - `GET /v1/status/uptime` — Historical uptime percentages per service
  - `POST /v1/status/maintenance` — Schedule a maintenance window
  - `GET /v1/status/incidents` — Active and recent incidents (pulls from IncidentManager)
  - `GET /v1/status/page` — Rendered status page data for public display
- **Daily Use**: "Is everything up? What's our SLA compliance this month?"

---

## 📊 Phase 4 Port Allocation Map

| Port Range | Persona | Services |
|---|---|---|
| `8832–8835` | Developers | TestDataFactory, ServiceRegistry, MockServer, DebugProxy |
| `8836–8837` | QA Engineers | ContractTester, TestReporter |
| `8838–8839` | Business Analysts | ReportBuilder, AlertEngine |
| `8840–8841` | Data Engineers | SchemaRegistry, DataQuality |
| `8842–8844` | AI/ML Engineers | ModelRegistry, EvalRunner, EmbeddingService |
| `8845–8846` | DevOps / SREs | IncidentManager, StatusPage |

---

## 📋 Phase 4 Implementation Priority

### Phase 4A — Every-Developer-Needs-This (🥇)
| # | Module | Persona | Justification |
|---|--------|---------|---------------|
| 1 | **TestDataFactory** | All | Every test suite needs realistic data — biggest daily friction |
| 2 | **ServiceRegistry** | All | 46 services need discoverability — too many ports to remember |
| 3 | **ContractTester** | QA / Dev | Breaking API changes between services is the #1 outage cause |
| 4 | **SchemaRegistry** | Data Eng / Dev | Event-driven architecture needs schema governance |
| 5 | **ModelRegistry** | AI Eng | ML model lifecycle has zero tooling today |
| 6 | **IncidentManager** | DevOps / SRE | Incident response needs structure, not Slack threads |

### Phase 4B — Productivity Multipliers (🥈)
| # | Module | Persona | Justification |
|---|--------|---------|---------------|
| 7 | **MockServer** | Dev / QA | Eliminates external API flakiness in tests |
| 8 | **DebugProxy** | Dev | Inter-service debugging is currently blind |
| 9 | **TestReporter** | QA | Aggregating 46 test suites by hand is unsustainable |
| 10 | **ReportBuilder** | BA | BAs shouldn't need to file Jira tickets for every data export |
| 11 | **AlertEngine** | BA / SRE | Proactive monitoring instead of reactive firefighting |
| 12 | **EvalRunner** | AI Eng | Prompt quality regression detection |
| 13 | **EmbeddingService** | AI Eng | Centralized embedding generation with caching saves cost |
| 14 | **DataQuality** | Data Eng | Catch bad data at ingestion, not in dashboards |
| 15 | **StatusPage** | DevOps | SLA reporting and public transparency |

---

## 📈 Full Platform Overview (Current + Proposed)

### Live Services (46)

| # | Service | Port | Category |
|---|---------|------|----------|
| 1 | Auth | 8090 | Identity |
| 2 | Billing | 8787 | Payments |
| 3 | Mail | 8787 | Communication |
| 4 | Webhooks | 8787 | Integration |
| 5 | Storage | 8790 | Files |
| 6 | Notifications | 8791 | Communication |
| 7 | FeatureFlags | 8792 | Product |
| 8 | Analytics | 8793 | Data |
| 9 | Search | 8794 | Discovery |
| 10 | Scheduler | 8795 | Automation |
| 11 | AuditLogs | 8796 | Compliance |
| 12 | Localization | 8797 | i18n |
| 13 | SSO | 8798 | Identity |
| 14 | RBAC | 8799 | Security |
| 15 | Discounts | 8800 | Commerce |
| 16 | Inventory | 8801 | Commerce |
| 17 | MediaProcessing | 8802 | Media |
| 18 | APIGenerator | 8803 | DevTools |
| 19 | APITester | 8804 | DevTools |
| 20 | ErrorTracking | 8805 | Observability |
| 21 | Experiments | 8806 | Product |
| 22 | Feedback | 8807 | Product |
| 23 | PromptManagement | 8808 | AI |
| 24 | LLMGuardrails | 8809 | AI |
| 25 | Realtime | 8810 | Communication |
| 26 | RateLimiter | 8811 | Infrastructure |
| 27 | ConfigVault | 8812 | Infrastructure |
| 28 | APIGateway | 8813 | Infrastructure |
| 29 | LogAggregator | 8814 | Observability |
| 30 | QueueBroker | 8815 | Infrastructure |
| 31 | Cache | 8816 | Infrastructure |
| 32 | DataPipeline | 8817 | Data |
| 33 | VectorSearch | 8818 | AI |
| 34 | ConsentManager | 8819 | Compliance |
| 35 | DataRetention | 8820 | Compliance |
| 36 | SMS | 8821 | Communication |
| 37 | Chat | 8822 | Communication |
| 38 | MFA | 8823 | Security |
| 39 | WAF | 8824 | Security |
| 40 | Subscriptions | 8825 | Payments |
| 41 | Invoicing | 8826 | Payments |
| 42 | Referrals | 8827 | Growth |
| 43 | Workflows | 8828 | Automation |
| 44 | CMS | 8829 | Content |
| 45 | FormBuilder | 8830 | Content |
| 46 | Comments | 8831 | Content |

### Proposed (Phase 4) — 15 services

| # | Service | Port | Persona |
|---|---------|------|---------|
| 47 | TestDataFactory | 8832 | Developer |
| 48 | ServiceRegistry | 8833 | Developer |
| 49 | MockServer | 8834 | Developer / QA |
| 50 | DebugProxy | 8835 | Developer |
| 51 | ContractTester | 8836 | QA |
| 52 | TestReporter | 8837 | QA |
| 53 | ReportBuilder | 8838 | BA |
| 54 | AlertEngine | 8839 | BA / SRE |
| 55 | SchemaRegistry | 8840 | Data Engineer |
| 56 | DataQuality | 8841 | Data Engineer |
| 57 | ModelRegistry | 8842 | AI Engineer |
| 58 | EvalRunner | 8843 | AI Engineer |
| 59 | EmbeddingService | 8844 | AI Engineer |
| 60 | IncidentManager | 8845 | DevOps / SRE |
| 61 | StatusPage | 8846 | DevOps / SRE |

---

> **Note**: All Phase 4 modules follow the same conventions — Hono + Cloudflare Workers, `GET /health`, typed SDK client (`PisigmaXxx`), vitest test suite. No changes to any of the current 46 services are required.
