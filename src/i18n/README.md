# Internationalization (Phase 1 — scaffolding)

Sentry is wired for multi-locale UI but only ships **English** today. The
scaffolding lets us add a second locale without churning the whole codebase.

## What's here

```
src/i18n/
├── config.ts            # Locale list + region routing
├── get-locale.ts        # Server-side locale resolver (cookie → Accept-Language → en)
├── index.ts             # getTranslator(locale) → t("path", vars)
└── messages/
    ├── en.json          # GA
    ├── es.json          # preview (machine baseline)
    ├── fr.json          # preview
    └── de.json          # preview
```

Use `formatNumber / formatCurrency / formatDate` from `@/lib/format` instead of
raw `toLocaleString` calls so a locale switch propagates everywhere.

## What's intentionally NOT here yet

- **Route-level `/[locale]/...` prefixing.** Adds middleware to every request
  and breaks our existing canonical URLs. We add it the day we sign a non-EN
  customer.
- **Translated marketing copy.** Stubs only. Native-speaker review before any
  locale leaves `preview`.
- **Translated module content.** The control catalogs (NIST CSF) reference
  upstream English-only standards; we'll add a sidecar dictionary for control
  *names*, not the underlying control IDs.

## Phase 2 checklist (add when needed)

- [ ] `npm install next-intl`
- [ ] Move `src/app/(marketing)/*` under `src/app/[locale]/(marketing)/*`
- [ ] Add `middleware.ts` calling `createMiddleware` from next-intl
- [ ] Emit `<link rel="alternate" hrefLang="...">` on every public page
- [ ] Add a locale switcher in `Nav`
- [ ] Translate `messages/*.json` end-to-end and flip status to `ga`
- [ ] Provision a Supabase project per data-residency region; route signup by
      `RESIDENCY_REGIONS` from `config.ts`.
