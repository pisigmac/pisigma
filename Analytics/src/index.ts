import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, EventBatchRequest, TelemetryEvent } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const eventStore: TelemetryEvent[] = []

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-analytics',
    events_ingested: eventStore.length,
  })
})

app.post('/v1/events', async (c) => {
  const body = await c.req.json<TelemetryEvent | EventBatchRequest>()
  const incoming = 'events' in body ? body.events : [body]

  for (const ev of incoming) {
    if (!ev.event_name) continue
    eventStore.push({
      ...ev,
      timestamp: ev.timestamp || new Date().toISOString(),
    })
  }

  return c.json({ success: true, ingested: incoming.length, total: eventStore.length })
})

app.get('/v1/stats/summary', (c) => {
  const counts: Record<string, number> = {}
  for (const ev of eventStore) {
    counts[ev.event_name] = (counts[ev.event_name] || 0) + 1
  }
  return c.json({ total_events: eventStore.length, event_counts: counts })
})

export default app
