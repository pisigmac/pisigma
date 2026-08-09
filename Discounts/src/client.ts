/**
 * Typed client SDK for PiSigma Discounts Service.
 */
import type { Coupon, CreateCouponRequest, DiscountEvaluationRequest, DiscountEvaluationResult } from './types'

export type DiscountsClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaDiscounts {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: DiscountsClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetch || fetch
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`
    return h
  }

  async checkHealth(): Promise<ClientResult<{ status: string; service: string; environment?: string }>> {
    const res = await this.fetchFn(`${this.baseUrl}/health`)
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        status: String(json.status),
        service: String(json.service),
        environment: json.environment ? String(json.environment) : undefined,
      },
    }
  }

  async evaluateDiscount(req: DiscountEvaluationRequest): Promise<ClientResult<DiscountEvaluationResult>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/discounts/evaluate`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as DiscountEvaluationResult,
    }
  }

  async createCoupon(req: CreateCouponRequest): Promise<ClientResult<{ success: boolean; coupon: Coupon }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/discounts/coupons`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as { success: boolean; coupon: Coupon },
    }
  }

  async getCoupons(): Promise<ClientResult<{ coupons: Coupon[] }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/discounts/coupons`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as { coupons: Coupon[] },
    }
  }
}
