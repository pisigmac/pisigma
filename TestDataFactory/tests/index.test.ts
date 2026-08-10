import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('TestDataFactory API', () => {
  it('should return health check', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe('ok');
    expect(body.service).toBe('testdatafactory');
  });

  it('should generate inline fields', async () => {
    const res = await app.request('/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count: 5,
        fields: [
          { name: 'full_name', type: 'name' },
          { name: 'email_address', type: 'email' },
          { name: 'age', type: 'number' }
        ]
      })
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data).toHaveLength(5);
    expect(body.data[0]).toHaveProperty('full_name');
    expect(body.data[0]).toHaveProperty('email_address');
    expect(body.data[0].email_address).toContain('@');
    expect(typeof body.data[0].age).toBe('number');
  });

  it('should register schema and generate data', async () => {
    const regRes = await app.request('/v1/schemas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'User',
        fields: [
          { name: 'id', type: 'uuid' },
          { name: 'username', type: 'string' }
        ]
      })
    });
    expect(regRes.status).toBe(200);

    const genRes = await app.request('/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema_name: 'User',
        count: 2
      })
    });
    const genBody = await genRes.json() as any;
    expect(genBody.data).toHaveLength(2);
    expect(genBody.data[0]).toHaveProperty('id');
    expect(genBody.data[0]).toHaveProperty('username');
  });

  it('should generate deterministic output with seed', async () => {
    const reqBody = {
      count: 2,
      seed: 42,
      fields: [{ name: 'name', type: 'name' }]
    };

    const res1 = await app.request('/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    const body1 = await res1.json() as any;

    const res2 = await app.request('/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    const body2 = await res2.json() as any;

    expect(body1.data).toEqual(body2.data);
  });

  it('should generate related entities', async () => {
    // First register Order schema since User is already registered
    await app.request('/v1/schemas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Order',
        fields: [
          { name: 'id', type: 'uuid' },
          { name: 'amount', type: 'number' }
        ]
      })
    });

    const res = await app.request('/v1/generate/related', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entities: [
          { schema_name: 'User', count: 1 },
          { schema_name: 'Order', count: 2, parent: 'User', foreign_key: 'user_id' }
        ]
      })
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.User).toHaveLength(1);
    expect(body.data.Order).toHaveLength(2);
    expect(body.data.Order[0]).toHaveProperty('user_id');
    expect(body.data.Order[0].user_id).toBe(body.data.User[0].id);
  });
});
