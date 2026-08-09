import { resolveMailProvider, sendSmtp, smtpConfigFromEnv } from './smtp'
import type { Env } from './types'

export type ProviderResult =
  | { ok: true; provider: string; providerId: string | null }
  | { ok: false; provider: string; error: string }

export type OutboundMail = {
  from: string
  to: string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  tags?: string[]
}

export async function deliverMail(env: Env, mail: OutboundMail): Promise<ProviderResult> {
  const provider = resolveMailProvider(env)

  if (provider === 'console') {
    console.log(
      JSON.stringify({
        type: 'pisigma-mail.console',
        from: mail.from,
        to: mail.to,
        subject: mail.subject,
        textPreview: (mail.text || mail.html || '').slice(0, 160),
      }),
    )
    return { ok: true, provider: 'console', providerId: `console_${Date.now()}` }
  }

  const cfg = smtpConfigFromEnv(env)
  if (!cfg) {
    return { ok: false, provider: 'smtp', error: 'SMTP_HOST not configured' }
  }

  try {
    const result = await sendSmtp(cfg, {
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: mail.replyTo,
    })
    return { ok: true, provider: 'smtp', providerId: result.messageId }
  } catch (e) {
    return {
      ok: false,
      provider: 'smtp',
      error: e instanceof Error ? e.message : 'SMTP send failed',
    }
  }
}
