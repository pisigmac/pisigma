# PiSigma Billing

Shared **Razorpay billing** microservice for PiSigma / PlexApps products — the billing equivalent of [`Auth/`](../Auth/) (identity) and [`Mail/`](../Mail/) (transactional email).

Products never hold Razorpay secrets. They call Billing with a product API key (`pb_live_` / `pb_test_`); Billing owns orders, signature verification, webhooks, rate limits, and payment logs.

## Features

- Product registry + `pb_live_` / `pb_test_` API keys (hashed at rest)
- Plans per product (`slug`, `amount_paise`, `INR`, `interval`)
- `POST /v1/orders` — Razorpay order (plan or ad-hoc amount) + Checkout `key_id`
- `POST /v1/verify` — HMAC payment signature → mark paid
- `POST /v1/webhooks/razorpay` — webhook signature when `RAZORPAY_WEBHOOK_SECRET` set
- Payment get + recent list; hourly rate limit; **Idempotency-Key** on order create
- Dev mode: `ALLOW_DEV_CHARGE=1` + no Razorpay keys → fake paid orders
- Typed client: [`src/client.ts`](src/client.ts)
- Health + OpenAPI stub

## Quick start

```bash
cd Billing
npm install
cp .env.example .dev.vars
npm run db:local
npm run dev
# → http://127.0.0.1:8787
```

### Bootstrap a product + plan

```bash
export BILLING=http://127.0.0.1:8787
export ADMIN=change-me-admin   # BILLING_ADMIN_TOKEN

curl -s -X POST "$BILLING/v1/admin/products" \
  -H "X-Admin-Token: $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "formrelay",
    "name": "Formrelay",
    "rate_limit_per_hour": 500
  }'

curl -s -X POST "$BILLING/v1/admin/products/formrelay/keys" \
  -H "X-Admin-Token: $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"name":"production","environment":"live"}'
# → { "key": "pb_live_…", … }  store once

curl -s -X POST "$BILLING/v1/admin/products/formrelay/plans" \
  -H "X-Admin-Token: $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "pro",
    "name": "Formrelay Pro",
    "amount_paise": 49900,
    "currency": "INR",
    "interval": "month"
  }'
```

### Create order + verify

```bash
curl -s -X POST "$BILLING/v1/orders" \
  -H "Authorization: Bearer pb_live_…" \
  -H "Idempotency-Key: demo-1" \
  -H "Content-Type: application/json" \
  -d '{"plan":"pro"}'
# → { "order_id", "key_id", "amount", … } for Razorpay Checkout

curl -s -X POST "$BILLING/v1/verify" \
  -H "Authorization: Bearer pb_live_…" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_…",
    "razorpay_payment_id": "pay_…",
    "razorpay_signature": "…"
  }'
```

With `ALLOW_DEV_CHARGE=1` and no Razorpay keys, orders are created as already `paid` (`mode: "dev"`).

## Integrate from a product

```ts
import { PisigmaBilling } from '../../Billing/src/client' // or copy the file

const billing = new PisigmaBilling({
  baseUrl: env.BILLING_URL,      // https://billing.plexapps.com
  apiKey: env.BILLING_API_KEY,   // pb_live_…
})

const order = await billing.createOrder({
  plan: 'pro',
  idempotencyKey: `checkout_${userId}`,
})
// Pass order.data.order_id + order.data.key_id to Razorpay Checkout

await billing.verify({
  razorpay_order_id: …,
  razorpay_payment_id: …,
  razorpay_signature: …,
})
```

**Formrelay:** can migrate off in-process Razorpay helpers to `BILLING_URL` + `BILLING_API_KEY`.

## Deploy

```bash
npx wrangler d1 create pisigma-billing
# paste database_id into wrangler.toml
npx wrangler d1 migrations apply pisigma-billing --remote
npx wrangler secret put BILLING_ADMIN_TOKEN
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
npx wrangler deploy
# Custom domain: billing.plexapps.com
# Razorpay Dashboard → Webhooks → https://billing.plexapps.com/v1/webhooks/razorpay
```

## API map

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | — |
| GET | `/v1/openapi.json` | — |
| GET | `/v1/plans` | Product key |
| POST | `/v1/orders` | Product key (+ optional Idempotency-Key) |
| POST | `/v1/verify` | Product key |
| GET | `/v1/payments` | Product key |
| GET | `/v1/payments/:id` | Product key |
| POST | `/v1/webhooks/razorpay` | `X-Razorpay-Signature` (if secret set) |
| * | `/v1/admin/*` | `X-Admin-Token` |

## Security notes

- API keys are SHA-256 hashed; only prefix is stored for lookup
- Admin token required for product / key / plan management
- Payment verify uses Razorpay HMAC (`order_id|payment_id`)
- Webhook verify uses HMAC of raw body when `RAZORPAY_WEBHOOK_SECRET` is set
- Rate limit is per product per UTC hour
- Never expose `RAZORPAY_KEY_SECRET` to product frontends — only `key_id` + `order_id`

## Related

- Auth spine: [`../Auth/`](../Auth/)
- Mail spine: [`../Mail/`](../Mail/)
- Product doc: [`../docs/portfolio/products/billing.md`](../docs/portfolio/products/billing.md)
