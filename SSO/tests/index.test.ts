import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaSSO } from '../src/client'

describe('SSO Service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-sso')
  })

  it('GET /v1/sso/providers lists SSO providers', async () => {
    const res = await app.request('/v1/sso/providers')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(Array.isArray(json.providers)).toBe(true)
    expect(json.providers.length).toBeGreaterThan(0)
    expect(json.providers[0].id).toBe('google')
  })

  it('POST /v1/sso/auth authenticates successfully with valid provider & token', async () => {
    const res = await app.request('/v1/sso/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider_id: 'google', token: 'mock-google-token' }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.success).toBe(true)
    expect(json.user).toBeDefined()
    expect(json.user.provider).toBe('google')
    expect(json.access_token).toBeDefined()
  })

  it('POST /v1/sso/auth returns 400 for invalid provider', async () => {
    const res = await app.request('/v1/sso/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider_id: 'unknown-provider', token: 'mock-token' }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as any
    expect(json.success).toBe(false)
    expect(json.error).toBeDefined()
  })

  it('PisigmaSSO client works correctly with app fetch mock', async () => {
    const client = new PisigmaSSO({
      baseUrl: 'http://127.0.0.1:8798',
      fetch: async (url, init) => app.request(url, init),
    })

    const health = await client.checkHealth()
    expect(health.ok).toBe(true)
    if (health.ok) {
      expect(health.data.service).toBe('pisigma-sso')
    }

    const providers = await client.getProviders()
    expect(providers.ok).toBe(true)
    if (providers.ok) {
      expect(providers.data.providers.length).toBeGreaterThan(0)
    }

    const auth = await client.authenticate({ provider_id: 'okta', token: 'okta-token' })
    expect(auth.ok).toBe(true)
    if (auth.ok) {
      expect(auth.data.success).toBe(true)
      expect(auth.data.user?.provider).toBe('okta')
    }
  })
})
