import type { ProductRow } from './types'

export function hourBucket(d = new Date()): string {
  return d.toISOString().slice(0, 13) // YYYY-MM-DDTHH
}

export async function assertWithinRateLimit(
  db: D1Database,
  product: ProductRow,
): Promise<{ ok: true } | { ok: false; limit: number; used: number }> {
  const bucket = hourBucket()
  const row = await db
    .prepare(`SELECT count FROM rate_buckets WHERE product_id = ? AND hour_bucket = ?`)
    .bind(product.id, bucket)
    .first<{ count: number }>()

  const used = row?.count ?? 0
  if (used >= product.rate_limit_per_hour) {
    return { ok: false, limit: product.rate_limit_per_hour, used }
  }

  await db
    .prepare(
      `INSERT INTO rate_buckets (product_id, hour_bucket, count) VALUES (?, ?, 1)
       ON CONFLICT(product_id, hour_bucket) DO UPDATE SET count = count + 1`,
    )
    .bind(product.id, bucket)
    .run()

  return { ok: true }
}

/** Retry delays after failures: attempt 1→1m, 2→5m, 3→30m (then exhausted). */
export const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000] as const

export function nextRetryAt(attemptCount: number, from = new Date()): string | null {
  // attemptCount is the number of attempts already made (after this failure)
  const delayIdx = attemptCount - 1
  if (delayIdx < 0 || delayIdx >= RETRY_DELAYS_MS.length) return null
  return new Date(from.getTime() + RETRY_DELAYS_MS[delayIdx]!).toISOString()
}

export function parseEventTypes(raw: string | null): string[] | null {
  if (raw == null || raw === '') return null
  try {
    const v = JSON.parse(raw)
    if (!Array.isArray(v)) return null
    return v.map(String)
  } catch {
    return null
  }
}

export function endpointMatchesEvent(eventTypesJson: string | null, event: string): boolean {
  const types = parseEventTypes(eventTypesJson)
  if (types == null || types.length === 0) return true
  return types.includes(event) || types.includes('*')
}

export function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}
