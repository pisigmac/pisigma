import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('VectorSearch Service', () => {
  it('should return health status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe('ok');
    expect(body.service).toBe('vectorsearch');
  });

  it('should upsert a vector', async () => {
    const res = await app.request('/v1/vectors/upsert', {
      method: 'POST',
      body: JSON.stringify({
        collection: 'test-col',
        id: 'v1',
        embedding: [1.0, 0.0, 0.0]
      })
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.id).toBe('v1');
    expect(body.collection).toBe('test-col');
  });

  it('should query vectors', async () => {
    const res = await app.request('/v1/vectors/query', {
      method: 'POST',
      body: JSON.stringify({
        collection: 'test-col',
        embedding: [1.0, 0.0, 0.0],
        top_k: 5
      })
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.length).toBe(1);
    expect(body[0].id).toBe('v1');
    expect(body[0].score).toBe(1); // cosine similarity of identical vectors
  });

  it('should list collections', async () => {
    const res = await app.request('/v1/vectors/collections');
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.length).toBe(1);
    expect(body[0].name).toBe('test-col');
    expect(body[0].count).toBe(1);
  });

  it('should delete a vector', async () => {
    const res = await app.request('/v1/vectors/v1', {
      method: 'DELETE'
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.deleted).toBe(true);
  });
});
