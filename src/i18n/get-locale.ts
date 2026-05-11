import { cookies, headers } from "next/headers";
import { ALL_LOCALES, DEFAULT_LOCALE, isLocale, type LocaleCode } from "./config";

const COOKIE_NAME = "sentry_locale";

/**
 * Resolve the active locale, in priority order:
 *   1. `sentry_locale` cookie (set explicitly by user via switcher)
 *   2. Accept-Language header best match
 *   3. DEFAULT_LOCALE
 *
 * Safe to call from any server component or server action.
 */
export async function getLocale(): Promise<LocaleCode> {
  const c = await cookies();
  const cookie = c.get(COOKIE_NAME)?.value;
  if (isLocale(cookie)) return cookie;

  const h = await headers();
  const accept = h.get("accept-language") || "";
  const candidate = accept
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase().slice(0, 2))
    .find((code) => code && isLocale(code));
  if (candidate && isLocale(candidate)) return candidate;

  return DEFAULT_LOCALE;
}

export async function setLocale(code: LocaleCode) {
  const c = await cookies();
  c.set(COOKIE_NAME, code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: true,
    httpOnly: false,
  });
}

export { ALL_LOCALES, DEFAULT_LOCALE };
