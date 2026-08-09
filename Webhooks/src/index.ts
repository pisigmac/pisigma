import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { processDueRetries } from './deliver'
import { adminRoutes } from './routes/admin'
import { deliverRoutes, internalRoutes } from './routes/deliver'
import { endpointRoutes } from './routes/endpoints'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.get('/health', async (c) => {
  let dbOk = false
  try {
    await c.env.DB.prepare(`SELECT 1`).first()
    dbOk = true
  } catch {
    dbOk = false
  }
  const status = dbOk ? 'ok' : 'degraded'
  return c.json(
    {
      status,
      service: 'pisigma-webhooks',
      db: dbOk,
    },
    dbOk ? 200 : 503,
  )
})

app.get('/v1/openapi.json', (c) =>
  c.json({
    openapi: '3.0.3',
    info: {
      title: 'PiSigma Webhooks',
      version: '1.0.0',
      description:
        'Shared outbound webhook delivery spine for PiSigma / PlexApps products — retries, HMAC signing, delivery logs',
    },
    paths: {
      '/health': { get: { summary: 'Health' } },
      '/v1/endpoints': {
        get: { summary: 'List endpoints', security: [{ bearerAuth: [] }] },
        post: { summary: 'Register endpoint', security: [{ bearerAuth: [] }] },
      },
      '/v1/deliver': {
        post: {
          summary: 'Enqueue / send webhook event',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'Idempotency-Key',
              in: 'header',
              schema: { type: 'string' },
            },
          ],
        },
      },
      '/v1/deliveries/{id}': {
        get: { summary: 'Get delivery', security: [{ bearerAuth: [] }] },
      },
      '/v1/internal/retry': {
        post: {
          summary: 'Process due retries (cron alternative)',
          security: [{ adminToken: [] }],
        },
      },
      '/v1/admin/products': {
        get: { summary: 'List products' },
        post: { summary: 'Create product' },
      },
      '/v1/admin/deliveries': { get: { summary: 'List all deliveries' } },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
        adminToken: { type: 'apiKey', in: 'header', name: 'X-Admin-Token' },
      },
    },
  }),
)

app.route('/v1', endpointRoutes)
app.route('/v1', deliverRoutes)
app.route('/v1/internal', internalRoutes)
app.route('/v1/admin', adminRoutes)

app.all('*', async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw)
  }
  return c.json({ error: 'not_found' }, 404)
})

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(processDueRetries(env))
  },
}
