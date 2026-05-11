import en from "./messages/en.json";
import es from "./messages/es.json";
import fr from "./messages/fr.json";
import de from "./messages/de.json";

import { type LocaleCode, DEFAULT_LOCALE } from "./config";

export const messages = { en, es, fr, de } as Record<string, typeof en>;

/**
 * Get a nested message by dot path, e.g. `t("marketing.heroTitle")`.
 * Falls back to English then to the path itself if missing.
 * String interpolation: `t("greeting", { name: "Alex" })` replaces `{name}`.
 */
export function getTranslator(locale: LocaleCode) {
  const bundle = messages[locale] ?? messages[DEFAULT_LOCALE];
  const fallback = messages[DEFAULT_LOCALE];
  return function t(path: string, vars?: Record<string, string | number>) {
    const raw = lookup(bundle, path) ?? lookup(fallback, path) ?? path;
    if (typeof raw !== "string") return path;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
  };
}

function lookup(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export { LOCALES, ALL_LOCALES, DEFAULT_LOCALE, type LocaleCode } from "./config";
