import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type {
  Env,
  GetPresenceResponse,
  PresenceItem,
  PresenceRequest,
  PublishMessageRequest,
  PublishMessageResponse,
  RealtimeMessage,
} from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const channelMessagesStore: Map<string, RealtimeMessage[]> = new Map()
const presenceStore: Map<string, Map<string, PresenceItem>> = new Map([
  [
    'global',
    new Map([
      [
        'user_sys_1',
        {
          user_id: 'user_sys_1',
          channel: 'global',
          status: 'online',
          last_seen: new Date().toISOString(),
        },
      ],
    ]),
  ],
])

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-realtime',
    environment: c.env?.REALTIME_ENV || 'development',
  })
})

app.post('/v1/realtime/publish', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<PublishMessageRequest>

  if (
    !body.channel ||
    typeof body.channel !== 'string' ||
    body.channel.trim() === '' ||
    !body.event ||
    typeof body.event !== 'string' ||
    body.event.trim() === ''
  ) {
    return c.json({ error: 'Missing or invalid required fields: channel and event are required' }, 400)
  }

  const channel = body.channel.trim()
  const eventName = body.event.trim()
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  const timestamp = new Date().toISOString()

  const msg: RealtimeMessage = {
    message_id: messageId,
    channel,
    event: eventName,
    data: body.data || {},
    sender_id: body.sender_id?.trim(),
    timestamp,
  }

  const history = channelMessagesStore.get(channel) || []
  history.push(msg)
  if (history.length > 100) history.shift()
  channelMessagesStore.set(channel, history)

  const response: PublishMessageResponse = {
    success: true,
    message_id: messageId,
    channel,
    event: eventName,
    timestamp,
  }

  return c.json(response)
})

app.get('/v1/realtime/presence', (c) => {
  const channel = (c.req.query('channel') || 'global').trim()

  const channelPresenceMap = presenceStore.get(channel)
  const activeUsers: PresenceItem[] = channelPresenceMap ? Array.from(channelPresenceMap.values()) : []

  const response: GetPresenceResponse = {
    channel,
    active_users: activeUsers,
    total_count: activeUsers.length,
  }

  return c.json(response)
})

app.post('/v1/realtime/presence', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<PresenceRequest>

  if (!body.channel || !body.user_id || typeof body.channel !== 'string' || typeof body.user_id !== 'string') {
    return c.json({ error: 'Missing required fields: channel and user_id are required' }, 400)
  }

  const channel = body.channel.trim()
  const userId = body.user_id.trim()
  const status = body.status === 'offline' || body.status === 'away' ? body.status : 'online'

  if (!presenceStore.has(channel)) {
    presenceStore.set(channel, new Map())
  }

  const channelMap = presenceStore.get(channel)!
  const item: PresenceItem = {
    user_id: userId,
    channel,
    status,
    last_seen: new Date().toISOString(),
    metadata: body.metadata,
  }

  channelMap.set(userId, item)

  return c.json({ success: true, presence: item })
})

app.get('/v1/realtime/messages', (c) => {
  const channel = c.req.query('channel')?.trim()
  if (!channel) {
    return c.json({ error: 'Missing required query parameter: channel' }, 400)
  }
  const messages = channelMessagesStore.get(channel) || []
  return c.json({ channel, messages })
})

export default app
