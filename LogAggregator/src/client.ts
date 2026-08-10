import { LogEntry, LogQuery, LogStats } from './types'

export class PisigmaLogAggregator {
  constructor(private baseUrl: string, private apiKey?: string) {}

  private async fetch(path: string, options?: RequestInit) {
    const headers = new Headers(options?.headers)
    if (this.apiKey) headers.set('Authorization', `Bearer ${this.apiKey}`)
    headers.set('Content-Type', 'application/json')
    
    return fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers
    })
  }

  async ingest(service: string, level: 'info'|'warn'|'error'|'debug', message: string, metadata?: any): Promise<{ id: string, ingested: boolean }> {
    const res = await this.fetch('/v1/logs/ingest', {
      method: 'POST',
      body: JSON.stringify({ service, level, message, metadata })
    })
    if (!res.ok) throw new Error('Failed to ingest log')
    return (await res.json()) as { id: string, ingested: boolean }
  }

  async search(query: LogQuery): Promise<LogEntry[]> {
    const res = await this.fetch('/v1/logs/search', {
      method: 'POST',
      body: JSON.stringify(query)
    })
    if (!res.ok) throw new Error('Failed to search logs')
    return (await res.json()) as LogEntry[]
  }

  async stats(): Promise<LogStats> {
    const res = await this.fetch('/v1/logs/stats')
    if (!res.ok) throw new Error('Failed to get stats')
    return (await res.json()) as LogStats
  }

  async setRetention(max_age_hours: number): Promise<{ pruned: number }> {
    const res = await this.fetch('/v1/logs/retention', {
      method: 'POST',
      body: JSON.stringify({ max_age_hours })
    })
    if (!res.ok) throw new Error('Failed to set retention')
    return (await res.json()) as { pruned: number }
  }
}
