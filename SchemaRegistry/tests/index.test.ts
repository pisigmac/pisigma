import { describe, expect, test } from 'vitest';
import app from '../src/index';

describe('SchemaRegistry', () => {
  test('Health check', async () => {
    const res = await app.request('/health');
    const data = await res.json() as any;
    expect(data.status).toBe('ok');
    expect(data.schemas_count).toBe(0);
  });

  test('Register schema user', async () => {
    const res = await app.request('/v1/schemas/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'user',
        fields: [
          { name: 'id', type: 'number', required: true },
          { name: 'email', type: 'string', required: true },
          { name: 'name', type: 'string' }
        ]
      })
    });
    const data = await res.json() as any;
    expect(data.current_version).toBe(1);
    expect(data.name).toBe('user');
  });

  test('Get latest version', async () => {
    const res = await app.request('/v1/schemas/user/latest');
    const data = await res.json() as any;
    expect(data.version).toBe(1);
    expect(data.fields.length).toBe(3);
  });

  test('Register again with added field', async () => {
    const res = await app.request('/v1/schemas/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'user',
        fields: [
          { name: 'id', type: 'number', required: true },
          { name: 'email', type: 'string', required: true },
          { name: 'name', type: 'string' },
          { name: 'age', type: 'number' }
        ]
      })
    });
    const data = await res.json() as any;
    expect(data.current_version).toBe(2);
  });

  test('Get all versions', async () => {
    const res = await app.request('/v1/schemas/user/versions');
    const data = await res.json() as any;
    expect(data.versions.length).toBe(2);
  });

  test('Validate correct payload', async () => {
    const res = await app.request('/v1/schemas/validate', {
      method: 'POST',
      body: JSON.stringify({
        schema_name: 'user',
        payload: { id: 1, email: 'a@b.com' }
      })
    });
    const data = await res.json() as any;
    expect(data.valid).toBe(true);
  });

  test('Validate with missing required field', async () => {
    const res = await app.request('/v1/schemas/validate', {
      method: 'POST',
      body: JSON.stringify({
        schema_name: 'user',
        payload: { name: 'test' }
      })
    });
    const data = await res.json() as any;
    expect(data.valid).toBe(false);
    expect(data.errors.some((e: string) => e.includes('id'))).toBe(true);
    expect(data.errors.some((e: string) => e.includes('email'))).toBe(true);
  });

  test('Validate with wrong type', async () => {
    const res = await app.request('/v1/schemas/validate', {
      method: 'POST',
      body: JSON.stringify({
        schema_name: 'user',
        payload: { id: 'not-number', email: 'a@b.com' }
      })
    });
    const data = await res.json() as any;
    expect(data.valid).toBe(false);
    expect(data.errors.some((e: string) => e.includes('id type mismatch'))).toBe(true);
  });

  test('Compatibility check: remove required field -> incompatible', async () => {
    const res = await app.request('/v1/schemas/compatibility', {
      method: 'POST',
      body: JSON.stringify({
        schema_name: 'user',
        new_fields: [
          { name: 'email', type: 'string', required: true }
        ]
      })
    });
    const data = await res.json() as any;
    expect(data.compatible).toBe(false);
  });

  test('Compatibility check: add optional field -> compatible', async () => {
    const res = await app.request('/v1/schemas/compatibility', {
      method: 'POST',
      body: JSON.stringify({
        schema_name: 'user',
        new_fields: [
          { name: 'id', type: 'number', required: true },
          { name: 'email', type: 'string', required: true },
          { name: 'name', type: 'string' },
          { name: 'age', type: 'number' },
          { name: 'address', type: 'string' }
        ]
      })
    });
    const data = await res.json() as any;
    expect(data.compatible).toBe(true);
  });
});
