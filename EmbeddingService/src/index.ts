import { Hono } from 'hono';
import { EmbeddingRequest, BatchEmbeddingRequest, EmbeddingResponse, SimilarityRequest, SimilarityResponse, ProviderInfo, CacheStats } from './types';

const app = new Hono();
const embeddingCache = new Map<string, number[]>();
let cacheHits = 0, cacheMisses = 0;

function generateLocalEmbedding(text: string, dimensions: number = 384): number[] {
  // Deterministic pseudo-embedding based on text content
  const vector: number[] = []
  for (let i = 0; i < dimensions; i++) {
    let hash = 0
    for (let j = 0; j < text.length; j++) {
      hash = ((hash << 5) - hash + text.charCodeAt(j) * (i + 1)) | 0
    }
    // Normalize to [-1, 1]
    vector.push(Math.sin(hash) * 0.5 + Math.cos(hash * 0.7) * 0.5)
  }
  // L2 normalize
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
  return vector.map(v => v / (norm || 1))
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1)
}

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'embeddingservice', cached_embeddings: embeddingCache.size });
});

app.post('/v1/embeddings/generate', async (c) => {
  const req = await c.req.json() as EmbeddingRequest;
  const input = req.input;
  const dimensions = req.dimensions || 384;
  const model = req.model || 'pisigma-embed-v1';
  const provider = req.provider || 'local';
  
  const cacheKey = `${input}-${dimensions}`;
  
  let vector: number[];
  let cached = false;
  
  if (embeddingCache.has(cacheKey)) {
    vector = embeddingCache.get(cacheKey)!;
    cached = true;
    cacheHits++;
  } else {
    vector = generateLocalEmbedding(input, dimensions);
    embeddingCache.set(cacheKey, vector);
    cacheMisses++;
  }
  
  const response: EmbeddingResponse = {
    input,
    vector,
    dimensions,
    model,
    provider,
    cached
  };
  
  return c.json(response);
});

app.post('/v1/embeddings/batch', async (c) => {
  const req = await c.req.json() as BatchEmbeddingRequest;
  const model = req.model || 'pisigma-embed-v1';
  const provider = req.provider || 'local';
  const dimensions = 384; // hardcode default
  
  const embeddings: EmbeddingResponse[] = [];
  
  for (const input of req.inputs) {
    const cacheKey = `${input}-${dimensions}`;
    let vector: number[];
    let cached = false;
    
    if (embeddingCache.has(cacheKey)) {
      vector = embeddingCache.get(cacheKey)!;
      cached = true;
      cacheHits++;
    } else {
      vector = generateLocalEmbedding(input, dimensions);
      embeddingCache.set(cacheKey, vector);
      cacheMisses++;
    }
    
    embeddings.push({
      input,
      vector,
      dimensions,
      model,
      provider,
      cached
    });
  }
  
  return c.json({ embeddings, total: req.inputs.length });
});

app.get('/v1/embeddings/providers', (c) => {
  const providers: ProviderInfo[] = [
    { name: 'local', models: ['pisigma-embed-v1'], default_dimensions: 384 },
    { name: 'openai', models: ['text-embedding-3-small', 'text-embedding-3-large'], default_dimensions: 1536 }
  ];
  return c.json({ providers });
});

app.post('/v1/embeddings/similarity', async (c) => {
  const req = await c.req.json() as SimilarityRequest;
  const vecA = generateLocalEmbedding(req.input_a, 384);
  const vecB = generateLocalEmbedding(req.input_b, 384);
  
  const similarity = cosineSimilarity(vecA, vecB);
  
  const response: SimilarityResponse = {
    similarity,
    input_a: req.input_a,
    input_b: req.input_b,
    method: 'cosine'
  };
  
  return c.json(response);
});

app.get('/v1/embeddings/cache/stats', (c) => {
  const total = cacheHits + cacheMisses;
  const stats: CacheStats = {
    total_cached: embeddingCache.size,
    hit_count: cacheHits,
    miss_count: cacheMisses,
    hit_rate: total === 0 ? 0 : cacheHits / total
  };
  return c.json(stats);
});

export default app;
