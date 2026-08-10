export class PisigmaComments {
  constructor(private baseUrl: string, private apiKey: string) {}

  async post(data: { resource_id: string, author_id: string, content: string, parent_id?: string }) {
    const res = await fetch(`${this.baseUrl}/v1/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async getThread(resourceId: string) {
    const res = await fetch(`${this.baseUrl}/v1/comments/${resourceId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return res.json();
  }

  async react(id: string, emoji: string) {
    const res = await fetch(`${this.baseUrl}/v1/comments/${id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({ emoji })
    });
    return res.json();
  }

  async moderate(id: string, action: 'approve' | 'flag' | 'delete') {
    const res = await fetch(`${this.baseUrl}/v1/comments/${id}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({ action })
    });
    return res.json();
  }
}
