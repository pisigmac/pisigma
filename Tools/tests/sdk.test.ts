import { describe, expect, it } from 'vitest'
import { createPisigmaClient } from '../sdk/index'

describe('PiSigma Unified Client Gateway', () => {
  it('instantiates all 12 microservice clients cleanly', () => {
    const pisigma = createPisigmaClient({ apiKey: 'test-key' })

    expect(pisigma.auth).toBeDefined()
    expect(pisigma.billing).toBeDefined()
    expect(pisigma.mail).toBeDefined()
    expect(pisigma.webhooks).toBeDefined()
    expect(pisigma.storage).toBeDefined()
    expect(pisigma.notifications).toBeDefined()
    expect(pisigma.flags).toBeDefined()
    expect(pisigma.analytics).toBeDefined()
    expect(pisigma.search).toBeDefined()
    expect(pisigma.scheduler).toBeDefined()
    expect(pisigma.auditLogs).toBeDefined()
    expect(pisigma.localization).toBeDefined()
  })
})
