import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaPromptManagement } from '../src/client'

describe('PromptManagement Service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-promptmanagement')
    expect(json.environment).toBe('development')
  })

  it('POST /v1/prompts/version creates a prompt template version', async () => {
    const res = await app.request('/v1/prompts/version', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'system_assistant',
        template: 'You are an AI assistant named {{name}} with tone {{tone}}.',
      }),
    })
    expect(res.status).toBe(201)
    const json = (await res.json()) as any
    expect(json.success).toBe(true)
    expect(json.prompt.name).toBe('system_assistant')
    expect(json.prompt.version).toBe(1)
    expect(json.prompt.variables).toContain('name')
    expect(json.prompt.variables).toContain('tone')
  })

  it('POST /v1/prompts/version increments version for existing prompt name', async () => {
    const res = await app.request('/v1/prompts/version', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'system_assistant',
        template: 'Updated system prompt for {{name}} in domain {{domain}}.',
      }),
    })
    expect(res.status).toBe(201)
    const json = (await res.json()) as any
    expect(json.success).toBe(true)
    expect(json.prompt.name).toBe('system_assistant')
    expect(json.prompt.version).toBe(2)
  })

  it('POST /v1/prompts/render renders template from pre-seeded ID', async () => {
    const res = await app.request('/v1/prompts/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: 'prompt-welcome-v1',
        variables: { user_name: 'Alice', platform_name: 'PiSigma' },
      }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.rendered_prompt).toBe('Hello Alice, welcome to PiSigma!')
    expect(json.template_id).toBe('prompt-welcome-v1')
  })

  it('POST /v1/prompts/render renders prompt from name using latest version', async () => {
    const res = await app.request('/v1/prompts/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'system_assistant',
        variables: { name: 'SigmaBot', domain: 'Finance' },
      }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.rendered_prompt).toBe('Updated system prompt for SigmaBot in domain Finance.')
    expect(json.version).toBe(2)
  })

  it('POST /v1/prompts/render handles inline raw template string', async () => {
    const res = await app.request('/v1/prompts/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'Summarize article {{title}} by {{author}}.',
        variables: { title: 'Quantum Computing 101', author: 'Dr. Smith' },
      }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.rendered_prompt).toBe('Summarize article Quantum Computing 101 by Dr. Smith.')
  })

  it('POST /v1/prompts/render tracks missing variables', async () => {
    const res = await app.request('/v1/prompts/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'Hello {{name}}, your balance is {{balance}} USD.',
        variables: { name: 'Bob' },
      }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.rendered_prompt).toBe('Hello Bob, your balance is {{balance}} USD.')
    expect(json.missing_variables).toContain('balance')
  })

  it('POST /v1/prompts/render returns 400 when template is not found', async () => {
    const res = await app.request('/v1/prompts/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: 'nonexistent-prompt-id',
      }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as any
    expect(json.error).toBeDefined()
  })

  it('PisigmaPromptManagement client operates correctly', async () => {
    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input.toString()
      const url = new URL(urlStr)
      const req = new Request(url, init)
      return app.request(req)
    }

    const client = new PisigmaPromptManagement({ baseUrl: 'http://localhost:8808', fetch: fetchMock as any })

    const health = await client.checkHealth()
    expect(health.ok).toBe(true)
    if (health.ok) {
      expect(health.data.service).toBe('pisigma-promptmanagement')
    }

    const versionRes = await client.createVersion({
      name: 'email_template',
      template: 'Dear {{customer}}, your order {{order_id}} has shipped!',
    })
    expect(versionRes.ok).toBe(true)
    if (versionRes.ok) {
      expect(versionRes.data.prompt.name).toBe('email_template')
    }

    const renderRes = await client.renderPrompt({
      name: 'email_template',
      variables: { customer: 'Jane', order_id: '#10293' },
    })
    expect(renderRes.ok).toBe(true)
    if (renderRes.ok) {
      expect(renderRes.data.rendered_prompt).toBe('Dear Jane, your order #10293 has shipped!')
    }
  })
})
