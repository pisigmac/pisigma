import { describe, expect, it, vi } from 'vitest'
import app from '../src/index'
import { PisigmaAPITester } from '../src/client'

describe('APITester Service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-api-tester')
    expect(json.environment).toBe('development')
  })

  it('POST /v1/tester/run requires url', async () => {
    const res = await app.request('/v1/tester/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as any
    expect(json.error).toBe('URL is required')
  })

  it('POST /v1/tester/run executes endpoint test', async () => {
    const globalFetchOriginal = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    ) as any

    try {
      const res = await app.request('/v1/tester/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'http://127.0.0.1:8804/health',
          method: 'GET',
          expected_status: 200,
        }),
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as any
      expect(json.success).toBe(true)
      expect(json.status_code).toBe(200)
      expect(json.matched_expected_status).toBe(true)
    } finally {
      globalThis.fetch = globalFetchOriginal
    }
  })

  it('POST /v1/tester/benchmark runs multiple request iterations', async () => {
    const globalFetchOriginal = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
    ) as any

    try {
      const res = await app.request('/v1/tester/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'http://127.0.0.1:8804/health',
          iterations: 5,
        }),
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as any
      expect(json.total_requests).toBe(5)
      expect(json.successful_requests).toBe(5)
      expect(json.failed_requests).toBe(0)
    } finally {
      globalThis.fetch = globalFetchOriginal
    }
  })

  it('PisigmaAPITester client operates correctly', async () => {
    const globalFetchOriginal = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
    ) as any

    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input.toString()
      const url = new URL(urlStr)
      const req = new Request(url, init)
      return app.request(req)
    }

    try {
      const client = new PisigmaAPITester({ baseUrl: 'http://localhost:8804', fetch: fetchMock as any })

      const health = await client.checkHealth()
      expect(health.ok).toBe(true)
      if (health.ok) {
        expect(health.data.service).toBe('pisigma-api-tester')
      }

      const testRes = await client.runTest({ url: 'http://localhost:8804/health' })
      expect(testRes.ok).toBe(true)
      if (testRes.ok) {
        expect(testRes.data.success).toBe(true)
      }

      const benchRes = await client.runBenchmark({ url: 'http://localhost:8804/health', iterations: 3 })
      expect(benchRes.ok).toBe(true)
      if (benchRes.ok) {
        expect(benchRes.data.total_requests).toBe(3)
      }
    } finally {
      globalThis.fetch = globalFetchOriginal
    }
  })
})
