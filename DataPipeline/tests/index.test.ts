import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('DataPipeline Service', () => {
  it('should return health status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe('ok');
    expect(body.service).toBe('datapipeline');
  });

  it('should create a job', async () => {
    const res = await app.request('/v1/pipeline/jobs', {
      method: 'POST',
      body: JSON.stringify({
        name: 'test-job',
        source_format: 'json',
        target_format: 'csv'
      })
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.name).toBe('test-job');
    expect(body.status).toBe('pending');
  });

  it('should run a job and get status', async () => {
    // create job
    let res = await app.request('/v1/pipeline/jobs', {
      method: 'POST',
      body: JSON.stringify({ name: 'job2', source_format: 'csv', target_format: 'json' })
    });
    let body = (await res.json()) as any;
    const id = body.id;

    // run job
    res = await app.request(`/v1/pipeline/jobs/${id}/run`, { method: 'POST' });
    expect(res.status).toBe(200);
    body = (await res.json()) as any;
    expect(body.status).toBe('completed');
    expect(body.records_processed).toBeGreaterThanOrEqual(100);
    expect(body.records_processed).toBeLessThanOrEqual(10000);

    // get status
    res = await app.request(`/v1/pipeline/jobs/${id}/status`);
    expect(res.status).toBe(200);
    body = (await res.json()) as any;
    expect(body.status).toBe('completed');
  });

  it('should transform data with filter_nulls', async () => {
    const res = await app.request('/v1/pipeline/transform', {
      method: 'POST',
      body: JSON.stringify({
        data: [
          { a: 1, b: null, c: 'hello' }
        ],
        operations: ['filter_nulls']
      })
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.transformed[0].b).toBeUndefined();
    expect(body.transformed[0].a).toBe(1);
    expect(body.transformed[0].c).toBe('hello');
  });
});
