import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('StatusPage API', () => {
  it('Health check', async () => {
    const res = await app.request('/health');
    const data = await res.json() as any;
    expect(data.status).toBe('ok');
    expect(data.monitored_services).toBe(0);
  });

  it('Register service', async () => {
    const res = await app.request('/v1/status/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'billing',
        health_url: 'http://127.0.0.1:8787/health'
      })
    });
    const data = await res.json() as any;
    expect(data.name).toBe('billing');
    expect(data.status).toBe('unknown');
  });

  it('Manually update status to operational', async () => {
    const res = await app.request('/v1/status/services/billing/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'operational' })
    });
    const data = await res.json() as any;
    expect(data.status).toBe('operational');
  });

  it('Manually update status to degraded', async () => {
    const res = await app.request('/v1/status/services/billing/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'degraded' })
    });
    const data = await res.json() as any;
    expect(data.status).toBe('degraded');

    const curr = await app.request('/v1/status/current');
    const currData = await curr.json() as any;
    expect(currData.overall_status).toBe('partial_issues');
  });

  it('Register second service and make both operational', async () => {
    await app.request('/v1/status/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'auth', health_url: 'http://127.0.0.1:8090/health' })
    });
    await app.request('/v1/status/services/billing/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'operational' })
    });
    await app.request('/v1/status/services/auth/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'operational' })
    });

    const curr = await app.request('/v1/status/current');
    const currData = await curr.json() as any;
    expect(currData.overall_status).toBe('all_operational');
  });

  it('Update one to major_outage', async () => {
    await app.request('/v1/status/services/auth/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'major_outage' })
    });

    const curr = await app.request('/v1/status/current');
    const currData = await curr.json() as any;
    expect(currData.overall_status).toBe('major_outage');
  });

  let maintenanceId = '';
  it('Create maintenance window', async () => {
    const res = await app.request('/v1/status/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'DB Upgrade',
        affected_services: ['auth'],
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 3600000).toISOString()
      })
    });
    const data = await res.json() as any;
    expect(data.status).toBe('scheduled');
    maintenanceId = data.id;

    const curr = await app.request('/v1/status/current');
    const currData = await curr.json() as any;
    expect(currData.upcoming_maintenance.length).toBe(1);
  });

  it('Update maintenance to completed', async () => {
    const res = await app.request(`/v1/status/maintenance/${maintenanceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });
    const data = await res.json() as any;
    expect(data.status).toBe('completed');

    const curr = await app.request('/v1/status/current');
    const currData = await curr.json() as any;
    expect(currData.upcoming_maintenance.length).toBe(0);
  });

  it('Delete a service', async () => {
    const res = await app.request('/v1/status/services/auth', { method: 'DELETE' });
    const data = await res.json() as any;
    expect(data.success).toBe(true);

    const list = await app.request('/v1/status/services');
    const listData = await list.json() as any;
    expect(listData.total).toBe(1);
    expect(listData.services[0].name).toBe('billing');
  });
});
