export interface Env {
  LOCALIZATION_ENV?: string
}

export interface GeoIPInfo {
  ip: string
  country: string
  country_code: string
  city?: string
  timezone?: string
  currency: string
}

export interface ExchangeRates {
  base: string
  rates: Record<string, number>
  updated_at: string
}

export interface TranslationResponse {
  locale: string
  translations: Record<string, string>
}
