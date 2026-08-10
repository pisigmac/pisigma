import { Hono } from 'hono';
import { Content, ContentVersion } from './types';

const app = new Hono<{ Bindings: any }>();

const contents = new Map<string, Content>();
const versions = new Map<string, ContentVersion[]>();

app.get('/health', (c) => c.json({ status: 'ok', service: 'cms' }));

app.post('/v1/cms/content', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const content: Content = {
    id,
    slug: body.slug,
    title: body.title,
    body: body.body,
    status: 'draft',
    version: 1,
    created_at: now,
    updated_at: now,
  };
  
  const version: ContentVersion = {
    content_id: id,
    version: 1,
    body: body.body,
    created_at: now,
  };
  
  contents.set(id, content);
  versions.set(id, [version]);
  
  return c.json(content);
});

app.get('/v1/cms/content/:slug', (c) => {
  const slug = c.req.param('slug');
  const content = Array.from(contents.values()).find(content => content.slug === slug);
  
  if (!content) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json(content);
});

app.put('/v1/cms/content/:id/publish', (c) => {
  const id = c.req.param('id');
  const content = contents.get(id);
  
  if (!content) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  content.status = 'published';
  content.updated_at = new Date().toISOString();
  
  return c.json(content);
});

app.get('/v1/cms/content/:id/versions', (c) => {
  const id = c.req.param('id');
  const history = versions.get(id) || [];
  return c.json(history);
});

export default app;
