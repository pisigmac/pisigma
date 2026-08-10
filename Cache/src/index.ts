import { Hono } from 'hono';
import { CacheEntry, CacheStats } from './types';

const app = new Hono<{ Bindings: { API_KEY?: string } }>();

const store = new Map<string, CacheEntry>();
const stats: CacheStats = { hits: 0, misses: 0, keys_count: 0 };

const getFullKey = (namespace: string, key: string) => `${namespace}:${key}`;

app.get('/health', (c) => c.json({ status: 'ok', service: 'cache' }));

app.get('/v1/cache/:namespace/stats', (c) => {
  return c.json(stats);
});

app.get('/v1/cache/:namespace/:key', (c) => {
  const namespace = c.req.param('namespace');
  const key = c.req.param('key');
  const fullKey = getFullKey(namespace, key);
  
  const entry = store.get(fullKey);
  if (!entry) {
    stats.misses++;
    return c.json({ error: 'not found' }, 404);
  }
  
  if (entry.ttl !== undefined && entry.ttl !== null) {
    const elapsed = Date.now() - entry.created_at;
    if (elapsed > entry.ttl * 1000) {
      store.delete(fullKey);
      stats.keys_count--;
      stats.misses++;
      return c.json({ error: 'not found' }, 404);
    }
    stats.hits++;
    return c.json({
      key,
      value: entry.value,
      ttl_remaining: Math.max(0, entry.ttl - Math.floor(elapsed / 1000))
    });
  }
  
  stats.hits++;
  return c.json({ key, value: entry.value, ttl_remaining: null });
});

app.put('/v1/cache/:namespace/:key', async (c) => {
  const namespace = c.req.param('namespace');
  const key = c.req.param('key');
  const fullKey = getFullKey(namespace, key);
  const body = await c.req.json<{ value: any; ttl?: number }>();
  
  if (!store.has(fullKey)) {
    stats.keys_count++;
  }
  
  store.set(fullKey, {
    key,
    value: body.value,
    ttl: body.ttl,
    namespace,
    created_at: Date.now()
  });
  
  return c.json({ key, namespace, ttl: body.ttl, stored: true });
});

app.delete('/v1/cache/:namespace/:key', (c) => {
  const namespace = c.req.param('namespace');
  const key = c.req.param('key');
  const fullKey = getFullKey(namespace, key);
  
  if (store.has(fullKey)) {
    store.delete(fullKey);
    stats.keys_count--;
  }
  return c.json({ deleted: true });
});

app.delete('/v1/cache/:namespace', (c) => {
  const namespace = c.req.param('namespace');
  let count = 0;
  for (const k of store.keys()) {
    if (k.startsWith(`${namespace}:`)) {
      store.delete(k);
      stats.keys_count--;
      count++;
    }
  }
  return c.json({ flushed: count });
});

export default app;