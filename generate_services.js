const fs = require('fs');
const path = require('path');

const rootDir = '/home/oh20210736-ud/Documents/WorkSpace/pisigma';

const files = {
  // ---------------- RateLimiter ----------------
  'RateLimiter/package.json': `{
  "name": "pisigma-ratelimiter",
  "scripts": {
    "dev": "wrangler dev --port 8811",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "wrangler": "^3.0.0",
    "@cloudflare/workers-types": "^4.0.0",
    "vitest": "^1.0.0",
    "typescript": "^5.0.0",
    "hono": "^4.0.0"
  }
}`,
  'RateLimiter/tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src"]
}`,
  'RateLimiter/wrangler.toml': `name = "pisigma-ratelimiter"
main = "src/index.ts"
compatibility_date = "2024-11-01"`,
  'RateLimiter/.env.example': `API_KEY=your-api-key-here`,
  'RateLimiter/src/types.ts': `export interface RateLimitRule {
  key: string;
  limit: number;
  window_seconds: number;
  strategy?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset_at: number;
  retry_after?: number;
}`,
  'RateLimiter/src/index.ts': `import { Hono } from 'hono';
import { RateLimitRule, RateLimitResult } from './types';

const app = new Hono<{ Bindings: { API_KEY?: string } }>();

const store = new Map<string, { count: number; reset_at: number }>();
const configs = new Map<string, RateLimitRule>();

app.get('/health', (c) => c.json({ status: 'ok', service: 'ratelimiter' }));

app.post('/v1/ratelimit/check', async (c) => {
  const body = await c.req.json<{ key: string; limit?: number; window_seconds?: number }>();
  const key = body.key;
  let limit = body.limit || 100;
  let window_seconds = body.window_seconds || 60;
  
  if (configs.has(key)) {
    const config = configs.get(key)!;
    limit = config.limit;
    window_seconds = config.window_seconds;
  }

  const now = Date.now();
  let record = store.get(key);

  if (!record || record.reset_at < now) {
    record = { count: 0, reset_at: now + window_seconds * 1000 };
  }

  record.count += 1;
  store.set(key, record);

  const allowed = record.count <= limit;
  const remaining = Math.max(0, limit - record.count);

  return c.json({
    allowed,
    remaining,
    reset_at: record.reset_at,
    ...(allowed ? {} : { retry_after: Math.ceil((record.reset_at - now) / 1000) })
  });
});

app.post('/v1/ratelimit/config', async (c) => {
  const body = await c.req.json<RateLimitRule>();
  configs.set(body.key, body);
  return c.json(body);
});

app.get('/v1/ratelimit/stats', (c) => {
  const stats: Record<string, { count: number; reset_at: number }> = {};
  for (const [key, value] of store.entries()) {
    stats[key] = value;
  }
  return c.json(stats);
});

export default app;`,
  'RateLimiter/src/client.ts': `import { RateLimitRule, RateLimitResult } from './types';

export class PisigmaRateLimiter {
  constructor(private baseUrl: string, private apiKey?: string) {}

