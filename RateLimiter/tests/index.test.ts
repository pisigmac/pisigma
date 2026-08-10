import { expect, test } from 'vitest';
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
});