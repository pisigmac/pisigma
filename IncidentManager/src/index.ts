import { Hono } from 'hono';
import { Incident, Postmortem, OnCallRotation, IncidentStatus, IncidentSeverity } from './types';

const app = new Hono();

const incidents = new Map<string, Incident>();
const postmortems = new Map<string, Postmortem>();
const oncall = new Map<string, OnCallRotation>();

const generateId = () => Math.random().toString(36).substring(2, 9);

app.get('/health', (c) => {
  let active_incidents = 0;
  for (const incident of incidents.values()) {
    if (incident.status !== 'resolved' && incident.status !== 'postmortem') {
      active_incidents++;
    }
  }
  return c.json({ status: 'ok', service: 'incidentmanager', active_incidents });
});

app.post('/v1/incidents/create', async (c) => {
  const body = await c.req.json();
  const id = generateId();
  const now = new Date().toISOString();
  
  const incident: Incident = {
    id,
    title: body.title,
    description: body.description,
    severity: body.severity,
    affected_services: body.affected_services,
    commander: body.commander,
    status: 'investigating',
    timeline: [{
      message: 'Incident created',
      author: 'system',
      timestamp: now
    }],
    created_at: now,
    updated_at: now,
  };
  
  incidents.set(id, incident);
  return c.json(incident);
});

app.get('/v1/incidents/active', (c) => {
  const active = Array.from(incidents.values()).filter(
    i => i.status !== 'resolved' && i.status !== 'postmortem'
  ).sort((a, b) => a.severity.localeCompare(b.severity));
  return c.json({ incidents: active, total: active.length });
});

app.get('/v1/incidents/all', (c) => {
  const severity = c.req.query('severity');
  const status = c.req.query('status');
  
  let all = Array.from(incidents.values());
  if (severity) all = all.filter(i => i.severity === severity);
  if (status) all = all.filter(i => i.status === status);
  
  return c.json({ incidents: all, total: all.length });
});

app.post('/v1/incidents/oncall', async (c) => {
  const body = await c.req.json();
  const id = generateId();
  const rotation: OnCallRotation = {
    id,
    team: body.team,
    members: body.members,
    current_index: 0,
    rotation_period: body.rotation_period,
    created_at: new Date().toISOString()
  };
  oncall.set(id, rotation);
  return c.json(rotation);
});

app.get('/v1/incidents/oncall', (c) => {
  const rotations = Array.from(oncall.values()).map(r => ({
    ...r,
    currently_on_call: r.members[r.current_index]
  }));
  return c.json({ rotations, total: rotations.length });
});

app.post('/v1/incidents/oncall/:team/rotate', (c) => {
  const team = c.req.param('team');
  const rotation = Array.from(oncall.values()).find(r => r.team === team);
  if (!rotation) return c.json({ error: 'not found' }, 404);
  
  rotation.current_index = (rotation.current_index + 1) % rotation.members.length;
  return c.json(rotation);
});

app.get('/v1/incidents/:id', (c) => {
  const id = c.req.param('id');
  const incident = incidents.get(id);
  if (!incident) return c.json({ error: 'not found' }, 404);
  return c.json(incident);
});

app.put('/v1/incidents/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const incident = incidents.get(id);
  if (!incident) return c.json({ error: 'not found' }, 404);
  
  const now = new Date();
  incident.status = body.status;
  incident.updated_at = now.toISOString();
  incident.timeline.push({
    message: body.message,
    author: body.author,
    status_change: body.status,
    timestamp: now.toISOString()
  });
  
  if (body.status === 'resolved' && incident.created_at) {
    incident.resolved_at = now.toISOString();
    const created = new Date(incident.created_at);
    incident.duration_minutes = Math.round((now.getTime() - created.getTime()) / 60000);
  }
  
  return c.json(incident);
});

app.post('/v1/incidents/:id/timeline', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const incident = incidents.get(id);
  if (!incident) return c.json({ error: 'not found' }, 404);
  
  incident.timeline.push({
    message: body.message,
    author: body.author,
    timestamp: new Date().toISOString()
  });
  
  return c.json(incident.timeline);
});

app.post('/v1/incidents/:id/postmortem', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const incident = incidents.get(id);
  if (!incident) return c.json({ error: 'not found' }, 404);
  
  const pm: Postmortem = {
    incident_id: id,
    root_cause: body.root_cause,
    impact_summary: body.impact_summary,
    action_items: body.action_items,
    lessons_learned: body.lessons_learned,
    created_at: new Date().toISOString()
  };
  
  postmortems.set(id, pm);
  incident.status = 'postmortem';
  
  return c.json(pm);
});

app.get('/v1/incidents/:id/postmortem', (c) => {
  const id = c.req.param('id');
  const pm = postmortems.get(id);
  if (!pm) return c.json({ error: 'not found' }, 404);
  return c.json(pm);
});

export default app;