  private async fetch(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    if (this.apiKey) headers.set('Authorization', \`Bearer \${this.apiKey}\`);
    headers.set('Content-Type', 'application/json');
    
    const res = await fetch(\`\${this.baseUrl}\${path}\`, { ...options, headers });
    return res;
  }

  async check(key: string, limit?: number, window_seconds?: number): Promise<RateLimitResult> {
    const res = await this.fetch('/v1/ratelimit/check', {
      method: 'POST',
      body: JSON.stringify({ key, limit, window_seconds })
    });
    return res.json() as any;
  }

  async configure(rule: RateLimitRule): Promise<RateLimitRule> {
    const res = await this.fetch('/v1/ratelimit/config', {
      method: 'POST',
      body: JSON.stringify(rule)
    });
    return res.json() as any;
  }

  async stats(): Promise<any> {
    const res = await this.fetch('/v1/ratelimit/stats');
    return res.json() as any;
  }
}`,
  'RateLimiter/tests/index.test.ts': `import { expect, test } from 'vitest';
import app from '../src/index';

test('health endpoint', async () => {
  const res = await app.request('/health');
  expect(res.status).toBe(200);
  const data = await res.json() as any;
  expect(data.status).toBe('ok');
  expect(data.service).toBe('ratelimiter');
});

test('check allows first request', async () => {
  const res = await app.request('/v1/ratelimit/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'test1', limit: 2, window_seconds: 60 })
  });
  const data = await res.json() as any;
  expect(data.allowed).toBe(true);
  expect(data.remaining).toBe(1);
});

test('check blocks after limit exceeded', async () => {
  await app.request('/v1/ratelimit/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'test2', limit: 1, window_seconds: 60 })
  });
  
  const res = await app.request('/v1/ratelimit/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'test2', limit: 1, window_seconds: 60 })
  });
  const data = await res.json() as any;
  expect(data.allowed).toBe(false);
  expect(data.remaining).toBe(0);
});

test('config endpoint', async () => {
  const res = await app.request('/v1/ratelimit/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'test3', limit: 5, window_seconds: 120 })
  });
  const data = await res.json() as any;
  expect(data.limit).toBe(5);
});`,

  // ---------------- Cache ----------------
  'Cache/package.json': `{
  "name": "pisigma-cache",
  "scripts": {
    "dev": "wrangler dev --port 8816",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "wrangler": "^3.0.0",
    "@cloudflare/workers-types": "^4.0.0",
    "vitest": "^1.0.0",
    "typescript": "^5.0.0",
    "hono": "^4.0.0"
  }
}`,
  'Cache/tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src"]
}`,
  'Cache/wrangler.toml': `name = "pisigma-cache"
main = "src/index.ts"
compatibility_date = "2024-11-01"`,
  'Cache/.env.example': `API_KEY=your-api-key-here`,
  'Cache/src/types.ts': `export interface CacheEntry {
  key: string;
  value: any;
  ttl?: number;
  namespace?: string;
  created_at: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys_count: number;
}`,
  'Cache/src/index.ts': `import { Hono } from 'hono';
import { CacheEntry, CacheStats } from './types';

const app = new Hono<{ Bindings: { API_KEY?: string } }>();

const store = new Map<string, CacheEntry>();
const stats: CacheStats = { hits: 0, misses: 0, keys_count: 0 };

const getFullKey = (namespace: string, key: string) => \`\${namespace}:\${key}\`;

app.get('/health', (c) => c.json({ status: 'ok', service: 'cache' }));

app.get('/v1/cache/:namespace/:key', (c) => {
  const namespace = c.req.param('namespace');
  const key = c.req.param('key');
  const fullKey = getFullKey(namespace, key);
  
  const entry = store.get(fullKey);
  if (!entry) {
    stats.misses++;
    return c.json({ error: 'not found' }, 404);
  }
  
  if (entry.ttl) {
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
    if (k.startsWith(\`\${namespace}:\`)) {
      store.delete(k);
      stats.keys_count--;
      count++;
    }
  }
  return c.json({ flushed: count });
});

app.get('/v1/cache/:namespace/stats', (c) => {
  return c.json(stats);
});

export default app;`,
  'Cache/src/client.ts': `import { CacheStats } from './types';

export class PisigmaCache {
  constructor(private baseUrl: string, private apiKey?: string) {}

  private async fetch(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    if (this.apiKey) headers.set('Authorization', \`Bearer \${this.apiKey}\`);
    headers.set('Content-Type', 'application/json');
    return fetch(\`\${this.baseUrl}\${path}\`, { ...options, headers });
  }

  async get(namespace: string, key: string): Promise<any> {
    const res = await this.fetch(\`/v1/cache/\${namespace}/\${key}\`);
    return res.json() as any;
  }

  async set(namespace: string, key: string, value: any, ttl?: number): Promise<any> {
    const res = await this.fetch(\`/v1/cache/\${namespace}/\${key}\`, {
      method: 'PUT',
      body: JSON.stringify({ value, ttl })
    });
    return res.json() as any;
  }

  async del(namespace: string, key: string): Promise<any> {
    const res = await this.fetch(\`/v1/cache/\${namespace}/\${key}\`, {
      method: 'DELETE'
    });
    return res.json() as any;
  }

  async flush(namespace: string): Promise<any> {
    const res = await this.fetch(\`/v1/cache/\${namespace}\`, {
      method: 'DELETE'
    });
    return res.json() as any;
  }

  async stats(namespace: string): Promise<CacheStats> {
    const res = await this.fetch(\`/v1/cache/\${namespace}/stats\`);
    return res.json() as any;
  }
}`,
  'Cache/tests/index.test.ts': `import { expect, test } from 'vitest';
import app from '../src/index';

test('health endpoint', async () => {
  const res = await app.request('/health');
  expect(res.status).toBe(200);
  const data = await res.json() as any;
  expect(data.status).toBe('ok');
  expect(data.service).toBe('cache');
});

test('set and get value', async () => {
  await app.request('/v1/cache/testns/key1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: 'val1' })
  });
  
  const res = await app.request('/v1/cache/testns/key1');
  const data = await res.json() as any;
  expect(data.value).toBe('val1');
});

test('TTL expiry', async () => {
  await app.request('/v1/cache/testns/key2', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: 'val2', ttl: 0 })
  });
  
  await new Promise(r => setTimeout(r, 10));
  const res = await app.request('/v1/cache/testns/key2');
  expect(res.status).toBe(404);
});

test('delete key', async () => {
  await app.request('/v1/cache/testns/key3', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: 'val3' })
  });
  
  const delRes = await app.request('/v1/cache/testns/key3', { method: 'DELETE' });
  const delData = await delRes.json() as any;
  expect(delData.deleted).toBe(true);
  
  const res = await app.request('/v1/cache/testns/key3');
  expect(res.status).toBe(404);
});

test('flush namespace', async () => {
  await app.request('/v1/cache/flushns/key1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: 'val1' })
  });
  
  const flushRes = await app.request('/v1/cache/flushns', { method: 'DELETE' });
  const flushData = await flushRes.json() as any;
  expect(flushData.flushed).toBeGreaterThan(0);
});

test('stats endpoint', async () => {
  const res = await app.request('/v1/cache/testns/stats');
  const data = await res.json() as any;
  expect(data.hits).toBeDefined();
  expect(data.misses).toBeDefined();
  expect(data.keys_count).toBeDefined();
});`,

  // ---------------- QueueBroker ----------------
  'QueueBroker/package.json': `{
  "name": "pisigma-queuebroker",
  "scripts": {
    "dev": "wrangler dev --port 8815",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "wrangler": "^3.0.0",
    "@cloudflare/workers-types": "^4.0.0",
    "vitest": "^1.0.0",
    "typescript": "^5.0.0",
    "hono": "^4.0.0"
  }
}`,
  'QueueBroker/tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src"]
}`,
  'QueueBroker/wrangler.toml': `name = "pisigma-queuebroker"
main = "src/index.ts"
compatibility_date = "2024-11-01"`,
  'QueueBroker/.env.example': `API_KEY=your-api-key-here`,
  'QueueBroker/src/types.ts': `export interface QueueMessage {
  id: string;
  queue: string;
  payload: any;
  created_at: number;
  status: string;
  retries?: number;
}

export interface QueueSubscriber {
  queue: string;
  webhook_url: string;
}

export interface QueueStats {
  depth: number;
  processed: number;
  failed: number;
  dlq_count: number;
}`,
  'QueueBroker/src/index.ts': `import { Hono } from 'hono';
import { QueueMessage, QueueSubscriber, QueueStats } from './types';

const app = new Hono<{ Bindings: { API_KEY?: string } }>();

const queues = new Map<string, QueueMessage[]>();
const dlq = new Map<string, QueueMessage[]>();
const subscribers = new Map<string, QueueSubscriber[]>();
const statsMap = new Map<string, QueueStats>();

const getStats = (queue: string) => {
  if (!statsMap.has(queue)) {
    statsMap.set(queue, { depth: 0, processed: 0, failed: 0, dlq_count: 0 });
  }
  return statsMap.get(queue)!;
};

app.get('/health', (c) => c.json({ status: 'ok', service: 'queuebroker' }));

app.post('/v1/queue/publish', async (c) => {
  const body = await c.req.json<{ queue: string; payload: any; delay_seconds?: number }>();
  const id = Math.random().toString(36).substring(7);
  
  const message: QueueMessage = {
    id,
    queue: body.queue,
    payload: body.payload,
    created_at: Date.now(),
    status: 'queued',
    retries: 0
  };
  
  if (!queues.has(body.queue)) {
    queues.set(body.queue, []);
  }
  queues.get(body.queue)!.push(message);
  
  const stats = getStats(body.queue);
  stats.depth++;
  
  return c.json({ id, queue: body.queue, status: 'queued' });
});

app.post('/v1/queue/subscribe', async (c) => {
  const body = await c.req.json<QueueSubscriber>();
  
  if (!subscribers.has(body.queue)) {
    subscribers.set(body.queue, []);
  }
  subscribers.get(body.queue)!.push(body);
  
  return c.json({ queue: body.queue, webhook_url: body.webhook_url, subscribed: true });
});

app.get('/v1/queue/:name/stats', (c) => {
  const name = c.req.param('name');
  const stats = getStats(name);
  return c.json(stats);
});

app.post('/v1/queue/:name/retry', (c) => {
  const name = c.req.param('name');
  
  const deadLetters = dlq.get(name) || [];
  const activeQueue = queues.get(name) || [];
  
  for (const msg of deadLetters) {
    msg.status = 'queued';
    activeQueue.push(msg);
  }
  
  dlq.set(name, []);
  if (!queues.has(name)) queues.set(name, activeQueue);
  
  const stats = getStats(name);
  stats.dlq_count = 0;
  stats.depth += deadLetters.length;
  
  return c.json({ retried: deadLetters.length });
});

export default app;`,
  'QueueBroker/src/client.ts': `import { QueueStats, QueueSubscriber } from './types';

export class PisigmaQueueBroker {
  constructor(private baseUrl: string, private apiKey?: string) {}

