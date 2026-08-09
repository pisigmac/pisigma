import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, GeoIPInfo, ExchangeRates, TranslationResponse } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-localization',
    environment: c.env?.LOCALIZATION_ENV || 'development',
  })
})

app.get('/v1/geoip', (c) => {
  const ipParam = c.req.query('ip')
  const ip = ipParam || c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
  const cf = (c.req.raw as any)?.cf

  const country = cf?.country || 'United States'
  const countryCode = cf?.country || 'US'
  const city = cf?.city || 'San Francisco'
  const timezone = cf?.timezone || 'America/Los_Angeles'
  const currency = countryCode === 'US' ? 'USD' : countryCode === 'GB' ? 'GBP' : 'EUR'

  const geoip: GeoIPInfo = {
    ip,
    country,
    country_code: countryCode,
    city,
    timezone,
    currency,
  }

  return c.json(geoip)
})

app.get('/v1/rates', (c) => {
  const baseParam = (c.req.query('base') || 'USD').toUpperCase()
  const baseRates: Record<string, number> = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 155.2,
    CAD: 1.36,
    AUD: 1.52,
    INR: 83.5,
    CHF: 0.9,
    CNY: 7.23,
  }

  const baseRate = baseRates[baseParam] || 1.0
  const calculatedRates: Record<string, number> = {}
  for (const [curr, r] of Object.entries(baseRates)) {
    calculatedRates[curr] = Number((r / baseRate).toFixed(4))
  }

  const response: ExchangeRates = {
    base: baseRates[baseParam] ? baseParam : 'USD',
    rates: calculatedRates,
    updated_at: new Date().toISOString(),
  }

  return c.json(response)
})

const translationsStore: Record<string, Record<string, string>> = {
  en: {
    welcome: 'Welcome',
    goodbye: 'Goodbye',
    login: 'Log In',
    logout: 'Log Out',
    error_generic: 'An unexpected error occurred',
  },
  es: {
    welcome: 'Bienvenido',
    goodbye: 'Adiós',
    login: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    error_generic: 'Ocurrió un error inesperado',
  },
  fr: {
    welcome: 'Bienvenue',
    goodbye: 'Au revoir',
    login: 'Se connecter',
    logout: 'Se déconnecter',
    error_generic: 'Une erreur inattendue est survenue',
  },
  de: {
    welcome: 'Willkommen',
    goodbye: 'Auf Wiedersehen',
    login: 'Anmelden',
    logout: 'Abmelden',
    error_generic: 'Ein unerwarteter Fehler ist aufgetreten',
  },
  ja: {
    welcome: 'ようこそ',
    goodbye: 'さようなら',
    login: 'ログイン',
    logout: 'ログアウト',
    error_generic: '予期せぬエラーが発生しました',
  },
}

app.get('/v1/translations/:locale', (c) => {
  const localeParam = c.req.param('locale').toLowerCase()
  const dictionary = translationsStore[localeParam] || translationsStore.en

  const response: TranslationResponse = {
    locale: localeParam,
    translations: dictionary,
  }

  return c.json(response)
})

export default app
