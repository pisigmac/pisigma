import { Hono } from 'hono';
import { MonitoredService, UptimeRecord, MaintenanceWindow, StatusSummary } from './types';

const app = new Hono();

const services = new Map<string, MonitoredService>();
const uptimeHistory: UptimeRecord[] = [];
const maintenance = new Map<string, MaintenanceWindow>();

const generateId = () => Math.random().toString(36).substring(2, 9);

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'statuspage', monitored_services: services.size });
});

app.post('/v1/status/services', async (c) => {
  const body = await c.req.json();
  const id = generateId();
  const service: MonitoredService = {
    id,
    name: body.name,
    health_url: body.health_url,
    status: 'unknown',
    registered_at: new Date().toISOString()
  };
  services.set(body.name, service);
  return c.json(service);
});

app.get('/v1/status/services', (c) => {
  const all = Array.from(services.values());
  return c.json({ services: all, total: all.length });
});

app.get('/v1/status/current', (c) => {
  const allServices = Array.from(services.values());
  let overall_status: 'all_operational' | 'partial_issues' | 'major_outage' = 'all_operational';
  
  const hasMajorOutage = allServices.some(s => s.status === 'major_outage');
  const hasPartialIssues = allServices.some(s => s.status === 'degraded' || s.status === 'partial_outage');
  
  if (hasMajorOutage) overall_status = 'major_outage';
  else if (hasPartialIssues) overall_status = 'partial_issues';

  const upcoming_maintenance = Array.from(maintenance.values()).filter(m => m.status === 'scheduled');
  
  const summary: StatusSummary = {
    overall_status,
    services: allServices,
    active_incidents_count: 0,
    upcoming_maintenance,
    last_updated: new Date().toISOString()
  };
  
  return c.json(summary);
});

app.get('/v1/status/uptime', (c) => {
  const serviceName = c.req.query('service');
  const days = parseInt(c.req.query('days') || '7', 10);
  
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  let records = uptimeHistory.filter(r => new Date(r.timestamp) >= cutoff);
  if (serviceName) records = records.filter(r => r.service_name === serviceName);
  
  const up_count = records.filter(r => r.status === 'up').length;
  const total_checks = records.length;
  const uptime_percentage = total_checks > 0 ? (up_count / total_checks) * 100 : 100;
  
  return c.json({
    service: serviceName,
    uptime_percentage,
    total_checks,
    up_count,
    down_count: total_checks - up_count,
    records
  });
});

app.post('/v1/status/maintenance', async (c) => {
  const body = await c.req.json();
  const id = generateId();
  const m: MaintenanceWindow = {
    id,
    title: body.title,
    description: body.description,
    affected_services: body.affected_services,
    starts_at: body.starts_at,
    ends_at: body.ends_at,
    status: 'scheduled',
    created_at: new Date().toISOString()
  };
  maintenance.set(id, m);
  return c.json(m);
});

app.get('/v1/status/maintenance', (c) => {
  const status = c.req.query('status');
  let all = Array.from(maintenance.values());
  if (status) all = all.filter(m => m.status === status);
  return c.json(all);
});

app.put('/v1/status/maintenance/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const m = maintenance.get(id);
  if (!m) return c.json({ error: 'not found' }, 404);
  
  if (body.status) m.status = body.status;
  if (body.title) m.title = body.title;
  if (body.description) m.description = body.description;
  if (body.affected_services) m.affected_services = body.affected_services;
  if (body.starts_at) m.starts_at = body.starts_at;
  if (body.ends_at) m.ends_at = body.ends_at;
  
  return c.json(m);
});

app.delete('/v1/status/services/:name', (c) => {
  const name = c.req.param('name');
  services.delete(name);
  return c.json({ success: true });
});

app.post('/v1/status/services/:name/check', async (c) => {
  const name = c.req.param('name');
  const service = services.get(name);
  if (!service) return c.json({ error: 'not found' }, 404);
  
  const start = Date.now();
  let status: 'up' | 'down' = 'down';
  let response_ms = 0;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(service.health_url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (res.ok) {
      status = 'up';
      service.status = 'operational';
    } else {
      service.status = 'major_outage';
    }
  } catch (error) {
    service.status = 'major_outage';
  }
  
  response_ms = Date.now() - start;
  service.last_checked = new Date().toISOString();
  service.last_response_ms = response_ms;
  
  uptimeHistory.push({
    service_name: name,
    timestamp: service.last_checked,
    status,
    response_ms
  });
  
  return c.json(service);
});

app.post('/v1/status/services/:name/update', async (c) => {
  const name = c.req.param('name');
  const body = await c.req.json();
  const service = services.get(name);
  if (!service) return c.json({ error: 'not found' }, 404);
  
  service.status = body.status;
  return c.json(service);
});

export default app;
