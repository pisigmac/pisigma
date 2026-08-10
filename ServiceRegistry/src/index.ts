import { Hono } from 'hono';
import { ServiceInstance, ServiceDependency, TopologyResponse } from './types';

const app = new Hono<{ Bindings: { API_KEY?: string } }>();

const registry = new Map<string, ServiceInstance>();
const dependencies = new Map<string, ServiceDependency[]>();

async function checkHealth(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    // @ts-ignore
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch (e) {
    return false;
  }
}

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'serviceregistry', registered_count: registry.size });
});

app.post('/v1/services/register', async (c) => {
  const payload = await c.req.json<ServiceInstance>();
  const id = payload.id || 'srv_' + Math.random().toString(36).substring(2, 9);
  
  const instance: ServiceInstance = {
    ...payload,
    id,
    registered_at: payload.registered_at || new Date().toISOString(),
    status: payload.status || 'unknown'
  };
  
  registry.set(instance.name, instance);
  return c.json(instance);
});

app.get('/v1/services', async (c) => {
  const services = Array.from(registry.values());
  
  for (const srv of services) {
    if (srv.health_url) {
      const isHealthy = await checkHealth(srv.health_url);
      srv.status = isHealthy ? 'healthy' : 'unhealthy';
      srv.last_checked = new Date().toISOString();
      registry.set(srv.name, srv);
    }
  }

  return c.json({ services, total: services.length });
});

// Important: place topology route before /:name to avoid conflict
app.get('/v1/services/topology', (c) => {
  const services = Array.from(registry.values());
  const allDeps: ServiceDependency[] = [];
  
  for (const deps of dependencies.values()) {
    allDeps.push(...deps);
  }

  const response: TopologyResponse = {
    services,
    dependencies: allDeps,
    edges: allDeps.length
  };

  return c.json(response);
});

app.get('/v1/services/:name', async (c) => {
  const name = c.req.param('name');
  const srv = registry.get(name);
  if (!srv) {
    return c.json({ error: 'Service not found' }, 404);
  }

  if (srv.health_url) {
    const isHealthy = await checkHealth(srv.health_url);
    srv.status = isHealthy ? 'healthy' : 'unhealthy';
    srv.last_checked = new Date().toISOString();
    registry.set(name, srv);
  }

  return c.json(srv);
});

app.delete('/v1/services/:name', (c) => {
  const name = c.req.param('name');
  const deleted = registry.delete(name);
  // Also clean up dependencies
  dependencies.delete(name);
  for (const [key, deps] of dependencies.entries()) {
    dependencies.set(key, deps.filter(d => d.to !== name));
  }
  
  return c.json({ deleted, name });
});

app.post('/v1/services/dependencies', async (c) => {
  const dep = await c.req.json<ServiceDependency>();
  
  const list = dependencies.get(dep.from) || [];
  list.push(dep);
  dependencies.set(dep.from, list);
  
  return c.json(dep);
});

export default app;
