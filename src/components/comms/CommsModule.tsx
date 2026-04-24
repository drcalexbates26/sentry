"use client";

import { useColors } from "@/lib/theme";
import { Badge, Button, Card, SectionHeader } from "@/components/ui";

export function CommsModule() {
  const colors = useColors();
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
                <Badge color={colors.green}>{ch.s}</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" style={{ width: "100%" }}>Configure</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
