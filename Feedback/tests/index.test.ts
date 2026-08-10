import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaFeedback } from '../src/client'

describe('Feedback Service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-feedback')
    expect(json.environment).toBe('development')
  })

  it('POST /v1/feedback/submit creates feedback successfully', async () => {
    const res = await app.request('/v1/feedback/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'usr_test',
        category: 'ui',
        rating: 5,
        comment: 'Love the smooth user experience!',
      }),
    })
    expect(res.status).toBe(201)
    const json = (await res.json()) as any
    expect(json.success).toBe(true)
    expect(json.feedback.id).toBeDefined()
    expect(json.feedback.category).toBe('ui')
    expect(json.feedback.rating).toBe(5)
    expect(json.feedback.comment).toBe('Love the smooth user experience!')
  })

  it('POST /v1/feedback/submit returns 400 for empty comment', async () => {
    const res = await app.request('/v1/feedback/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: '   ' }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as any
    expect(json.error).toBeDefined()
  })

  it('POST /v1/feedback/submit returns 400 for invalid rating', async () => {
    const res = await app.request('/v1/feedback/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: 'Bad rating', rating: 6 }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as any
    expect(json.error).toBeDefined()
  })

  it('GET /v1/feedback/summary aggregates feedback metrics correctly', async () => {
    const res = await app.request('/v1/feedback/summary')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(typeof json.total_count).toBe('number')
    expect(typeof json.average_rating).toBe('number')
    expect(json.category_counts).toBeDefined()
    expect(json.rating_distribution).toBeDefined()
  })

  it('PisigmaFeedback client operates correctly', async () => {
    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input.toString()
      const url = new URL(urlStr)
      const req = new Request(url, init)
      return app.request(req)
    }

    const client = new PisigmaFeedback({ baseUrl: 'http://localhost:8807', fetch: fetchMock as any })

    const health = await client.checkHealth()
    expect(health.ok).toBe(true)
    if (health.ok) {
      expect(health.data.service).toBe('pisigma-feedback')
    }

    const submitRes = await client.submitFeedback({
      user_id: 'usr_client',
      category: 'bug',
      rating: 4,
      comment: 'Found a small glitch',
    })
    expect(submitRes.ok).toBe(true)
    if (submitRes.ok) {
      expect(submitRes.data.success).toBe(true)
      expect(submitRes.data.feedback.category).toBe('bug')
    }

    const summaryRes = await client.getSummary('bug')
    expect(summaryRes.ok).toBe(true)
    if (summaryRes.ok) {
      expect(summaryRes.data.total_count).toBeGreaterThanOrEqual(1)
    }
  })
})
