import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, DocumentInput, IndexRequest, SearchQueryRequest, SearchResultItem } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const indexStore = new Map<string, Map<string, DocumentInput>>()

function getOrCreateIndex(indexName: string): Map<string, DocumentInput> {
  let idx = indexStore.get(indexName)
  if (!idx) {
    idx = new Map<string, DocumentInput>()
    indexStore.set(indexName, idx)
  }
  return idx
}

app.get('/health', (c) => {
  const indexName = c.env?.SEARCH_INDEX_NAME || 'default_index'
  const idx = indexStore.get(indexName)
  const count = idx ? idx.size : 0

  return c.json({
    status: 'ok',
    service: 'pisigma-search',
    index_name: indexName,
    indexed_documents: count,
  })
})

app.post('/v1/index', async (c) => {
  const body = await c.req.json<IndexRequest | DocumentInput>().catch(() => ({} as any))
  const indexName = ('index_name' in body && body.index_name) ? body.index_name : (c.env?.SEARCH_INDEX_NAME || 'default_index')

  let docs: DocumentInput[] = []
  if ('documents' in body && Array.isArray(body.documents)) {
    docs = body.documents
  } else if ('id' in body && body.id) {
    docs = [body as DocumentInput]
  }

  if (docs.length === 0) {
    return c.json({ error: 'invalid_request', message: 'documents array or document object with id is required' }, 400)
  }

  const idx = getOrCreateIndex(indexName)
  let count = 0
  for (const doc of docs) {
    if (!doc.id || !doc.title) continue
    idx.set(doc.id, {
      id: doc.id,
      title: doc.title,
      content: doc.content || '',
      metadata: doc.metadata,
      tags: doc.tags,
    })
    count++
  }

  return c.json({
    success: true,
    index_name: indexName,
    indexed: count,
    total: idx.size,
  })
})

app.post('/v1/search', async (c) => {
  const body = await c.req.json<SearchQueryRequest>().catch(() => ({} as SearchQueryRequest))
  if (!body.query || typeof body.query !== 'string') {
    return c.json({ error: 'invalid_request', message: 'query string is required' }, 400)
  }

  const indexName = body.index_name || c.env?.SEARCH_INDEX_NAME || 'default_index'
  const idx = indexStore.get(indexName)
  const limit = body.limit && body.limit > 0 ? body.limit : 10
  const q = body.query.toLowerCase().trim()
  const terms = q.split(/\s+/).filter(Boolean)

  const results: SearchResultItem[] = []

  if (idx) {
    for (const doc of idx.values()) {
      let score = 0
      const titleLower = doc.title.toLowerCase()
      const contentLower = doc.content.toLowerCase()

      for (const term of terms) {
        if (titleLower.includes(term)) score += 2
        if (contentLower.includes(term)) score += 1
        if (doc.tags?.some((t) => t.toLowerCase().includes(term))) score += 1.5
      }

      if (score > 0) {
        results.push({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          score,
          metadata: doc.metadata,
          tags: doc.tags,
        })
      }
    }
  }

  results.sort((a, b) => b.score - a.score)
  const sliced = results.slice(0, limit)

  return c.json({
    query: body.query,
    index_name: indexName,
    total: results.length,
    results: sliced,
  })
})

export default app
