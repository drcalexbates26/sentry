import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/marketing/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Sentry by Dark Rock",
  description: "How Sentry by Dark Rock Labs collects, uses, and protects personal data.",
};

const LAST_UPDATED = "May 8, 2026";

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        Dark Rock Labs, Inc. ("<strong>Dark Rock</strong>", "we", "us") operates Sentry, a cyber-resilience platform.
        This policy explains what personal data we collect, why we collect it, and the rights you have over it. It is
        written to satisfy the EU GDPR, the UK GDPR, the California Consumer Privacy Act (CCPA/CPRA), Canada's PIPEDA,
        Brazil's LGPD, and similar frameworks worldwide.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> — name, work email, organization, and authentication identifiers (managed by
          Supabase Auth).
        </li>
        <li>
          <strong>Workspace data</strong> — content you and your team create inside Sentry (assessments, tickets,
          policies, etc.).
        </li>
        <li>
          <strong>Usage data</strong> — pages visited, feature events, and performance metrics, used solely to operate
          and improve the service.
        </li>
        <li>
          <strong>Communications</strong> — emails you send to support and the records of those exchanges.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <p>
        We process your data to (a) provide the service you signed up for, (b) maintain security and prevent abuse,
        (c) communicate with you about your account, and (d) comply with our legal obligations. We do not sell personal
        data, and we do not use it to train third-party AI models.
      </p>

      <h2>3. Legal bases (EEA / UK)</h2>
      <p>
        We rely on: <strong>performance of contract</strong> (delivering the service), <strong>legitimate interests</strong>
        (security, fraud prevention, product improvement), <strong>consent</strong> (optional marketing emails), and{" "}
        <strong>legal obligation</strong> (responding to lawful requests).
      </p>

      <h2>4. Sub-processors</h2>
      <p>We use carefully vetted sub-processors to operate the service:</p>
      <ul>
        <li>
          <strong>Vercel Inc.</strong> — application hosting (US, with multi-region support).
        </li>
        <li>
          <strong>Supabase Inc.</strong> — database, authentication, object storage.
        </li>
        <li>
          <strong>Resend Inc.</strong> — transactional email delivery.
        </li>
      </ul>
      <p>
        A current list is maintained at <Link href="/security#subprocessors">/security#subprocessors</Link>. We notify
        customers in advance of material sub-processor changes.
      </p>

      <h2>5. Data residency</h2>
      <p>
        US customers' data is stored in the United States by default. EU customers may request EU-resident storage
        (Frankfurt or Paris regions). UK, Canada, Brazil, and APAC residency is available on request for Enterprise
        plans.
      </p>

      <h2>6. Retention</h2>
      <p>
        We keep workspace data for the lifetime of your subscription plus 30 days after cancellation, after which it is
        permanently deleted. Backups are retained for an additional 30 days. Account logs and security telemetry are
        retained for 12 months.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Subject to applicable law, you may: access your data, correct inaccuracies, request deletion, restrict
        processing, port your data to another service, or object to a particular use. EU/UK residents may also lodge a
        complaint with a supervisory authority. Email{" "}
        <a href="mailto:privacy@darkrocksecurity.com">privacy@darkrocksecurity.com</a> to exercise any of these rights.
      </p>

      <h2>8. Children</h2>
      <p>Sentry is not intended for children under 16, and we do not knowingly collect data from them.</p>

      <h2>9. International transfers</h2>
      <p>
        Where we transfer personal data outside the EEA/UK, we rely on the European Commission's Standard Contractual
        Clauses (and the UK Addendum) plus supplementary security measures including encryption in transit and at rest.
      </p>

      <h2>10. Changes</h2>
      <p>
        We post material updates here and notify account administrators by email at least 30 days before they take
        effect.
      </p>

      <h2>11. Contact</h2>
      <p>
        Dark Rock Labs, Inc. · Data Protection Officer ·{" "}
        <a href="mailto:privacy@darkrocksecurity.com">privacy@darkrocksecurity.com</a>
      </p>
    </LegalShell>
  );
}
