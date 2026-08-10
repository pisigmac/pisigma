import { expect, test } from 'vitest';
import app from '../src/index';

test('health check', async () => {
  const res = await app.request('/health');
  expect(res.status).toBe(200);
  const data = await res.json() as any;
  expect(data.status).toBe('ok');
});

test('create suite', async () => {
  const req = new Request('http://localhost/v1/evals/suites', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Suite',
      test_cases: [
        { input: 'hello', expected_output: 'Hello' },
        { input: '2+2', expected_output: '4' },
        { input: 'capital of france', expected_output: 'Paris' }
      ]
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res = await app.fetch(req);
  const data = await res.json() as any;
  expect(data.test_cases.length).toBe(3);
  expect(data.id).toBeDefined();
});

test('run exact match', async () => {
  // get suite id first
  const suitesRes = await app.request('/v1/evals/suites');
  const suites = await suitesRes.json() as any;
  const suite_id = suites[0].id;

  const req = new Request('http://localhost/v1/evals/run', {
    method: 'POST',
    body: JSON.stringify({
      suite_id,
      scorer: 'exact_match',
      responses: ['Hello', '4', 'London']
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res = await app.fetch(req);
  const data = await res.json() as any;
  expect(data.passed).toBe(2);
  expect(data.failed).toBe(1);
});

test('run contains', async () => {
  const suitesRes = await app.request('/v1/evals/suites');
  const suites = await suitesRes.json() as any;
  const suite_id = suites[0].id;

  const req = new Request('http://localhost/v1/evals/run', {
    method: 'POST',
    body: JSON.stringify({
      suite_id,
      scorer: 'contains',
      responses: ['Hello world', 'answer is 4', 'Paris is beautiful']
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res = await app.fetch(req);
  const data = await res.json() as any;
  expect(data.passed).toBe(3);
});

test('run levenshtein', async () => {
  const suitesRes = await app.request('/v1/evals/suites');
  const suites = await suitesRes.json() as any;
  const suite_id = suites[0].id;

  const req = new Request('http://localhost/v1/evals/run', {
    method: 'POST',
    body: JSON.stringify({
      suite_id,
      scorer: 'levenshtein',
      responses: ['Hella', '4', 'Pariss']
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res = await app.fetch(req);
  const data = await res.json() as any;
  // all should pass as they are close
  expect(data.passed).toBe(3);
  expect(data.results[0].score).toBeGreaterThan(0.5);
  expect(data.results[0].score).toBeLessThan(1.0);
});

test('compare two runs', async () => {
  const trendsRes = await app.request('/v1/evals/trends');
  const trends = await trendsRes.json() as any;
  const runs = trends.trends[0].runs;
  
  const req = new Request('http://localhost/v1/evals/compare', {
    method: 'POST',
    body: JSON.stringify({
      run_id_a: runs[0].run_id, // exact match
      run_id_b: runs[1].run_id  // contains
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res = await app.fetch(req);
  const data = await res.json() as any;
  // 3rd test in run A failed (0), in run B passed (1). delta should be > 0.
  expect(data.summary.improved_count).toBeGreaterThanOrEqual(1);
});

test('trends', async () => {
  const res = await app.request('/v1/evals/trends');
  const data = await res.json() as any;
  expect(data.trends.length).toBeGreaterThan(0);
});
