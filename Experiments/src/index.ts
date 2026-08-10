import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type {
  Env,
  Experiment,
  GetVariantRequest,
  GetVariantResponse,
  TrackEventRequest,
  TrackEventResponse,
  CreateExperimentRequest,
  TrackedEvent,
} from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const experimentsStore: Map<string, Experiment> = new Map([
  [
    'checkout_v2',
    {
      id: 'checkout_v2',
      name: 'New Checkout Flow',
      description: 'Test one-step checkout vs multi-step checkout',
      variants: ['control', 'one_step', 'accordion'],
      active: true,
      created_at: new Date().toISOString(),
    },
  ],
  [
    'button_color',
    {
      id: 'button_color',
      name: 'Call to Action Button Color',
      description: 'Test green vs blue CTA button',
      variants: ['blue', 'green'],
      active: true,
      created_at: new Date().toISOString(),
    },
  ],
])

const trackedEventsStore: TrackedEvent[] = []

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-experiments',
    environment: c.env?.EXPERIMENTS_ENV || 'development',
  })
})

app.post('/v1/experiments/variant', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<GetVariantRequest>

  if (!body.experiment_id || typeof body.experiment_id !== 'string' || !body.user_id || typeof body.user_id !== 'string') {
    return c.json({ error: 'Missing required fields: experiment_id and user_id are required' }, 400)
  }

  const experimentId = body.experiment_id.trim()
  const userId = body.user_id.trim()

  const experiment = experimentsStore.get(experimentId)
  const variants = experiment && experiment.variants.length > 0 ? experiment.variants : ['control', 'treatment']

  const seed = `${experimentId}:${userId}`
  const index = hashString(seed) % variants.length
  const assignedVariant = variants[index]

  const response: GetVariantResponse = {
    experiment_id: experimentId,
    user_id: userId,
    variant: assignedVariant,
    assigned_at: new Date().toISOString(),
  }

  return c.json(response)
})

app.post('/v1/experiments/track', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<TrackEventRequest>

  if (
    !body.experiment_id ||
    typeof body.experiment_id !== 'string' ||
    !body.user_id ||
    typeof body.user_id !== 'string' ||
    !body.event_name ||
    typeof body.event_name !== 'string'
  ) {
    return c.json({ error: 'Missing required fields: experiment_id, user_id, and event_name are required' }, 400)
  }

  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  const trackedEvent: TrackedEvent = {
    event_id: eventId,
    experiment_id: body.experiment_id.trim(),
    user_id: body.user_id.trim(),
    event_name: body.event_name.trim(),
    value: typeof body.value === 'number' ? body.value : undefined,
    metadata: body.metadata,
    timestamp: new Date().toISOString(),
  }

  trackedEventsStore.push(trackedEvent)

  const response: TrackEventResponse = {
    success: true,
    event_id: eventId,
    experiment_id: trackedEvent.experiment_id,
    user_id: trackedEvent.user_id,
    event_name: trackedEvent.event_name,
    timestamp: trackedEvent.timestamp,
  }

  return c.json(response)
})

app.post('/v1/experiments', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<CreateExperimentRequest>

  if (!body.id || !body.name || !Array.isArray(body.variants) || body.variants.length === 0) {
    return c.json({ error: 'Missing required fields: id, name, and non-empty variants array' }, 400)
  }

  const id = body.id.trim()
  const exp: Experiment = {
    id,
    name: body.name.trim(),
    description: body.description?.trim(),
    variants: body.variants.map((v) => String(v).trim()),
    active: true,
    created_at: new Date().toISOString(),
  }

  experimentsStore.set(id, exp)

  return c.json({ success: true, experiment: exp }, 201)
})

app.get('/v1/experiments', (c) => {
  const experiments = Array.from(experimentsStore.values())
  return c.json({ experiments })
})

export default app
