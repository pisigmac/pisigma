import { expect, test, describe } from 'vitest';
import app from '../src/index';

describe('Comments Service', () => {
  test('health check', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body).toEqual({ status: 'ok', service: 'comments' });
  });

  let commentId = '';
  
  test('post comment', async () => {
    const res = await app.request('/v1/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_id: 'post_1', author_id: 'user_1', content: 'hello' })
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.content).toBe('hello');
    commentId = body.id;
  });

  test('reply to comment', async () => {
    const res = await app.request('/v1/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_id: 'post_1', author_id: 'user_2', content: 'world', parent_id: commentId })
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.parent_id).toBe(commentId);
  });

  test('get thread', async () => {
    const res = await app.request('/v1/comments/post_1');
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.length).toBe(2);
  });

  test('react adds emoji count', async () => {
    const res = await app.request(`/v1/comments/${commentId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji: 'thumbs_up' })
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.reactions.thumbs_up).toBe(1);
  });

  test('moderate flags comment', async () => {
    const res = await app.request(`/v1/comments/${commentId}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'flag' })
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe('flagged');
  });
});
