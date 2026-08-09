import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('FeatureFlags service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-featureflags')
  })

  it('POST /v1/evaluate evaluates flags properly', async () => {
    const res = await app.request('/v1/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'usr_1', flags: ['new_ui_dashboard', 'beta_ai_features'] }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.flags.new_ui_dashboard).toBe(true)
    expect(json.flags.beta_ai_features).toBe(false)
  })
})
