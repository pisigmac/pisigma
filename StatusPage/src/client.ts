import { MonitoredService, MaintenanceWindow, StatusSummary } from './types';

export class PisigmaStatusPage {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8846') {
    this.baseUrl = baseUrl;
  }

  async registerService(data: any): Promise<MonitoredService> {
    const res = await fetch(`${this.baseUrl}/v1/status/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json() as Promise<MonitoredService>;
  }

  async listServices(): Promise<{ services: MonitoredService[], total: number }> {
    const res = await fetch(`${this.baseUrl}/v1/status/services`);
    return res.json() as Promise<any>;
  }

  async removeService(name: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/v1/status/services/${name}`, { method: 'DELETE' });
    return res.json();
  }

  async checkService(name: string): Promise<MonitoredService> {
    const res = await fetch(`${this.baseUrl}/v1/status/services/${name}/check`, { method: 'POST' });
    return res.json() as Promise<MonitoredService>;
  }

  async updateServiceStatus(name: string, status: string): Promise<MonitoredService> {
    const res = await fetch(`${this.baseUrl}/v1/status/services/${name}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json() as Promise<MonitoredService>;
  }

  async getCurrentStatus(): Promise<StatusSummary> {
    const res = await fetch(`${this.baseUrl}/v1/status/current`);
    return res.json() as Promise<StatusSummary>;
  }

  async getUptime(service?: string, days?: number): Promise<any> {
    const url = new URL(`${this.baseUrl}/v1/status/uptime`);
    if (service) url.searchParams.set('service', service);
    if (days) url.searchParams.set('days', days.toString());
    const res = await fetch(url.toString());
    return res.json();
  }

  async createMaintenance(data: any): Promise<MaintenanceWindow> {
    const res = await fetch(`${this.baseUrl}/v1/status/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json() as Promise<MaintenanceWindow>;
  }

  async listMaintenance(status?: string): Promise<MaintenanceWindow[]> {
    const url = new URL(`${this.baseUrl}/v1/status/maintenance`);
    if (status) url.searchParams.set('status', status);
    const res = await fetch(url.toString());
    return res.json() as Promise<MaintenanceWindow[]>;
  }

  async updateMaintenance(id: string, data: any): Promise<MaintenanceWindow> {
    const res = await fetch(`${this.baseUrl}/v1/status/maintenance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json() as Promise<MaintenanceWindow>;
  }
}
