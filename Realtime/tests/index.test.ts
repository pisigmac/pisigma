import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaRealtime } from '../src/client'

describe('Realtime Service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-realtime')
    expect(json.environment).toBe('development')
  })

  it('POST /v1/realtime/publish publishes a message successfully', async () => {
    const res = await app.request('/v1/realtime/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'chat_room_1',
        event: 'new_message',
        data: { text: 'Hello World' },
        sender_id: 'usr_abc',
      }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.success).toBe(true)
    expect(json.message_id).toBeDefined()
    expect(json.channel).toBe('chat_room_1')
    expect(json.event).toBe('new_message')
  })

  it('POST /v1/realtime/publish returns 400 when channel or event missing', async () => {
    const res = await app.request('/v1/realtime/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'room_1' }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as any
    expect(json.error).toBeDefined()
  })

  it('GET /v1/realtime/presence fetches channel presence', async () => {
    const res = await app.request('/v1/realtime/presence?channel=global')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.channel).toBe('global')
    expect(Array.isArray(json.active_users)).toBe(true)
    expect(typeof json.total_count).toBe('number')
  })

  it('POST /v1/realtime/presence updates presence state', async () => {
    const res = await app.request('/v1/realtime/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'lobby',
        user_id: 'usr_xyz',
        status: 'online',
      }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.success).toBe(true)
    expect(json.presence.user_id).toBe('usr_xyz')
    expect(json.presence.status).toBe('online')

    const getRes = await app.request('/v1/realtime/presence?channel=lobby')
    expect(getRes.status).toBe(200)
    const getJson = (await getRes.json()) as any
    expect(getJson.total_count).toBe(1)
    expect(getJson.active_users[0].user_id).toBe('usr_xyz')
  })

  it('PisigmaRealtime client operates correctly', async () => {
    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input.toString()
      const url = new URL(urlStr)
      const req = new Request(url, init)
      return app.request(req)
    }

    const client = new PisigmaRealtime({ baseUrl: 'http://localhost:8810', fetch: fetchMock as any })

    const health = await client.checkHealth()
    expect(health.ok).toBe(true)
    if (health.ok) {
      expect(health.data.service).toBe('pisigma-realtime')
    }

    const pubRes = await client.publish({
      channel: 'notifications',
      event: 'alert',
      data: { msg: 'Server maintenance' },
    })
    expect(pubRes.ok).toBe(true)
    if (pubRes.ok) {
      expect(pubRes.data.success).toBe(true)
      expect(pubRes.data.channel).toBe('notifications')
    }

    const presenceRes = await client.getPresence('lobby')
    expect(presenceRes.ok).toBe(true)
    if (presenceRes.ok) {
      expect(presenceRes.data.channel).toBe('lobby')
    }
  })
})
