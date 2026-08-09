export type Env = {
  DB: D1Database
  ASSETS?: Fetcher
  MAIL_ADMIN_TOKEN?: string
  /** smtp (default when SMTP_HOST set) | console */
  MAIL_PROVIDER?: string
  MAIL_FROM?: string
  SMTP_HOST?: string
  SMTP_PORT?: string
  SMTP_USER?: string
  SMTP_PASS?: string
  /** "1" for implicit TLS (465) */
  SMTP_SECURE?: string
  /** "1" to force STARTTLS (587); default on when not secure */
  SMTP_STARTTLS?: string
  /** Optional: accept pisigma-auth JWTs for /v1/admin (aud must include "mail") */
  MAIL_AUTH_JWKS_URL?: string
  MAIL_AUTH_ISSUER?: string
  MAIL_AUTH_AUDIENCE?: string
}

export type ProductRow = {
  id: string
  slug: string
  name: string
  allowed_from: string
  rate_limit_per_hour: number
  active: number
  created_at: string
}

export type ApiKeyRow = {
  id: string
  product_id: string
  name: string
  key_prefix: string
  key_hash: string
  environment: string
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}

export type TemplateRow = {
  id: string
  product_id: string
  subject: string
  html: string | null
  text: string | null
  updated_at: string
}

export type MessageRow = {
  id: string
  product_id: string
  api_key_id: string | null
  to_addrs: string
  from_addr: string
  reply_to: string | null
  subject: string
  template_id: string | null
  provider: string
  provider_id: string | null
  status: string
  error: string | null
  tags: string | null
  metadata: string | null
  idempotency_key: string | null
  created_at: string
}

export type AuthContext = {
  product: ProductRow
  key: ApiKeyRow
}

export type SendRequest = {
  to: string | string[]
  subject?: string
  html?: string
  text?: string
  template?: string
  data?: Record<string, unknown>
  from?: string
  reply_to?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}
