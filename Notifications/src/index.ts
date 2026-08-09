import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, NotificationFeedItem, PushNotificationRequest, RegisterDeviceRequest } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const mockDevices = new Map<string, Array<{ token: string; platform: string }>>()
const mockFeed = new Map<string, NotificationFeedItem[]>()

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-notifications',
    provider: c.env?.NOTIFICATIONS_PROVIDER || 'mock',
  })
})

app.post('/v1/devices/register', async (c) => {
  const body = await c.req.json<RegisterDeviceRequest>()
  if (!body.user_id || !body.device_token || !body.platform) {
    return c.json({ error: 'invalid_request', message: 'user_id, device_token and platform required' }, 400)
  }

  const existing = mockDevices.get(body.user_id) || []
  existing.push({ token: body.device_token, platform: body.platform })
  mockDevices.set(body.user_id, existing)

  return c.json({ success: true, registered_devices: existing.length })
})

app.post('/v1/push/send', async (c) => {
  const body = await c.req.json<PushNotificationRequest>()
  if (!body.user_id || !body.title || !body.body) {
    return c.json({ error: 'invalid_request', message: 'user_id, title and body required' }, 400)
  }

  const notificationId = `notif_${Date.now()}`
  const feedItem: NotificationFeedItem = {
    id: notificationId,
    user_id: body.user_id,
    title: body.title,
    body: body.body,
    read: false,
    created_at: new Date().toISOString(),
  }

  const userItems = mockFeed.get(body.user_id) || []
  userItems.unshift(feedItem)
  mockFeed.set(body.user_id, userItems)

  return c.json({
    success: true,
    notification_id: notificationId,
    delivered_devices: (mockDevices.get(body.user_id) || []).length || 1,
  })
})

app.get('/v1/feed/:userId', (c) => {
  const userId = c.req.param('userId')
  const feed = mockFeed.get(userId) || []
  return c.json({ user_id: userId, notifications: feed })
})

export default app
