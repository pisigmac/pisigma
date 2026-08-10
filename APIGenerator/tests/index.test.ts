import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaAPIGenerator } from '../src/client'

describe('APIGenerator Service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-api-generator')
    expect(json.environment).toBe('development')
  })

  it('POST /v1/generator/schema requires title', async () => {
    const res = await app.request('/v1/generator/schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as any
    expect(json.error).toBe('Title is required')
  })

  it('POST /v1/generator/schema generates valid OpenAPI schema', async () => {
    const res = await app.request('/v1/generator/schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Petstore API',
        version: '2.0.0',
        resources: [
          {
            name: 'pets',
            properties: {
              name: { type: 'string', example: 'Fido' },
              age: { type: 'number', example: 3 },
            },
          },
        ],
      }),
    })
    expect(res.status).toBe(201)
    const json = (await res.json()) as any
    expect(json.success).toBe(true)
    expect(json.schema.openapi).toBe('3.0.0')
    expect(json.schema.info.title).toBe('Petstore API')
    expect(json.schema.paths['/pets']).toBeDefined()
  })

  it('GET /v1/generator/mock/:resource returns mock data', async () => {
    const res = await app.request('/v1/generator/mock/users?count=3')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.resource).toBe('users')
    expect(json.count).toBe(3)
    expect(json.data.length).toBe(3)
    expect(json.data[0].email).toBe('user1@example.com')
  })

  it('PisigmaAPIGenerator client operates correctly', async () => {
    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input.toString()
      const url = new URL(urlStr)
      const req = new Request(url, init)
      return app.request(req)
    }

    const client = new PisigmaAPIGenerator({ baseUrl: 'http://localhost:8803', fetch: fetchMock as any })

    const health = await client.checkHealth()
    expect(health.ok).toBe(true)
    if (health.ok) {
      expect(health.data.service).toBe('pisigma-api-generator')
    }

    const schemaRes = await client.generateSchema({ title: 'Test Service' })
    expect(schemaRes.ok).toBe(true)
    if (schemaRes.ok) {
      expect(schemaRes.data.schema.info.title).toBe('Test Service')
    }

    const mockRes = await client.getMockData('products', { count: 2 })
    expect(mockRes.ok).toBe(true)
    if (mockRes.ok) {
      expect(mockRes.data.count).toBe(2)
      expect(mockRes.data.data.length).toBe(2)
    }
  })
})
