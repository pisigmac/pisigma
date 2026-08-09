import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { resolveMailProvider, smtpConfigFromEnv } from './smtp'
import { adminRoutes } from './routes/admin'
import { sendRoutes } from './routes/send'
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
  const provider = resolveMailProvider(c.env)
  const smtp = smtpConfigFromEnv(c.env)
  const status = dbOk ? 'ok' : 'degraded'
  return c.json(
    {
      status,
      service: 'pisigma-mail',
      provider,
      db: dbOk,
      smtp_configured: Boolean(smtp),
      auth_jwks: Boolean(c.env.MAIL_AUTH_JWKS_URL),
    },
    dbOk ? 200 : 503,
  )
})

app.get('/v1/openapi.json', (c) =>
  c.json({
    openapi: '3.0.3',
    info: {
      title: 'PiSigma Mail',
      version: '1.1.0',
      description: 'Shared transactional email product for PiSigma / PlexApps — SMTP-backed, Auth via pisigma-auth',
    },
    paths: {
      '/health': { get: { summary: 'Health' } },
      '/v1/send': {
        post: {
          summary: 'Send email',
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
      '/v1/messages/{id}': { get: { summary: 'Get message', security: [{ bearerAuth: [] }] } },
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

app.route('/v1', sendRoutes)
app.route('/v1/admin', adminRoutes)

app.all('*', async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw)
  }
  return c.json({ error: 'not_found' }, 404)
})

export default app
