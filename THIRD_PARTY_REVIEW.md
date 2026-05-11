# Sentry by Dark Rock Labs — Independent Platform Review

**Reviewed:** May 8, 2026
**Subject:** Sentry v3.1.0 — multi-tenant SaaS deployed on Vercel + Supabase
**Reviewer scope:** Architecture, security, performance, accessibility, compliance, operability, and scale.

This is a candid, prioritized list of what is strong, what is weak, and what should be done next. It is meant to be read by an engineering lead and a security buyer at the same time.

---

## 0. Executive summary

Sentry is in good shape for the stage it is at. The multi-tenant data model is correct, Row-Level Security is wired at the database layer (not just at the application), and the marketing surface is well-instrumented for SEO. The fastest wins for trust and revenue are: (1) a third-party penetration test and SOC 2 Type II, (2) a finished observability stack with on-call paging, (3) automated CI gates (typecheck + tests + audit) so quality stays steady as the team grows. The biggest **latent risk** is operational, not architectural: a single Supabase project, a single Vercel project, and no documented disaster-recovery runbook. None of those are hard to fix, but they need to be fixed before the first enterprise procurement review.

**Bottom line:** the architecture will scale to ~1,000 tenants without a rewrite. The compliance posture needs ~6 months of evidence-gathering and one audit. The operations posture needs a focused 30-day sprint.

---

## 1. What's strong

| Area | Why it's working |
|---|---|
| Multi-tenant isolation | `tenantId` FK on every data table, RLS policies enforced at Postgres, helper `current_tenant_id()` consulted on every query path. Defence-in-depth: even a bug in app code can't cross tenants. |
| Auth model | Supabase Auth (managed) avoids rolling our own; magic-link + password + invite flows are all in place. `super_admin` impersonation is gated behind an httpOnly cookie with an audit-friendly banner. |
| SEO surface | Per-module SSG, dynamic OG images, sitemap, robots, JSON-LD Organization + SoftwareApplication + BreadcrumbList. This is better than most early-stage SaaS. |
| Deploy hygiene | Vercel + GitHub auto-deploy, `vercel.json` security headers, scheduled crons declared in-repo, secrets only in env vars. |
| Demo isolation | Each prospect gets a freshly cloned tenant rather than a shared sandbox — eliminates "another customer broke our demo" failure mode. |
| Type-safe data layer | Prisma 7 with app-supplied string IDs (no surprises across environments) and 11/18 modules promoted from JSON-blob to typed tables. |

---

## 2. Highest-priority gaps (next 30 days)

### 2.1 No automated CI gates

There is no GitHub Actions workflow running `tsc --noEmit`, `eslint`, `next build`, or `jest` on PRs today. Deploys can succeed even when tests fail locally. **Add a `.github/workflows/ci.yml` that runs typecheck + lint + tests + build on every PR** and require it before merge. Cost: half a day.

### 2.2 No observability / paging

`vercel logs` is the only signal. There is no structured logging, no error aggregator (Sentry.io, Logtail, Axiom, Datadog), no uptime monitor, no on-call rotation. **Wire @sentry/nextjs (the error monitor, different product) or Axiom; set up a Better Stack uptime check on `/`, `/login`, and `/api/health`; create a PagerDuty schedule.** Without this, the first prod outage is also the first time you know about it.

### 2.3 No backups owned by you

Supabase keeps PITR backups, but on the free/pro plan they live in the same blast radius as your project. **Schedule a nightly `pg_dump` into a separate object store (R2 / S3) in a different region, retain 30 days, and document a restore drill.** This is also a SOC 2 Common Criteria item.

### 2.4 No rate limiting

`/api/*` and server actions have no rate limit. `/login` is protected by Supabase, but everything else is open. **Add Upstash Ratelimit or Vercel's built-in throttle to (a) auth endpoints, (b) email-sending actions, (c) report generation.** A single abusive tenant could otherwise burn your Resend quota or DDoS the report renderer.

### 2.5 Secrets hygiene audit

The `.env` in this repo is gitignored, but several scripts still re-read `process.env.RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_URL` directly. **Pull secrets through a single `src/lib/env.ts` module that validates with Zod at boot**; that gives one place to add rotation, redaction, and missing-var warnings. The current setup will eventually leak one of these to a stack trace.

### 2.6 No CSP

`vercel.json` has X-Frame-Options, HSTS, and Permissions-Policy, but no `Content-Security-Policy`. **Draft a report-only CSP first** (`default-src 'self'; img-src 'self' data: https:; ...`), observe report-uri for 2 weeks, then promote to enforcing. The biggest payoff in security headers you have not yet collected.

