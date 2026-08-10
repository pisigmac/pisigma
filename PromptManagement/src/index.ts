import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type {
  Env,
  PromptTemplate,
  PromptRenderRequest,
  PromptRenderResult,
  PromptVersionRequest,
  PromptVersionResult,
} from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

// In-memory store for prompt templates
const promptStore: Map<string, PromptTemplate> = new Map()

// Helper to extract variable names from template string
function extractVariables(template: string): string[] {
  const vars = new Set<string>()
  // Match {{var}} or {var}
  const regex = /\{\{?\s*([a-zA-Z0-9_]+)\s*\}?\}/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(template)) !== null) {
    if (match[1]) {
      vars.add(match[1])
    }
  }
  return Array.from(vars)
}

// Pre-seed default prompt template
const defaultPrompt: PromptTemplate = {
  id: 'prompt-welcome-v1',
  name: 'welcome_message',
  template: 'Hello {{user_name}}, welcome to {{platform_name}}!',
  version: 1,
  variables: ['user_name', 'platform_name'],
  created_at: new Date().toISOString(),
}
promptStore.set(defaultPrompt.id, defaultPrompt)

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-promptmanagement',
    environment: c.env?.PROMPT_MANAGEMENT_ENV || 'development',
  })
})

app.post('/v1/prompts/version', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<PromptVersionRequest>

  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return c.json({ error: 'Missing or invalid field: name' }, 400)
  }

  if (!body.template || typeof body.template !== 'string') {
    return c.json({ error: 'Missing or invalid field: template' }, 400)
  }

  const name = body.name.trim()
  const templateStr = body.template

  // Calculate version
  const existingForName = Array.from(promptStore.values()).filter((p) => p.name === name)
  let version = body.version
  if (typeof version !== 'number' || version <= 0) {
    const maxVer = existingForName.reduce((max, p) => Math.max(max, p.version), 0)
    version = maxVer + 1
  }

  const extractedVars = extractVariables(templateStr)
  const providedVars = Array.isArray(body.variables) ? body.variables : []
  const allVars = Array.from(new Set([...extractedVars, ...providedVars]))

  const id = `prompt-${name}-v${version}`
  const prompt: PromptTemplate = {
    id,
    name,
    template: templateStr,
    version,
    variables: allVars,
    created_at: new Date().toISOString(),
  }

  promptStore.set(id, prompt)

  const result: PromptVersionResult = {
    success: true,
    prompt,
    message: `Prompt version v${version} created for '${name}'`,
  }

  return c.json(result, 201)
})

app.post('/v1/prompts/render', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<PromptRenderRequest>

  let templateText: string | null = null
  let templateId: string | undefined = body.template_id
  let templateName: string | undefined = body.name
  let version: number | undefined = body.version

  if (body.template && typeof body.template === 'string') {
    templateText = body.template
  } else if (templateId) {
    const prompt = promptStore.get(templateId)
    if (prompt) {
      templateText = prompt.template
      templateName = prompt.name
      version = prompt.version
    }
  } else if (templateName) {
    const matching = Array.from(promptStore.values()).filter((p) => p.name === templateName)
    if (matching.length > 0) {
      let selected: PromptTemplate | undefined
      if (version) {
        selected = matching.find((p) => p.version === version)
      } else {
        selected = matching.reduce((latest, current) =>
          current.version > latest.version ? current : latest
        )
      }
      if (selected) {
        templateText = selected.template
        templateId = selected.id
        version = selected.version
      }
    }
  }

  if (templateText === null) {
    return c.json({ error: 'Prompt template not found or no template text provided' }, 400)
  }

  const variables = body.variables || {}
  const missingVars: string[] = []

  // Replace {{var}} or {var}
  const renderedPrompt = templateText.replace(/\{\{?\s*([a-zA-Z0-9_]+)\s*\}?\}/g, (match, varName) => {
    if (Object.prototype.hasOwnProperty.call(variables, varName) && variables[varName] !== undefined && variables[varName] !== null) {
      return String(variables[varName])
    }
    missingVars.push(varName)
    return match
  })

  const result: PromptRenderResult = {
    rendered_prompt: renderedPrompt,
    template_id: templateId,
    name: templateName,
    version,
    missing_variables: missingVars.length > 0 ? Array.from(new Set(missingVars)) : undefined,
  }

  return c.json(result)
})

app.get('/v1/prompts', (c) => {
  const prompts = Array.from(promptStore.values())
  return c.json({ prompts })
})

app.get('/v1/prompts/:id', (c) => {
  const id = c.req.param('id')
  const prompt = promptStore.get(id)
  if (!prompt) {
    return c.json({ error: 'Prompt template not found' }, 404)
  }
  return c.json({ prompt })
})

export default app
