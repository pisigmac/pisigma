import { describe, expect, it } from 'vitest'
import { buildMime, encodeSubject, parseMailbox, resolveMailProvider } from '../src/smtp'

describe('parseMailbox', () => {
  it('parses Name <email>', () => {
    expect(parseMailbox('PlexApps <noreply@plexapps.com>')).toEqual({
      name: 'PlexApps',
      email: 'noreply@plexapps.com',
    })
  })

  it('parses bare email', () => {
    expect(parseMailbox('a@b.com').email).toBe('a@b.com')
  })
})

describe('encodeSubject', () => {
  it('leaves ascii alone', () => {
    expect(encodeSubject('Hello')).toBe('Hello')
  })

  it('encodes unicode', () => {
    expect(encodeSubject('नमस्ते')).toMatch(/^=\?UTF-8\?B\?/)
  })
})

describe('buildMime', () => {
  it('builds text message', () => {
    const mime = buildMime({
      from: 'A <a@b.com>',
      to: ['c@d.com'],
      subject: 'Hi',
      text: 'body',
    })
    expect(mime).toContain('From: A <a@b.com>')
    expect(mime).toContain('To: c@d.com')
    expect(mime).toContain('Content-Transfer-Encoding: base64')
  })
})

describe('resolveMailProvider', () => {
  it('defaults to console without SMTP', () => {
    expect(resolveMailProvider({})).toBe('console')
  })

  it('uses smtp when host set', () => {
    expect(resolveMailProvider({ SMTP_HOST: 'smtp.example.com' })).toBe('smtp')
  })

  it('honors forced console', () => {
    expect(resolveMailProvider({ MAIL_PROVIDER: 'console', SMTP_HOST: 'x' })).toBe('console')
  })
})
