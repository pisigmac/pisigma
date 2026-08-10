import { expect, test } from 'vitest';
import app from '../src/index';

test('health check', async () => {
  const res = await app.request('/health');
  expect(res.status).toBe(200);
  const data = await res.json() as any;
  expect(data.status).toBe('ok');
});

test('generate embedding', async () => {
  const req = new Request('http://localhost/v1/embeddings/generate', {
    method: 'POST',
    body: JSON.stringify({ input: 'hello world' }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res = await app.fetch(req);
  const data = await res.json() as any;
  expect(data.dimensions).toBe(384);
  expect(data.vector).toBeInstanceOf(Array);
  expect(data.cached).toBe(false);
});

test('generate same input twice cached', async () => {
  // First time
  await app.fetch(new Request('http://localhost/v1/embeddings/generate', {
    method: 'POST',
    body: JSON.stringify({ input: 'test cache' }),
    headers: { 'Content-Type': 'application/json' }
  }));
  
  // Second time
  const req2 = new Request('http://localhost/v1/embeddings/generate', {
    method: 'POST',
    body: JSON.stringify({ input: 'test cache' }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res2 = await app.fetch(req2);
  const data2 = await res2.json() as any;
  expect(data2.cached).toBe(true);
});

test('batch embed', async () => {
  const req = new Request('http://localhost/v1/embeddings/batch', {
    method: 'POST',
    body: JSON.stringify({ inputs: ['a', 'b', 'c'] }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res = await app.fetch(req);
  const data = await res.json() as any;
  expect(data.total).toBe(3);
  expect(data.embeddings.length).toBe(3);
});

test('similarity same text', async () => {
  const req = new Request('http://localhost/v1/embeddings/similarity', {
    method: 'POST',
    body: JSON.stringify({ input_a: 'cat', input_b: 'cat' }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res = await app.fetch(req);
  const data = await res.json() as any;
  // Account for floating point precision
  expect(data.similarity).toBeGreaterThan(0.99);
});

test('similarity different text', async () => {
  const req = new Request('http://localhost/v1/embeddings/similarity', {
    method: 'POST',
    body: JSON.stringify({ input_a: 'cat', input_b: 'quantum physics research' }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res = await app.fetch(req);
  const data = await res.json() as any;
  expect(data.similarity).toBeLessThan(1.0);
});

test('cache stats', async () => {
  const res = await app.request('/v1/embeddings/cache/stats');
  const data = await res.json() as any;
  expect(data.hit_count).toBeDefined();
  expect(data.miss_count).toBeDefined();
});

test('providers', async () => {
  const res = await app.request('/v1/embeddings/providers');
  const data = await res.json() as any;
  expect(data.providers.find((p: any) => p.name === 'local')).toBeDefined();
});
