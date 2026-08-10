import { describe, expect, test } from 'vitest';
import app from '../src/index';

describe('DataQuality', () => {
  test('Health check', async () => {
    const res = await app.request('/health');
    const data = await res.json() as any;
    expect(data.status).toBe('ok');
    expect(data.datasets_with_rules).toBe(0);
  });

  test('Create not_null rule for email', async () => {
    const res = await app.request('/v1/quality/rules', {
      method: 'POST',
      body: JSON.stringify({
        dataset: 'users',
        field: 'email',
        rule_type: 'not_null',
        severity: 'error'
      })
    });
    const data = await res.json() as any;
    expect(data.id).toBeDefined();
    expect(data.rule_type).toBe('not_null');
  });

  test('Validate data with null email', async () => {
    const res = await app.request('/v1/quality/validate', {
      method: 'POST',
      body: JSON.stringify({
        dataset: 'users',
        data: [{ id: 1, email: null }, { id: 2, email: 'test@test.com' }]
      })
    });
    const data = await res.json() as any;
    expect(data.violation_count).toBeGreaterThan(0);
    expect(data.violations[0].field).toBe('email');
  });

  test('Create range rule for age and validate', async () => {
    await app.request('/v1/quality/rules', {
      method: 'POST',
      body: JSON.stringify({
        dataset: 'users_age',
        field: 'age',
        rule_type: 'range',
        params: { min: 0, max: 150 },
        severity: 'error'
      })
    });

    const res = await app.request('/v1/quality/validate', {
      method: 'POST',
      body: JSON.stringify({
        dataset: 'users_age',
        data: [{ age: 25 }, { age: 200 }]
      })
    });
    const data = await res.json() as any;
    expect(data.violation_count).toBe(1);
    expect(data.violations[0].actual_value).toBe(200);
  });

  test('Create unique rule for id and validate', async () => {
    await app.request('/v1/quality/rules', {
      method: 'POST',
      body: JSON.stringify({
        dataset: 'users_id',
        field: 'id',
        rule_type: 'unique',
        severity: 'error'
      })
    });

    const res = await app.request('/v1/quality/validate', {
      method: 'POST',
      body: JSON.stringify({
        dataset: 'users_id',
        data: [{ id: 1 }, { id: 2 }, { id: 1 }]
      })
    });
    const data = await res.json() as any;
    expect(data.violation_count).toBeGreaterThan(0);
    expect(data.violations.some((v: any) => v.actual_value === 1)).toBe(true);
  });

  test('Profile data', async () => {
    const res = await app.request('/v1/quality/profile', {
      method: 'POST',
      body: JSON.stringify({
        dataset: 'test',
        data: [{ age: 10, name: 'A' }, { age: 20, name: null }, { age: 30, name: 'C' }]
      })
    });
    const data = await res.json() as any;
    const ageProfile = data.profiles.find((p: any) => p.field === 'age');
    expect(ageProfile.min).toBe(10);
    expect(ageProfile.max).toBe(30);

    const nameProfile = data.profiles.find((p: any) => p.field === 'name');
    expect(nameProfile.null_count).toBe(1);
    expect(nameProfile.unique_count).toBe(3); // 'A', null, 'C'
  });

  test('Quality scores reflect pass_rate', async () => {
    const res = await app.request('/v1/quality/scores');
    const data = await res.json() as any;
    expect(data.scores.length).toBeGreaterThan(0);
    const score = data.scores.find((s: any) => s.dataset === 'users_age');
    expect(score).toBeDefined();
    expect(score.score).toBeLessThan(100);
  });
});
