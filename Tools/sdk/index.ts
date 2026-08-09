/**
 * Unified PiSigma Shared Infrastructure SDK & Facade Gateway
 *
 * Import typed clients for any PiSigma infrastructure microservice:
 *
 *   import { createPisigmaClient } from 'pisigma/Tools/sdk'
 *   const pisigma = createPisigmaClient({ apiKey: 'secret' })
 *   await pisigma.storage.getPresignedUploadUrl(...)
 *   await pisigma.flags.isEnabled('beta_feature')
 */

import { PisigmaAuth } from '../../Auth/client'
import { PisigmaBilling } from '../../Billing/src/client'
import { PisigmaMail } from '../../Mail/src/client'
import { PisigmaWebhooks } from '../../Webhooks/src/client'
import { PisigmaStorage } from '../../Storage/src/client'
import { PisigmaNotifications } from '../../Notifications/src/client'
import { PisigmaFeatureFlags } from '../../FeatureFlags/src/client'
import { PisigmaAnalytics } from '../../Analytics/src/client'
import { PisigmaSearch } from '../../Search/src/client'
import { PisigmaScheduler } from '../../Scheduler/src/client'
import { PisigmaAuditLogs } from '../../AuditLogs/src/client'
import { PisigmaLocalization } from '../../Localization/src/client'
import { PisigmaMediaProcessing } from '../../MediaProcessing/src/client'
import { PisigmaDiscounts } from '../../Discounts/src/client'
import { PisigmaInventory } from '../../Inventory/src/client'
import { PisigmaSSO } from '../../SSO/src/client'
import { PisigmaRBAC } from '../../RBAC/src/client'

export {
  PisigmaAuth,
  PisigmaBilling,
  PisigmaMail,
  PisigmaWebhooks,
  PisigmaStorage,
  PisigmaNotifications,
  PisigmaFeatureFlags,
  PisigmaAnalytics,
  PisigmaSearch,
  PisigmaScheduler,
  PisigmaAuditLogs,
  PisigmaLocalization,
  PisigmaMediaProcessing,
  PisigmaDiscounts,
  PisigmaInventory,
  PisigmaSSO,
  PisigmaRBAC,
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export type PisigmaServiceName =
  | 'auth'
  | 'billing'
  | 'mail'
  | 'webhooks'
  | 'storage'
  | 'notifications'
  | 'flags'
  | 'analytics'
  | 'search'
  | 'scheduler'
  | 'auditLogs'
  | 'localization'
  | 'mediaProcessing'
  | 'discounts'
  | 'inventory'
  | 'sso'
  | 'rbac'

export interface PisigmaClientConfig {
  /** Optional custom base URL mapping for individual services */
  baseUrlMap?: Partial<Record<PisigmaServiceName, string>>
  /** Host domain/IP for default port mapping (default: "http://127.0.0.1") */
  host?: string
  /** Global API key or bearer token */
  apiKey?: string
  /** Optional tenant identifier for multi-tenant tracing */
  tenantId?: string
  /** Custom fetch implementation */
  fetch?: typeof fetch
}

const DEFAULT_PORTS: Record<PisigmaServiceName, number> = {
  auth: 8090,
  billing: 8787,
  mail: 8787,
  webhooks: 8787,
  storage: 8790,
  notifications: 8791,
  flags: 8792,
  analytics: 8793,
  search: 8794,
  scheduler: 8795,
  auditLogs: 8796,
  localization: 8797,
  sso: 8798,
  rbac: 8799,
  mediaProcessing: 8802,
  discounts: 8800,
  inventory: 8801,
}

export class PisigmaClient {
  readonly auth: PisigmaAuth
  readonly billing: PisigmaBilling
  readonly mail: PisigmaMail
  readonly webhooks: PisigmaWebhooks
  readonly storage: PisigmaStorage
  readonly notifications: PisigmaNotifications
  readonly flags: PisigmaFeatureFlags
  readonly analytics: PisigmaAnalytics
  readonly search: PisigmaSearch
  readonly scheduler: PisigmaScheduler
  readonly auditLogs: PisigmaAuditLogs
  readonly localization: PisigmaLocalization
  readonly mediaProcessing: PisigmaMediaProcessing
  readonly discounts: PisigmaDiscounts
  readonly inventory: PisigmaInventory
  readonly sso: PisigmaSSO
  readonly rbac: PisigmaRBAC

  constructor(config: PisigmaClientConfig = {}) {
    const host = (config.host || 'http://127.0.0.1').replace(/\/$/, '')
    const fetchFn = config.fetch || fetch
    const apiKey = config.apiKey

    const getUrl = (service: PisigmaServiceName): string => {
      return config.baseUrlMap?.[service] || `${host}:${DEFAULT_PORTS[service]}`
    }

    this.auth = new PisigmaAuth({ baseUrl: getUrl('auth'), apiKey, fetch: fetchFn })
    this.billing = new PisigmaBilling({ baseUrl: getUrl('billing'), apiKey: apiKey || '', fetch: fetchFn })
    this.mail = new PisigmaMail({ baseUrl: getUrl('mail'), apiKey, fetch: fetchFn })
    this.webhooks = new PisigmaWebhooks({ baseUrl: getUrl('webhooks'), apiKey: apiKey || '', fetch: fetchFn })
    this.storage = new PisigmaStorage({ baseUrl: getUrl('storage'), apiKey, fetch: fetchFn })
    this.notifications = new PisigmaNotifications({ baseUrl: getUrl('notifications'), apiKey, fetch: fetchFn })
    this.flags = new PisigmaFeatureFlags({ baseUrl: getUrl('flags'), apiKey, fetch: fetchFn })
    this.analytics = new PisigmaAnalytics({ baseUrl: getUrl('analytics'), apiKey, fetch: fetchFn })
    this.search = new PisigmaSearch({ baseUrl: getUrl('search'), apiKey, fetch: fetchFn })
    this.scheduler = new PisigmaScheduler({ baseUrl: getUrl('scheduler'), apiKey, fetch: fetchFn })
    this.auditLogs = new PisigmaAuditLogs({ baseUrl: getUrl('auditLogs'), apiKey, fetch: fetchFn })
    this.localization = new PisigmaLocalization({ baseUrl: getUrl('localization'), apiKey, fetch: fetchFn })
    this.mediaProcessing = new PisigmaMediaProcessing({ baseUrl: getUrl('mediaProcessing'), apiKey, fetch: fetchFn })
    this.discounts = new PisigmaDiscounts({ baseUrl: getUrl('discounts'), apiKey, fetch: fetchFn })
    this.inventory = new PisigmaInventory({ baseUrl: getUrl('inventory'), apiKey, fetch: fetchFn })
    this.sso = new PisigmaSSO({ baseUrl: getUrl('sso'), apiKey, fetch: fetchFn })
    this.rbac = new PisigmaRBAC({ baseUrl: getUrl('rbac'), apiKey, fetch: fetchFn })
  }
}

/**
 * Factory helper to instantiate the unified PiSigma SDK Gateway
 */
export function createPisigmaClient(config: PisigmaClientConfig = {}): PisigmaClient {
  return new PisigmaClient(config)
}


