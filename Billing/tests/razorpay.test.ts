import { describe, expect, it } from 'vitest'
import { hmacSha256Hex, timingSafeEqual } from '../src/crypto'
import { hourBucket, isValidPlanInterval } from '../src/policy'
import {
  razorpayConfigured,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../src/razorpay'

describe('hmacSha256Hex', () => {
  it('is deterministic', async () => {
    const a = await hmacSha256Hex('secret', 'payload')
    const b = await hmacSha256Hex('secret', 'payload')
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })

  it('changes with payload', async () => {
    const a = await hmacSha256Hex('secret', 'a')
    const b = await hmacSha256Hex('secret', 'b')
    expect(a).not.toBe(b)
  })
})

describe('timingSafeEqual', () => {
  it('equals same strings', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true)
  })

  it('rejects different length', () => {
    expect(timingSafeEqual('ab', 'abc')).toBe(false)
  })

  it('rejects different content', () => {
    expect(timingSafeEqual('abc', 'abd')).toBe(false)
  })
})

describe('verifyPaymentSignature', () => {
  it('accepts valid Razorpay checkout signature', async () => {
    const secret = 'test_secret'
    const orderId = 'order_ABC'
    const paymentId = 'pay_XYZ'
    const signature = await hmacSha256Hex(secret, `${orderId}|${paymentId}`)
    expect(await verifyPaymentSignature(secret, orderId, paymentId, signature)).toBe(true)
  })

  it('rejects tampered signature', async () => {
    const ok = await verifyPaymentSignature('secret', 'order_1', 'pay_1', 'deadbeef')
    expect(ok).toBe(false)
  })
})

describe('verifyWebhookSignature', () => {
  it('accepts valid webhook HMAC of raw body', async () => {
    const secret = 'whsec'
    const body = '{"event":"payment.captured"}'
    const signature = await hmacSha256Hex(secret, body)
    expect(await verifyWebhookSignature(secret, body, signature)).toBe(true)
  })

  it('rejects bad webhook signature', async () => {
    expect(await verifyWebhookSignature('whsec', '{}', 'nope')).toBe(false)
  })
})

describe('razorpayConfigured', () => {
  it('requires both key id and secret', () => {
    expect(razorpayConfigured({})).toBe(false)
    expect(razorpayConfigured({ RAZORPAY_KEY_ID: 'rzp_test' })).toBe(false)
    expect(
      razorpayConfigured({ RAZORPAY_KEY_ID: 'rzp_test', RAZORPAY_KEY_SECRET: 'sec' }),
    ).toBe(true)
  })
})

describe('policy helpers', () => {
  it('hourBucket shape', () => {
    expect(hourBucket(new Date('2026-08-09T13:22:00Z'))).toBe('2026-08-09T13')
  })

  it('validates plan intervals', () => {
    expect(isValidPlanInterval('month')).toBe(true)
    expect(isValidPlanInterval('year')).toBe(true)
    expect(isValidPlanInterval('one_time')).toBe(true)
    expect(isValidPlanInterval('week')).toBe(false)
  })
})
