"use client";

import { useColors } from "@/lib/theme";
import { Badge, Button, Card, SectionHeader, useModal } from "@/components/ui";

export function IntegrationsModule() {
  const modal = useModal();
  const colors = useColors();
  return (
    <div>
      <SectionHeader sub="Future integrations with your security stack">Integrations</SectionHeader>
      <Card style={{ marginBottom: 16, borderLeft: `3px solid ${colors.teal}`, padding: 14 }}>
        <p style={{ color: colors.textMuted, fontSize: 11, margin: 0, lineHeight: 1.6 }}>
          Sentry integrations will enable automated data ingestion from your existing security tools. Register your interest below and our team will notify you when each integration becomes available.
        </p>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 12 }}>
        {[
          { n: "SIEM", i: "📊", a: ["REST", "Syslog", "Webhook"], d: "Ingest alerts and events from your SIEM platform for automated incident correlation." },
          { n: "EDR/XDR", i: "🛡️", a: ["CrowdStrike", "Defender", "SentinelOne"], d: "Enrich incident data with endpoint detection and response telemetry." },
          { n: "SOAR", i: "⚙️", a: ["XSOAR", "Splunk SOAR"], d: "Sync playbook actions and automate response workflows across platforms." },
          { n: "GRC", i: "📋", a: ["SCF Connect", "ServiceNow"], d: "Export assessment results and control mappings to your GRC platform." },
          { n: "Ticketing", i: "🎫", a: ["ServiceNow", "Jira"], d: "Sync tickets and tasks bidirectionally with your ticketing system." },
          { n: "Threat Intel", i: "🔍", a: ["MISP", "VirusTotal"], d: "Enrich IOCs with threat intelligence feeds during active incidents." },
        ].map((x) => (
          <Card key={x.n}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>{x.i}</span>
              <span style={{ color: colors.white, fontWeight: 600, fontSize: 12 }}>{x.n}</span>
              <Badge color={colors.textDim}>Coming Soon</Badge>
            </div>
            <p style={{ color: colors.textMuted, fontSize: 10, margin: "0 0 8px", lineHeight: 1.4 }}>{x.d}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
              {x.a.map((a) => <Badge key={a} color={colors.blue}>{a}</Badge>)}
            </div>
            <Button variant="outline" size="sm" style={{ width: "100%" }} onClick={() => modal.showAlert("Interest Registered", `Your interest in the ${x.n} integration has been recorded. We'll notify you when it becomes available.`)}>Register Interest</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
