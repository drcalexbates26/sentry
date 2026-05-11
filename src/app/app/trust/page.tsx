import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const colors = {
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  teal: "#00B4A6",
  tealLight: "#33C4B8",
  bg: "#0A0E14",
  panel: "#0F1623",
  panelLight: "#151C28",
  panelBorder: "#1E293B",
  green: "#22C55E",
  orange: "#F97316",
};

interface Subprocessor {
  name: string;
  category: string;
  purpose: string;
  region: string;
  contractType: string;
  url: string;
}

const SUBPROCESSORS: Subprocessor[] = [
  {
    name: "Supabase",
    category: "Database & Authentication",
    purpose: "Hosts the multi-tenant Postgres database, Authentication (Supabase Auth), and Storage. Backups, encryption at rest, row-level security policies.",
    region: "United States · us-east-1",
    contractType: "Data Processing Agreement available · SOC 2 Type II",
    url: "https://supabase.com/security",
  },
  {
    name: "Vercel",
    category: "Application Hosting",
    purpose: "Hosts the Sentry web application, runs server functions, serves static assets, terminates TLS, and runs the threat-intel cron jobs.",
    region: "United States · Global edge for static delivery",
    contractType: "Data Processing Agreement available · SOC 2 Type II",
    url: "https://vercel.com/security",
  },
  {
    name: "Resend",
    category: "Transactional Email",
    purpose: "Delivers tenant-facing emails: assessment reports, weekly digests, incident notifications, password-reset magic links.",
    region: "United States · us-east-1",
    contractType: "Data Processing Agreement available",
    url: "https://resend.com/security",
  },
  {
    name: "Cloudflare",
    category: "DNS & DDoS Mitigation",
    purpose: "DNS resolution for production domains, edge DDoS protection, bot mitigation.",
    region: "United States · Global anycast network",
    contractType: "Standard contractual clauses · ISO 27001 / SOC 2 Type II",
    url: "https://www.cloudflare.com/trust-hub/",
  },
  {
    name: "GitHub",
    category: "Source Control & CI",
    purpose: "Stores the Sentry application source code. No customer data flows through GitHub.",
    region: "United States",
    contractType: "Standard contractual clauses",
    url: "https://github.com/security",
  },
  {
    name: "Anthropic Claude (optional)",
    category: "AI Assistance",
    purpose: "Used only at tenant explicit opt-in for AI-assisted analysis. Not used in default platform operation. Zero data retention agreement.",
    region: "United States",
    contractType: "Zero data retention; on-demand only",
    url: "https://www.anthropic.com/legal/privacy",
  },
];

