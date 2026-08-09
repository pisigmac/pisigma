import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, EvaluateRequest, FeatureFlag } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const flagsStore = new Map<string, FeatureFlag>([
  ['new_ui_dashboard', { key: 'new_ui_dashboard', description: 'Enable redesigned UI dashboard', enabled: true }],
  ['beta_ai_features', { key: 'beta_ai_features', description: 'Enable AI chat integration', enabled: false }],
  ['dark_mode_default', { key: 'dark_mode_default', description: 'Default theme dark mode', enabled: true }],
])

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-featureflags',
    environment: c.env?.FEATURE_FLAGS_ENV || 'development',
    total_flags: flagsStore.size,
  })
})

app.get('/v1/flags', (c) => {
  return c.json({ flags: Array.from(flagsStore.values()) })
})

app.post('/v1/evaluate', async (c) => {
  const body = await c.req.json<EvaluateRequest>().catch(() => ({} as EvaluateRequest))
  const targetFlags = body.flags || Array.from(flagsStore.keys())

  const evaluated: Record<string, boolean> = {}
  for (const key of targetFlags) {
    const flag = flagsStore.get(key)
    evaluated[key] = flag ? flag.enabled : false
  }

  return c.json({ user_id: body.user_id || 'anonymous', flags: evaluated })
})

app.put('/v1/flags/:key', async (c) => {
  const key = c.req.param('key')
  const body = await c.req.json<Partial<FeatureFlag>>()

  const existing = flagsStore.get(key) || { key, description: '', enabled: false }
  const updated: FeatureFlag = {
    ...existing,
    ...body,
    key,
  }
  flagsStore.set(key, updated)

  return c.json({ success: true, flag: updated })
})

export default app
