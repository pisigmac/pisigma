import { Hono } from 'hono';
import { QueueMessage, QueueSubscriber, QueueStats } from './types';

const app = new Hono<{ Bindings: { API_KEY?: string } }>();

const queues = new Map<string, QueueMessage[]>();
const dlq = new Map<string, QueueMessage[]>();
const subscribers = new Map<string, QueueSubscriber[]>();
const statsMap = new Map<string, QueueStats>();

const getStats = (queue: string) => {
  if (!statsMap.has(queue)) {
    statsMap.set(queue, { depth: 0, processed: 0, failed: 0, dlq_count: 0 });
  }
  return statsMap.get(queue)!;
};

app.get('/health', (c) => c.json({ status: 'ok', service: 'queuebroker' }));

app.post('/v1/queue/publish', async (c) => {
  const body = await c.req.json<{ queue: string; payload: any; delay_seconds?: number }>();
  const id = Math.random().toString(36).substring(7);
  
  const message: QueueMessage = {
    id,
    queue: body.queue,
    payload: body.payload,
    created_at: Date.now(),
    status: 'queued',
    retries: 0
  };
  
  if (!queues.has(body.queue)) {
    queues.set(body.queue, []);
  }
  queues.get(body.queue)!.push(message);
  
  const stats = getStats(body.queue);
  stats.depth++;
  
  return c.json({ id, queue: body.queue, status: 'queued' });
});

app.post('/v1/queue/subscribe', async (c) => {
  const body = await c.req.json<QueueSubscriber>();
  
  if (!subscribers.has(body.queue)) {
    subscribers.set(body.queue, []);
  }
  subscribers.get(body.queue)!.push(body);
  
  return c.json({ queue: body.queue, webhook_url: body.webhook_url, subscribed: true });
});

app.get('/v1/queue/:name/stats', (c) => {
  const name = c.req.param('name');
  const stats = getStats(name);
  return c.json(stats);
});

app.post('/v1/queue/:name/retry', (c) => {
  const name = c.req.param('name');
  
  const deadLetters = dlq.get(name) || [];
  const activeQueue = queues.get(name) || [];
  
  for (const msg of deadLetters) {
    msg.status = 'queued';
    activeQueue.push(msg);
  }
  
  dlq.set(name, []);
  if (!queues.has(name)) queues.set(name, activeQueue);
  
  const stats = getStats(name);
  stats.dlq_count = 0;
  stats.depth += deadLetters.length;
  
  return c.json({ retried: deadLetters.length });
});

export default app;