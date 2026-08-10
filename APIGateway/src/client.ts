import { RouteEntry } from './types'

export class PisigmaAPIGateway {
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

  async registerRoute(route: RouteEntry): Promise<RouteEntry> {
    const res = await this.fetch('/v1/gateway/routes', {
      method: 'POST',
      body: JSON.stringify(route)
    })
    if (!res.ok) throw new Error('Failed to register route')
    return (await res.json()) as RouteEntry
  }

  async listRoutes(): Promise<RouteEntry[]> {
    const res = await this.fetch('/v1/gateway/routes')
    if (!res.ok) throw new Error('Failed to list routes')
    return (await res.json()) as RouteEntry[]
  }

  async deleteRoute(path: string): Promise<{ deleted: boolean }> {
    const encodedPath = encodeURIComponent(path)
    const res = await this.fetch(`/v1/gateway/routes/${encodedPath}`, {
      method: 'DELETE'
    })
    if (res.status === 404) return { deleted: false }
    if (!res.ok) throw new Error('Failed to delete route')
    return (await res.json()) as { deleted: boolean }
  }
}
