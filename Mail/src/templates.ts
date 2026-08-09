/**
 * Minimal Mustache-like renderer.
 * - {{name}} HTML-escaped
 * - {{{name}}} raw (use sparingly)
 * Missing keys → empty string
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function lookup(data: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let cur: unknown = data
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

function stringify(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return JSON.stringify(v)
}

export function renderTemplate(source: string, data: Record<string, unknown>): string {
  return source
    .replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_m, key: string) => stringify(lookup(data, key)))
    .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => escapeHtml(stringify(lookup(data, key))))
}
