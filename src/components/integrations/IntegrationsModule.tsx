"use client";

import { colors } from "@/lib/tokens";
import { Badge, Button, Card, SectionHeader } from "@/components/ui";

export function IntegrationsModule() {
  return (
    <div>
      <SectionHeader sub="Connect stack, pen test tool, APIs">Integrations</SectionHeader>
      <Card style={{ marginBottom: 12, borderColor: colors.teal + "33" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: colors.teal + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔴</div>
          <div>
            <h3 style={{ color: colors.white, margin: 0, fontSize: 14 }}>Dark Rock Labs Penetration Testing</h3>
            <p style={{ color: colors.textMuted, fontSize: 11, margin: "2px 0 8px" }}>On-demand pen testing integrated with Sentry.</p>
            <div style={{ display: "flex", gap: 6 }}>
              <Button size="sm">Launch Tool →</Button>
              <Button variant="secondary" size="sm">Schedule</Button>
            </div>
          </div>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 12 }}>
        {[
          { n: "SIEM", i: "📊", a: ["REST", "Syslog", "Webhook"] },
          { n: "EDR/XDR", i: "🛡️", a: ["CrowdStrike", "Defender", "SentinelOne"] },
          { n: "SOAR", i: "⚙️", a: ["XSOAR", "Splunk SOAR"] },
          { n: "GRC", i: "📋", a: ["SCF Connect", "ServiceNow"] },
          { n: "Ticketing", i: "🎫", a: ["ServiceNow", "Jira"] },
          { n: "Threat Intel", i: "🔍", a: ["MISP", "VirusTotal"] },
        ].map((x) => (
          <Card key={x.n}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{x.i}</span>
              <span style={{ color: colors.white, fontWeight: 600, fontSize: 12 }}>{x.n}</span>
              <Badge color={colors.green}>Available</Badge>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
              {x.a.map((a) => <Badge key={a} color={colors.blue}>{a}</Badge>)}
            </div>
            <Button variant="outline" size="sm" style={{ width: "100%" }}>Configure</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
