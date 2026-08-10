import { expect, test } from 'vitest';
import app from '../src/index';

test('health check', async () => {
  const res = await app.request('/health');
  expect(res.status).toBe(200);
  const data = await res.json() as any;
  expect(data.status).toBe('ok');
});

test('register model', async () => {
  const req1 = new Request('http://localhost/v1/models/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'sentiment-v1', framework: 'pytorch', metrics: { accuracy: 0.85, latency_ms: 50 } }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res1 = await app.fetch(req1);
  const data1 = await res1.json() as any;
  expect(data1.name).toBe('sentiment-v1');
  expect(data1.versions[0].version).toBe(1);

  const req2 = new Request('http://localhost/v1/models/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'sentiment-v1', framework: 'pytorch', metrics: { accuracy: 0.92, latency_ms: 45 } }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res2 = await app.fetch(req2);
  const data2 = await res2.json() as any;
  expect(data2.versions.length).toBe(2);
  expect(data2.versions[1].version).toBe(2);
});

test('get versions', async () => {
  const res = await app.request('/v1/models/sentiment-v1/versions');
  const data = await res.json() as any;
  expect(data.length).toBe(2);
});

test('promote to production and get active', async () => {
  const req = new Request('http://localhost/v1/models/sentiment-v1/promote', {
    method: 'POST',
    body: JSON.stringify({ version: 2, target: 'production' }),
    headers: { 'Content-Type': 'application/json' }
  });
  await app.fetch(req);
  
  const res = await app.request('/v1/models/sentiment-v1/active');
  const data = await res.json() as any;
  expect(data.version).toBe(2);
});

test('compare versions', async () => {
  const req = new Request('http://localhost/v1/models/compare', {
    method: 'POST',
    body: JSON.stringify({ model_name: 'sentiment-v1', version_a: 1, version_b: 2 }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res = await app.fetch(req);
  const data = await res.json() as any;
  expect(data.metrics_diff.accuracy.improved).toBe(true);
  expect(data.metrics_diff.latency_ms.improved).toBe(true);
});

test('list models', async () => {
  const req = new Request('http://localhost/v1/models/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'ner-model', framework: 'tensorflow', metrics: { f1_score: 0.88 } }),
    headers: { 'Content-Type': 'application/json' }
  });
  await app.fetch(req);

  const res = await app.request('/v1/models');
  const data = await res.json() as any;
  expect(data.total).toBe(2);
});
