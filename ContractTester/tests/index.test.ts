import { expect, test } from 'vitest';
import app from '../src/index';

test('Health check', async () => {
  const res = await app.request('/health');
  expect(res.status).toBe(200);
  const data = await res.json() as any;
  expect(data.status).toBe('ok');
});

let contractId = '';

test('Register contract', async () => {
  const res = await app.request('/v1/contracts/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'Test',
      consumer: 'Consumer',
      endpoint: '/test',
      method: 'GET',
      response_schema: [
        { name: 'id', type: 'number', required: true },
        { name: 'email', type: 'string', required: true }
      ]
    })
  });
  const data = await res.json() as any;
  expect(res.status).toBe(201);
  contractId = data.id;
});

test('Verify correct response', async () => {
  const res = await app.request('/v1/contracts/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contract_id: contractId,
      actual_response: { id: 1, email: 'a@b.com' }
    })
  });
  const data = await res.json() as any;
  expect(data.passed).toBe(true);
});

test('Verify with wrong type', async () => {
  const res = await app.request('/v1/contracts/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contract_id: contractId,
      actual_response: { id: 'not-a-number', email: 'a@b.com' }
    })
  });
  const data = await res.json() as any;
  expect(data.passed).toBe(false);
  expect(data.errors.some((e: string) => e.includes('id'))).toBe(true);
});

test('Verify with missing required field', async () => {
  const res = await app.request('/v1/contracts/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contract_id: contractId,
      actual_response: { id: 1 }
    })
  });
  const data = await res.json() as any;
  expect(data.passed).toBe(false);
  expect(data.errors.some((e: string) => e.includes('email'))).toBe(true);
});

test('Diff: remove a field', async () => {
  const res = await app.request('/v1/contracts/diff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      old_schema: [{ name: 'id', type: 'number' }],
      new_schema: []
    })
  });
  const data = await res.json() as any;
  expect(data.compatible).toBe(false);
  expect(data.breaking_changes.some((e: string) => e.includes('id'))).toBe(true);
});

test('Diff: add optional field', async () => {
  const res = await app.request('/v1/contracts/diff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      old_schema: [],
      new_schema: [{ name: 'id', type: 'number', required: false }]
    })
  });
  const data = await res.json() as any;
  expect(data.compatible).toBe(true);
  expect(data.non_breaking_changes.some((e: string) => e.includes('id'))).toBe(true);
});
