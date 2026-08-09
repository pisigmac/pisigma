# PiSigma Auth

Shared identity microservice for PiSigma products. **Product-agnostic:** no consumer product is hard-coded in Auth. Other services validate JWTs via JWKS and assign product grants via admin API or deployment env.

## Features

- Email/password register & login
- Google + GitHub OAuth
- RS256 access tokens + refresh tokens
- Public JWKS (`/.well-known/jwks.json`)
- Orgs / memberships (`org_id` / `workspace_id` claims)
- Product grants (`aud` + `roles.<product>`) — assigned per product, not baked into Auth

## Quick start

```bash
cd Auth
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
export AUTH_DATABASE_URL=sqlite+pysqlite:////tmp/pisigma_auth.db
# Optional: auto-grant audiences on signup for a given deployment
# export AUTH_DEFAULT_AUDIENCES=myproduct,otherproduct
pisigma-auth
# → http://127.0.0.1:8090
```

OpenAPI: http://127.0.0.1:8090/docs

## Integrate from another product

1. Send users to Auth login API or OAuth start URLs
2. Receive `access_token` (Bearer JWT)
3. Validate locally with JWKS (`iss`, `aud`, `exp`) — no call to Auth per request
4. Read claims: `sub`, `email`, `org_id`, `workspace_id`, `roles`
5. Ensure users have a **product grant** for your audience (`POST /v1/admin/grants` or `AUTH_DEFAULT_AUDIENCES` in that environment)

```bash
curl http://127.0.0.1:8090/.well-known/jwks.json
```

Example claims (after granting audience `myproduct`):

```json
{
  "sub": "user_uuid",
  "email": "dev@example.com",
  "org_id": "…",
  "workspace_id": "…",
  "aud": ["myproduct"],
  "roles": { "myproduct": "operator" },
  "iss": "https://auth.pisigma.local"
}
```

## OAuth setup

Create Google / GitHub OAuth apps. Redirect URIs:

- `http://localhost:8090/v1/oauth/google/callback`
- `http://localhost:8090/v1/oauth/github/callback`

Env:

```bash
export AUTH_GOOGLE_CLIENT_ID=…
export AUTH_GOOGLE_CLIENT_SECRET=…
export AUTH_GITHUB_CLIENT_ID=…
export AUTH_GITHUB_CLIENT_SECRET=…
export AUTH_SPA_CALLBACK_URL=http://localhost:5173/auth/callback
```

## Docker

```bash
docker compose up -d
```

Postgres + Auth on port 8090.

## API map (`/v1`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/register` | Signup |
| POST | `/auth/login` | Password login |
| POST | `/auth/refresh` | Rotate tokens |
| POST | `/auth/logout` | Revoke refresh |
| GET | `/auth/me` | Current user |
| GET | `/oauth/google/start` | Google OAuth |
| GET | `/oauth/github/start` | GitHub OAuth |
| GET | `/.well-known/jwks.json` | JWKS |
| POST | `/introspect` | Gateway introspection |
| CRUD | `/orgs` | Tenancy |
| Admin | `/admin/users`, `/admin/grants` | Platform admin |
