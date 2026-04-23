"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useStore } from "@/store";
import { Badge, Button, Card, Input, Select, SectionHeader } from "@/components/ui";

export function ForensicsModule() {
  const { forensicLogs, addForensicLog } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [nf, setNf] = useState({ title: "", classification: "Confidential", caseRef: "", description: "", encKey: "" });

  return (
    <div>
      <SectionHeader sub="Encrypted evidence vault with chain-of-custody">Forensic Logs</SectionHeader>
      <Button style={{ marginBottom: 12 }} onClick={() => setShowNew(true)}>+ New Entry</Button>
      {showNew && (
        <Card style={{ marginBottom: 12, borderColor: colors.cyan + "44" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Input label="Title" value={nf.title} onChange={(v) => setNf((p) => ({ ...p, title: v }))} placeholder="Memory dump - SRV01" />
            <Select label="Classification" value={nf.classification} onChange={(v) => setNf((p) => ({ ...p, classification: v }))} options={["Internal", "Confidential", "Restricted", "Privileged & Confidential"]} />
            <Input label="Case Ref" value={nf.caseRef} onChange={(v) => setNf((p) => ({ ...p, caseRef: v }))} placeholder="CASE-2026-001" />
            <Input label="Encryption Key" value={nf.encKey} onChange={(v) => setNf((p) => ({ ...p, encKey: v }))} type="password" placeholder="Required" />
          </div>
          <Input label="Chain of Custody Notes" value={nf.description} onChange={(v) => setNf((p) => ({ ...p, description: v }))} textarea placeholder="Collected by [Name] from [System]. SHA256: ..." />
          <div style={{ display: "flex", gap: 6 }}>
            <Button onClick={() => { if (nf.title) { addForensicLog({ id: Date.now(), ...nf, created: new Date().toLocaleString(), locked: !!nf.encKey }); setShowNew(false); setNf({ title: "", classification: "Confidential", caseRef: "", description: "", encKey: "" }); } }}>Save</Button>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </Card>
      )}
      {forensicLogs.map((log) => (
        <Card key={log.id} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            {log.locked && <span>🔒</span>}
            <span style={{ color: colors.white, fontSize: 12, fontWeight: 600 }}>{log.title}</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <Badge color={colors.cyan}>{log.classification}</Badge>
            {log.caseRef && <Badge>{log.caseRef}</Badge>}
            <Badge color={colors.textDim}>{log.created}</Badge>
          </div>
          {log.description && <p style={{ color: colors.textMuted, fontSize: 10, margin: "6px 0 0" }}>{log.description}</p>}
        </Card>
      ))}
    </div>
  );
}
