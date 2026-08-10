import { expect, test } from 'vitest';
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
});