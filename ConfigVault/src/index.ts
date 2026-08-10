import { Hono } from 'hono'
import { ConfigEntry, ConfigSnapshot } from './types'

type Bindings = {
  API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// In-memory store: Map<string, ConfigEntry>
// Keyed by "namespace:key"
const store = new Map<string, ConfigEntry>()

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'configvault' })
})

app.get('/v1/config/:namespace/snapshot', (c) => {
  const namespace = c.req.param('namespace')
  const entries: ConfigEntry[] = []

  for (const [key, value] of store.entries()) {
    if (key.startsWith(`${namespace}:`)) {
      entries.push(value)
    }
  }

  const snapshot: ConfigSnapshot = {
    namespace,
    entries,
    exported_at: new Date().toISOString()
  }

  return c.json(snapshot)
})

app.get('/v1/config/:namespace/:key', (c) => {
  const namespace = c.req.param('namespace')
  const key = c.req.param('key')
  const entryKey = `${namespace}:${key}`

  if (store.has(entryKey)) {
    return c.json(store.get(entryKey))
  }
  return c.json({ error: 'Not found' }, 404)
})

app.put('/v1/config/:namespace/:key', async (c) => {
  const namespace = c.req.param('namespace')
  const key = c.req.param('key')
  const body = await c.req.json<{ value: string }>()
  const entryKey = `${namespace}:${key}`

  let version = 1
  if (store.has(entryKey)) {
    version = store.get(entryKey)!.version + 1
  }

  const entry: ConfigEntry = {
    namespace,
    key,
    value: body.value,
    version,
    updated_at: new Date().toISOString()
  }

  store.set(entryKey, entry)
  return c.json(entry)
})

app.post('/v1/config/rotate', async (c) => {
  const body = await c.req.json<{ namespace: string, key: string, new_value: string }>()
  const entryKey = `${body.namespace}:${body.key}`

  let version = 1
  if (store.has(entryKey)) {
    version = store.get(entryKey)!.version + 1
  }

  const entry: ConfigEntry = {
    namespace: body.namespace,
    key: body.key,
    value: body.new_value,
    version,
    updated_at: new Date().toISOString()
  }

  store.set(entryKey, entry)
  return c.json({ rotated: true, version })
})

export default app
