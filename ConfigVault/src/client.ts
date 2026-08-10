import { ConfigEntry, ConfigSnapshot } from './types'

export class PisigmaConfigVault {
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

  async get(namespace: string, key: string): Promise<ConfigEntry | null> {
    const res = await this.fetch(`/v1/config/${namespace}/${key}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to get config')
    return (await res.json()) as ConfigEntry
  }

  async set(namespace: string, key: string, value: string): Promise<ConfigEntry> {
    const res = await this.fetch(`/v1/config/${namespace}/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    })
    if (!res.ok) throw new Error('Failed to set config')
    return (await res.json()) as ConfigEntry
  }

  async rotate(namespace: string, key: string, new_value: string): Promise<{ rotated: boolean, version: number }> {
    const res = await this.fetch('/v1/config/rotate', {
      method: 'POST',
      body: JSON.stringify({ namespace, key, new_value })
    })
    if (!res.ok) throw new Error('Failed to rotate config')
    return (await res.json()) as { rotated: boolean, version: number }
  }

  async snapshot(namespace: string): Promise<ConfigSnapshot> {
    const res = await this.fetch(`/v1/config/${namespace}/snapshot`)
    if (!res.ok) throw new Error('Failed to get snapshot')
    return (await res.json()) as ConfigSnapshot
  }
}
