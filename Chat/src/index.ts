import { Hono } from 'hono';
import { Channel, ChatMessage } from './types';

const app = new Hono<{ Bindings: { [key: string]: string } }>();

const channels = new Map<string, Channel>();
const messages: ChatMessage[] = [];

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'chat' });
});

app.post('/v1/chat/channels', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const channel: Channel = {
    id,
    name: body.name,
    members: body.members || [],
    created_at: new Date().toISOString()
  };
  channels.set(id, channel);
  return c.json(channel);
});

app.post('/v1/chat/messages', async (c) => {
  const body = await c.req.json();
  if (!channels.has(body.channel_id)) {
    return c.json({ error: 'Channel not found' }, 404);
  }
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    channel_id: body.channel_id,
    sender_id: body.sender_id,
    content: body.content,
    timestamp: new Date().toISOString(),
    read_by: []
  };
  messages.push(message);
  return c.json(message);
});

app.get('/v1/chat/channels/:id/messages', (c) => {
  const id = c.req.param('id');
  const channelMessages = messages.filter(m => m.channel_id === id);
  channelMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return c.json(channelMessages);
});

app.post('/v1/chat/messages/:id/read', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const message = messages.find(m => m.id === id);
  if (message) {
    if (!message.read_by) {
      message.read_by = [];
    }
    if (!message.read_by.includes(body.user_id)) {
      message.read_by.push(body.user_id);
    }
  }
  return c.json({ marked: true });
});

export default app;
