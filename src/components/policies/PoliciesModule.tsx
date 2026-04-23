"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useStore } from "@/store";
import { Badge, Button, Card, SectionHeader } from "@/components/ui";
import { POLICY_TEMPLATES } from "@/data/policy-templates";
import { generatePolicy } from "@/lib/policy-generator";

export function PoliciesModule() {
  const { org, tech, comp, policiesGen, addPolicyGen } = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [gen, setGen] = useState<Record<string, string>>({});

  const O = org?.name || "[Organization Name]";
  const D = new Date().toISOString().split("T")[0];
  const CF = (comp || []).join(", ") || "As determined by organizational requirements";

  const genPolicy = (id: string) => {
    const result = generatePolicy(id, O, D, tech, CF);
    setGen((p) => ({ ...p, [id]: result }));
    addPolicyGen(id);
  };

  if (sel && gen[sel]) {
    const t = POLICY_TEMPLATES.find((x) => x.id === sel);
    return (
      <div>
        <Button variant="ghost" onClick={() => setSel(null)} style={{ marginBottom: 12 }}>← Back to Templates</Button>
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 style={{ color: colors.white, margin: "0 0 4px", fontSize: 16 }}>{t?.n}</h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge color={colors.green}>Generated</Badge>
                <Badge color={colors.teal}>POL-{sel.toUpperCase()}-001</Badge>
                <Badge color={colors.blue}>v1.0</Badge>
                <Badge color={colors.textMuted}>{D}</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              const blob = new Blob([gen[sel]], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${O.replace(/\s/g, "_")}_${t?.n.replace(/\s/g, "_")}_v1.0.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}>Export TXT</Button>
          </div>
          <div style={{ background: colors.obsidianM, borderRadius: 8, padding: 4 }}>
            <pre style={{
              padding: 20, color: colors.text, fontSize: 11, lineHeight: 1.75,
              whiteSpace: "pre-wrap", fontFamily: "var(--font-mono, monospace)",
              maxHeight: 600, overflow: "auto", margin: 0,
            }}>{gen[sel]}</pre>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader sub="Professional security policy documents with version control, stakeholder approval, and technology-specific integration">Policy Generator</SectionHeader>
      <Card style={{ marginBottom: 16, borderLeft: `3px solid ${colors.teal}`, padding: 14 }}>
        <p style={{ color: colors.textMuted, fontSize: 11, margin: 0, lineHeight: 1.6 }}>
          Each policy is generated with your organization profile ({O}), technology stack integrations, and compliance framework alignment ({CF}).
        </p>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
        {POLICY_TEMPLATES.map((t) => (
          <Card key={t.id} onClick={() => { if (!gen[t.id]) genPolicy(t.id); setSel(t.id); }}
            style={{ cursor: "pointer", borderColor: gen[t.id] ? colors.green + "33" : colors.panelBorder }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 24 }}>{t.i}</span>
              {gen[t.id] ? <Badge color={colors.green}>Generated</Badge> : <Badge color={colors.textDim}>Click to generate</Badge>}
            </div>
            <h4 style={{ color: colors.white, margin: "10px 0 4px", fontSize: 13 }}>{t.n}</h4>
            <p style={{ color: colors.textMuted, fontSize: 10, margin: 0, lineHeight: 1.4 }}>{t.d}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
