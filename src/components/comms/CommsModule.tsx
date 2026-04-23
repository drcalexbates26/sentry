"use client";

import { colors } from "@/lib/tokens";
import { Button, Card, SectionHeader } from "@/components/ui";

export function CommsModule() {
  return (
    <div>
      <SectionHeader sub="Out-of-band communication for compromised environments">Secure Communications</SectionHeader>
      <Card style={{ marginBottom: 12, borderLeft: `3px solid ${colors.orange}` }}>
        <p style={{ color: colors.textMuted, fontSize: 11, margin: 0 }}>
          <strong style={{ color: colors.orange }}>Warning:</strong> If identity infrastructure is compromised, use out-of-band channels immediately.
        </p>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 12 }}>
        {[
          { n: "Signal", i: "📱", s: "Recommended" },
          { n: "WhatsApp", i: "💬", s: "Available" },
          { n: "Zoom", i: "📹", s: "Available" },
          { n: "WebEx", i: "🖥️", s: "Available" },
          { n: "Satellite Phone", i: "📡", s: "Standby" },
          { n: "In-Person EOC", i: "🏢", s: "Always Available" },
        ].map((ch) => (
          <Card key={ch.n}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{ch.i}</span>
              <div>
                <div style={{ color: colors.white, fontWeight: 600, fontSize: 12 }}>{ch.n}</div>
                <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 99, background: colors.green + "20", color: colors.green, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{ch.s}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" style={{ width: "100%" }}>Configure</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
