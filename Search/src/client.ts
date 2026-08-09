/**
 * Tiny typed client for PiSigma Search Service.
 * Usage:
 *   const search = new PisigmaSearch({ baseUrl })
 *   await search.index([{ id: 'doc_1', title: 'Hello', content: 'World' }])
 *   const res = await search.search({ query: 'Hello' })
 */
export type SearchClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type DocumentInput = {
  id: string
  title: string
  content: string
  metadata?: Record<string, unknown>
  tags?: string[]
}

export type IndexDocumentsInput = {
  index_name?: string
  documents: DocumentInput[]
}

export type SearchQueryInput = {
  index_name?: string
  query: string
  limit?: number
  filters?: Record<string, unknown>
}

export type SearchResultItem = {
  id: string
  title: string
  content: string
  score: number
  metadata?: Record<string, unknown>
  tags?: string[]
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaSearch {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: SearchClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetch || fetch
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`
    return h
  }

  async checkHealth(): Promise<ClientResult<{ status: string; service: string; index_name: string; indexed_documents: number }>> {
    const res = await this.fetchFn(`${this.baseUrl}/health`)
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        status: String(json.status),
        service: String(json.service),
        index_name: String(json.index_name || ''),
        indexed_documents: Number(json.indexed_documents || 0),
      },
    }
  }

  async index(documents: DocumentInput[] | IndexDocumentsInput): Promise<ClientResult<{ success: boolean; indexed: number; total: number }>> {
    const body = Array.isArray(documents) ? { documents } : documents
    const res = await this.fetchFn(`${this.baseUrl}/v1/index`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        success: Boolean(json.success),
        indexed: Number(json.indexed),
        total: Number(json.total),
      },
    }
  }

  async search(input: SearchQueryInput): Promise<ClientResult<{ query: string; total: number; results: SearchResultItem[] }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/search`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        query: String(json.query),
        total: Number(json.total),
        results: (json.results as SearchResultItem[]) || [],
      },
    }
  }
}
