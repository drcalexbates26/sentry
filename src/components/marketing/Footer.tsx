import Link from "next/link";
import { RookLogo } from "./RookLogo";

const colors = {
  obsidianM: "#151C28",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  teal: "#00B4A6",
  panelBorder: "#1E293B",
};

export function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${colors.panelBorder}`, background: colors.obsidianM }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px 28px 32px",
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
          gap: 40,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <RookLogo size={36} />
            <div>
              <div style={{ color: colors.text, fontWeight: 700, fontSize: 16 }}>Sentry</div>
              <div style={{ color: colors.teal, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em" }}>
                DARK ROCK LABS
              </div>
            </div>
          </div>
          <p style={{ color: colors.textMuted, marginTop: 16, fontSize: 14, lineHeight: 1.6, maxWidth: 360 }}>
            The cyber resilience platform purpose-built for incident response, assessment, and operational readiness.
          </p>
        </div>

        <FooterCol title="Product" links={[
          { label: "Capabilities", href: "#capabilities" },
          { label: "Modules", href: "#modules" },
          { label: "How it works", href: "#how" },
          { label: "Sign in", href: "/login" },
        ]} />

        <FooterCol title="Company" links={[
          { label: "Dark Rock Labs", href: "https://darkrocklabs.com" },
          { label: "Dark Rock Security", href: "https://darkrocksecurity.com" },
          { label: "Contact", href: "mailto:contact@darkrocksecurity.com" },
          { label: "Talk to us", href: "mailto:contact@darkrocksecurity.com?subject=Sentry%20demo" },
        ]} />

        <FooterCol title="Trust" links={[
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
          { label: "Security", href: "/security" },
          { label: "Report a vulnerability", href: "mailto:security@darkrocksecurity.com" },
        ]} />
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 28px",
          borderTop: `1px solid ${colors.panelBorder}`,
          color: colors.textDim,
          fontSize: 12,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>© {new Date().getFullYear()} Dark Rock Labs. All rights reserved.</div>
        <div>Sentry v3.1.0</div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <div style={{ color: colors.text, fontWeight: 700, fontSize: 13, marginBottom: 14 }}>{title}</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              style={{ color: colors.textMuted, fontSize: 14, textDecoration: "none" }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
