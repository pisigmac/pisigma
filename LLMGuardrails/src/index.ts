import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type {
  Env,
  GuardrailEvaluationRequest,
  GuardrailEvaluationResult,
  GuardrailRedactRequest,
  GuardrailRedactResult,
  GuardrailViolation,
} from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-llmguardrails',
    environment: c.env?.LLM_GUARDRAILS_ENV || 'development',
  })
})

app.post('/v1/guardrails/evaluate', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<GuardrailEvaluationRequest>

  if (typeof body.text !== 'string' || body.text.trim().length === 0) {
    return c.json({ error: 'Missing or invalid field: text' }, 400)
  }

  const text = body.text
  const requestedRules = Array.isArray(body.rules) && body.rules.length > 0 ? body.rules : null
  const threshold = typeof body.threshold === 'number' ? body.threshold : 80

  const violations: GuardrailViolation[] = []
  const flaggedCategories: string[] = []

  // Check 1: Prompt Injection / Jailbreak
  if (!requestedRules || requestedRules.includes('prompt_injection') || requestedRules.includes('jailbreak')) {
    const injectionPatterns = [
      /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
      /bypass\s+(all\s+)?(rules|safeguards|filters)/i,
      /you\s+are\s+now\s+dan/i,
      /disregard\s+(system\s+prompt|safety)/i,
      /override\s+security\s+protocol/i,
    ]
    const matched = injectionPatterns.some((pattern) => pattern.test(text))
    if (matched) {
      violations.push({
        rule: 'prompt_injection',
        detected: true,
        severity: 'critical',
        details: 'Potential prompt injection or safety bypass pattern detected',
      })
      flaggedCategories.push('prompt_injection')
    }
  }

  // Check 2: Secret Exposure
  if (!requestedRules || requestedRules.includes('secret_leak')) {
    const secretPatterns = [
      /sk-[a-zA-Z0-9]{20,}/,
      /ghp_[a-zA-Z0-9]{20,}/,
      /AKIA[0-9A-Z]{16}/,
      /-----BEGIN PRIVATE KEY-----/,
    ]
    const matched = secretPatterns.some((pattern) => pattern.test(text))
    if (matched) {
      violations.push({
        rule: 'secret_leak',
        detected: true,
        severity: 'high',
        details: 'Hardcoded API key, token, or private key detected in input text',
      })
      flaggedCategories.push('secret_leak')
    }
  }

  // Check 3: PII Detection
  if (!requestedRules || requestedRules.includes('pii')) {
    const piiPatterns = [
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/, // email
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    ]
    const matched = piiPatterns.some((pattern) => pattern.test(text))
    if (matched) {
      violations.push({
        rule: 'pii',
        detected: true,
        severity: 'medium',
        details: 'Personally identifiable information (email/SSN) detected',
      })
      flaggedCategories.push('pii')
    }
  }

  // Check 4: Toxicity / Profanity
  if (!requestedRules || requestedRules.includes('toxicity')) {
    const toxicTerms = ['hate', 'violence', 'malware', 'exploit']
    const lowerText = text.toLowerCase()
    const foundToxic = toxicTerms.filter((term) => lowerText.includes(term))
    if (foundToxic.length >= 2) {
      violations.push({
        rule: 'toxicity',
        detected: true,
        severity: 'medium',
        details: `Toxic keywords detected: ${foundToxic.join(', ')}`,
      })
      flaggedCategories.push('toxicity')
    }
  }

  // Calculate score based on violations
  let score = 100
  for (const v of violations) {
    if (v.severity === 'critical') score -= 50
    else if (v.severity === 'high') score -= 30
    else if (v.severity === 'medium') score -= 20
    else if (v.severity === 'low') score -= 10
  }
  score = Math.max(0, score)

  const passed = score >= threshold && !violations.some((v) => v.severity === 'critical')

  const result: GuardrailEvaluationResult = {
    passed,
    score,
    violations,
    flagged_categories: flaggedCategories,
  }

  return c.json(result)
})

app.post('/v1/guardrails/redact', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<GuardrailRedactRequest>

  if (typeof body.text !== 'string') {
    return c.json({ error: 'Missing or invalid field: text' }, 400)
  }

  const originalText = body.text
  let redactedText = originalText
  const customReplacement = body.replacement
  const redactTypes = Array.isArray(body.redact_types) && body.redact_types.length > 0
    ? body.redact_types
    : ['email', 'phone', 'ssn', 'api_key', 'credit_card']

  let replacementsCount = 0
  const typesRedactedSet = new Set<string>()

  // 1. Email
  if (redactTypes.includes('email') || redactTypes.includes('pii')) {
    const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g
    const matches = redactedText.match(emailRegex)
    if (matches && matches.length > 0) {
      replacementsCount += matches.length
      typesRedactedSet.add('email')
      redactedText = redactedText.replace(emailRegex, customReplacement || '[REDACTED_EMAIL]')
    }
  }

  // 2. SSN
  if (redactTypes.includes('ssn') || redactTypes.includes('pii')) {
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g
    const matches = redactedText.match(ssnRegex)
    if (matches && matches.length > 0) {
      replacementsCount += matches.length
      typesRedactedSet.add('ssn')
      redactedText = redactedText.replace(ssnRegex, customReplacement || '[REDACTED_SSN]')
    }
  }

  // 3. Phone Number
  if (redactTypes.includes('phone') || redactTypes.includes('pii')) {
    const phoneRegex = /\b(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b/g
    const matches = redactedText.match(phoneRegex)
    if (matches && matches.length > 0) {
      replacementsCount += matches.length
      typesRedactedSet.add('phone')
      redactedText = redactedText.replace(phoneRegex, customReplacement || '[REDACTED_PHONE]')
    }
  }

  // 4. API Key / Token
  if (redactTypes.includes('api_key') || redactTypes.includes('secret')) {
    const apiKeyRegex = /\b(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16})\b/g
    const matches = redactedText.match(apiKeyRegex)
    if (matches && matches.length > 0) {
      replacementsCount += matches.length
      typesRedactedSet.add('api_key')
      redactedText = redactedText.replace(apiKeyRegex, customReplacement || '[REDACTED_API_KEY]')
    }
  }

  const result: GuardrailRedactResult = {
    original_text: originalText,
    redacted_text: redactedText,
    replacements_made: replacementsCount,
    redacted_types: Array.from(typesRedactedSet),
  }

  return c.json(result)
})

export default app
