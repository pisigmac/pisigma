import { Hono } from 'hono';
import { WorkflowDefinition, WorkflowState, WorkflowInstance } from './types';

const app = new Hono<{ Bindings: { API_KEY: string } }>();

const definitions = new Map<string, WorkflowDefinition>();
const instances = new Map<string, WorkflowInstance>();

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'workflows' });
});

app.post('/v1/workflows/define', async (c) => {
  const body = await c.req.json<{ name: string; states: WorkflowState[] }>();
  if (!body.states || body.states.length < 2) {
    return c.json({ error: 'Workflow must have at least 2 states' }, 400);
  }

  const def: WorkflowDefinition = {
    id: crypto.randomUUID(),
    name: body.name,
    states: body.states,
    created_at: new Date().toISOString()
  };
  definitions.set(def.id, def);
  return c.json(def);
});

app.post('/v1/workflows/:id/trigger', (c) => {
  const id = c.req.param('id');
  const def = definitions.get(id);
  if (!def) return c.json({ error: 'not found' }, 404);

  const initialState = def.states[0];
  const instance: WorkflowInstance = {
    id: crypto.randomUUID(),
    workflow_id: def.id,
    current_state: initialState.name,
    history: [],
    status: initialState.requires_approval ? 'waiting_approval' : 'running'
  };
  if (instance.status === 'running' && initialState.transitions.length === 0) {
    instance.status = 'completed';
  }

  instances.set(instance.id, instance);
  return c.json(instance);
});

app.get('/v1/workflows/:id/status', (c) => {
  const id = c.req.param('id');
  const instance = instances.get(id);
  if (!instance) return c.json({ error: 'not found' }, 404);
  return c.json(instance);
});

app.post('/v1/workflows/:id/approve', async (c) => {
  const id = c.req.param('id');
  const instance = instances.get(id);
  if (!instance) return c.json({ error: 'not found' }, 404);

  const def = definitions.get(instance.workflow_id);
  if (!def) return c.json({ error: 'workflow definition not found' }, 404);

  const currentStateDef = def.states.find(s => s.name === instance.current_state);
  if (!currentStateDef) return c.json({ error: 'invalid state' }, 400);

  if (!currentStateDef.requires_approval) {
    return c.json({ error: 'current state does not require approval' }, 400);
  }

  if (currentStateDef.transitions.length > 0) {
    const nextStateName = currentStateDef.transitions[0];
    instance.history.push({
      from: instance.current_state,
      to: nextStateName,
      timestamp: new Date().toISOString()
    });
    instance.current_state = nextStateName;
    
    const nextStateDef = def.states.find(s => s.name === nextStateName);
    if (nextStateDef && nextStateDef.requires_approval) {
      instance.status = 'waiting_approval';
    } else if (!nextStateDef || nextStateDef.transitions.length === 0) {
      instance.status = 'completed';
    } else {
      instance.status = 'running';
    }
  } else {
    instance.status = 'completed';
  }

  instances.set(instance.id, instance);
  return c.json(instance);
});

export default app;
