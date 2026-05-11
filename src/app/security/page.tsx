import type { Metadata } from "next";
import { LegalShell } from "@/components/marketing/LegalShell";

export const metadata: Metadata = {
  title: "Security — Sentry by Dark Rock",
  description: "How Sentry is built, secured, and operated. Sub-processors, controls, and reporting.",
};

const LAST_UPDATED = "May 8, 2026";

export default function SecurityPage() {
  return (
    <LegalShell title="Security at Sentry" lastUpdated={LAST_UPDATED}>
      <p>
        Security isn't a layer we add — it's the product. This page summarizes how we build, operate, and report on the
        security of Sentry by Dark Rock Labs.
      </p>

      <h2>Architecture</h2>
      <ul>
        <li><strong>Multi-tenant isolation</strong> — every data row carries a tenantId and is protected by Postgres Row-Level Security policies, not just application checks.</li>
        <li><strong>Encryption in transit</strong> — TLS 1.3 on every public endpoint; HSTS preload-eligible.</li>
        <li><strong>Encryption at rest</strong> — AES-256 (Supabase / Vercel managed storage).</li>
        <li><strong>Secret management</strong> — secrets live only in Vercel environment variables; nothing in the repo, nothing in logs.</li>
        <li><strong>Least-privilege auth</strong> — Supabase Auth + Postgres roles; service-role keys never reach the browser.</li>
      </ul>

      <h2>Application security</h2>
      <ul>
        <li>Server actions enforce session checks and tenant scoping on every request.</li>
        <li>Strict security headers: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Permissions-Policy, Referrer-Policy strict-origin-when-cross-origin.</li>
        <li>HTML sanitization (sanitize-html) on every untrusted HTML render.</li>
        <li>Dependency scanning via GitHub Dependabot; high-severity advisories fixed within 7 days.</li>
      </ul>

      <h2 id="subprocessors">Sub-processors</h2>
      <ul>
        <li><strong>Vercel Inc.</strong> — application hosting and edge delivery.</li>
        <li><strong>Supabase Inc.</strong> — Postgres database, authentication, object storage.</li>
        <li><strong>Resend Inc.</strong> — transactional email.</li>
      </ul>
      <p>We notify administrators of material sub-processor changes at least 30 days in advance.</p>

      <h2>Operational practices</h2>
      <ul>
        <li><strong>Backups</strong> — automated daily snapshots with point-in-time recovery to 7 days.</li>
        <li><strong>Logging</strong> — request logs retained 30 days; security audit logs retained 12 months.</li>
        <li><strong>Incident response</strong> — 24-hour notification target for confirmed security incidents affecting Customer Data.</li>
        <li><strong>Change management</strong> — every production change ships through a PR with code review and automated checks.</li>
      </ul>

      <h2>Compliance roadmap</h2>
      <ul>
        <li><strong>SOC 2 Type II</strong> — observation period in progress (target completion Q4 2026).</li>
        <li><strong>ISO 27001</strong> — controls mapped; certification audit scheduled Q1 2027.</li>
        <li><strong>HIPAA</strong> — BAA available for Enterprise customers handling PHI.</li>
        <li><strong>GDPR / UK GDPR / CCPA</strong> — DPA available at contract signing.</li>
      </ul>

      <h2>Reporting vulnerabilities</h2>
      <p>
        We welcome reports from the security community. Email{" "}
        <a href="mailto:security@darkrocksecurity.com">security@darkrocksecurity.com</a> or use our PGP key (fingerprint
        available on request). We commit to acknowledging reports within 2 business days and providing a status update
        within 7 days. We do not pursue good-faith researchers who follow responsible disclosure.
      </p>

      <h2>Trust portal</h2>
      <p>
        Customers and prospects under NDA may request SOC 2 reports, penetration-test summaries, and our latest
        sub-processor list at{" "}
        <a href="mailto:trust@darkrocksecurity.com">trust@darkrocksecurity.com</a>.
      </p>
    </LegalShell>
  );
}
