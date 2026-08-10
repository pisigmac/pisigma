import { Channel, ChatMessage } from './types';

export class PisigmaChat {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async createChannel(name: string, members: string[]): Promise<Channel> {
    const res = await fetch(`${this.baseUrl}/v1/chat/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, members })
    });
    return res.json();
  }

  async sendMessage(channel_id: string, sender_id: string, content: string): Promise<ChatMessage> {
    const res = await fetch(`${this.baseUrl}/v1/chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id, sender_id, content })
    });
    return res.json();
  }

  async getMessages(channel_id: string): Promise<ChatMessage[]> {
    const res = await fetch(`${this.baseUrl}/v1/chat/channels/${channel_id}/messages`);
    return res.json();
  }

  async markRead(message_id: string, user_id: string): Promise<{ marked: boolean }> {
    const res = await fetch(`${this.baseUrl}/v1/chat/messages/${message_id}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    });
    return res.json();
  }
}