  private async fetch(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    if (this.apiKey) headers.set('Authorization', \`Bearer \${this.apiKey}\`);
    headers.set('Content-Type', 'application/json');
    return fetch(\`\${this.baseUrl}\${path}\`, { ...options, headers });
  }

  async publish(queue: string, payload: any, delay_seconds?: number): Promise<any> {
    const res = await this.fetch('/v1/queue/publish', {
      method: 'POST',
      body: JSON.stringify({ queue, payload, delay_seconds })
    });
    return res.json() as any;
  }

  async subscribe(queue: string, webhook_url: string): Promise<any> {
    const res = await this.fetch('/v1/queue/subscribe', {
      method: 'POST',
      body: JSON.stringify({ queue, webhook_url })
    });
    return res.json() as any;
  }

  async stats(queue: string): Promise<QueueStats> {
    const res = await this.fetch(\`/v1/queue/\${queue}/stats\`);
    return res.json() as any;
  }

  async retry(queue: string): Promise<any> {
    const res = await this.fetch(\`/v1/queue/\${queue}/retry\`, {
      method: 'POST'
    });
    return res.json() as any;
  }
}`,
  'QueueBroker/tests/index.test.ts': `import { expect, test } from 'vitest';
import app from '../src/index';

test('health endpoint', async () => {
  const res = await app.request('/health');
  expect(res.status).toBe(200);
  const data = await res.json() as any;
  expect(data.status).toBe('ok');
  expect(data.service).toBe('queuebroker');
});

test('publish message', async () => {
  const res = await app.request('/v1/queue/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queue: 'test-q', payload: { foo: 'bar' } })
  });
  const data = await res.json() as any;
  expect(data.id).toBeDefined();
  expect(data.status).toBe('queued');
});

test('subscribe webhook', async () => {
  const res = await app.request('/v1/queue/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queue: 'test-q', webhook_url: 'http://example.com' })
  });
  const data = await res.json() as any;
  expect(data.subscribed).toBe(true);
});

test('stats endpoint', async () => {
  await app.request('/v1/queue/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queue: 'test-stats', payload: 'test' })
  });
  
  const res = await app.request('/v1/queue/test-stats/stats');
  const data = await res.json() as any;
  expect(data.depth).toBeGreaterThan(0);
});

test('retry endpoint', async () => {
  const res = await app.request('/v1/queue/test-retry/retry', {
    method: 'POST'
  });
  const data = await res.json() as any;
  expect(data.retried).toBeDefined();
});`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(rootDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  console.log('Created:', fullPath);
}
