import { describe, expect, it } from 'vitest'
import {
  formatSignatureHeader,
  hmacSha256Hex,
  mintApiKey,
  sha256Hex,
  timingSafeEqual,
} from '../src/crypto'
import { endpointMatchesEvent, hourBucket, nextRetryAt, RETRY_DELAYS_MS } from '../src/policy'

describe('hmacSha256Hex', () => {
  it('matches known HMAC-SHA256 vector', async () => {
    // HMAC-SHA256("key", "The quick brown fox jumps over the lazy dog")
    const hex = await hmacSha256Hex('key', 'The quick brown fox jumps over the lazy dog')
    expect(hex).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8')
  })

  it('formats signature header', async () => {
    const hex = await hmacSha256Hex('secret', '{"event":"test"}')
    expect(formatSignatureHeader(hex)).toBe(`sha256=${hex}`)
    expect(formatSignatureHeader(hex).startsWith('sha256=')).toBe(true)
  })

  it('is deterministic for same secret+body', async () => {
    const a = await hmacSha256Hex('whsec_abc', '{"id":"dlv_1"}')
    const b = await hmacSha256Hex('whsec_abc', '{"id":"dlv_1"}')
    expect(a).toBe(b)
  })

  it('changes when body changes', async () => {
    const a = await hmacSha256Hex('s', 'body-a')
    const b = await hmacSha256Hex('s', 'body-b')
    expect(a).not.toBe(b)
  })
})

describe('api key minting', () => {
  it('mints pw_live_ / pw_test_ keys', async () => {
    const live = await mintApiKey('live')
    expect(live.raw.startsWith('pw_live_')).toBe(true)
    expect(live.prefix).toBe(live.raw.slice(0, 14))
    expect(live.hash).toBe(await sha256Hex(live.raw))

    const test = await mintApiKey('test')
    expect(test.raw.startsWith('pw_test_')).toBe(true)
  })
})

describe('timingSafeEqual', () => {
  it('compares equal strings', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true)
    expect(timingSafeEqual('abc', 'abd')).toBe(false)
    expect(timingSafeEqual('ab', 'abc')).toBe(false)
  })
})

describe('retry schedule', () => {
  it('uses 1m, 5m, 30m delays', () => {
    expect(RETRY_DELAYS_MS).toEqual([60_000, 5 * 60_000, 30 * 60_000])
    const from = new Date('2026-08-09T12:00:00.000Z')
    expect(nextRetryAt(1, from)).toBe('2026-08-09T12:01:00.000Z')
    expect(nextRetryAt(2, from)).toBe('2026-08-09T12:05:00.000Z')
    expect(nextRetryAt(3, from)).toBe('2026-08-09T12:30:00.000Z')
    expect(nextRetryAt(4, from)).toBeNull()
  })
})

describe('endpointMatchesEvent', () => {
  it('matches all when null/empty', () => {
    expect(endpointMatchesEvent(null, 'form.submitted')).toBe(true)
    expect(endpointMatchesEvent('[]', 'form.submitted')).toBe(true)
  })

  it('filters by event_types', () => {
    expect(endpointMatchesEvent('["form.submitted","form.updated"]', 'form.submitted')).toBe(true)
    expect(endpointMatchesEvent('["form.submitted"]', 'other')).toBe(false)
    expect(endpointMatchesEvent('["*"]', 'anything')).toBe(true)
  })
})

describe('hourBucket', () => {
  it('shapes UTC hour', () => {
    expect(hourBucket(new Date('2026-08-09T13:22:00Z'))).toBe('2026-08-09T13')
  })
})
