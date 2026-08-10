import { Hono } from 'hono';
import { RegisteredModel, ModelVersion, ComparisonResult, ModelMetrics } from './types';

const app = new Hono();
const models = new Map<string, RegisteredModel>();

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'modelregistry', models_count: models.size });
});

app.post('/v1/models/register', async (c) => {
  const body = await c.req.json();
  const { name, description, owner, tags, framework, metrics, parameters, artifact_url, notes } = body;
  
  const existing = models.get(name);
  const now = new Date().toISOString();
  
  if (existing) {
    const newVersion: ModelVersion = {
      version: existing.versions.length + 1,
      framework,
      metrics,
      parameters,
      artifact_url,
      status: 'draft',
      created_at: now,
      notes
    };
    existing.versions.push(newVersion);
    existing.updated_at = now;
    if (description) existing.description = description;
    if (owner) existing.owner = owner;
    if (tags) existing.tags = tags;
    return c.json(existing);
  } else {
    const newModel: RegisteredModel = {
      id: crypto.randomUUID(),
      name,
      description,
      owner,
      tags,
      versions: [{
        version: 1,
        framework,
        metrics,
        parameters,
        artifact_url,
        status: 'draft',
        created_at: now,
        notes
      }],
      created_at: now,
      updated_at: now
    };
    models.set(name, newModel);
    return c.json(newModel);
  }
});

app.get('/v1/models', (c) => {
  const result = Array.from(models.values()).map(m => {
    const prodVersion = m.versions.find(v => v.status === 'production') || null;
    return {
      name: m.name,
      description: m.description,
      current_production_version: prodVersion ? prodVersion.version : null,
      total_versions: m.versions.length
    };
  });
  return c.json({ models: result, total: result.length });
});

app.post('/v1/models/compare', async (c) => {
  const { model_name, version_a, version_b } = await c.req.json();
  const model = models.get(model_name);
  if (!model) return c.json({ error: 'Model not found' }, 404);
  
  const va = model.versions.find(v => v.version === version_a);
  const vb = model.versions.find(v => v.version === version_b);
  if (!va || !vb) return c.json({ error: 'Version not found' }, 404);
  
  const metrics_diff: Record<string, { a: number, b: number, delta: number, improved: boolean }> = {};
  
  const allKeys = new Set([...Object.keys(va.metrics || {}), ...Object.keys(vb.metrics || {})]);
  allKeys.delete('custom');
  
  const isBetter = (key: string, delta: number) => {
    if (['loss', 'latency_ms'].includes(key)) return delta < 0;
    return delta > 0;
  };
  
  for (const key of Array.from(allKeys)) {
    const valA = (va.metrics as any)[key] as number | undefined;
    const valB = (vb.metrics as any)[key] as number | undefined;
    if (valA !== undefined && valB !== undefined) {
      const delta = valB - valA;
      metrics_diff[key] = {
        a: valA,
        b: valB,
        delta,
        improved: isBetter(key, delta)
      };
    }
  }
  
  return c.json({
    model_name,
    version_a,
    version_b,
    metrics_diff
  } as ComparisonResult);
});

app.get('/v1/models/:name/versions', (c) => {
  const model = models.get(c.req.param('name'));
  if (!model) return c.json({ error: 'Model not found' }, 404);
  return c.json(model.versions);
});

app.get('/v1/models/:name/active', (c) => {
  const model = models.get(c.req.param('name'));
  if (!model) return c.json({ error: 'Model not found' }, 404);
  const active = model.versions.find(v => v.status === 'production') || model.versions[model.versions.length - 1];
  return c.json(active);
});

app.post('/v1/models/:name/promote', async (c) => {
  const { version, target } = await c.req.json();
  const model = models.get(c.req.param('name'));
  if (!model) return c.json({ error: 'Model not found' }, 404);
  
  const targetVersion = model.versions.find(v => v.version === version);
  if (!targetVersion) return c.json({ error: 'Version not found' }, 404);
  
  if (target === 'production') {
    model.versions.forEach(v => {
      if (v.status === 'production' && v.version !== version) {
        v.status = 'archived';
      }
    });
  }
  
  targetVersion.status = target;
  targetVersion.promoted_at = new Date().toISOString();
  
  return c.json(targetVersion);
});

export default app;