---

## 3. Architecture review

### 3.1 The strong choices

- **Server Components by default, Client Components only at interaction edges.** This is the right call for an admin-heavy product where most pages are read-mostly.
- **Zustand for client state.** Lighter than Redux, easier to debug than React Context, no opinionated middleware tax.
- **Single Postgres for now.** Sharding is premature. The schema has tenantId everywhere, so the future migration is mechanical, not a redesign.

### 3.2 The drifts to watch

- **JSON blob persistence on 7/18 modules.** Each one is a future migration job. Set a policy: every new module ships as a typed table; existing JSON blobs migrate when they get a new feature. Otherwise the blob grows indefinitely.
- **Server actions vs. API routes.** You have both. Pick one as primary (server actions for tenant-scoped mutations, API routes only for webhooks and third-party callbacks) and document it. Mixing them confuses contributors and complicates rate limiting.
- **`getSessionUser()` is called per-component.** Each call re-hits Supabase. **Wrap it with `React.cache()`** so a single render only resolves the session once. Free latency win.
- **No middleware boundary.** Auth checks live inside each server action; if one is forgotten, the action runs unauthenticated. **Add a `middleware.ts` that fast-rejects unauthenticated requests to `/app` and `/admin`** before they reach the route handler.

### 3.3 Database

- Add `CREATE INDEX CONCURRENTLY` on every `tenantId` column. Today they are FKs but not always indexed; on a 50k-row table, queries will degrade.
- Add a `created_at` index where you sort by it (assessments, tickets, incidents).
- Consider Prisma's `relationMode = "prisma"` if you want to drop FK constraints for faster bulk operations later — but keep them for now.

---

## 4. Security review

### 4.1 What's already correct

- RLS enabled on every tenant-scoped table.
- HTML sanitization on every untrusted render.
- Service-role key never reaches the browser.
- httpOnly impersonation cookie with the orange visible banner.
- Strict security headers minus CSP.

### 4.2 Findings, prioritized

| Sev | Finding | Recommendation |
|---|---|---|
| High | No CSP | Draft report-only, then enforce (see §2.6). |
| High | No rate limiting | Add Upstash Ratelimit on auth and email actions. |
| High | No penetration test | Engage a reputable firm (Trail of Bits, Bishop Fox, Doyensec) within 90 days. Budget USD 25–60k for a 1–2 week web app pentest. |
| Med | Audit log is partial | Every `super_admin` impersonation should write a row to a `audit_log` table — currently only the cookie is set. Required for SOC 2 CC7.2. |
| Med | No MFA | Supabase Auth supports TOTP. Enable it for `super_admin` accounts immediately, all users in the next quarter. |
| Med | No session timeout policy | Add idle-timeout (default 8 hours) and absolute-timeout (12 hours) for app sessions; surface in tenant settings. |
| Med | No bot protection | `/login` and `/contact` mailto links will attract scrapers. Consider Vercel BotID (now GA) or Cloudflare Turnstile on the login form. |
| Low | Dependency vulnerability monitoring | Turn on Dependabot security updates + Renovate weekly. Currently dependencies are pinned but not actively monitored. |
| Low | No password policy surfaced | Supabase Auth lets you configure min length, character classes. Set min length to 12, require non-trivial, and surface that in the signup UI. |
| Low | `dangerouslySetInnerHTML` usage | A handful of sites in JSON-LD. Audit each one and confirm input is trusted (currently true, but a future contributor may not know). |

### 4.3 Threat model gaps

There is no threat model document. Build one — a single page is fine — using STRIDE per asset (User, Tenant, AdminConsole, ResendAPI, SupabaseDB). It will surface 3–5 mitigations you have not thought of. Required reading for SOC 2 CC3.

---

## 5. Performance

### 5.1 What's working

- Per-module pages are SSG'd. First load is fast.
- Images are served from Vercel's optimized CDN.
- Next.js Server Components keep client JS bundles small.

### 5.2 What to measure (you can't fix what you can't see)

- **Web Vitals collection.** Add `@vercel/speed-insights` and `@vercel/analytics` so LCP, CLS, INP are tracked per page in production. Free for now.
- **Database query latency.** Enable `pg_stat_statements` and dump top-10 slowest weekly to a Grafana board or a Supabase dashboard.
- **API latency from the client's perspective.** Real-User Monitoring (RUM) tells you what users feel, not what the server measured.

### 5.3 Likely wins

