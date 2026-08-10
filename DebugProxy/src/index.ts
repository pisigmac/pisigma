import { Hono } from 'hono';
import { InterceptRule, CapturedRequest, ProxyStats } from './types';

const app = new Hono<{ Bindings: {} }>();

const rules = new Map<string, InterceptRule>();
let captured: CapturedRequest[] = [];

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'debugproxy', active_rules: rules.size, captured_count: captured.length });
});

app.post('/v1/proxy/intercept', async (c) => {
  const body = await c.req.json<InterceptRule>();
  const id = body.id || crypto.randomUUID();
  const rule: InterceptRule = {
    capture_headers: true,
    capture_body: true,
    active: true,
    ...body,
    id,
    created_at: new Date().toISOString(),
  };
  rules.set(id, rule);
  return c.json(rule);
});

app.get('/v1/proxy/rules', (c) => {
  return c.json(Array.from(rules.values()));
});

app.delete('/v1/proxy/rules/:id', (c) => {
  const id = c.req.param('id');
  if (!rules.has(id)) return c.json({ error: 'not_found' }, 404);
  rules.delete(id);
  return c.json({ deleted: true, id });
});

app.post('/v1/proxy/capture', async (c) => {
  const body = await c.req.json<any>();
  const request: CapturedRequest = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    rule_id: body.rule_id || '',
    method: body.method,
    url: body.url,
    request_headers: body.request_headers,
    request_body: body.request_body,
    response_status: body.response_status,
    response_headers: body.response_headers,
    response_body: body.response_body,
    latency_ms: body.latency_ms || 0,
    source_service: body.source_service,
    target_service: body.target_service,
  };
  captured.push(request);
  return c.json(request);
});

app.get('/v1/proxy/requests', (c) => {
  const source = c.req.query('source');
  const target = c.req.query('target');
  const status = c.req.query('status');
  const limitStr = c.req.query('limit');
  
  let filtered = captured;
  if (source) filtered = filtered.filter(r => r.source_service === source);
  if (target) filtered = filtered.filter(r => r.target_service === target);
  if (status && status === '4xx') filtered = filtered.filter(r => r.response_status && r.response_status >= 400 && r.response_status < 500);
  
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;
  if (limit) filtered = filtered.slice(-limit);

  return c.json({ requests: filtered, total: filtered.length });
});

app.get('/v1/proxy/requests/:id', (c) => {
  const id = c.req.param('id');
  const req = captured.find(r => r.id === id);
  if (!req) return c.json({ error: 'not_found' }, 404);
  return c.json(req);
});

app.delete('/v1/proxy/requests', (c) => {
  const count = captured.length;
  captured = [];
  return c.json({ cleared: true, count });
});

app.get('/v1/proxy/stats', (c) => {
  const total_captured = captured.length;
  const by_service: Record<string, number> = {};
  let total_latency = 0;
  let errors = 0;
  const latencies: number[] = [];

  for (const req of captured) {
    by_service[req.target_service] = (by_service[req.target_service] || 0) + 1;
    total_latency += req.latency_ms;
    latencies.push(req.latency_ms);
    if (req.response_status && req.response_status >= 400) {
      errors++;
    }
  }

  latencies.sort((a, b) => a - b);
  const p95Index = Math.max(0, Math.floor(latencies.length * 0.95) - 1);
  const p95_latency_ms = latencies.length > 0 ? latencies[p95Index] : 0;

  const avg_latency_ms = total_captured > 0 ? total_latency / total_captured : 0;
  const error_rate = total_captured > 0 ? errors / total_captured : 0;

  const stats: ProxyStats = {
    total_captured,
    by_service,
    avg_latency_ms,
    error_rate,
    p95_latency_ms,
  };
  return c.json(stats);
});

export default app;
