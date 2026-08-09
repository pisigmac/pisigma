/** Workers-native SMTP client via cloudflare:sockets (no Resend). */

export type SmtpConfig = {
  host: string
  port: number
  user?: string
  pass?: string
  /** Implicit TLS (typically port 465). */
  secure: boolean
  /** Upgrade with STARTTLS after EHLO (typically port 587). */
  starttls: boolean
}

export type SmtpMail = {
  from: string
  to: string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
}

export function parseMailbox(from: string): { name: string | null; email: string } {
  const m = /^(?:"?([^"<]*)"?\s*)?<([^>]+)>$/.exec(from.trim())
  if (m) {
    return { name: m[1]?.trim() || null, email: m[2]!.trim() }
  }
  return { name: null, email: from.trim() }
}

export function encodeSubject(subject: string): string {
  if (/^[\x20-\x7e]*$/.test(subject)) return subject
  const bytes = new TextEncoder().encode(subject)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return `=?UTF-8?B?${btoa(bin)}?=`
}

function encodeBase64(data: Uint8Array): string {
  let bin = ''
  for (const b of data) bin += String.fromCharCode(b)
  return btoa(bin)
}

function chunkB64(s: string, n = 76): string {
  const parts: string[] = []
  for (let i = 0; i < s.length; i += n) parts.push(s.slice(i, i + n))
  return parts.join('\r\n')
}

export function buildMime(mail: SmtpMail): string {
  const subject = encodeSubject(mail.subject)
  const date = new Date().toUTCString()
  const messageId = `<${crypto.randomUUID()}@pisigma-mail>`
  const headers: string[] = [
    `From: ${mail.from}`,
    `To: ${mail.to.join(', ')}`,
    `Subject: ${subject}`,
    `Date: ${date}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
  ]
  if (mail.replyTo) headers.push(`Reply-To: ${mail.replyTo}`)

  const text = mail.text
  const html = mail.html

  if (text && html) {
    const boundary = `pisigma_${crypto.randomUUID().replace(/-/g, '')}`
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`)
    const textPart = [
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      chunkB64(encodeBase64(new TextEncoder().encode(text))),
    ].join('\r\n')
    const htmlPart = [
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      chunkB64(encodeBase64(new TextEncoder().encode(html))),
    ].join('\r\n')
    return `${headers.join('\r\n')}\r\n\r\n${textPart}\r\n${htmlPart}\r\n--${boundary}--\r\n`
  }

  const body = html || text || ''
  headers.push(`Content-Type: ${html ? 'text/html' : 'text/plain'}; charset=utf-8`)
  headers.push('Content-Transfer-Encoding: base64')
  return `${headers.join('\r\n')}\r\n\r\n${chunkB64(encodeBase64(new TextEncoder().encode(body)))}\r\n`
}

type CfSocket = {
  readable: ReadableStream<Uint8Array>
  writable: WritableStream<Uint8Array>
  close(): void
  startTls?: () => CfSocket
}

async function openSocket(cfg: SmtpConfig): Promise<CfSocket> {
  const { connect } = (await import('cloudflare:sockets')) as {
    connect: (opts: {
      hostname: string
      port: number
      secureTransport?: 'on' | 'off' | 'starttls'
    }) => CfSocket
  }
  const secureTransport = cfg.secure ? 'on' : cfg.starttls ? 'starttls' : 'off'
  return connect({ hostname: cfg.host, port: cfg.port, secureTransport })
}

class SmtpSession {
  private reader: ReadableStreamDefaultReader<Uint8Array>
  private writer: WritableStreamDefaultWriter<Uint8Array>
  private buf = ''
  private encoder = new TextEncoder()
  private decoder = new TextDecoder()

  constructor(private socket: CfSocket) {
    this.reader = socket.readable.getReader()
    this.writer = socket.writable.getWriter()
  }

  private async readReply(): Promise<{ code: number; lines: string[] }> {
    const lines: string[] = []
    for (;;) {
      while (!this.buf.includes('\n')) {
        const { value, done } = await this.reader.read()
        if (done) throw new Error('SMTP connection closed')
        this.buf += this.decoder.decode(value, { stream: true })
      }
      const idx = this.buf.indexOf('\n')
      const raw = this.buf.slice(0, idx).replace(/\r$/, '')
      this.buf = this.buf.slice(idx + 1)
      lines.push(raw)
      if (/^\d{3}[\s]/.test(raw)) {
        return { code: Number(raw.slice(0, 3)), lines }
      }
    }
  }

