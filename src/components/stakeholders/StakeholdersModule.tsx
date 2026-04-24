"use client";

import { useState, useCallback } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card, Input, Select, SectionHeader } from "@/components/ui";
import { STAKEHOLDER_GROUPS, SYSTEM_CATEGORIES } from "@/data/stakeholder-groups";
import type { StakeholderPerson, KeySystem } from "@/types/stakeholder";

export function StakeholdersModule() {
  const { stakeholders, updateStakeholders, org } = useStore();
  const colors = useColors();
  const [editGroup, setEditGroup] = useState<string | null>(null);
  const [editSys, setEditSys] = useState<string | null>(null);
  const [nf, setNf] = useState({ firstName: "", lastName: "", title: "", responsibilities: "", email: "", cell: "" });
  const [nsf, setNsf] = useState({ systemName: "", category: "", owner: "", ownerEmail: "", ownerCell: "", criticality: "High", notes: "" });

  const totalContacts = STAKEHOLDER_GROUPS.reduce((sum, g) => ((stakeholders[g.key] as StakeholderPerson[]) || []).length + sum, 0);
  const totalSystems = (stakeholders.keySystems || []).length;

  const addPerson = useCallback((groupKey: string) => {
    if (!nf.firstName || !nf.lastName) return;
    const person = { ...nf, id: Date.now() } as StakeholderPerson;
    updateStakeholders((p) => ({ ...p, [groupKey]: [...(p[groupKey] as StakeholderPerson[]), person] }));
    setNf({ firstName: "", lastName: "", title: "", responsibilities: "", email: "", cell: "" });
  }, [nf, updateStakeholders]);

  const addSystem = useCallback(() => {
    if (!nsf.systemName) return;
    const sys = { ...nsf, id: Date.now() } as KeySystem;
    updateStakeholders((p) => ({ ...p, keySystems: [...p.keySystems, sys] }));
    setNsf({ systemName: "", category: "", owner: "", ownerEmail: "", ownerCell: "", criticality: "High", notes: "" });
    setEditSys(null);
  }, [nsf, updateStakeholders]);

  const exportStakeholders = () => {
    let txt = `DARK ROCK LABS SENTRY\nSTAKEHOLDER DIRECTORY\n${"═".repeat(60)}\nOrganization: ${org?.name || "[Organization]"}\nGenerated: ${new Date().toLocaleString()}\n\n`;
    STAKEHOLDER_GROUPS.forEach((g) => {
      const people = (stakeholders[g.key] as StakeholderPerson[]) || [];
      if (people.length > 0) {
        txt += `\n${g.label.toUpperCase()}\n${"─".repeat(40)}\n`;
        people.forEach((p, i) => { txt += `  ${i + 1}. ${p.firstName} ${p.lastName} | ${p.title || "N/A"} | ${p.email || "N/A"} | ${p.cell || "N/A"}\n`; });
      }
    });
    const blob = new Blob([txt], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Sentry_Stakeholder_Directory.txt`; a.click();
  };

  return (
    <div>
      <SectionHeader sub="Incident response stakeholder directory with contact details and system owners">Stakeholders</SectionHeader>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Badge color={colors.teal}>{totalContacts} Contacts</Badge>
          <Badge color={colors.blue}>{totalSystems} Systems</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={exportStakeholders}>Export Directory</Button>
      </div>

      <Card style={{ marginBottom: 16, background: `linear-gradient(135deg,${colors.teal}08,${colors.panel})`, borderColor: colors.teal + "33" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: colors.teal + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛡️</div>
          <div>
            <div style={{ color: colors.teal, fontWeight: 700, fontSize: 13 }}>Dark Rock Cybersecurity - Pre-Approved IR Partner</div>
            <div style={{ color: colors.textMuted, fontSize: 11 }}>IncidentResponse@Darkrocklabs.com · darkrocksecurity.com</div>
          </div>
        </div>
      </Card>

      {STAKEHOLDER_GROUPS.map((g) => {
        const people = (stakeholders[g.key] as StakeholderPerson[]) || [];
        const isEditing = editGroup === g.key;
        return (
          <Card key={g.key} style={{ marginBottom: 12, borderLeft: `3px solid ${g.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: people.length > 0 || isEditing ? 10 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{g.icon}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <h3 style={{ color: colors.white, margin: 0, fontSize: 13 }}>{g.label}</h3>
                    <Badge color={people.length > 0 ? colors.green : colors.textDim}>{people.length}</Badge>
                  </div>
                  <p style={{ color: colors.textMuted, fontSize: 10, margin: "3px 0 0", lineHeight: 1.4, maxWidth: 500 }}>{g.desc}</p>
                </div>
              </div>
              <Button variant={isEditing ? "secondary" : "outline"} size="sm" onClick={() => setEditGroup(isEditing ? null : g.key)}>
                {isEditing ? "Close" : "+ Add"}
              </Button>
            </div>
            {people.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderTop: `1px solid ${colors.panelBorder}` }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{p.firstName} {p.lastName}</span>
                    {p.title && <Badge color={g.color}>{p.title}</Badge>}
                  </div>
                  {p.responsibilities && <div style={{ color: colors.textMuted, fontSize: 10, marginBottom: 4 }}>{p.responsibilities}</div>}
                  <div style={{ display: "flex", gap: 14 }}>
                    {p.email && <span style={{ color: colors.text, fontSize: 10 }}>{p.email}</span>}
                    {p.cell && <span style={{ color: colors.text, fontSize: 10 }}>{p.cell}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => updateStakeholders((prev) => ({ ...prev, [g.key]: (prev[g.key] as StakeholderPerson[]).filter((x) => x.id !== p.id) }))} style={{ color: colors.red }}>✕</Button>
              </div>
            ))}
            {isEditing && (
              <div style={{ background: colors.obsidianM, borderRadius: 7, padding: 14, marginTop: 8, borderTop: `1px solid ${colors.panelBorder}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                  <Input label="First Name *" value={nf.firstName} onChange={(v) => setNf((p) => ({ ...p, firstName: v }))} placeholder="Jane" />
                  <Input label="Last Name *" value={nf.lastName} onChange={(v) => setNf((p) => ({ ...p, lastName: v }))} placeholder="Doe" />
                  <Input label="Title" value={nf.title} onChange={(v) => setNf((p) => ({ ...p, title: v }))} placeholder="VP of Security" />
                  <Input label="Email" value={nf.email} onChange={(v) => setNf((p) => ({ ...p, email: v }))} placeholder="jane@org.com" />
                  <Input label="Cell Phone" value={nf.cell} onChange={(v) => setNf((p) => ({ ...p, cell: v }))} placeholder="(555) 123-4567" />
                </div>
                <Input label="Responsibilities" value={nf.responsibilities} onChange={(v) => setNf((p) => ({ ...p, responsibilities: v }))} textarea rows={2} />
                <div style={{ display: "flex", gap: 6 }}>
                  <Button onClick={() => addPerson(g.key)} disabled={!nf.firstName || !nf.lastName}>Add Contact</Button>
                  <Button variant="secondary" onClick={() => setEditGroup(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {/* Key Systems */}
      <div style={{ marginTop: 24 }}>
        <SectionHeader sub="Critical systems and their owners for rapid incident coordination">Key Systems Contacts</SectionHeader>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <Button onClick={() => setEditSys(editSys ? null : "new")}>{editSys ? "Cancel" : "+ Add System"}</Button>
        </div>
        {editSys && (
          <Card style={{ marginBottom: 14, borderColor: colors.blue + "44" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
              <Input label="System Name *" value={nsf.systemName} onChange={(v) => setNsf((p) => ({ ...p, systemName: v }))} placeholder="SAP ERP, Workday, AWS Production" />
              <Select label="Category *" value={nsf.category} onChange={(v) => setNsf((p) => ({ ...p, category: v }))} options={SYSTEM_CATEGORIES} />
              <Select label="Criticality" value={nsf.criticality} onChange={(v) => setNsf((p) => ({ ...p, criticality: v }))} options={["Critical", "High", "Medium", "Low"]} />
              <Input label="System Owner" value={nsf.owner} onChange={(v) => setNsf((p) => ({ ...p, owner: v }))} placeholder="John Smith" />
              <Input label="Owner Email" value={nsf.ownerEmail} onChange={(v) => setNsf((p) => ({ ...p, ownerEmail: v }))} />
              <Input label="Owner Cell" value={nsf.ownerCell} onChange={(v) => setNsf((p) => ({ ...p, ownerCell: v }))} />
            </div>
            <Input label="Notes" value={nsf.notes} onChange={(v) => setNsf((p) => ({ ...p, notes: v }))} textarea rows={2} />
            <Button onClick={addSystem} disabled={!nsf.systemName || !nsf.category}>Add System</Button>
          </Card>
        )}
        {stakeholders.keySystems.length === 0 ? (
          <Card style={{ textAlign: "center" }}><p style={{ color: colors.textDim, fontSize: 11 }}>No key systems added.</p></Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 }}>
            {stakeholders.keySystems.map((sys) => {
              const critColor = sys.criticality === "Critical" ? colors.red : sys.criticality === "High" ? colors.orange : colors.yellow;
              return (
                <Card key={sys.id} style={{ borderLeft: `3px solid ${critColor}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ color: colors.white, fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{sys.systemName}</div>
                      <div style={{ display: "flex", gap: 4 }}><Badge color={colors.blue}>{sys.category}</Badge><Badge color={critColor}>{sys.criticality}</Badge></div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => updateStakeholders((p) => ({ ...p, keySystems: p.keySystems.filter((x) => x.id !== sys.id) }))} style={{ color: colors.red }}>✕</Button>
                  </div>
                  {sys.owner && (
                    <div style={{ marginTop: 8, borderTop: `1px solid ${colors.panelBorder}`, paddingTop: 6 }}>
                      <div style={{ color: colors.text, fontSize: 11, fontWeight: 600 }}>{sys.owner}</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 3 }}>
                        {sys.ownerEmail && <span style={{ color: colors.textMuted, fontSize: 10 }}>{sys.ownerEmail}</span>}
                        {sys.ownerCell && <span style={{ color: colors.textMuted, fontSize: 10 }}>{sys.ownerCell}</span>}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
