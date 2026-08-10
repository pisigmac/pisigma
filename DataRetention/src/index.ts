import { Hono } from 'hono'
import { RetentionPolicy, RetentionExecution, ErasureRequest } from './types'

type Bindings = {
  API_KEY?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

const policies: RetentionPolicy[] = []
const executions: RetentionExecution[] = []
const erasureRequests: ErasureRequest[] = []

app.get('/health', (c) => c.json({ status: 'ok', service: 'dataretention' }))

app.post('/v1/retention/policies', async (c) => {
  const body = await c.req.json()
  const policy: RetentionPolicy = {
    id: crypto.randomUUID(),
    data_type: body.data_type,
    retention_days: body.retention_days,
    action: body.action,
    created_at: new Date().toISOString()
  }
  policies.push(policy)
  return c.json(policy)
})

app.get('/v1/retention/policies', (c) => {
  return c.json(policies)
})

app.post('/v1/retention/execute', async (c) => {
  const body = await c.req.json()
  const policy = policies.find(p => p.id === body.policy_id)
  if (!policy) return c.json({ error: 'Policy not found' }, 404)

  const records_affected = Math.floor(Math.random() * (500 - 10 + 1)) + 10
  const execution: RetentionExecution = {
    id: crypto.randomUUID(),
    policy_id: policy.id,
    records_affected,
    executed_at: new Date().toISOString()
  }
  executions.push(execution)
  
  return c.json({ id: execution.id, records_affected: execution.records_affected, executed_at: execution.executed_at })
})

app.post('/v1/retention/erasure', async (c) => {
  const body = await c.req.json()
  const request: ErasureRequest = {
    id: crypto.randomUUID(),
    user_id: body.user_id,
    status: 'pending',
    requested_at: new Date().toISOString()
  }
  erasureRequests.push(request)
  return c.json({ id: request.id, user_id: request.user_id, status: request.status })
})

app.get('/v1/retention/erasure/:id', (c) => {
  const id = c.req.param('id')
  const request = erasureRequests.find(r => r.id === id)
  if (!request) return c.json({ error: 'Not found' }, 404)
  return c.json(request)
})

export default app
