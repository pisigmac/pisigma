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
import { PisigmaPromptManagement } from '../../PromptManagement/src/client'
import { PisigmaLLMGuardrails } from '../../LLMGuardrails/src/client'
import { PisigmaAPIGenerator } from '../../APIGenerator/src/client'
import { PisigmaAPITester } from '../../APITester/src/client'
import { PisigmaErrorTracking } from '../../ErrorTracking/src/client'
import { PisigmaExperiments } from '../../Experiments/src/client'
import { PisigmaFeedback } from '../../Feedback/src/client'
import { PisigmaRealtime } from '../../Realtime/src/client'
import { PisigmaRateLimiter } from '../../RateLimiter/src/client'
import { PisigmaCache } from '../../Cache/src/client'
import { PisigmaQueueBroker } from '../../QueueBroker/src/client'
import { PisigmaConfigVault } from '../../ConfigVault/src/client'
import { PisigmaAPIGateway } from '../../APIGateway/src/client'
import { PisigmaLogAggregator } from '../../LogAggregator/src/client'
import { PisigmaDataPipeline } from '../../DataPipeline/src/client'
import { PisigmaVectorSearch } from '../../VectorSearch/src/client'
import { PisigmaConsentManager } from '../../ConsentManager/src/client'
import { PisigmaDataRetention } from '../../DataRetention/src/client'
import { PisigmaSMS } from '../../SMS/src/client'
import { PisigmaChat } from '../../Chat/src/client'
import { PisigmaMFA } from '../../MFA/src/client'
import { PisigmaWAF } from '../../WAF/src/client'
import { PisigmaSubscriptions } from '../../Subscriptions/src/client'
import { PisigmaInvoicing } from '../../Invoicing/src/client'
import { PisigmaReferrals } from '../../Referrals/src/client'
import { PisigmaWorkflows } from '../../Workflows/src/client'
import { PisigmaCMS } from '../../CMS/src/client'
import { PisigmaFormBuilder } from '../../FormBuilder/src/client'
import { PisigmaComments } from '../../Comments/src/client'

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
  PisigmaPromptManagement,
  PisigmaLLMGuardrails,
  PisigmaAPIGenerator,
  PisigmaAPITester,
  PisigmaErrorTracking,
  PisigmaExperiments,
  PisigmaFeedback,
  PisigmaRealtime,
  PisigmaRateLimiter,
  PisigmaCache,
  PisigmaQueueBroker,
  PisigmaConfigVault,
  PisigmaAPIGateway,
  PisigmaLogAggregator,
  PisigmaDataPipeline,
  PisigmaVectorSearch,
  PisigmaConsentManager,
  PisigmaDataRetention,
  PisigmaSMS,
  PisigmaChat,
  PisigmaMFA,
  PisigmaWAF,
  PisigmaSubscriptions,
  PisigmaInvoicing,
  PisigmaReferrals,
  PisigmaWorkflows,
  PisigmaCMS,
  PisigmaFormBuilder,
  PisigmaComments,
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
  | 'promptManagement'
  | 'llmGuardrails'
  | 'apiGenerator'
  | 'apiTester'
  | 'errorTracking'
  | 'experiments'
  | 'feedback'
  | 'realtime'
  | 'rateLimiter'
  | 'cache'
  | 'queueBroker'
  | 'configVault'
  | 'apiGateway'
  | 'logAggregator'
  | 'dataPipeline'
  | 'vectorSearch'
  | 'consentManager'
  | 'dataRetention'
  | 'sms'
  | 'chat'
  | 'mfa'
  | 'waf'
  | 'subscriptions'
  | 'invoicing'
  | 'referrals'
  | 'workflows'
  | 'cms'
  | 'formBuilder'
  | 'comments'

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
  promptManagement: 8808,
  llmGuardrails: 8809,
  apiGenerator: 8803,
  apiTester: 8804,
  errorTracking: 8805,
  experiments: 8806,
  feedback: 8807,
  realtime: 8810,
  rateLimiter: 8811,
  cache: 8816,
  queueBroker: 8815,
  configVault: 8812,
  apiGateway: 8813,
  logAggregator: 8814,
  dataPipeline: 8817,
  vectorSearch: 8818,
  consentManager: 8819,
  dataRetention: 8820,
  sms: 8821,
  chat: 8822,
  mfa: 8823,
  waf: 8824,
  subscriptions: 8825,
  invoicing: 8826,
  referrals: 8827,
  workflows: 8828,
  cms: 8829,
  formBuilder: 8830,
  comments: 8831,
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
  readonly promptManagement: PisigmaPromptManagement
  readonly llmGuardrails: PisigmaLLMGuardrails
  readonly apiGenerator: PisigmaAPIGenerator
  readonly apiTester: PisigmaAPITester
  readonly errorTracking: PisigmaErrorTracking
  readonly experiments: PisigmaExperiments
  readonly feedback: PisigmaFeedback
  readonly realtime: PisigmaRealtime
  readonly rateLimiter: PisigmaRateLimiter
  readonly cache: PisigmaCache
  readonly queueBroker: PisigmaQueueBroker
  readonly configVault: PisigmaConfigVault
  readonly apiGateway: PisigmaAPIGateway
  readonly logAggregator: PisigmaLogAggregator
  readonly dataPipeline: PisigmaDataPipeline
  readonly vectorSearch: PisigmaVectorSearch
  readonly consentManager: PisigmaConsentManager
  readonly dataRetention: PisigmaDataRetention
  readonly sms: PisigmaSMS
  readonly chat: PisigmaChat
  readonly mfa: PisigmaMFA
  readonly waf: PisigmaWAF
  readonly subscriptions: PisigmaSubscriptions
  readonly invoicing: PisigmaInvoicing
  readonly referrals: PisigmaReferrals
  readonly workflows: PisigmaWorkflows
  readonly cms: PisigmaCMS
  readonly formBuilder: PisigmaFormBuilder
  readonly comments: PisigmaComments

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
    this.promptManagement = new PisigmaPromptManagement({ baseUrl: getUrl('promptManagement'), apiKey, fetch: fetchFn })
    this.llmGuardrails = new PisigmaLLMGuardrails({ baseUrl: getUrl('llmGuardrails'), apiKey, fetch: fetchFn })
    this.apiGenerator = new PisigmaAPIGenerator({ baseUrl: getUrl('apiGenerator'), apiKey, fetch: fetchFn })
    this.apiTester = new PisigmaAPITester({ baseUrl: getUrl('apiTester'), apiKey, fetch: fetchFn })
    this.errorTracking = new PisigmaErrorTracking({ baseUrl: getUrl('errorTracking'), apiKey, fetch: fetchFn })
    this.experiments = new PisigmaExperiments({ baseUrl: getUrl('experiments'), apiKey, fetch: fetchFn })
    this.feedback = new PisigmaFeedback({ baseUrl: getUrl('feedback'), apiKey, fetch: fetchFn })
    this.realtime = new PisigmaRealtime({ baseUrl: getUrl('realtime'), apiKey, fetch: fetchFn })
    this.rateLimiter = new PisigmaRateLimiter({ baseUrl: getUrl('rateLimiter'), apiKey, fetch: fetchFn })
    this.cache = new PisigmaCache({ baseUrl: getUrl('cache'), apiKey, fetch: fetchFn })
    this.queueBroker = new PisigmaQueueBroker({ baseUrl: getUrl('queueBroker'), apiKey, fetch: fetchFn })
    this.configVault = new PisigmaConfigVault({ baseUrl: getUrl('configVault'), apiKey, fetch: fetchFn })
    this.apiGateway = new PisigmaAPIGateway({ baseUrl: getUrl('apiGateway'), apiKey, fetch: fetchFn })
    this.logAggregator = new PisigmaLogAggregator({ baseUrl: getUrl('logAggregator'), apiKey, fetch: fetchFn })
    this.dataPipeline = new PisigmaDataPipeline({ baseUrl: getUrl('dataPipeline'), apiKey, fetch: fetchFn })
    this.vectorSearch = new PisigmaVectorSearch({ baseUrl: getUrl('vectorSearch'), apiKey, fetch: fetchFn })
    this.consentManager = new PisigmaConsentManager({ baseUrl: getUrl('consentManager'), apiKey, fetch: fetchFn })
    this.dataRetention = new PisigmaDataRetention({ baseUrl: getUrl('dataRetention'), apiKey, fetch: fetchFn })
    this.sms = new PisigmaSMS({ baseUrl: getUrl('sms'), apiKey, fetch: fetchFn })
    this.chat = new PisigmaChat({ baseUrl: getUrl('chat'), apiKey, fetch: fetchFn })
    this.mfa = new PisigmaMFA({ baseUrl: getUrl('mfa'), apiKey, fetch: fetchFn })
    this.waf = new PisigmaWAF({ baseUrl: getUrl('waf'), apiKey, fetch: fetchFn })
    this.subscriptions = new PisigmaSubscriptions({ baseUrl: getUrl('subscriptions'), apiKey, fetch: fetchFn })
    this.invoicing = new PisigmaInvoicing({ baseUrl: getUrl('invoicing'), apiKey, fetch: fetchFn })
    this.referrals = new PisigmaReferrals({ baseUrl: getUrl('referrals'), apiKey, fetch: fetchFn })
    this.workflows = new PisigmaWorkflows({ baseUrl: getUrl('workflows'), apiKey, fetch: fetchFn })
    this.cms = new PisigmaCMS({ baseUrl: getUrl('cms'), apiKey, fetch: fetchFn })
    this.formBuilder = new PisigmaFormBuilder({ baseUrl: getUrl('formBuilder'), apiKey, fetch: fetchFn })
    this.comments = new PisigmaComments({ baseUrl: getUrl('comments'), apiKey, fetch: fetchFn })
  }
}

/**
 * Factory helper to instantiate the unified PiSigma SDK Gateway
 */
export function createPisigmaClient(config: PisigmaClientConfig = {}): PisigmaClient {
  return new PisigmaClient(config)
}