- Wrap `getSessionUser()` in `React.cache()` (mentioned above) — saves one Supabase round-trip per component that calls it. On the dashboard alone this is probably 3–5 round-trips per page render.
- The `MODULES` array is imported by ~6 components. It's small (~5KB JSON-equivalent), but it forces a client bundle import where it could be server-only. Move the array to a server module and pass the bare minimum to clients.
- The dashboard recharts bundle is heavy. Code-split with `next/dynamic` so it only loads when the dashboard route is hit.
- Switch to Fluid Compute streaming SSR for any dashboard with synchronous data fetches.

### 5.4 Future scale concerns

- A single Postgres at 10k–50k tenants will run out of connections before it runs out of CPU. Make sure Prisma uses pgBouncer connection-pooling URL in prod (which Supabase enables by default — verify you are using the pooled URL, not the direct URL, in serverless).
- The TenantState JSON blob is unbounded. Today it averages ~30KB per tenant; for a power user it could be 5MB. Set a hard cap (e.g. 2MB) and shard hot keys to typed tables as they grow.

---

## 6. Accessibility (a11y)

This is the area with the lowest current score and the highest reputational risk if an enterprise buyer asks for a VPAT.

**Findings:**

| Sev | Finding |
|---|---|
| High | No documented accessibility baseline. No Axe / pa11y CI step. |
| High | Many interactive elements (the tenant switcher dropdown, the cookie consent banner, the OG-image teaser CTAs) are styled but lack ARIA labels or keyboard focus management. |
| Med | Color contrast: Aurora Teal (#00B4A6) on Deep Obsidian (#0A0E14) is fine, but Aurora Teal on the `rgba(0,180,166,0.10)` pill background is borderline AA. Run a Lighthouse a11y audit and fix anything below 4.5:1 for text. |
| Med | No skip-link on the marketing pages. Add `<a href="#main">Skip to content</a>`. |
| Med | Focus rings have been suppressed in places by CSS. Restore them; an outline is better than no outline. |
| Low | OG images do not have `alt` text generated dynamically. Per-module OG already has it via `generateImageMetadata`, but the homepage OG does not. |

**Recommended action:** add `@axe-core/playwright` to the test suite and gate PRs on zero new violations. Then run an external WCAG 2.1 AA audit before announcing enterprise availability.

---

## 7. Compliance posture

### 7.1 Current state

| Framework | Status | Effort to reach |
|---|---|---|
| GDPR / UK GDPR | DPA exists, DPO email, privacy policy. Sub-processor list public. **Mostly ready.** | 2 weeks of polish + a sub-processor change-notification process. |
| CCPA / CPRA | Privacy policy covers it implicitly. Add a "Do Not Sell or Share" link as a no-op (since you don't sell). | 1 day. |
| SOC 2 Type I | Not started. Most CC controls are technically present but undocumented. | 8–10 weeks with a tool like Drata, Vanta, or Secureframe. USD 12–25k. |
| SOC 2 Type II | Needs a 6-month observation window after Type I. | 6 months calendar + USD 15–30k audit. |
| ISO 27001 | Controls mostly map to SOC 2; ISO is the better choice if you're EU-first. | 6–9 months calendar + USD 20–40k. |
| HIPAA | BAA available, Supabase + Vercel both have BAAs available on enterprise plans. **Don't claim HIPAA-compliance until you've signed BAAs with both upstream vendors.** | 1 month + plan upgrades. |
| PCI-DSS | Out of scope today (no card data handled in-app). |
| FedRAMP | Out of scope for next 18 months — requires GovCloud and a US-citizen-only ops team. |

### 7.2 The cheap items to do this month

- Publish the sub-processor list at `/security#subprocessors` (done in this PR).
- Email administrators 30 days before any sub-processor change (need a script + a list).
- Stand up a "Trust Portal" — even a simple landing page at `/security` with PDFs gated by an email-form — and stop sending the SOC 2 report by attachment.
- Get a `security.txt` at `/.well-known/security.txt` (5-minute task, signals professionalism to every researcher and procurement reviewer who looks).

### 7.3 Avoid these mistakes

- Don't claim certifications you don't have. "SOC 2 in progress" is fine; "SOC 2 compliant" before audit is not.
- Don't promise "end-to-end encryption" unless you mean it. You have encryption in transit and at rest, which is enough — but the phrase E2EE has a specific meaning.
- Don't list every framework on the website unless you can produce evidence on request.

---

## 8. Operability

### 8.1 Gaps

- **No runbook.** "What does the on-call engineer do when `/login` returns 500?" — undocumented. Create `/docs/runbooks/{deploy-failure,db-down,smtp-down,supabase-outage}.md`.
- **No status page.** Customers learn about outages from being unable to log in. Cheap fix: statuspage.io free tier or Vercel's built-in status integration.
- **No feature flags.** Releasing a risky module change ships to 100% of tenants immediately. Add a lightweight feature-flag layer (Vercel Edge Config, GrowthBook, Statsig) before the customer base outgrows what you can manually email about.
- **No structured logging.** Console logs are unstructured strings; you can't query by tenantId or userId after the fact. Migrate to a single `log.info({ tenantId, ... }, "message")` helper that targets pino → Axiom.
- **No load test.** You don't know your breaking point. Run a k6 script against staging (1, 10, 100, 500 concurrent users) and document the result. Repeat quarterly.
- **No DR plan.** What happens if Supabase loses a region? Today: hours of downtime and possible data loss. With a nightly cross-region dump (§2.3) plus a documented restore procedure, RPO is 24h and RTO is ~4h. Get this written down.

### 8.2 Cost watchpoints

At current scale, costs are negligible. Watch these as you grow:

- **Vercel function execution time** — Fluid Compute is fine, but `next/og` ImageResponse renders are CPU-heavy. Cache aggressively (which Next.js already does at build time for SSG pages — only worry if you switch any OG to dynamic).
- **Resend volume** — at 100 emails/day/tenant × 1000 tenants you'll need the production tier. Budget USD 100/mo at GA scale.
- **Supabase egress** — heavy report PDF downloads count. Generate PDFs in the function and return them, don't fan out to clients to fetch.

---

## 9. Developer experience

| Item | State | Action |
|---|---|---|
| Local setup | A new dev needs Supabase keys, RESEND_API_KEY, a DATABASE_URL. No `npm run setup:local`. | Build a `scripts/dev-setup.mjs` that prints a checklist. |
| Tests | Jest + Testing Library configured. Coverage unknown, no CI gate. | Add coverage report + 70% minimum. |
| E2E | Playwright installed, no scenarios committed. | Write 3 critical-path scenarios: login → dashboard, create-assessment, run-incident. |
| Storybook | Not present. With 18 modules + many UI primitives, this hurts. | Add Storybook for `src/components/ui/*` and screenshot test critical pages. |
| Type strictness | `strict: true` in tsconfig (assumed — verify). Use `noUncheckedIndexedAccess` if not yet on. | One-time fix. |
| Docs | CLAUDE.md, DEPLOYMENT.md, SUPABASE_SETUP.md — good for an LLM, sparse for a human. | A 10-minute onboarding doc for a new engineer. |

---

## 10. Internationalization (i18n)

Phase 1 scaffolding shipped in this PR (locale config, message bundles, formatters, residency map, legal pages, cookie consent). Phase 2 work is documented in `src/i18n/README.md` and intentionally deferred until a non-EN customer is on the horizon.

**Risk:** if you take a Spanish-speaking customer before Phase 2, the marketing copy will appear in English to them. That's survivable for early customers but not for procurement. Either deliver Phase 2 before pitching outside the US, or scope deals as English-only until ready.

---

## 11. The 90-day priority stack

If only one engineer is doing this in the background of feature work:

**Days 1–14:** CI gates, structured logging + Axiom, error monitoring, status page, security.txt, 3 Playwright scenarios, Trust Portal stub. *Outcome: you know when you break, and you can show it.*

**Days 15–45:** CSP (report-only → enforce), rate limiting, Audit log table, MFA for super_admin, dependency Dependabot, nightly pg_dump to R2, runbook for top-5 failure modes, threat model document. *Outcome: SOC 2 evidence-collection is no longer the bottleneck.*

**Days 46–90:** External pentest (~2 weeks), SOC 2 Type I kickoff (Drata/Vanta), VPAT-style accessibility audit, feature-flag layer, k6 load test baseline. *Outcome: you can answer every enterprise procurement question with a document, not a maybe.*

---

## 12. What this review did NOT cover

- Financial / billing flows. Stripe was de-scoped.
- AI / LLM safety review (if you add an AI module, redo this section).
- Mobile app (none today).
- Marketing copy quality, brand strategy.
- Hiring plan, team composition.

---

## 13. Closing

The platform is meaningfully ahead of where most pre-seed cybersecurity SaaS sit at this stage. The work between here and an enterprise procurement-ready product is mostly **paperwork, observability, and one audit**, not refactors. The biggest mindset shift to make is: stop treating "passing the build" as evidence of correctness. Start treating "shipping with monitoring, rate limiting, and a documented response procedure" as the bar. Everything else will compound from there.

— *End of review*
