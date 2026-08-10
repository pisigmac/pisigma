export interface Env {
  PROMPT_MANAGEMENT_ENV?: string
}

export interface PromptTemplate {
  id: string
  name: string
  template: string
  version: number
  variables: string[]
  created_at: string
  updated_at?: string
}

export interface PromptRenderRequest {
  template_id?: string
  name?: string
  template?: string
  variables?: Record<string, unknown>
  version?: number
}

export interface PromptRenderResult {
  rendered_prompt: string
  template_id?: string
  name?: string
  version?: number
  missing_variables?: string[]
}

export interface PromptVersionRequest {
  name: string
  template: string
  version?: number
  variables?: string[]
}

export interface PromptVersionResult {
  success: boolean
  prompt: PromptTemplate
  message?: string
}
