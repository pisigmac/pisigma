import { formatSignatureHeader, hmacSha256Hex } from './crypto'
import { nextRetryAt } from './policy'
import type { DeliveryRow, Env } from './types'

const RESPONSE_TRUNCATE = 2048
const FETCH_TIMEOUT_MS = 15_000

export type AttemptResult = {
  ok: boolean
  statusCode: number | null
  error: string | null
  responseBody: string | null
}

export async function signAndPost(
  url: string,
  secret: string,
  event: string,
  deliveryId: string,
  body: string,
): Promise<AttemptResult> {
  const hex = await hmacSha256Hex(secret, body)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PiSigma-Webhooks/1.0',
        'X-Pisigma-Signature': formatSignatureHeader(hex),
        'X-Pisigma-Event': event,
        'X-Pisigma-Delivery': deliveryId,
      },
      body,
      signal: controller.signal,
    })

    const text = await res.text().catch(() => '')
    const truncated =
      text.length > RESPONSE_TRUNCATE ? text.slice(0, RESPONSE_TRUNCATE) + '…' : text || null

    if (res.ok) {
      return { ok: true, statusCode: res.status, error: null, responseBody: truncated }
    }
    return {
      ok: false,
      statusCode: res.status,
      error: `http_${res.status}`,
      responseBody: truncated,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fetch_failed'
    return { ok: false, statusCode: null, error: msg.slice(0, 500), responseBody: null }
  } finally {
    clearTimeout(timer)
  }
}

/** Perform one HTTP attempt and persist status / next retry. */
export async function attemptDelivery(env: Env, row: DeliveryRow): Promise<DeliveryRow> {
  const result = await signAndPost(row.url, row.signing_secret, row.event, row.id, row.payload)
  const attemptCount = row.attempt_count + 1
  const now = new Date()
  const nowIso = now.toISOString()

  if (result.ok) {
    await env.DB.prepare(
      `UPDATE deliveries SET
         status = 'delivered',
         attempt_count = ?,
         next_attempt_at = NULL,
         last_status_code = ?,
         last_error = NULL,
         response_body = ?,
         updated_at = ?,
         delivered_at = ?
       WHERE id = ?`,
    )
      .bind(attemptCount, result.statusCode, result.responseBody, nowIso, nowIso, row.id)
      .run()

    return {
      ...row,
      status: 'delivered',
      attempt_count: attemptCount,
      next_attempt_at: null,
      last_status_code: result.statusCode,
      last_error: null,
      response_body: result.responseBody,
      updated_at: nowIso,
      delivered_at: nowIso,
    }
  }

  const canRetry = attemptCount < row.max_attempts
  const nextAt = canRetry ? nextRetryAt(attemptCount, now) : null
  const status = canRetry ? 'pending' : 'exhausted'

  await env.DB.prepare(
    `UPDATE deliveries SET
       status = ?,
       attempt_count = ?,
       next_attempt_at = ?,
       last_status_code = ?,
       last_error = ?,
       response_body = ?,
       updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      status,
      attemptCount,
      nextAt,
      result.statusCode,
      result.error,
      result.responseBody,
      nowIso,
      row.id,
    )
    .run()

  return {
    ...row,
    status,
    attempt_count: attemptCount,
    next_attempt_at: nextAt,
    last_status_code: result.statusCode,
    last_error: result.error,
    response_body: result.responseBody,
    updated_at: nowIso,
  }
}

/** Process deliveries due for retry (cron or POST /v1/internal/retry). */
export async function processDueRetries(
  env: Env,
  limit = 50,
): Promise<{ processed: number; delivered: number; exhausted: number }> {
  const nowIso = new Date().toISOString()
  const { results } = await env.DB.prepare(
    `SELECT * FROM deliveries
     WHERE status = 'pending'
       AND next_attempt_at IS NOT NULL
       AND next_attempt_at <= ?
     ORDER BY next_attempt_at ASC
     LIMIT ?`,
  )
    .bind(nowIso, limit)
    .all<DeliveryRow>()

  let processed = 0
  let delivered = 0
  let exhausted = 0

  for (const row of results || []) {
    const updated = await attemptDelivery(env, row)
    processed++
    if (updated.status === 'delivered') delivered++
    if (updated.status === 'exhausted') exhausted++
  }

  return { processed, delivered, exhausted }
}

export function deliveryPublicResponse(row: DeliveryRow) {
  return {
    id: row.id,
    status: row.status,
    event: row.event,
    url: row.url,
    endpoint_id: row.endpoint_id,
    attempt_count: row.attempt_count,
    max_attempts: row.max_attempts,
    next_attempt_at: row.next_attempt_at,
    last_status_code: row.last_status_code,
    last_error: row.last_error,
    idempotency_key: row.idempotency_key,
    created_at: row.created_at,
    updated_at: row.updated_at,
    delivered_at: row.delivered_at,
  }
}
