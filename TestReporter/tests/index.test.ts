import { expect, test } from 'vitest';
import app from '../src/index';

test('Health check', async () => {
  const res = await app.request('/health');
  expect(res.status).toBe(200);
  const data = await res.json() as any;
  expect(data.status).toBe('ok');
});

test('Ingest report 1', async () => {
  const res = await app.request('/v1/reports/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service: 'ServiceA',
      results: [
        { status: 'passed', duration_ms: 10, test_name: 'test1', suite: 's1', service: 'ServiceA' },
        { status: 'passed', duration_ms: 20, test_name: 'test2', suite: 's1', service: 'ServiceA' },
        { status: 'failed', duration_ms: 30, test_name: 'test3', suite: 's1', service: 'ServiceA' }
      ]
    })
  });
  const data = await res.json() as any;
  expect(data.total).toBe(3);
  expect(data.passed).toBe(2);
  expect(data.failed).toBe(1);
  expect(data.duration_ms).toBe(60);
});

test('Ingest report 2', async () => {
  await app.request('/v1/reports/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service: 'ServiceB',
      results: [
        { status: 'passed', duration_ms: 10, test_name: 'test1', suite: 's1', service: 'ServiceB' }
      ]
    })
  });
  
  const sumRes = await app.request('/v1/reports/summary');
  const sumData = await sumRes.json() as any;
  expect(sumData.total_services).toBe(2);
});

test('Flaky tests', async () => {
  await app.request('/v1/reports/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service: 'ServiceA',
      results: [
        { status: 'passed', duration_ms: 10, test_name: 'test3', suite: 's1', service: 'ServiceA' }
      ]
    })
  });
  const flakRes = await app.request('/v1/reports/flaky');
  const flakData = await flakRes.json() as any;
  expect(flakData.flaky_tests.length).toBe(1);
  expect(flakData.flaky_tests[0].test_name).toBe('test3');
});

test('Trends', async () => {
  const tRes = await app.request('/v1/reports/trends');
  const tData = await tRes.json() as any;
  expect(tData.trends.length).toBeGreaterThan(0);
  expect(tData.trends[0].date).toBeDefined();
});

test('Coverage', async () => {
  const covRes = await app.request('/v1/reports/coverage');
  const covData = await covRes.json() as any;
  expect(covData.coverage.length).toBe(2); // ServiceA and ServiceB
});

test('Get reports by service', async () => {
  const repRes = await app.request('/v1/reports/ServiceA');
  const repData = await repRes.json() as any;
  expect(repData.reports.length).toBe(2);
});
