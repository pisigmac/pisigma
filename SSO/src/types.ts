export interface Env {
  SSO_ENV?: string
  SSO_SECRET_KEY?: string
}

export interface SSOProvider {
  id: string
  name: string
  type: 'saml' | 'oidc' | 'oauth2'
  enabled: boolean
  issuer_url?: string
}

export interface SSOAuthRequest {
  provider_id: string
  token?: string
  code?: string
  redirect_uri?: string
}

export interface SSOAuthResponse {
  success: boolean
  user?: {
    id: string
    email: string
    name?: string
    provider: string
  }
  access_token?: string
  expires_in?: number
  error?: string
}
