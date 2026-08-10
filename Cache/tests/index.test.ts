import { expect, test } from 'vitest';
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
});