# PiSigma Webhooks

Shared **outbound HTTP webhook** microservice for PiSigma / PlexApps products — the delivery equivalent of [`Mail/`](../Mail/) (pisigma-mail) and [`Auth/`](../Auth/) (pisigma-auth).

Products never implement their own retry/signing loops. They call Webhooks with a product API key (`pw_live_` / `pw_test_`); this service owns endpoints, HMAC signatures, retries, rate limits, and delivery logs.

## Features

- Product registry + hashed API keys
- Endpoint registry per product (`url`, `secret`, optional `event_types` filter)
- `POST /v1/deliver` — immediate attempt + persisted delivery row
- Retries on failure: **1m → 5m → 30m** via Cloudflare Cron (`* * * * *`) or `POST /v1/internal/retry`
- Payload signing: `X-Pisigma-Signature: sha256=<hmac>`, `X-Pisigma-Event`, `X-Pisigma-Delivery`
- **Idempotency-Key** header
- Per-product hourly rate limits
- Delivery lookup + admin listing
- Typed client: [`src/client.ts`](src/client.ts)
- Health + OpenAPI stub + public landing

## Quick start

```bash
cd Webhooks
npm install
cp .env.example .dev.vars
npm run db:local
npm run dev
# → http://127.0.0.1:8787
```

### Bootstrap a product

```bash
export WH=http://127.0.0.1:8787
export ADMIN=change-me-admin   # WEBHOOKS_ADMIN_TOKEN

curl -s -X POST "$WH/v1/admin/products" \
  -H "X-Admin-Token: $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"slug":"formrelay","name":"Formrelay","rate_limit_per_hour":5000}'

curl -s -X POST "$WH/v1/admin/products/formrelay/keys" \
  -H "X-Admin-Token: $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"name":"production","environment":"live"}'
# → { "key": "pw_live_…", … }  store once
```

### Register an endpoint

```bash
curl -s -X POST "$WH/v1/endpoints" \
  -H "Authorization: Bearer pw_live_…" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/hooks/formrelay",
    "secret": "whsec_your_receiver_secret",
    "event_types": ["form.submitted", "form.updated"]
  }'
```

### Deliver

```bash
curl -s -X POST "$WH/v1/deliver" \
  -H "Authorization: Bearer pw_live_…" \
  -H "Idempotency-Key: sub_123" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "form.submitted",
    "data": {"submission_id": "123", "email": "a@b.com"},
    "endpoint_id": "ep_…"
  }'
```

Omit `endpoint_id` / `url` to fan-out to all matching active endpoints. For ad-hoc delivery, pass `url` + `secret`.

## Cron retries

`wrangler.toml` registers:

```toml
[triggers]
crons = ["* * * * *"]
```

Every minute the Worker `scheduled` handler runs `processDueRetries`, which POSTs any `pending` delivery whose `next_attempt_at <= now`.

Backoff after failed attempts:

| After attempt | Next retry |
|---------------|------------|
| 1 (immediate) | +1 minute |
| 2 | +5 minutes |
| 3 | +30 minutes |
| 4 | `exhausted` (no more) |

**Without Cron Triggers** (local / external scheduler), call:

```bash
curl -s -X POST "$WH/v1/internal/retry" \
  -H "X-Admin-Token: $ADMIN"
```

## Receiver verification

Request body (exact bytes signed):

```json
{"id":"dlv_…","event":"form.submitted","data":{…},"created_at":"…"}
```

Headers:

```
X-Pisigma-Signature: sha256=<hex hmac-sha256(secret, body)>
X-Pisigma-Event: form.submitted
X-Pisigma-Delivery: dlv_…
```

Verify by recomputing HMAC-SHA256 of the raw body with your endpoint secret and comparing to the hex after `sha256=`.

## Integrate from a product

```ts
import { PisigmaWebhooks } from '../../Webhooks/src/client'

const wh = new PisigmaWebhooks({
  baseUrl: env.WEBHOOKS_URL,      // https://webhooks.plexapps.com
  apiKey: env.WEBHOOKS_API_KEY,   // pw_live_…
})

await wh.deliver({
  event: 'form.submitted',
  data: { submission_id: id },
  endpointId: env.WEBHOOK_ENDPOINT_ID,
  idempotencyKey: `sub_${id}`,
})
```

**Formrelay:** replace naive `postWebhook` in `formrelay/src/deliver.ts` with this client when ready (not done in this scaffold).

## Deploy

```bash
npx wrangler d1 create pisigma-webhooks
# paste database_id into wrangler.toml
npx wrangler d1 migrations apply pisigma-webhooks --remote
npx wrangler secret put WEBHOOKS_ADMIN_TOKEN
npx wrangler deploy
# Custom domain: webhooks.plexapps.com
```

## API map

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | — |
| GET | `/v1/openapi.json` | — |
| POST | `/v1/endpoints` | Product key |
| GET | `/v1/endpoints` | Product key |
| GET | `/v1/endpoints/:id` | Product key |
| PATCH | `/v1/endpoints/:id` | Product key |
| POST | `/v1/deliver` | Product key |
| GET | `/v1/deliveries/:id` | Product key |
| POST | `/v1/internal/retry` | Admin token |
| GET | `/v1/admin/products` | Admin token |
| POST | `/v1/admin/products` | Admin token |
| PATCH | `/v1/admin/products/:slug` | Admin token |
| POST | `/v1/admin/products/:slug/keys` | Admin token |
| POST | `/v1/admin/products/:slug/keys/:keyId/revoke` | Admin token |
| GET | `/v1/admin/products/:slug/deliveries` | Admin token |
| GET | `/v1/admin/deliveries` | Admin token |

## Security notes

- API keys are SHA-256 hashed; only prefix is stored for lookup
- Endpoint secrets are stored for signing (protect D1 / admin access)
- Admin token required for product/key management and internal retry
- Rate limit is per product per UTC hour
- Prefer HTTPS endpoint URLs in production

## Related

- Mail spine: [`../Mail/`](../Mail/)
- Auth spine: [`../Auth/`](../Auth/)
- Product doc: [`../docs/portfolio/products/webhooks.md`](../docs/portfolio/products/webhooks.md)
