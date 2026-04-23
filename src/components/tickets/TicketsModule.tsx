"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useStore } from "@/store";
import { Badge, Button, Card, Input, Select, SectionHeader } from "@/components/ui";
import { IR_PHASES } from "@/data/ir-phases";

export function TicketsModule() {
  const { tickets, addTicket, updateTicket } = useStore();
  const [sel, setSel] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [nf, setNf] = useState({ title: "", severity: "Medium", phase: "", assignee: "", details: "" });

  if (sel !== null) {
    const tk = tickets.find((t) => t.id === sel);
    if (!tk) return null;
    return (
      <div>
        <Button variant="ghost" onClick={() => setSel(null)} style={{ marginBottom: 12 }}>← Back</Button>
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ color: colors.white, margin: "0 0 4px", fontSize: 15 }}>{tk.title}</h2>
              <div style={{ display: "flex", gap: 4 }}>
                <Badge color={tk.severity === "Critical" ? colors.red : colors.orange}>{tk.severity}</Badge>
                <Badge color={tk.status === "Open" ? colors.orange : tk.status === "Closed" ? colors.green : colors.blue}>{tk.status}</Badge>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Button variant="outline" size="sm" onClick={() => {
                const txt = `SENTRY TICKET\nID: ${tk.id}\nTitle: ${tk.title}\nSeverity: ${tk.severity}\nStatus: ${tk.status}\nAssignee: ${tk.assignee || "Unassigned"}\nCreated: ${tk.created}\n\nDetails:\n${tk.details || "None"}\n`;
                const blob = new Blob([txt], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Sentry-Ticket-${tk.id}.txt`; a.click();
              }}>Export</Button>
              <Select value={tk.status} onChange={(v) => updateTicket(tk.id, { status: v })} options={["Open", "In Progress", "Contained", "Resolved", "Closed"]} />
            </div>
          </div>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Card>
            <h4 style={{ color: colors.white, marginTop: 0, fontSize: 12 }}>Details</h4>
            <Input label="Assignee" value={tk.assignee || ""} onChange={(v) => updateTicket(tk.id, { assignee: v })} placeholder="Assign..." />
            <Input label="Details" value={tk.details || ""} onChange={(v) => updateTicket(tk.id, { details: v })} textarea placeholder="Full details..." rows={4} />
          </Card>
          <Card>
            <h4 style={{ color: colors.white, marginTop: 0, fontSize: 12 }}>Action Log</h4>
            {(tk.actions || []).map((a, i) => (
              <div key={i} style={{ padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}`, fontSize: 10 }}>
                <span style={{ color: colors.teal }}>[{a.time}]</span> <span style={{ color: colors.textMuted }}>{a.by}:</span> <span style={{ color: colors.text }}>{a.text}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" style={{ marginTop: 6 }} onClick={() => {
              const t = prompt("Action:"); const b = prompt("By:");
              if (t) updateTicket(tk.id, { actions: [...(tk.actions || []), { text: t, by: b || "Unknown", time: new Date().toLocaleTimeString() }] });
            }}>+ Log Action</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader sub="Phase-based incident tracking">Tickets</SectionHeader>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Button onClick={() => setShowNew(true)}>+ New Ticket</Button>
      </div>
      {showNew && (
        <Card style={{ marginBottom: 12, borderColor: colors.teal + "44" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Input label="Title" value={nf.title} onChange={(v) => setNf((p) => ({ ...p, title: v }))} />
            <Select label="Severity" value={nf.severity} onChange={(v) => setNf((p) => ({ ...p, severity: v }))} options={["Low", "Medium", "High", "Critical"]} />
            <Select label="Phase" value={nf.phase} onChange={(v) => setNf((p) => ({ ...p, phase: v }))} options={IR_PHASES.map((p) => p.n)} />
            <Input label="Assignee" value={nf.assignee} onChange={(v) => setNf((p) => ({ ...p, assignee: v }))} />
          </div>
          <Input label="Details" value={nf.details} onChange={(v) => setNf((p) => ({ ...p, details: v }))} textarea />
          <div style={{ display: "flex", gap: 6 }}>
            <Button onClick={() => { addTicket({ id: Date.now(), ...nf, status: "Open", created: new Date().toLocaleDateString(), actions: [] }); setShowNew(false); setNf({ title: "", severity: "Medium", phase: "", assignee: "", details: "" }); }}>Create</Button>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </Card>
      )}
      {tickets.map((tk) => (
        <Card key={tk.id} onClick={() => setSel(tk.id)} style={{ cursor: "pointer", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: colors.white, fontSize: 12, fontWeight: 600 }}>{tk.title}</div>
              <div style={{ color: colors.textDim, fontSize: 9, marginTop: 2 }}>{tk.created} · {tk.assignee || "Unassigned"}</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <Badge color={tk.severity === "Critical" ? colors.red : colors.orange}>{tk.severity}</Badge>
              <Badge color={tk.status === "Closed" ? colors.green : colors.orange}>{tk.status}</Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
