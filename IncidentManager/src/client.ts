import { Incident, Postmortem, OnCallRotation, IncidentStatus, IncidentSeverity } from './types';

export class PisigmaIncidentManager {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8845') {
    this.baseUrl = baseUrl;
  }

  async createIncident(data: any): Promise<Incident> {
    const res = await fetch(`${this.baseUrl}/v1/incidents/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json() as Promise<Incident>;
  }

  async updateStatus(id: string, status: IncidentStatus, message: string, author: string): Promise<Incident> {
    const res = await fetch(`${this.baseUrl}/v1/incidents/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, message, author })
    });
    return res.json() as Promise<Incident>;
  }

  async addTimelineEntry(id: string, message: string, author: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/v1/incidents/${id}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, author })
    });
    return res.json();
  }

  async getActiveIncidents(): Promise<{ incidents: Incident[], total: number }> {
    const res = await fetch(`${this.baseUrl}/v1/incidents/active`);
    return res.json() as Promise<any>;
  }

  async getAllIncidents(severity?: string, status?: string): Promise<{ incidents: Incident[], total: number }> {
    const url = new URL(`${this.baseUrl}/v1/incidents/all`);
    if (severity) url.searchParams.set('severity', severity);
    if (status) url.searchParams.set('status', status);
    const res = await fetch(url.toString());
    return res.json() as Promise<any>;
  }

  async getIncident(id: string): Promise<Incident> {
    const res = await fetch(`${this.baseUrl}/v1/incidents/${id}`);
    return res.json() as Promise<Incident>;
  }

  async createPostmortem(id: string, data: any): Promise<Postmortem> {
    const res = await fetch(`${this.baseUrl}/v1/incidents/${id}/postmortem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json() as Promise<Postmortem>;
  }

  async getPostmortem(id: string): Promise<Postmortem> {
    const res = await fetch(`${this.baseUrl}/v1/incidents/${id}/postmortem`);
    return res.json() as Promise<Postmortem>;
  }

  async createOnCall(data: any): Promise<OnCallRotation> {
    const res = await fetch(`${this.baseUrl}/v1/incidents/oncall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json() as Promise<OnCallRotation>;
  }

  async listOnCall(): Promise<{ rotations: any[], total: number }> {
    const res = await fetch(`${this.baseUrl}/v1/incidents/oncall`);
    return res.json() as Promise<any>;
  }

  async rotate(team: string): Promise<OnCallRotation> {
    const res = await fetch(`${this.baseUrl}/v1/incidents/oncall/${team}/rotate`, { method: 'POST' });
    return res.json() as Promise<OnCallRotation>;
  }
}
