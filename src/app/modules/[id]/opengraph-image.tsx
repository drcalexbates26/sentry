import { ImageResponse } from "next/og";
import { MODULES, getModule } from "@/components/marketing/module-data";

export const alt = "Sentry module";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  return MODULES.map((m) => ({ id: m.id }));
}

export default async function ModuleOGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mod = getModule(id);
  if (!mod) {
    return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#0A0E14" }} />, size);
  }

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
              "radial-gradient(ellipse 70% 50% at 80% 0%, rgba(0, 180, 166, 0.32) 0%, rgba(0, 180, 166, 0) 60%), radial-gradient(ellipse 50% 40% at 10% 100%, rgba(0, 180, 166, 0.2) 0%, rgba(0, 180, 166, 0) 60%)",
            display: "flex",
          }}
        />
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

        {/* Top brand strip */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "44px 64px 0",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "linear-gradient(135deg, #00B4A6, #009A8E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 12px rgba(0,180,166,0.4)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 20h14v2H5v-2z" fill="#0A0E14" />
              <path d="M7 18h10l1-3H6l1 3z" fill="#0A0E14" />
              <path d="M8 15h8V9H8v6z" fill="#0A0E14" />
              <path d="M7 9h10l-1-3H8L7 9z" fill="#0A0E14" />
              <path d="M6 6h2V3h2v3h4V3h2v3h2v1H6V6z" fill="#0A0E14" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ color: "#E2E8F0", fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" }}>Sentry</div>
            <div style={{ color: "#33C4B8", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em" }}>
              DARK ROCK LABS
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              padding: "8px 16px",
              background: "rgba(0, 180, 166, 0.10)",
              border: "1px solid rgba(0, 180, 166, 0.42)",
              borderRadius: 999,
              color: "#33C4B8",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.14em",
              display: "flex",
            }}
          >
            {mod.label.toUpperCase()}
          </div>
        </div>

        {/* Hero */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: "48px 64px 0",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#E2E8F0",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              display: "flex",
              maxWidth: 1050,
            }}
          >
            {mod.hero}
          </div>
          <div
            style={{
              color: "#94A3B8",
              fontSize: 24,
              lineHeight: 1.5,
              marginTop: 22,
              maxWidth: 950,
              display: "flex",
            }}
          >
            {mod.tagline}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            padding: "0 64px 44px",
          }}
        >
          <div
            style={{
              color: "#33C4B8",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.1em",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              display: "flex",
            }}
          >
            sentry.darkrocklabs.com/modules/{mod.id}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: "linear-gradient(135deg, #00B4A6, #009A8E)",
              borderRadius: 8,
              color: "#0A0E14",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.04em",
            }}
          >
            See it live →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
