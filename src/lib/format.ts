/**
 * Locale-aware formatters. Use these throughout the app instead of raw
 * `toLocaleString()` / `toFixed()` calls so a locale switch later cascades
 * everywhere automatically.
 */
import { DEFAULT_LOCALE, type LocaleCode, LOCALES } from "@/i18n/config";

const localeTagMap: Record<LocaleCode, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-PT",
  ja: "ja-JP",
};

export function tag(locale: LocaleCode = DEFAULT_LOCALE) {
  return localeTagMap[locale] ?? "en-US";
}

export function formatNumber(value: number, locale: LocaleCode = DEFAULT_LOCALE, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(tag(locale), opts).format(value);
}

export function formatCurrency(value: number, locale: LocaleCode = DEFAULT_LOCALE, currency?: string) {
  const cur = currency ?? LOCALES[locale].currency;
  return new Intl.NumberFormat(tag(locale), {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: Date | string | number, locale: LocaleCode = DEFAULT_LOCALE, style: "short" | "medium" | "long" = "medium") {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(tag(locale), { dateStyle: style }).format(d);
}

export function formatDateTime(value: Date | string | number, locale: LocaleCode = DEFAULT_LOCALE) {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(tag(locale), { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function formatRelative(value: Date | string | number, locale: LocaleCode = DEFAULT_LOCALE) {
  const now = Date.now();
  const then = value instanceof Date ? value.getTime() : new Date(value).getTime();
  const diffSec = Math.round((then - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(tag(locale), { numeric: "auto" });
  const buckets: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];
  for (const [unit, sec] of buckets) {
    if (Math.abs(diffSec) >= sec || unit === "second") {
      return rtf.format(Math.round(diffSec / sec), unit);
    }
  }
  return "";
}