  async expect(ok: number | number[], label: string): Promise<void> {
    const want = Array.isArray(ok) ? ok : [ok]
    const reply = await this.readReply()
    if (!want.includes(reply.code)) {
      throw new Error(`SMTP ${label} failed: ${reply.lines.join(' | ')}`)
    }
  }

  async cmd(line: string, ok: number | number[], label: string): Promise<void> {
    await this.writer.write(this.encoder.encode(line + '\r\n'))
    await this.expect(ok, label)
  }

  async writeData(mime: string): Promise<void> {
    const stuffed = mime.replace(/^\./gm, '..')
    const payload = (stuffed.endsWith('\r\n') ? stuffed : stuffed + '\r\n') + '.\r\n'
    await this.writer.write(this.encoder.encode(payload))
    await this.expect(250, 'message body')
  }

  async upgradeTlsIfNeeded(cfg: SmtpConfig): Promise<void> {
    if (!cfg.starttls || cfg.secure) return
    await this.cmd('STARTTLS', 220, 'STARTTLS')
    if (!this.socket.startTls) {
      throw new Error('SMTP STARTTLS requested but runtime has no startTls()')
    }
    this.writer.releaseLock()
    this.reader.releaseLock()
    this.socket = this.socket.startTls()
    this.reader = this.socket.readable.getReader()
    this.writer = this.socket.writable.getWriter()
  }

  async quit(): Promise<void> {
    try {
      await this.writer.write(this.encoder.encode('QUIT\r\n'))
    } catch {
      /* ignore */
    }
    try {
      this.writer.releaseLock()
      this.reader.releaseLock()
      this.socket.close()
    } catch {
      /* ignore */
    }
  }
}

export async function sendSmtp(cfg: SmtpConfig, mail: SmtpMail): Promise<{ messageId: string }> {
  if (!mail.to.length) throw new Error('SMTP requires at least one recipient')
  const envelopeFrom = parseMailbox(mail.from).email
  const mime = buildMime(mail)
  const messageId = /Message-ID:\s*(<[^>]+>)/i.exec(mime)?.[1] || `smtp_${Date.now()}`

  const socket = await openSocket(cfg)
  const session = new SmtpSession(socket)

  try {
    await session.expect(220, 'banner')
    await session.cmd(`EHLO pisigma-mail`, 250, 'EHLO')
    await session.upgradeTlsIfNeeded(cfg)
    if (cfg.starttls && !cfg.secure) {
      await session.cmd(`EHLO pisigma-mail`, 250, 'EHLO after STARTTLS')
    }

    if (cfg.user && cfg.pass) {
      await session.cmd('AUTH LOGIN', 334, 'AUTH LOGIN')
      await session.cmd(btoa(cfg.user), 334, 'AUTH user')
      await session.cmd(btoa(cfg.pass), 235, 'AUTH pass')
    }

    await session.cmd(`MAIL FROM:<${envelopeFrom}>`, 250, 'MAIL FROM')
    for (const rcpt of mail.to) {
      await session.cmd(`RCPT TO:<${rcpt}>`, [250, 251], 'RCPT TO')
    }
    await session.cmd('DATA', 354, 'DATA')
    await session.writeData(mime)
    return { messageId }
  } finally {
    await session.quit()
  }
}

export function smtpConfigFromEnv(env: {
  SMTP_HOST?: string
  SMTP_PORT?: string
  SMTP_USER?: string
  SMTP_PASS?: string
  SMTP_SECURE?: string
  SMTP_STARTTLS?: string
}): SmtpConfig | null {
  if (!env.SMTP_HOST) return null
  const port = Number(env.SMTP_PORT || (env.SMTP_SECURE === '1' ? 465 : 587))
  const secure = env.SMTP_SECURE === '1' || port === 465
  const starttls = env.SMTP_STARTTLS === '1' || (!secure && port === 587)
  return {
    host: env.SMTP_HOST,
    port,
    user: env.SMTP_USER || undefined,
    pass: env.SMTP_PASS || undefined,
    secure,
    starttls: secure ? false : starttls,
  }
}

export function resolveMailProvider(env: {
  MAIL_PROVIDER?: string
  SMTP_HOST?: string
}): 'smtp' | 'console' {
  const forced = (env.MAIL_PROVIDER || '').toLowerCase()
  if (forced === 'console' || forced === 'smtp') return forced
  if (env.SMTP_HOST) return 'smtp'
  return 'console'
}
