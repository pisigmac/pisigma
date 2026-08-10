import { Hono } from 'hono';
import { PipelineJob, TransformRequest } from './types';

const app = new Hono<{ Bindings: { API_KEY: string } }>();
const jobs = new Map<string, PipelineJob>();

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'datapipeline' });
});

app.post('/v1/pipeline/jobs', async (c) => {
  const body = await c.req.json<{ name: string; source_format: 'csv' | 'json' | 'xml'; target_format: 'csv' | 'json' }>();
  const job: PipelineJob = {
    id: crypto.randomUUID(),
    name: body.name,
    source_format: body.source_format,
    target_format: body.target_format,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  jobs.set(job.id, job);
  return c.json(job);
});

app.post('/v1/pipeline/jobs/:id/run', (c) => {
  const id = c.req.param('id');
  const job = jobs.get(id);
  if (!job) return c.json({ error: 'not found' }, 404);

  job.status = 'completed';
  job.records_processed = Math.floor(Math.random() * (10000 - 100 + 1)) + 100;
  jobs.set(id, job);
  return c.json(job);
});

app.get('/v1/pipeline/jobs/:id/status', (c) => {
  const id = c.req.param('id');
  const job = jobs.get(id);
  if (!job) return c.json({ error: 'not found' }, 404);
  return c.json(job);
});

app.post('/v1/pipeline/transform', async (c) => {
  const body = await c.req.json<TransformRequest>();
  let transformed = JSON.parse(JSON.stringify(body.data)); // Deep copy

  if (body.operations.includes('filter_nulls')) {
    transformed = transformed.map((item: any) => {
      const newItem = { ...item };
      for (const key in newItem) {
        if (newItem[key] === null || newItem[key] === undefined) {
          delete newItem[key];
        }
      }
      return newItem;
    });
  }
  
  if (body.operations.includes('uppercase')) {
    transformed = transformed.map((item: any) => {
      const newItem = { ...item };
      for (const key in newItem) {
        if (typeof newItem[key] === 'string') {
          newItem[key] = newItem[key].toUpperCase();
        }
      }
      return newItem;
    });
  }
  
  if (body.operations.includes('flatten')) {
    transformed = transformed.map((item: any) => {
      const flatten = (obj: any, prefix = '') => {
        return Object.keys(obj).reduce((acc: any, k) => {
          const pre = prefix.length ? prefix + '_' : '';
          if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flatten(obj[k], pre + k));
          } else {
            acc[pre + k] = obj[k];
          }
          return acc;
        }, {});
      };
      return flatten(item);
    });
  }

  return c.json({
    transformed,
    operations_applied: body.operations
  });
});

export default app;
