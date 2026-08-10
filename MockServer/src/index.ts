import { Hono } from 'hono';
import { MockDefinition, MockMatch, RecordingSession } from './types';

const app = new Hono<{ Bindings: {} }>();

const mocks = new Map<string, MockDefinition>();
const matchLog: MockMatch[] = [];
const sessions = new Map<string, RecordingSession>();

function matchPath(pattern: string, path: string): boolean {
  if (!pattern.includes('*')) return pattern === path;
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(path);
}

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'mockserver', active_mocks: mocks.size });
});

app.post('/v1/mocks/define', async (c) => {
  const body = await c.req.json<MockDefinition>();
  const id = body.id || crypto.randomUUID();
  const mock: MockDefinition = {
    ...body,
    id,
    created_at: new Date().toISOString(),
  };
  mocks.set(id, mock);
  return c.json({ id, created_at: mock.created_at });
});

app.get('/v1/mocks', (c) => {
  return c.json({ mocks: Array.from(mocks.values()), total: mocks.size });
});

app.delete('/v1/mocks/:id', (c) => {
  const id = c.req.param('id');
  if (!mocks.has(id)) return c.json({ error: 'not_found' }, 404);
  mocks.delete(id);
  return c.json({ deleted: true, id });
});

app.post('/v1/mocks/record', async (c) => {
  const { target_url } = await c.req.json<{ target_url: string }>();
  const id = crypto.randomUUID();
  const session: RecordingSession = {
    id,
    target_url,
    started_at: new Date().toISOString(),
    requests: [],
    status: 'recording',
  };
  sessions.set(id, session);
  return c.json(session);
});

app.get('/v1/mocks/sessions/:sessionId', (c) => {
  const sessionId = c.req.param('sessionId');
  const session = sessions.get(sessionId);
  if (!session) return c.json({ error: 'not_found' }, 404);
  return c.json(session);
});

app.get('/v1/mocks/log', (c) => {
  return c.json({ matches: matchLog.slice(-100), total: matchLog.length });
});

app.all('/proxy/*', async (c) => {
  const path = c.req.path.replace(/^\/proxy/, '') || '/';
  const method = c.req.method;

  let matchedMock: MockDefinition | null = null;
  for (const mock of mocks.values()) {
    if (mock.method === method && matchPath(mock.path, path)) {
      matchedMock = mock;
      break;
    }
  }

  if (!matchedMock) {
    return c.json({ error: 'no_mock_matched', method, path }, 404);
  }

  if (matchedMock.times !== undefined) {
    matchedMock.times--;
    if (matchedMock.times <= 0) {
      mocks.delete(matchedMock.id!);
    }
  }

  const match: MockMatch = {
    mock_id: matchedMock.id!,
    request_method: method,
    request_path: path,
    response_status: matchedMock.response_status || 200,
    response_body: matchedMock.response_body,
    matched_at: new Date().toISOString(),
    latency_ms: matchedMock.latency_ms || 0,
  };

  matchLog.push(match);

  for (const session of sessions.values()) {
    if (session.status === 'recording') {
      session.requests.push(match);
    }
  }

  const status = (matchedMock.response_status || 200) as any;
  const headers = matchedMock.response_headers || {};
  return c.json(matchedMock.response_body, status, headers);
});

export default app;
