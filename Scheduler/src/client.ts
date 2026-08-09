/**
 * Tiny typed client for PiSigma Scheduler Service.
 * Usage:
 *   const scheduler = new PisigmaScheduler({ baseUrl })
 *   const res = await scheduler.schedule({ name: 'cleanup', target_url: 'http://localhost/cleanup' })
 *   const job = await scheduler.getJob(res.data.job.id)
 */
export type SchedulerClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type JobInput = {
  name: string
  target_url: string
  cron_expression?: string
  payload?: Record<string, unknown>
  delay_seconds?: number
}

export type JobStatus = 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled'

export type Job = {
  id: string
  name: string
  target_url: string
  cron_expression?: string
  payload?: Record<string, unknown>
  status: JobStatus
  scheduled_at: string
  execute_at?: string
  created_at: string
  updated_at: string
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaScheduler {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: SchedulerClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetch || fetch
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`
    return h
  }

  async checkHealth(): Promise<ClientResult<{ status: string; service: string; environment: string; active_jobs: number }>> {
    const res = await this.fetchFn(`${this.baseUrl}/health`)
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        status: String(json.status),
        service: String(json.service),
        environment: String(json.environment || ''),
        active_jobs: Number(json.active_jobs || 0),
      },
    }
  }

  async schedule(input: JobInput): Promise<ClientResult<{ success: boolean; job: Job }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/jobs/schedule`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        success: Boolean(json.success),
        job: json.job as Job,
      },
    }
  }

  async getJob(id: string): Promise<ClientResult<{ job: Job }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/jobs/${id}`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        job: json.job as Job,
      },
    }
  }
}
