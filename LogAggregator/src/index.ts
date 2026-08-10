import { Hono } from 'hono'
import { LogEntry, LogQuery, LogStats } from './types'

type Bindings = {
  API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

const logs: LogEntry[] = []
let nextId = 1

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'logaggregator' })
})

app.post('/v1/logs/ingest', async (c) => {
  const body = await c.req.json<{ service: string, level: 'info'|'warn'|'error'|'debug', message: string, metadata?: any }>()
  
  const entry: LogEntry = {
    id: String(nextId++),
    service: body.service,
    level: body.level,
    message: body.message,
    metadata: body.metadata,
    timestamp: new Date().toISOString()
  }
  
  logs.push(entry)
  return c.json({ id: entry.id, ingested: true })
})

app.post('/v1/logs/search', async (c) => {
  const query = await c.req.json<LogQuery>()
  
  let matches = logs
  if (query.service) matches = matches.filter(l => l.service === query.service)
  if (query.level) matches = matches.filter(l => l.level === query.level)
  if (query.from) {
    const fromTime = new Date(query.from).getTime()
    matches = matches.filter(l => new Date(l.timestamp).getTime() >= fromTime)
  }
  if (query.to) {
    const toTime = new Date(query.to).getTime()
    matches = matches.filter(l => new Date(l.timestamp).getTime() <= toTime)
  }
  
  if (query.limit && query.limit > 0) {
    matches = matches.slice(0, query.limit)
  }
  
  return c.json(matches)
})

app.get('/v1/logs/stats', (c) => {
  const stats: LogStats = {
    total: logs.length,
    by_level: {},
    by_service: {}
  }
  
  for (const l of logs) {
    stats.by_level[l.level] = (stats.by_level[l.level] || 0) + 1
    stats.by_service[l.service] = (stats.by_service[l.service] || 0) + 1
  }
  
  return c.json(stats)
})

app.post('/v1/logs/retention', async (c) => {
  const body = await c.req.json<{ max_age_hours: number }>()
  const cutoffTime = Date.now() - (body.max_age_hours * 60 * 60 * 1000)
  
  let pruned = 0
  for (let i = logs.length - 1; i >= 0; i--) {
    if (new Date(logs[i].timestamp).getTime() < cutoffTime) {
      logs.splice(i, 1)
      pruned++
    }
  }
  
  return c.json({ pruned })
})

export default app
