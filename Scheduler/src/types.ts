export interface Env {
  SCHEDULER_ENV?: string
  SCHEDULER_MAX_CONCURRENT_JOBS?: string
  SCHEDULER_API_KEY?: string
}

export type JobStatus = 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface JobInput {
  name: string
  target_url: string
  cron_expression?: string
  payload?: Record<string, unknown>
  delay_seconds?: number
}

export interface Job {
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

export interface ScheduleJobResponse {
  success: boolean
  job: Job
}
