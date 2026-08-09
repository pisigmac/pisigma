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

export function isValidPlanInterval(interval: string): boolean {
  return interval === 'month' || interval === 'year' || interval === 'one_time'
}
