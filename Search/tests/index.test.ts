import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaSearch } from '../src/client'

describe('Search service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-search')
  })

  it('POST /v1/index indexes documents', async () => {
    const res = await app.request('/v1/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documents: [
          { id: 'doc_1', title: 'PiSigma Auth', content: 'FastAPI authentication service' },
          { id: 'doc_2', title: 'PiSigma Search', content: 'Full text search indexing engine' },
        ],
      }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.success).toBe(true)
    expect(json.indexed).toBe(2)
  })

  it('POST /v1/search retrieves matching documents', async () => {
    const res = await app.request('/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'search' }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.total).toBe(1)
    expect(json.results[0].id).toBe('doc_2')
  })

  it('PisigmaSearch client works correctly', async () => {
    const client = new PisigmaSearch({
      baseUrl: 'http://localhost:8794',
      fetch: async (url, init) => app.request(url, init),
    })

    const health = await client.checkHealth()
    expect(health.ok).toBe(true)
    if (health.ok) {
      expect(health.data.status).toBe('ok')
    }

    const indexRes = await client.index([
      { id: 'doc_3', title: 'Scheduler Job', content: 'Task runner cron and queue scheduler' },
    ])
    expect(indexRes.ok).toBe(true)

    const searchRes = await client.search({ query: 'Scheduler' })
    expect(searchRes.ok).toBe(true)
    if (searchRes.ok) {
      expect(searchRes.data.total).toBe(1)
      expect(searchRes.data.results[0].id).toBe('doc_3')
    }
  })
})
