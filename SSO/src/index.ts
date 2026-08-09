import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, SSOAuthRequest, SSOAuthResponse, SSOProvider } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const providersStore: SSOProvider[] = [
  {
    id: 'google',
    name: 'Google Workspace',
    type: 'oidc',
    enabled: true,
    issuer_url: 'https://accounts.google.com',
  },
  {
    id: 'okta',
    name: 'Okta Enterprise SSO',
    type: 'saml',
    enabled: true,
    issuer_url: 'https://pisigma.okta.com',
  },
  {
    id: 'azure-ad',
    name: 'Microsoft Entra ID / Azure AD',
    type: 'oidc',
    enabled: true,
    issuer_url: 'https://login.microsoftonline.com/common',
  },
]

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-sso',
    environment: c.env?.SSO_ENV || 'development',
    total_providers: providersStore.length,
  })
})

app.get('/v1/sso/providers', (c) => {
  return c.json({
    providers: providersStore,
  })
})

app.post('/v1/sso/auth', async (c) => {
  const body = await c.req.json<SSOAuthRequest>().catch(() => ({} as SSOAuthRequest))
  const { provider_id, token, code } = body

  if (!provider_id) {
    return c.json({ success: false, error: 'provider_id is required' }, 400)
  }

  const provider = providersStore.find((p) => p.id === provider_id && p.enabled)
  if (!provider) {
    return c.json({ success: false, error: `Unsupported or disabled provider: ${provider_id}` }, 400)
  }

  if (!token && !code) {
    return c.json({ success: false, error: 'Either token or auth code must be provided' }, 400)
  }

  const userId = `usr_sso_${provider_id}_${Math.random().toString(36).substring(2, 9)}`
  const email = `user@${provider_id}.example.com`

  const responseData: SSOAuthResponse = {
    success: true,
    user: {
      id: userId,
      email,
      name: `SSO User (${provider.name})`,
      provider: provider.id,
    },
    access_token: `sso_jwt_${Math.random().toString(36).substring(2, 15)}`,
    expires_in: 3600,
  }

  return c.json(responseData)
})

export default app
