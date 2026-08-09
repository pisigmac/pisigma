# PiSigma Mail

**Transactional email product** for PiSigma / PlexApps — the mail equivalent of [`Auth/`](../Auth/).  
Sends over **your SMTP** (Postfix, Mailcow, SES SMTP, etc.). **No Resend. No Clerk.**

Products call Mail with `pm_*` keys. Humans/admin can use **pisigma-auth** JWTs (`MAIL_AUTH_JWKS_URL`).

## Features

- Product registry + hashed `pm_live_` / `pm_test_` API keys
- `POST /v1/send` — raw HTML/text or templates (`{{var}}` / `{{{raw}}}`)
- From allowlist, hourly rate limits, Idempotency-Key, delivery log
- Providers: **SMTP** (prod) · **console** (local)
- Admin: `X-Admin-Token` **or** Auth/ Bearer JWT (audience `mail`)
- Typed client: [`src/client.ts`](src/client.ts)

## Quick start

```bash
cd Mail
npm install
cp .env.example .dev.vars   # MAIL_PROVIDER=console for local
npm run db:local
npm run dev
```

### Production SMTP

```bash
# .dev.vars / wrangler secrets+vars
MAIL_PROVIDER=smtp
MAIL_FROM=PlexApps <noreply@plexapps.com>
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...          # wrangler secret put SMTP_PASS
SMTP_STARTTLS=1
```

Publish SPF / DKIM / DMARC on `plexapps.com` for the SMTP host you use.

### Optional: Auth/ for admin (not Clerk)

```bash
MAIL_AUTH_JWKS_URL=https://auth.example/.well-known/jwks.json
MAIL_AUTH_ISSUER=https://auth.example
MAIL_AUTH_AUDIENCE=mail
# Grant product audience "mail" in Auth/ for operators
```

### Bootstrap a product

```bash
export MAIL=http://127.0.0.1:8787
export ADMIN=change-me-admin

curl -s -X POST "$MAIL/v1/admin/products" \
  -H "X-Admin-Token: $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"slug":"formrelay","name":"Formrelay","allowed_from":["Formrelay <noreply@plexapps.com>","*"],"rate_limit_per_hour":2000}'

curl -s -X POST "$MAIL/v1/admin/products/formrelay/keys" \
  -H "X-Admin-Token: $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"name":"production","environment":"live"}'
```

## Integrate

```ts
import { PisigmaMail } from '../../Mail/src/client'

const mail = new PisigmaMail({ baseUrl: env.MAIL_URL, apiKey: env.MAIL_API_KEY })
await mail.send({ to, subject, text, idempotencyKey: `…` })
```

**Formrelay:** set `MAIL_URL` + `MAIL_API_KEY` (required for email; no direct Resend).

## Deploy

```bash
npx wrangler d1 create pisigma-mail
npx wrangler d1 migrations apply pisigma-mail --remote
npx wrangler secret put MAIL_ADMIN_TOKEN
npx wrangler secret put SMTP_PASS
# vars: MAIL_PROVIDER=smtp MAIL_FROM SMTP_HOST SMTP_PORT SMTP_USER SMTP_STARTTLS=1
npx wrangler deploy
# custom domain: mail.plexapps.com
```

## API map

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | — |
| POST | `/v1/send` | Product key `pm_*` |
| GET | `/v1/messages/:id` | Product key |
| * | `/v1/admin/*` | Admin token or Auth JWT |

## Related

- Auth spine: [`../Auth/`](../Auth/)
- Product doc: [`../docs/portfolio/products/mail.md`](../docs/portfolio/products/mail.md)
