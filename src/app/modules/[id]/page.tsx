import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { MODULES, DEFAULT_CALLOUTS, getModule, getRelatedModules } from "@/components/marketing/module-data";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sentry.darkrocklabs.com";

const colors = {
  obsidian: "#0A0E14",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  teal: "#00B4A6",
  tealLight: "#33C4B8",
  panel: "#0F1623",
  panelBorder: "#1E293B",
};

export async function generateStaticParams() {
  return MODULES.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const mod = getModule(id);
  if (!mod) return { title: "Module not found" };

  const url = `${SITE_URL}/modules/${id}`;
  const ogImage = `/marketing/screenshots/${mod.file}`;
  const title = `${mod.label} — ${mod.hero} | Sentry`;
  const description = `${mod.tagline} ${mod.description.slice(0, 140)}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: "Sentry by Dark Rock Labs",
      title,
      description,
      url,
      locale: "en_US",
      images: [{ url: ogImage, width: 1440, height: 900, alt: `Sentry — ${mod.label}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  };
}

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mod = getModule(id);
  if (!mod) notFound();

  const Icon = mod.icon;
  const callouts = mod.callouts ?? DEFAULT_CALLOUTS;
  const related = getRelatedModules(id, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Sentry", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Modules", item: `${SITE_URL}/#modules` },
          { "@type": "ListItem", position: 3, name: mod.label, item: `${SITE_URL}/modules/${mod.id}` },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/modules/${mod.id}`,
        url: `${SITE_URL}/modules/${mod.id}`,
        name: mod.hero,
        description: mod.description,
        isPartOf: { "@id": `${SITE_URL}#website` },
        primaryImageOfPage: `${SITE_URL}/marketing/screenshots/${mod.file}`,
      },
    ],
  };

  return (
    <main style={{ background: colors.obsidian, minHeight: "100vh", color: colors.text }}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />

      {/* Hero */}
      <section
        style={{
          position: "relative",
          padding: "64px 28px 40px",
          background: "linear-gradient(135deg, rgba(0,180,166,0.18) 0%, rgba(0,180,166,0.02) 60%, transparent 100%)",
          borderBottom: `1px solid ${colors.panelBorder}`,
          overflow: "hidden",
        }}
      >
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }} />
        <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.textDim, fontSize: 13, marginBottom: 18 }}>
            <Link href="/" style={{ color: colors.tealLight, textDecoration: "none" }}>Sentry</Link>
            <span>/</span>
            <Link href="/#modules" style={{ color: colors.tealLight, textDecoration: "none" }}>Modules</Link>
            <span>/</span>
            <span style={{ color: colors.textMuted }}>{mod.label}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: `linear-gradient(135deg, ${colors.teal}, #009A8E)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#0A0E14", boxShadow: "0 6px 24px rgba(0,180,166,0.32)",
              flexShrink: 0,
            }}>
              <Icon size={28} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                color: colors.tealLight, fontSize: 12, fontWeight: 700,
                letterSpacing: "0.18em", fontFamily: "Figtree, sans-serif",
              }}>
                {mod.label.toUpperCase()}
              </div>
              <h1 style={{
                fontFamily: "Figtree, sans-serif",
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 800,
                color: colors.text,
                margin: "4px 0 0",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}>
                {mod.hero}
              </h1>
            </div>
          </div>

          <p style={{
            fontFamily: "Source Sans 3, sans-serif",
            fontSize: 20,
            color: colors.textMuted,
            lineHeight: 1.5,
            margin: "10px 0 28px",
            maxWidth: 820,
          }}>
            {mod.tagline}
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/login"
              style={{
                padding: "12px 22px",
                borderRadius: 10,
                background: `linear-gradient(135deg, ${colors.teal}, #009A8E)`,
                color: "#0A0E14",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                fontFamily: "Figtree, sans-serif",
                boxShadow: "0 4px 16px rgba(0,180,166,0.28)",
              }}
            >
              See it live →
            </Link>
            <a
              href="mailto:contact@darkrocksecurity.com?subject=Sentry%20demo"
              style={{
                padding: "12px 22px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                color: colors.text,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "Figtree, sans-serif",
              }}
            >
              Talk to us
            </a>
          </div>
        </div>
      </section>

      {/* Screenshot + Highlights */}
      <section style={{ padding: "56px 28px" }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 32,
          alignItems: "flex-start",
        }} className="module-grid">
          {/* Screenshot */}
          <div style={{
            background: "#080C12",
            border: `1px solid ${colors.panelBorder}`,
            borderRadius: 14,
            overflow: "hidden",
          }}>
            <div style={{
              height: 28, padding: "0 12px", background: "#0A0E14",
              borderBottom: `1px solid ${colors.panelBorder}`,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F56565" }} />
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ECC94B" }} />
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#48BB78" }} />
              <span style={{ marginLeft: 14, color: colors.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                sentry.darkrocklabs.com / {mod.id}
              </span>
            </div>
            <div style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/marketing/screenshots/${mod.file}`}
                alt={`Sentry — ${mod.label}`}
                style={{ display: "block", width: "100%", height: "auto" }}
              />
              {callouts.slice(0, mod.highlights.length).map((c, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${c.x}%`,
                    top: `${c.y}%`,
                    transform: "translate(-50%, -50%)",
                    width: 32, height: 32, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${colors.teal}, #009A8E)`,
                    color: "#0A0E14",
                    fontSize: 14, fontWeight: 800,
                    fontFamily: "JetBrains Mono, monospace",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid #0A0E14",
                    boxShadow: "0 0 0 2px rgba(0,180,166,0.55), 0 4px 14px rgba(0,180,166,0.45)",
                    pointerEvents: "none",
                  }}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <aside>
            <h2 style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "Figtree, sans-serif",
              margin: "0 0 14px",
            }}>
              What you get
            </h2>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              {mod.highlights.map((h, i) => (
                <li key={i} style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: 14,
                  background: colors.panel,
                  border: `1px solid ${colors.panelBorder}`,
                  borderRadius: 10,
                }}>
                  <span style={{
                    flexShrink: 0,
                    width: 28, height: 28, borderRadius: "50%",
                    background: colors.teal + "1F",
                    border: `1px solid ${colors.teal}55`,
                    color: colors.tealLight,
                    fontSize: 12, fontWeight: 800,
                    fontFamily: "JetBrains Mono, monospace",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {i + 1}
                  </span>
                  <span style={{
                    color: colors.text,
                    fontSize: 14,
                    lineHeight: 1.55,
                    fontFamily: "Source Sans 3, sans-serif",
                  }}>{h}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        <div style={{ maxWidth: 1280, margin: "32px auto 0" }}>
          <div style={{
            padding: "24px 28px",
            background: colors.panel,
            border: `1px solid ${colors.panelBorder}`,
            borderRadius: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}>
            <p style={{
              color: colors.text,
              fontSize: 16,
              lineHeight: 1.6,
              margin: 0,
              maxWidth: 720,
              fontFamily: "Source Sans 3, sans-serif",
            }}>
              {mod.description}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href="/login"
                style={{
                  padding: "11px 18px",
                  borderRadius: 9,
                  background: `linear-gradient(135deg, ${colors.teal}, #009A8E)`,
                  color: "#0A0E14",
                  fontWeight: 700, fontSize: 13,
                  textDecoration: "none",
                  fontFamily: "Figtree, sans-serif",
                }}
              >
                Sign in
              </Link>
              <a
                href="mailto:contact@darkrocksecurity.com?subject=Sentry%20demo"
                style={{
                  padding: "11px 18px",
                  borderRadius: 9,
                  background: "transparent",
                  color: colors.text,
                  fontWeight: 600, fontSize: 13,
                  textDecoration: "none",
                  border: `1px solid ${colors.panelBorder}`,
                  fontFamily: "Figtree, sans-serif",
                }}
              >
                Book a demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Related modules */}
      <section style={{ padding: "32px 28px 80px", borderTop: `1px solid ${colors.panelBorder}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            color: colors.textMuted, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.18em", textTransform: "uppercase",
            fontFamily: "Figtree, sans-serif", marginBottom: 18,
          }}>
            Continue exploring
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}>
            {related.map((r) => {
              const RIcon = r.icon;
              return (
                <Link
                  key={r.id}
                  href={`/modules/${r.id}`}
                  style={{
                    display: "block",
                    padding: 18,
                    background: colors.panel,
                    border: `1px solid ${colors.panelBorder}`,
                    borderRadius: 12,
                    textDecoration: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "rgba(0,180,166,0.12)",
                      border: `1px solid rgba(0,180,166,0.32)`,
                      color: colors.teal,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <RIcon size={16} />
                    </div>
                    <span style={{ color: colors.text, fontSize: 14, fontWeight: 700, fontFamily: "Figtree, sans-serif" }}>{r.label}</span>
                  </div>
                  <div style={{ color: colors.text, fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{r.hero}</div>
                  <div style={{ color: colors.textMuted, fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>{r.tagline}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 900px) {
          .module-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
