export interface Env {
  RBAC_ENV?: string
  RBAC_ADMIN_TOKEN?: string
}

export interface Role {
  name: string
  description?: string
  permissions: string[]
}

export interface CanRequest {
  user_id?: string
  roles?: string[]
  action: string
  resource?: string
}

export interface CanResponse {
  allowed: boolean
  user_id?: string
  action: string
  resource?: string
  matched_role?: string
  reason?: string
}

export interface CreateRoleRequest {
  name: string
  description?: string
  permissions: string[]
}
