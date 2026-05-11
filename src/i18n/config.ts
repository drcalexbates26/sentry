/**
 * Internationalization config — Phase 1 (scaffolding).
 *
 * Phase 1 ships only English UI strings but provides:
 *   • Locale list + metadata (currency, date format, native name)
 *   • Region routing config (which Vercel/Supabase region to prefer)
 *   • Message bundles indexed by locale (currently EN populated, ES/FR/DE/PT stubs)
 *
 * Phase 2 (when first non-EN tenant signs): add next-intl middleware,
 * route prefix `/[locale]`, translate marketing copy, hreflang tags.
 *
 * Why this split: full i18n changes URL structure (SEO impact) and adds
 * a middleware to every request. We're not paying that tax until at
 * least one customer needs it.
 */

export const DEFAULT_LOCALE = "en" as const;

export const LOCALES = {
  en: {
    code: "en",
    label: "English",
    nativeLabel: "English",
    currency: "USD",
    dateFormat: "MM/dd/yyyy",
    direction: "ltr",
    region: "iad1", // Vercel us-east-1 (default)
    status: "ga",
  },
  es: {
    code: "es",
    label: "Spanish",
    nativeLabel: "Español",
    currency: "EUR",
    dateFormat: "dd/MM/yyyy",
    direction: "ltr",
    region: "mad1", // Vercel Madrid
    status: "preview",
  },
  fr: {
    code: "fr",
    label: "French",
    nativeLabel: "Français",
    currency: "EUR",
    dateFormat: "dd/MM/yyyy",
    direction: "ltr",
    region: "cdg1", // Vercel Paris
    status: "preview",
  },
  de: {
    code: "de",
    label: "German",
    nativeLabel: "Deutsch",
    currency: "EUR",
    dateFormat: "dd.MM.yyyy",
    direction: "ltr",
    region: "fra1", // Vercel Frankfurt
    status: "preview",
  },
  pt: {
    code: "pt",
    label: "Portuguese",
    nativeLabel: "Português",
    currency: "EUR",
    dateFormat: "dd/MM/yyyy",
    direction: "ltr",
    region: "gru1", // Vercel São Paulo
    status: "preview",
  },
  ja: {
    code: "ja",
    label: "Japanese",
    nativeLabel: "日本語",
    currency: "JPY",
    dateFormat: "yyyy/MM/dd",
    direction: "ltr",
    region: "hnd1", // Vercel Tokyo
    status: "planned",
  },
} as const;

export type LocaleCode = keyof typeof LOCALES;
export const ALL_LOCALES = Object.keys(LOCALES) as LocaleCode[];

export function isLocale(value: string | undefined | null): value is LocaleCode {
  return !!value && value in LOCALES;
}

export function getLocaleMeta(code: LocaleCode) {
  return LOCALES[code];
}

/**
 * Map of legal-residency → recommended data region.
 * Used to route new tenants to the nearest Supabase project (Phase 2: multi-region).
 */
export const RESIDENCY_REGIONS = {
  US: { region: "iad1", supabaseRegion: "us-east-1", currency: "USD" },
  EU: { region: "fra1", supabaseRegion: "eu-central-1", currency: "EUR" },
  UK: { region: "lhr1", supabaseRegion: "eu-west-2", currency: "GBP" },
  CA: { region: "iad1", supabaseRegion: "ca-central-1", currency: "CAD" },
  APAC: { region: "sin1", supabaseRegion: "ap-southeast-1", currency: "USD" },
  JP: { region: "hnd1", supabaseRegion: "ap-northeast-1", currency: "JPY" },
} as const;

export type Residency = keyof typeof RESIDENCY_REGIONS;
