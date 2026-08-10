import { Hono } from 'hono';
import { Comment } from './types';

const app = new Hono<{ Bindings: { API_KEY: string } }>();

let comments: Comment[] = [];

app.get('/health', (c) => c.json({ status: 'ok', service: 'comments' }));

app.post('/v1/comments', async (c) => {
  const body = await c.req.json();
  const comment: Comment = {
    id: Math.random().toString(36).substring(2, 9),
    resource_id: body.resource_id,
    author_id: body.author_id,
    content: body.content,
    parent_id: body.parent_id,
    reactions: {},
    status: 'active',
    created_at: new Date().toISOString()
  };
  comments.push(comment);
  return c.json(comment, 201);
});

app.get('/v1/comments/:resourceId', (c) => {
  const resourceId = c.req.param('resourceId');
  const thread = comments.filter(comment => comment.resource_id === resourceId);
  return c.json(thread);
});

app.post('/v1/comments/:id/react', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const comment = comments.find(comment => comment.id === id);
  if (!comment) {
    return c.json({ error: 'Comment not found' }, 404);
  }
  if (!comment.reactions) {
    comment.reactions = {};
  }
  comment.reactions[body.emoji] = (comment.reactions[body.emoji] || 0) + 1;
  return c.json(comment);
});

app.post('/v1/comments/:id/moderate', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const comment = comments.find(comment => comment.id === id);
  if (!comment) {
    return c.json({ error: 'Comment not found' }, 404);
  }
  comment.status = body.action === 'flag' ? 'flagged' : body.action === 'delete' ? 'deleted' : 'active';
  return c.json(comment);
});

export default app;
