import { MockDefinition, MockMatch, RecordingSession } from './types';

export class PisigmaMockServer {
  constructor(private baseUrl: string) {}

  async defineMock(mock: MockDefinition): Promise<{ id: string; created_at: string }> {
    const res = await fetch(`${this.baseUrl}/v1/mocks/define`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mock),
    });
    return res.json();
  }

  async listMocks(): Promise<{ mocks: MockDefinition[]; total: number }> {
    const res = await fetch(`${this.baseUrl}/v1/mocks`);
    return res.json();
  }

  async deleteMock(id: string): Promise<{ deleted: boolean; id: string }> {
    const res = await fetch(`${this.baseUrl}/v1/mocks/${id}`, { method: 'DELETE' });
    return res.json();
  }

  async startRecording(targetUrl: string): Promise<RecordingSession> {
    const res = await fetch(`${this.baseUrl}/v1/mocks/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_url: targetUrl }),
    });
    return res.json();
  }

  async getSession(sessionId: string): Promise<RecordingSession> {
    const res = await fetch(`${this.baseUrl}/v1/mocks/sessions/${sessionId}`);
    return res.json();
  }

  async getMatchLog(): Promise<{ matches: MockMatch[]; total: number }> {
    const res = await fetch(`${this.baseUrl}/v1/mocks/log`);
    return res.json();
  }
}
