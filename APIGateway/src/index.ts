import { Hono } from 'hono'
import { RouteEntry } from './types'

type Bindings = {
  API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

const store = new Map<string, RouteEntry>()

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'apigateway' })
})

app.post('/v1/gateway/routes', async (c) => {
  const body = await c.req.json<RouteEntry>()
  const route: RouteEntry = {
    path: body.path,
    upstream_url: body.upstream_url,
    methods: body.methods,
    auth_required: body.auth_required
  }
  
  store.set(route.path, route)
  return c.json(route)
})

app.get('/v1/gateway/routes', (c) => {
  const routes: RouteEntry[] = Array.from(store.values())
  return c.json(routes)
})

app.delete('/v1/gateway/routes/:path', (c) => {
  const path = decodeURIComponent(c.req.param('path'))
  
  if (store.has(path)) {
    store.delete(path)
    return c.json({ deleted: true })
  }
  return c.json({ error: 'Not found' }, 404)
})

export default app
