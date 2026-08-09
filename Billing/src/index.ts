import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { razorpayConfigured } from './razorpay'
import { adminRoutes } from './routes/admin'
import { billingRoutes } from './routes/billing'
import { webhookRoutes } from './routes/webhooks'
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
  const razorpay = razorpayConfigured(c.env)
  const status = dbOk ? 'ok' : 'degraded'
  return c.json(
    {
      status,
      service: 'pisigma-billing',
      db: dbOk,
      razorpay_configured: razorpay,
      allow_dev_charge: c.env.ALLOW_DEV_CHARGE === '1',
      webhook_secret_configured: Boolean(c.env.RAZORPAY_WEBHOOK_SECRET),
    },
    dbOk ? 200 : 503,
  )
})

app.get('/v1/openapi.json', (c) =>
  c.json({
    openapi: '3.0.3',
    info: {
      title: 'PiSigma Billing',
      version: '1.0.0',
      description: 'Shared Razorpay billing spine for PiSigma / PlexApps products',
    },
    paths: {
      '/health': { get: { summary: 'Health' } },
      '/v1/orders': {
        post: {
          summary: 'Create Razorpay order for a plan or ad-hoc amount',
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
      '/v1/verify': {
        post: {
          summary: 'Verify payment signature and mark paid',
          security: [{ bearerAuth: [] }],
        },
      },
      '/v1/payments': { get: { summary: 'List recent payments', security: [{ bearerAuth: [] }] } },
      '/v1/payments/{id}': { get: { summary: 'Get payment', security: [{ bearerAuth: [] }] } },
      '/v1/plans': { get: { summary: 'List active plans', security: [{ bearerAuth: [] }] } },
      '/v1/webhooks/razorpay': { post: { summary: 'Razorpay webhook' } },
      '/v1/admin/products': {
        get: { summary: 'List products' },
        post: { summary: 'Create product' },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
        adminToken: { type: 'apiKey', in: 'header', name: 'X-Admin-Token' },
      },
    },
  }),
)

// More specific mounts first so product-key middleware on billingRoutes
// does not intercept admin / webhooks.
app.route('/v1/webhooks', webhookRoutes)
app.route('/v1/admin', adminRoutes)
app.route('/v1', billingRoutes)

app.all('*', async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw)
  }
  return c.json({ error: 'not_found' }, 404)
})

export default app
