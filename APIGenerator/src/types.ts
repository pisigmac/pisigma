export interface Env {
  APIGENERATOR_ENV?: string
}

export interface ResourceProperty {
  type: string
  description?: string
  example?: unknown
}

export interface ResourceDefinition {
  name: string
  properties?: Record<string, ResourceProperty>
}

export interface GenerateSchemaRequest {
  title: string
  version?: string
  description?: string
  resources?: ResourceDefinition[]
}

export interface GeneratedSchema {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
  }
  paths: Record<string, unknown>
  components: {
    schemas: Record<string, unknown>
  }
  generated_at: string
}

export interface MockItem {
  id: string
  [key: string]: unknown
}

export interface MockDataResponse {
  resource: string
  count: number
  data: MockItem[]
  generated_at: string
}
