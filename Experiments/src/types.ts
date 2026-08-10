export interface Env {
  EXPERIMENTS_ENV?: string
}

export interface Experiment {
  id: string
  name: string
  description?: string
  variants: string[]
  active: boolean
  created_at: string
}

export interface GetVariantRequest {
  experiment_id: string
  user_id: string
  attributes?: Record<string, any>
}

export interface GetVariantResponse {
  experiment_id: string
  user_id: string
  variant: string
  assigned_at: string
}

export interface TrackEventRequest {
  experiment_id: string
  user_id: string
  event_name: string
  value?: number
  metadata?: Record<string, any>
}

export interface TrackEventResponse {
  success: boolean
  event_id: string
  experiment_id: string
  user_id: string
  event_name: string
  timestamp: string
}

export interface CreateExperimentRequest {
  id: string
  name: string
  description?: string
  variants: string[]
}

export interface TrackedEvent {
  event_id: string
  experiment_id: string
  user_id: string
  event_name: string
  value?: number
  metadata?: Record<string, any>
  timestamp: string
}
