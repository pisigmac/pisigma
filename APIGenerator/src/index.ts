import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, GenerateSchemaRequest, GeneratedSchema, MockDataResponse, MockItem } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-api-generator',
    environment: c.env?.APIGENERATOR_ENV || 'development',
  })
})

app.post('/v1/generator/schema', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<GenerateSchemaRequest>

  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return c.json({ error: 'Title is required' }, 400)
  }

  const title = body.title.trim()
  const version = body.version || '1.0.0'
  const description = body.description || `Generated API specification for ${title}`
  const resources = body.resources || [{ name: 'default' }]

  const paths: Record<string, unknown> = {}
  const schemas: Record<string, unknown> = {}

  for (const res of resources) {
    const resName = res.name.toLowerCase()
    const schemaName = res.name.charAt(0).toUpperCase() + res.name.slice(1)

    const props: Record<string, unknown> = {
      id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
      created_at: { type: 'string', format: 'date-time' },
    }

    if (res.properties) {
      for (const [propKey, propVal] of Object.entries(res.properties)) {
        props[propKey] = {
          type: propVal.type || 'string',
          ...(propVal.description && { description: propVal.description }),
          ...(propVal.example !== undefined && { example: propVal.example }),
        }
      }
    }

    schemas[schemaName] = {
      type: 'object',
      properties: props,
    }

    paths[`/${resName}`] = {
      get: {
        summary: `List ${resName}`,
        responses: {
          '200': {
            description: `A list of ${resName}`,
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: `#/components/schemas/${schemaName}` },
                },
              },
            },
          },
        },
      },
      post: {
        summary: `Create ${resName}`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${schemaName}` },
            },
          },
        },
        responses: {
          '201': {
            description: `Created ${resName}`,
          },
        },
      },
    }
  }

  const generatedSchema: GeneratedSchema = {
    openapi: '3.0.0',
    info: {
      title,
      version,
      description,
    },
    paths,
    components: {
      schemas,
    },
    generated_at: new Date().toISOString(),
  }

  return c.json({ success: true, schema: generatedSchema }, 201)
})

app.get('/v1/generator/mock/:resource', (c) => {
  const resource = c.req.param('resource')?.toLowerCase()
  if (!resource) {
    return c.json({ error: 'Resource parameter is required' }, 400)
  }

  const countQuery = c.req.query('count')
  let count = countQuery ? parseInt(countQuery, 10) : 5
  if (isNaN(count) || count < 1) count = 5
  if (count > 50) count = 50

  const items: MockItem[] = []
  const now = new Date().toISOString()

  for (let i = 1; i <= count; i++) {
    const id = `mock_${resource}_${i}`
    if (resource === 'users' || resource === 'user') {
      items.push({
        id,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: i === 1 ? 'admin' : 'user',
        created_at: now,
      })
    } else if (resource === 'products' || resource === 'product') {
      items.push({
        id,
        title: `Product ${i}`,
        price: Math.round((10 + i * 5.99) * 100) / 100,
        in_stock: true,
        created_at: now,
      })
    } else if (resource === 'orders' || resource === 'order') {
      items.push({
        id,
        order_number: `ORD-${1000 + i}`,
        status: i % 2 === 0 ? 'completed' : 'pending',
        total_amount: Math.round((25 + i * 12.5) * 100) / 100,
        created_at: now,
      })
    } else {
      items.push({
        id,
        title: `${resource.charAt(0).toUpperCase() + resource.slice(1)} Item ${i}`,
        status: 'active',
        created_at: now,
      })
    }
  }

  const response: MockDataResponse = {
    resource,
    count: items.length,
    data: items,
    generated_at: now,
  }

  return c.json(response)
})

export default app
