import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('Notifications service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-notifications')
  })

  it('Device registration and push sending flow', async () => {
    const regRes = await app.request('/v1/devices/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'usr_1', device_token: 'tok_abc', platform: 'web' }),
    })
    expect(regRes.status).toBe(200)

    const pushRes = await app.request('/v1/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'usr_1', title: 'Welcome', body: 'Hello user!' }),
    })
    expect(pushRes.status).toBe(200)

    const feedRes = await app.request('/v1/feed/usr_1')
    expect(feedRes.status).toBe(200)
    const feed = (await feedRes.json()) as any
    expect(feed.notifications).toHaveLength(1)
    expect(feed.notifications[0].title).toBe('Welcome')
  })
})
