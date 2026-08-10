import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('IncidentManager API', () => {
  it('Health check', async () => {
    const res = await app.request('/health');
    const data = await res.json() as any;
    expect(data.status).toBe('ok');
    expect(data.active_incidents).toBe(0);
  });

  let incidentId = '';

  it('Create incident', async () => {
    const res = await app.request('/v1/incidents/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Database outage',
        description: 'DB is down',
        severity: 'p1_critical',
        affected_services: ['billing', 'auth']
      })
    });
    const data = await res.json() as any;
    expect(data.status).toBe('investigating');
    expect(data.timeline.length).toBe(1);
    incidentId = data.id;
  });

  it('Update status to identified', async () => {
    const res = await app.request(`/v1/incidents/${incidentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'identified',
        message: 'Found the issue',
        author: 'alice'
      })
    });
    const data = await res.json() as any;
    expect(data.status).toBe('identified');
    expect(data.timeline.length).toBe(2);
  });

  it('Add timeline entry', async () => {
    const res = await app.request(`/v1/incidents/${incidentId}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Working on a fix',
        author: 'alice'
      })
    });
    const data = await res.json() as any;
    expect(data.length).toBe(3);
  });

  it('Get active incidents', async () => {
    const res = await app.request('/v1/incidents/active');
    const data = await res.json() as any;
    expect(data.total).toBe(1);
  });

  it('Update status to resolved', async () => {
    const res = await app.request(`/v1/incidents/${incidentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'resolved',
        message: 'Fixed',
        author: 'alice'
      })
    });
    const data = await res.json() as any;
    expect(data.status).toBe('resolved');
    expect(data.resolved_at).toBeDefined();
    expect(data.duration_minutes).toBeDefined();
  });

  it('Get active incidents again', async () => {
    const res = await app.request('/v1/incidents/active');
    const data = await res.json() as any;
    expect(data.total).toBe(0);
  });

  it('Create postmortem', async () => {
    const res = await app.request(`/v1/incidents/${incidentId}/postmortem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        root_cause: 'Bad query',
        impact_summary: 'Users could not login',
        action_items: [{ task: 'Add index', owner: 'alice', status: 'open' }]
      })
    });
    const data = await res.json() as any;
    expect(data.root_cause).toBe('Bad query');
  });

  it('Create and rotate on-call', async () => {
    const res = await app.request('/v1/incidents/oncall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team: 'sre',
        members: [{ name: 'A', email: 'a@a' }, { name: 'B', email: 'b@b' }, { name: 'C', email: 'c@c' }],
        rotation_period: 'daily'
      })
    });
    let data = await res.json() as any;
    expect(data.current_index).toBe(0);

    const rot1 = await app.request('/v1/incidents/oncall/sre/rotate', { method: 'POST' });
    data = await rot1.json() as any;
    expect(data.current_index).toBe(1);

    const rot2 = await app.request('/v1/incidents/oncall/sre/rotate', { method: 'POST' });
    data = await rot2.json() as any;
    expect(data.current_index).toBe(2);
  });
});
