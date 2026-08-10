import { Hono } from 'hono'
import { AlertRule, AlertEvent, EscalationPolicy } from './types'

const app = new Hono()

const rules = new Map<string, AlertRule>()
const events: AlertEvent[] = []
const escalations = new Map<string, EscalationPolicy>()
const lastFired = new Map<string, number>()

function checkCondition(value: number, condition: string, threshold: number): boolean {
  switch(condition) {
    case 'gt': return value > threshold
    case 'lt': return value < threshold
    case 'gte': return value >= threshold
    case 'lte': return value <= threshold
    case 'eq': return value === threshold
    default: return false
  }
}

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'alertengine',
    rules_count: rules.size,
    active_alerts: events.filter(e => !e.acknowledged).length
  })
})

app.post('/v1/alerts/rules', async (c) => {
  const body = await c.req.json()
  const rule: AlertRule = body
  const id = Date.now().toString()
  const newRule = {
    ...rule,
    id,
    enabled: rule.enabled ?? true,
    cooldown_minutes: rule.cooldown_minutes ?? 5,
    created_at: new Date().toISOString()
  }
  rules.set(id, newRule)
  return c.json(newRule, 201)
})

app.get('/v1/alerts/rules', (c) => {
  const severity = c.req.query('severity')
  let filteredRules = Array.from(rules.values())
  if (severity) {
    filteredRules = filteredRules.filter(r => r.severity === severity)
  }
  return c.json({ rules: filteredRules, total: filteredRules.length })
})

app.post('/v1/alerts/evaluate', async (c) => {
  const body = await c.req.json()
  const { metric, value } = body as { metric: string, value: number }
  
  const matchingRules = Array.from(rules.values()).filter(r => r.metric === metric && r.enabled !== false)
  
  let evaluated = 0
  let skipped_cooldown = 0
  const triggered: AlertEvent[] = []
  
  const now = Date.now()

  for (const rule of matchingRules) {
    evaluated++
    if (checkCondition(value, rule.condition, rule.threshold)) {
      const cooldownMs = (rule.cooldown_minutes ?? 5) * 60 * 1000
      const lastTriggered = lastFired.get(rule.id!) || 0
      
      if (now - lastTriggered >= cooldownMs) {
        const event: AlertEvent = {
          id: Date.now().toString() + Math.random().toString(),
          rule_id: rule.id!,
          rule_name: rule.name,
          metric: rule.metric,
          actual_value: value,
          threshold: rule.threshold,
          condition: rule.condition,
          severity: rule.severity,
          triggered_at: new Date().toISOString(),
          acknowledged: false
        }
        events.push(event)
        triggered.push(event)
        lastFired.set(rule.id!, now)
      } else {
        skipped_cooldown++
      }
    }
  }

  return c.json({ evaluated, triggered, skipped_cooldown })
})

app.get('/v1/alerts/history', (c) => {
  const severity = c.req.query('severity')
  const acknowledged = c.req.query('acknowledged')
  
  let filteredEvents = events
  if (severity) {
    filteredEvents = filteredEvents.filter(e => e.severity === severity)
  }
  if (acknowledged !== undefined) {
    const isAck = acknowledged === 'true'
    filteredEvents = filteredEvents.filter(e => !!e.acknowledged === isAck)
  }
  
  return c.json({ events: filteredEvents, total: filteredEvents.length })
})

app.post('/v1/alerts/escalation', async (c) => {
  const body = await c.req.json()
  const policy: EscalationPolicy = body
  const id = Date.now().toString()
  const newPolicy = { ...policy, id, created_at: new Date().toISOString() }
  escalations.set(id, newPolicy)
  return c.json(newPolicy, 201)
})

app.get('/v1/alerts/escalation', (c) => {
  return c.json({ policies: Array.from(escalations.values()), total: escalations.size })
})

app.put('/v1/alerts/rules/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const existing = rules.get(id)
  if (!existing) return c.json({ error: 'Not found' }, 404)
  const updated = { ...existing, ...body }
  rules.set(id, updated)
  return c.json(updated)
})

app.delete('/v1/alerts/rules/:id', (c) => {
  const id = c.req.param('id')
  if (!rules.has(id)) return c.json({ error: 'Not found' }, 404)
  rules.delete(id)
  return c.json({ success: true })
})

app.post('/v1/alerts/:id/acknowledge', (c) => {
  const id = c.req.param('id')
  const event = events.find(e => e.id === id)
  if (!event) return c.json({ error: 'Not found' }, 404)
  event.acknowledged = true
  return c.json(event)
})

export default app
