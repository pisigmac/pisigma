import { expect, test, describe } from 'vitest';
import app from '../src/index';

describe('Chat API', () => {
  test('GET /health', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data).toEqual({ status: 'ok', service: 'chat' });
  });

  test('create channel, send message, get messages, mark read', async () => {
    // Create channel
    const createChanRes = await app.request('/v1/chat/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'General', members: ['user1', 'user2'] })
    });
    const channel = await createChanRes.json() as any;
    expect(channel.name).toBe('General');
    expect(channel.members).toEqual(['user1', 'user2']);

    // Send message
    const sendMsgRes = await app.request('/v1/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channel.id, sender_id: 'user1', content: 'Hello!' })
    });
    const msg = await sendMsgRes.json() as any;
    expect(msg.content).toBe('Hello!');
    expect(msg.channel_id).toBe(channel.id);

    // Get messages
    const getMsgsRes = await app.request(`/v1/chat/channels/${channel.id}/messages`);
    const msgs = await getMsgsRes.json() as any;
    expect(msgs.length).toBe(1);
    expect(msgs[0].id).toBe(msg.id);

    // Mark read
    const markReadRes = await app.request(`/v1/chat/messages/${msg.id}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user2' })
    });
    const markRes = await markReadRes.json() as any;
    expect(markRes.marked).toBe(true);
  });
});
