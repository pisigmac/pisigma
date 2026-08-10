import { Hono } from 'hono';
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

export default app;