export default async function InAppTrustPage() {
  // Gate behind authentication so tenant users can review without being logged out.
  await requireUser();

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, padding: "32px 24px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <Link href="/app" style={{ color: colors.tealLight, fontSize: 12, textDecoration: "none" }}>
          ← Back to Sentry
        </Link>

        <header style={{ marginTop: 14, marginBottom: 24 }}>
          <div style={{ color: colors.tealLight, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", fontFamily: "Figtree, sans-serif" }}>
            SECURITY & TRUST
          </div>
          <h1 style={{ color: colors.text, fontSize: 30, fontWeight: 800, margin: "6px 0 0", letterSpacing: "-0.02em", fontFamily: "Figtree, sans-serif" }}>
            How Sentry is secured
          </h1>
          <p style={{ color: colors.textMuted, fontSize: 13, margin: "8px 0 0", lineHeight: 1.65, maxWidth: 720 }}>
            This is the in-tenant summary of how we run the platform. The same controls are described publicly at <code style={{ color: colors.text }}>/security</code>. For a SOC 2 report under NDA or a Data Processing Agreement, email{" "}
            <a href="mailto:trust@darkrocksecurity.com" style={{ color: colors.teal }}>trust@darkrocksecurity.com</a>.
          </p>
        </header>

        {/* Posture summary */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 24 }}>
          <Tile label="Transport encryption" value="TLS 1.3" tone={colors.green} />
          <Tile label="At-rest encryption" value="AES-256" tone={colors.green} />
          <Tile label="Multi-tenant isolation" value="Postgres RLS" tone={colors.green} sub="Row-level security policies enforced at the DB layer, not just app layer." />
          <Tile label="Authentication" value="Supabase Auth + MFA" tone={colors.green} sub="MFA enforced for admin accounts." />
          <Tile label="Backups" value="Daily · 7-day PITR" tone={colors.green} />
          <Tile label="SOC 2" value="Type II in progress" tone={colors.orange} sub="Target completion Q4 2026." />
        </section>

        {/* Sub-processor list */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ color: colors.text, fontSize: 18, fontWeight: 700, margin: "0 0 6px", fontFamily: "Figtree, sans-serif" }}>Sub-processors</h2>
          <p style={{ color: colors.textMuted, fontSize: 12, margin: "0 0 14px", lineHeight: 1.6, maxWidth: 720 }}>
            The third-party services that process customer data on Dark Rock Labs's behalf. We notify tenants in advance of any material sub-processor changes.
          </p>

          <div style={{ background: colors.panel, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, overflow: "hidden" }}>
            {SUBPROCESSORS.map((s, i) => (
              <div
                key={s.name}
                style={{
                  padding: "18px 20px",
                  borderTop: i === 0 ? "none" : `1px solid ${colors.panelBorder}`,
                  display: "grid",
                  gridTemplateColumns: "200px 1fr",
                  gap: 18,
                }}
              >
                <div>
                  <div style={{ color: colors.text, fontSize: 14, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ color: colors.tealLight, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", marginTop: 3 }}>{s.category}</div>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: colors.textMuted, fontSize: 11, textDecoration: "underline", marginTop: 6, display: "inline-block" }}>
                    Security page →
                  </a>
                </div>
                <div>
                  <p style={{ color: colors.text, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{s.purpose}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 14, rowGap: 4, marginTop: 10, fontSize: 11 }}>
                    <span style={{ color: colors.textDim }}>Region</span>
                    <span style={{ color: colors.textMuted }}>{s.region}</span>
                    <span style={{ color: colors.textDim }}>Contract</span>
                    <span style={{ color: colors.textMuted }}>{s.contractType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Compliance roadmap */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ color: colors.text, fontSize: 18, fontWeight: 700, margin: "0 0 6px", fontFamily: "Figtree, sans-serif" }}>Compliance posture</h2>
          <div style={{ background: colors.panel, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: "18px 20px" }}>
            <RoadmapRow title="GDPR / UK GDPR" status="In place" tone={colors.green} note="DPA available · sub-processor change-notification process · data-subject rights handled by Privacy Officer." />
            <RoadmapRow title="CCPA / CPRA" status="In place" tone={colors.green} note="Privacy policy covers consumer rights. We do not sell personal data." />
            <RoadmapRow title="SOC 2 Type II" status="In progress" tone={colors.orange} note="Observation window underway. Target completion Q4 2026 via Drata / Vanta tooling." />
            <RoadmapRow title="ISO 27001" status="Planned" tone={colors.textDim} note="Most controls map from SOC 2; certification audit targeted Q1 2027." />
            <RoadmapRow title="HIPAA" status="BAA available" tone={colors.green} note="Signed BAA available for Enterprise tenants. Supabase + Vercel sub-processor BAAs required on enterprise plans." />
            <RoadmapRow title="FedRAMP" status="Not in scope" tone={colors.textDim} note="Requires GovCloud + US-citizen-only ops team. Roadmap horizon ≥ 18 months." />
          </div>
        </section>

        {/* Reporting + contact */}
        <section style={{ background: colors.panel, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: "18px 20px" }}>
          <h2 style={{ color: colors.text, fontSize: 16, fontWeight: 700, margin: "0 0 6px", fontFamily: "Figtree, sans-serif" }}>Reporting a security issue</h2>
          <p style={{ color: colors.textMuted, fontSize: 12, margin: "0 0 10px", lineHeight: 1.65 }}>
            We welcome reports from the security community. Email{" "}
            <a href="mailto:security@darkrocksecurity.com" style={{ color: colors.teal }}>security@darkrocksecurity.com</a>{" "}
            with reproduction steps. We acknowledge within 2 business days and provide a status update within 7 days. Good-faith researchers following responsible disclosure are protected.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill label="Security disclosures" value="security@darkrocksecurity.com" />
            <Pill label="Trust portal & DPA requests" value="trust@darkrocksecurity.com" />
            <Pill label="Privacy / data-subject rights" value="privacy@darkrocksecurity.com" />
          </div>
        </section>

        <p style={{ color: colors.textDim, fontSize: 11, margin: "20px 0 0", lineHeight: 1.6 }}>
          Last reviewed {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Generated by Sentry · Dark Rock Labs.
        </p>
      </div>
    </div>
  );
}

// ─── primitives ──────────────────────────────────────────────────────

function Tile({ label, value, tone, sub }: { label: string; value: string; tone: string; sub?: string }) {
  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.panelBorder}`, borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${tone}` }}>
      <div style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: tone, fontSize: 15, fontWeight: 800, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );
}

function RoadmapRow({ title, status, tone, note }: { title: string; status: string; tone: string; note: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 120px 1fr", gap: 14, padding: "10px 0", borderTop: `1px solid ${colors.panelBorder}`, alignItems: "baseline" }}>
      <span style={{ color: colors.text, fontSize: 13, fontWeight: 600 }}>{title}</span>
      <span style={{ color: tone, fontSize: 12, fontWeight: 700 }}>{status}</span>
      <span style={{ color: colors.textMuted, fontSize: 11, lineHeight: 1.5 }}>{note}</span>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: colors.panelLight, border: `1px solid ${colors.panelBorder}`, fontSize: 11 }}>
      <span style={{ color: colors.textDim }}>{label}</span>
      <a href={`mailto:${value}`} style={{ color: colors.teal, textDecoration: "none", fontFamily: "JetBrains Mono, monospace" }}>{value}</a>
    </span>
  );
}
