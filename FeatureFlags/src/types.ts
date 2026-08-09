export interface Env {
  FEATURE_FLAGS_ENV?: string
}

export interface FeatureFlag {
  key: string
  description: string
  enabled: boolean
  percentage_rollout?: number
}

export interface EvaluateRequest {
  user_id?: string
  flags?: string[]
}
