import { Hono } from 'hono';
import { VectorEntry, VectorQuery, VectorResult } from './types';

const app = new Hono<{ Bindings: { API_KEY: string } }>();

const vectors = new Map<string, VectorEntry[]>();

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'vectorsearch' });
});

app.post('/v1/vectors/upsert', async (c) => {
  const body = await c.req.json<{ collection: string; id?: string; embedding: number[]; metadata?: Record<string, string> }>();
  const entry: VectorEntry = {
    id: body.id || crypto.randomUUID(),
    collection: body.collection,
    embedding: body.embedding,
    metadata: body.metadata,
    created_at: new Date().toISOString()
  };

  const collectionVectors = vectors.get(entry.collection) || [];
  const existingIndex = collectionVectors.findIndex(v => v.id === entry.id);
  if (existingIndex >= 0) {
    collectionVectors[existingIndex] = entry;
  } else {
    collectionVectors.push(entry);
  }
  vectors.set(entry.collection, collectionVectors);

  return c.json(entry);
});

app.post('/v1/vectors/query', async (c) => {
  const query = await c.req.json<VectorQuery>();
  const collectionVectors = vectors.get(query.collection) || [];
  
  const results: VectorResult[] = [];
  for (const v of collectionVectors) {
    // Compute cosine similarity
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < query.embedding.length; i++) {
      dotProduct += query.embedding[i] * v.embedding[i];
      normA += query.embedding[i] * query.embedding[i];
      normB += v.embedding[i] * v.embedding[i];
    }
    const score = (normA === 0 || normB === 0) ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    results.push({ id: v.id, score, metadata: v.metadata });
  }

  results.sort((a, b) => b.score - a.score);
  return c.json(results.slice(0, query.top_k || 10));
});

app.delete('/v1/vectors/:id', (c) => {
  const id = c.req.param('id');
  let deleted = false;
  for (const [collection, collectionVectors] of vectors.entries()) {
    const initialLength = collectionVectors.length;
    const filtered = collectionVectors.filter(v => v.id !== id);
    if (filtered.length < initialLength) {
      vectors.set(collection, filtered);
      deleted = true;
    }
  }
  return c.json({ deleted });
});

app.get('/v1/vectors/collections', (c) => {
  const collections = Array.from(vectors.entries()).map(([name, vecs]) => ({
    name,
    count: vecs.length
  }));
  return c.json(collections);
});

export default app;
