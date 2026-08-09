import { describe, expect, it } from 'vitest'
import { escapeHtml, renderTemplate } from '../src/templates'
import { hourBucket, parseAllowedFrom, pickFromAddress } from '../src/policy'
import type { ProductRow } from '../src/types'

describe('renderTemplate', () => {
  it('escapes HTML in {{var}}', () => {
    expect(renderTemplate('Hi {{name}}', { name: '<b>x</b>' })).toBe(
      'Hi &lt;b&gt;x&lt;/b&gt;',
    )
  })

  it('allows raw {{{var}}}', () => {
    expect(renderTemplate('{{{html}}}', { html: '<b>x</b>' })).toBe('<b>x</b>')
  })

  it('supports nested paths', () => {
    expect(renderTemplate('{{user.email}}', { user: { email: 'a@b.com' } })).toBe('a@b.com')
  })
})

describe('escapeHtml', () => {
  it('escapes entities', () => {
    expect(escapeHtml(`a&b<"'>`)).toContain('&amp;')
  })
})

describe('policy', () => {
  const product = (allowed_from: string): ProductRow => ({
    id: 'p1',
    slug: 'formrelay',
    name: 'Formrelay',
    allowed_from,
    rate_limit_per_hour: 100,
    active: 1,
    created_at: '',
  })

  it('parses allowlist', () => {
    expect(parseAllowedFrom('["a@b.com"]')).toEqual(['a@b.com'])
  })

  it('rejects non-allowlisted from', () => {
    const r = pickFromAddress(product('["A <a@b.com>"]'), 'evil@x.com', 'default@x.com')
    expect(r.ok).toBe(false)
  })

  it('allows wildcard', () => {
    const r = pickFromAddress(product('["*"]'), 'any@x.com', 'default@x.com')
    expect(r.ok && r.from).toBe('any@x.com')
  })

  it('hourBucket shape', () => {
    expect(hourBucket(new Date('2026-08-09T13:22:00Z'))).toBe('2026-08-09T13')
  })
})
