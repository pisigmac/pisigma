export type Env = {
  DB: D1Database
  ASSETS?: Fetcher
  WEBHOOKS_ADMIN_TOKEN?: string
}

export type ProductRow = {
  id: string
  slug: string
  name: string
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

export type EndpointRow = {
  id: string
  product_id: string
  url: string
  secret: string
  event_types: string | null
  description: string | null
  active: number
  created_at: string
  updated_at: string
}

export type DeliveryRow = {
  id: string
  product_id: string
  api_key_id: string | null
  endpoint_id: string | null
  url: string
  signing_secret: string
  event: string
  payload: string
  status: string
  attempt_count: number
  max_attempts: number
  next_attempt_at: string | null
  last_status_code: number | null
  last_error: string | null
  response_body: string | null
  idempotency_key: string | null
  created_at: string
  updated_at: string
  delivered_at: string | null
}

export type AuthContext = {
  product: ProductRow
  key: ApiKeyRow
}

export type DeliverRequest = {
  event: string
  data?: Record<string, unknown>
  endpoint_id?: string
  url?: string
  secret?: string
}

export type CreateEndpointRequest = {
  url: string
  secret: string
  event_types?: string[] | null
  description?: string
}
