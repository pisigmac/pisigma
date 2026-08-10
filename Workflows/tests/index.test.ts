import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('Workflows Service', () => {
  it('should return health status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe('ok');
    expect(body.service).toBe('workflows');
  });

  let workflowId: string;
  let instanceId: string;

  it('should define workflow with states', async () => {
    const res = await app.request('/v1/workflows/define', {
      method: 'POST',
      body: JSON.stringify({
        name: 'test-workflow',
        states: [
          { name: 'step1', transitions: ['step2'], requires_approval: true },
          { name: 'step2', transitions: [], requires_approval: false }
        ]
      })
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.name).toBe('test-workflow');
    expect(body.states.length).toBe(2);
    workflowId = body.id;
  });

  it('should trigger creates instance at initial state', async () => {
    const res = await app.request(`/v1/workflows/${workflowId}/trigger`, { method: 'POST' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.workflow_id).toBe(workflowId);
    expect(body.current_state).toBe('step1');
    expect(body.status).toBe('waiting_approval');
    instanceId = body.id;
  });

  it('should status return current state', async () => {
    const res = await app.request(`/v1/workflows/${instanceId}/status`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.current_state).toBe('step1');
  });

  it('should approve advances state', async () => {
    const res = await app.request(`/v1/workflows/${instanceId}/approve`, { method: 'POST' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.current_state).toBe('step2');
    expect(body.status).toBe('completed');
    expect(body.history.length).toBe(1);
    expect(body.history[0].from).toBe('step1');
    expect(body.history[0].to).toBe('step2');
  });
});
