export type Env = {
  DB: D1Database
  ASSETS?: Fetcher
  BILLING_ADMIN_TOKEN?: string
  RAZORPAY_KEY_ID?: string
  RAZORPAY_KEY_SECRET?: string
  RAZORPAY_WEBHOOK_SECRET?: string
  ALLOW_DEV_CHARGE?: string
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

export type PlanRow = {
  id: string
  product_id: string
  slug: string
  name: string
  amount_paise: number
  currency: string
  interval: string
  active: number
  created_at: string
}

export type PaymentRow = {
  id: string
  product_id: string
  api_key_id: string | null
  plan_id: string | null
  plan_slug: string | null
  amount_paise: number
  currency: string
  status: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  receipt: string | null
  notes: string | null
  metadata: string | null
  idempotency_key: string | null
  confirmed_at: string | null
  created_at: string
}

export type AuthContext = {
  product: ProductRow
  key: ApiKeyRow
}

export type CreateOrderRequest = {
  plan?: string
  amount_paise?: number
  currency?: string
  receipt?: string
  notes?: Record<string, string>
  metadata?: Record<string, unknown>
  description?: string
}

export type VerifyRequest = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}
