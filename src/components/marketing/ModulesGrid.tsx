"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SectionHeader } from "./Capabilities";
import { MODULES, DEFAULT_CALLOUTS, type ModuleEntry } from "./module-data";

const colors = {
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  teal: "#00B4A6",
  tealLight: "#33C4B8",
  panel: "#0F1623",
  panelBorder: "#1E293B",
};

type Mod = ModuleEntry;
const mods = MODULES;


export function ModulesGrid() {
  const [active, setActive] = useState<Mod | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
    <section id="modules" style={{ padding: "88px 28px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="Modules"
          title="Eighteen modules. One workspace."
          subtitle="Click any module to see what it does for your team — with hero callouts and the screenshot from the live product."
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 18,
            marginTop: 48,
          }}
        >
          {mods.map((m) => (
            <Card key={m.id} mod={m} onClick={() => setActive(m)} />
          ))}
        </div>
      </div>

      {active && <Lightbox mod={active} onClose={() => setActive(null)} />}
    </section>
  );
}

function Card({ mod, onClick }: { mod: Mod; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  const [imgError, setImgError] = useState(false);
  const Icon = mod.icon;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`Open ${mod.label} preview`}
      style={{
        textAlign: "left",
        padding: 0,
        background: colors.panel,
        border: `1px solid ${hover ? "rgba(0,180,166,0.45)" : colors.panelBorder}`,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hover ? "0 18px 40px rgba(0, 180, 166, 0.18)" : "0 1px 0 rgba(0,0,0,0)",
        width: "100%",
        fontFamily: "inherit",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 24, padding: "0 10px", background: "#0A0E14",
          borderBottom: `1px solid ${colors.panelBorder}`,
          display: "flex", alignItems: "center", gap: 5,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F56565" }} />
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ECC94B" }} />
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#48BB78" }} />
      </div>

      <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#080C12", overflow: "hidden" }}>
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/marketing/screenshots/${mod.file}`}
            alt={mod.label}
            onError={() => setImgError(true)}
            style={{
              width: "100%", height: "100%", objectFit: "cover", objectPosition: "left top",
              transform: hover ? "scale(1.03)" : "scale(1)", transition: "transform 0.45s ease",
            }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: colors.textDim, fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
            preview unavailable
          </div>
        )}
        <div
          style={{
            position: "absolute", top: 10, right: 10,
            padding: "4px 9px", borderRadius: 6,
            background: hover ? "rgba(0, 180, 166, 0.95)" : "rgba(10, 14, 20, 0.78)",
            color: hover ? "#0A0E14" : colors.textMuted,
            fontFamily: "Figtree, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            transition: "background 0.18s, color 0.18s",
            backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          }}
        >
          LEARN MORE →
        </div>
      </div>

      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0, 180, 166, 0.1)",
            border: `1px solid rgba(0, 180, 166, 0.28)`,
            color: colors.teal, flexShrink: 0,
          }}
        >
          <Icon size={17} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: colors.text, fontFamily: "Figtree, sans-serif", fontSize: 14, fontWeight: 700 }}>{mod.label}</div>
          <div style={{ color: colors.textMuted, fontSize: 12.5, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mod.note}</div>
        </div>
      </div>
    </button>
  );
}

function Lightbox({ mod, onClose }: { mod: Mod; onClose: () => void }) {
  const Icon = mod.icon;
  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${mod.label} preview`}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(8, 12, 18, 0.94)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 32, overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%", maxWidth: 1280,
          background: colors.panel,
          border: `1px solid ${colors.panelBorder}`,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.55)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close preview"
          style={{
            position: "absolute", top: 14, right: 14, zIndex: 2,
            width: 36, height: 36, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(10, 14, 20, 0.88)",
            border: `1px solid ${colors.panelBorder}`,
            color: colors.text, cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>

        {/* Hero */}
        <div
          style={{
            padding: "32px 36px 20px",
            background: "linear-gradient(135deg, rgba(0, 180, 166, 0.16) 0%, rgba(0, 180, 166, 0.02) 60%, transparent 100%)",
            borderBottom: `1px solid ${colors.panelBorder}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: 12,
                background: "linear-gradient(135deg, #00B4A6, #009A8E)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#0A0E14", boxShadow: "0 6px 20px rgba(0,180,166,0.3)",
                flexShrink: 0,
              }}
            >
              <Icon size={24} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: colors.tealLight, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", fontFamily: "Figtree, sans-serif" }}>
                {mod.label.toUpperCase()}
              </div>
              <h2 style={{
                fontFamily: "Figtree, sans-serif",
                fontSize: "clamp(24px, 3.4vw, 36px)",
                fontWeight: 800,
                color: colors.text,
                margin: "4px 0 0",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}>{mod.hero}</h2>
            </div>
          </div>
          <p style={{
            fontFamily: "Source Sans 3, sans-serif",
            fontSize: 17, color: colors.textMuted, lineHeight: 1.55, margin: 0, maxWidth: 820,
          }}>{mod.tagline}</p>
        </div>

        {/* Body: 2-column on desktop, stacked on mobile */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 0,
          }}
          className="lightbox-grid"
        >
          {/* Screenshot */}
          <div style={{ background: "#080C12", padding: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${colors.panelBorder}` }}>
            <div style={{ width: "100%", borderRadius: 8, overflow: "hidden", border: `1px solid ${colors.panelBorder}`, background: "#0A0E14", position: "relative" }}>
              <div style={{ height: 24, padding: "0 10px", background: "#0A0E14", borderBottom: `1px solid ${colors.panelBorder}`, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F56565" }} />
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ECC94B" }} />
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#48BB78" }} />
                <span style={{ marginLeft: 12, color: colors.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}>
                  sentry / {mod.label.toLowerCase().replace(/\s+/g, "-")}
                </span>
              </div>
              <div style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/marketing/screenshots/${mod.file}`}
                  alt={mod.label}
                  style={{ display: "block", width: "100%", height: "auto", background: "#080C12" }}
                />
                {(mod.callouts ?? DEFAULT_CALLOUTS).slice(0, mod.highlights.length).map((c, i) => (
                  <span
                    key={i}
                    style={{
                      position: "absolute",
                      left: `${c.x}%`,
                      top: `${c.y}%`,
                      transform: "translate(-50%, -50%)",
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #00B4A6, #009A8E)",
                      color: "#0A0E14",
                      fontSize: 13,
                      fontWeight: 800,
                      fontFamily: "JetBrains Mono, monospace",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #0A0E14",
                      boxShadow: "0 0 0 2px rgba(0, 180, 166, 0.55), 0 4px 14px rgba(0, 180, 166, 0.45)",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Marketing copy + highlights */}
          <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{
              fontFamily: "Source Sans 3, sans-serif",
              fontSize: 14.5, lineHeight: 1.6, color: colors.text, margin: 0,
            }}>
              {mod.description}
            </p>

            <div>
              <div style={{ color: colors.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "Figtree, sans-serif", marginBottom: 10 }}>
                What you get
              </div>
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {mod.highlights.map((h, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span
                      style={{
                        flexShrink: 0,
                        width: 22, height: 22, borderRadius: "50%",
                        background: colors.teal + "1F",
                        border: `1px solid ${colors.teal}55`,
                        color: colors.tealLight,
                        fontSize: 11, fontWeight: 800, fontFamily: "JetBrains Mono, monospace",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ color: colors.text, fontSize: 13, lineHeight: 1.55, fontFamily: "Source Sans 3, sans-serif" }}>{h}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* CTA footer */}
        <div
          style={{
            padding: "20px 32px",
            borderTop: `1px solid ${colors.panelBorder}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            background: "rgba(0, 180, 166, 0.04)",
          }}
        >
          <div style={{ color: colors.textMuted, fontSize: 12, fontFamily: "Figtree, sans-serif" }}>
            See {mod.label} working with your data — sign in or talk to us about a guided demo.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/login"
              style={{
                padding: "10px 20px",
                borderRadius: 9,
                background: `linear-gradient(135deg, ${colors.teal}, #009A8E)`,
                color: "#0A0E14",
                fontWeight: 700, fontSize: 13,
                textDecoration: "none",
                fontFamily: "Figtree, sans-serif",
                boxShadow: "0 4px 16px rgba(0,180,166,0.28)",
              }}
            >
              Sign in →
            </Link>
            <a
              href="mailto:contact@darkrocksecurity.com?subject=Sentry%20demo"
              style={{
                padding: "10px 20px",
                borderRadius: 9,
                background: "rgba(255, 255, 255, 0.04)",
                color: colors.text,
                fontWeight: 600, fontSize: 13,
                textDecoration: "none",
                border: `1px solid ${colors.panelBorder}`,
                fontFamily: "Figtree, sans-serif",
              }}
            >
              Talk to us
            </a>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .lightbox-grid { grid-template-columns: 1fr !important; }
            .lightbox-grid > div:first-child { border-right: none !important; border-bottom: 1px solid ${colors.panelBorder} !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
