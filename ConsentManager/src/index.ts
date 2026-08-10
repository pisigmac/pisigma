import { Hono } from 'hono'
import { ConsentRecord, DSARRequest, ConsentPolicy } from './types'

type Bindings = {
  API_KEY?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

const records: ConsentRecord[] = []
const dsarRequests: DSARRequest[] = []
const policies: ConsentPolicy[] = [
  { id: '1', name: 'Necessary', description: 'Essential cookies', required: true },
  { id: '2', name: 'Analytics', description: 'Analytics tracking', required: false }
]

app.get('/health', (c) => c.json({ status: 'ok', service: 'consentmanager' }))

app.get('/v1/consent/policies', (c) => {
  return c.json(policies)
})

app.post('/v1/consent/record', async (c) => {
  const body = await c.req.json()
  const record: ConsentRecord = {
    id: crypto.randomUUID(),
    user_id: body.user_id,
    purpose: body.purpose,
    granted: body.granted,
    ip_address: body.ip_address,
    timestamp: new Date().toISOString()
  }
  records.push(record)
  return c.json(record)
})

app.get('/v1/consent/:userId', (c) => {
  const userId = c.req.param('userId')
  const userRecords = records.filter(r => r.user_id === userId)
  
  const latestByPurpose: Record<string, ConsentRecord> = {}
  userRecords.forEach(record => {
    const existing = latestByPurpose[record.purpose]
    if (!existing || new Date(record.timestamp) > new Date(existing.timestamp)) {
      latestByPurpose[record.purpose] = record
    }
  })
  
  return c.json(Object.values(latestByPurpose))
})

app.post('/v1/consent/dsar', async (c) => {
  const body = await c.req.json()
  const request: DSARRequest = {
    id: crypto.randomUUID(),
    user_id: body.user_id,
    type: body.type,
    status: 'pending',
    created_at: new Date().toISOString()
  }
  dsarRequests.push(request)
  return c.json({ id: request.id, status: request.status })
})

export default app
