import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaLocalization } from '../src/client'

describe('Localization service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-localization')
    expect(json.environment).toBe('development')
  })

  it('GET /v1/geoip returns location details', async () => {
    const res = await app.request('/v1/geoip?ip=8.8.8.8')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.ip).toBe('8.8.8.8')
    expect(json.country).toBeDefined()
    expect(json.currency).toBeDefined()
  })

  it('GET /v1/rates returns exchange rates', async () => {
    const res = await app.request('/v1/rates?base=EUR')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.base).toBe('EUR')
    expect(json.rates).toBeDefined()
    expect(json.rates.EUR).toBe(1)
    expect(json.rates.USD).toBeGreaterThan(0)
  })

  it('GET /v1/translations/:locale returns translations for locale', async () => {
    const resEs = await app.request('/v1/translations/es')
    expect(resEs.status).toBe(200)
    const jsonEs = (await resEs.json()) as any
    expect(jsonEs.locale).toBe('es')
    expect(jsonEs.translations.welcome).toBe('Bienvenido')

    const resUnknown = await app.request('/v1/translations/unknown_lang')
    expect(resUnknown.status).toBe(200)
    const jsonUnknown = (await resUnknown.json()) as any
    expect(jsonUnknown.locale).toBe('unknown_lang')
    expect(jsonUnknown.translations.welcome).toBe('Welcome')
  })

  it('PisigmaLocalization client operates correctly', async () => {
    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input.toString()
      const url = new URL(urlStr)
      const req = new Request(url, init)
      return app.request(req)
    }

    const client = new PisigmaLocalization({ baseUrl: 'http://localhost:8797', fetch: fetchMock as any })
    const health = await client.checkHealth()
    expect(health.ok).toBe(true)

    const geoRes = await client.getGeoIP('1.1.1.1')
    expect(geoRes.ok).toBe(true)
    if (geoRes.ok) {
      expect(geoRes.data.ip).toBe('1.1.1.1')
    }

    const ratesRes = await client.getRates('USD')
    expect(ratesRes.ok).toBe(true)
    if (ratesRes.ok) {
      expect(ratesRes.data.base).toBe('USD')
      expect(ratesRes.data.rates.USD).toBe(1)
    }

    const transRes = await client.getTranslations('fr')
    expect(transRes.ok).toBe(true)
    if (transRes.ok) {
      expect(transRes.data.locale).toBe('fr')
      expect(transRes.data.translations.welcome).toBe('Bienvenue')
    }
  })
})
