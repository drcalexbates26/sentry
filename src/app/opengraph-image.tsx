import { ImageResponse } from "next/og";

// Tells Next this file generates the homepage's OpenGraph image
export const alt = "Sentry — cyber resilience platform by Dark Rock Labs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0A0E14",
          color: "#E2E8F0",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Aurora glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0, 180, 166, 0.32) 0%, rgba(0, 180, 166, 0) 60%), radial-gradient(ellipse 40% 30% at 80% 100%, rgba(0, 180, 166, 0.18) 0%, rgba(0, 180, 166, 0) 60%)",
            display: "flex",
          }}
        />
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            display: "flex",
          }}
        />

        {/* Header */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "56px 64px 0",
          }}
        >
          {/* Rook plate */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "linear-gradient(135deg, #00B4A6, #009A8E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 24px rgba(0,180,166,0.42)",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M5 20h14v2H5v-2z" fill="#0A0E14" />
              <path d="M7 18h10l1-3H6l1 3z" fill="#0A0E14" />
              <path d="M8 15h8V9H8v6z" fill="#0A0E14" />
              <path d="M7 9h10l-1-3H8L7 9z" fill="#0A0E14" />
              <path d="M6 6h2V3h2v3h4V3h2v3h2v1H6V6z" fill="#0A0E14" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ color: "#E2E8F0", fontSize: 32, fontWeight: 800, letterSpacing: "-0.01em" }}>
              Sentry
            </div>
            <div style={{ color: "#33C4B8", fontSize: 14, fontWeight: 700, letterSpacing: "0.18em" }}>
              DARK ROCK LABS
            </div>
          </div>
        </div>

        {/* Hero */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: "44px 64px 0",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 18px",
              background: "rgba(0, 180, 166, 0.10)",
              border: "1px solid rgba(0, 180, 166, 0.42)",
              borderRadius: 999,
              color: "#33C4B8",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.1em",
              alignSelf: "flex-start",
              marginBottom: 24,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00B4A6", display: "flex" }} />
            CYBER RESILIENCE PLATFORM
          </div>

          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              color: "#E2E8F0",
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <span>The operating system for&nbsp;</span>
            <span
              style={{
                background: "linear-gradient(135deg, #00B4A6, #33C4B8)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              cyber resilience.
            </span>
          </div>

          <div
            style={{
              color: "#94A3B8",
              fontSize: 22,
              lineHeight: 1.5,
              marginTop: 22,
              maxWidth: 920,
              display: "flex",
            }}
          >
            Assessment, incident command, playbooks, tabletop, forensics, stakeholders, and 12 more modules — built for the way security teams actually operate.
          </div>
        </div>

        {/* Footer stats */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            padding: "0 64px 48px",
            gap: 32,
          }}
        >
          <div style={{ display: "flex", gap: 32 }}>
            <Stat n="18" l="MODULES" />
            <Stat n="14" l="IR PLAYBOOKS" />
            <Stat n="NIST CSF 2.0" l="ASSESSMENT" />
          </div>
          <div
            style={{
              color: "#64748B",
              fontSize: 18,
              fontWeight: 600,
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              display: "flex",
            }}
          >
            sentry.darkrocklabs.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ color: "#E2E8F0", fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>{n}</div>
      <div style={{ color: "#64748B", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", marginTop: 4 }}>{l}</div>
    </div>
  );
}
