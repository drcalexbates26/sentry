"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useStore } from "@/store";
import { Badge, Button, Card, Checkbox, Input, Select, SectionHeader, ProgressBar } from "@/components/ui";
import { PLAYBOOKS } from "@/data/playbooks";

export function PlaybooksModule() {
  const { cases, addCase, addTicket, addTask, addTasks } = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [pbChecks, setPbChecks] = useState<Record<string, boolean>>({});
  const [assignModal, setAssignModal] = useState<typeof PLAYBOOKS[0] | null>(null);
  const [incTitle, setIncTitle] = useState("");
  const [incSev, setIncSev] = useState("High");
  const [incAssignee, setIncAssignee] = useState("");

  const cats = ["All", ...new Set(PLAYBOOKS.map((p) => p.cat))];
  const filtered = filter === "All" ? PLAYBOOKS : PLAYBOOKS.filter((p) => p.cat === filter);
  const activeAssignments = cases.filter((c) => c.playbook && c.status === "Open");

  const togglePbCheck = (pbId: string, phase: string, idx: number) => {
    const key = `${pbId}_${phase}_${idx}`;
    setPbChecks((p) => ({ ...p, [key]: !p[key] }));
  };

  const getPbProgress = (pbId: string) => {
    const pb = PLAYBOOKS.find((p) => p.id === pbId);
    if (!pb) return 0;
    let total = 0, done = 0;
    [{ k: "iocs", d: pb.iocs }, { k: "contain", d: pb.contain }, { k: "erad", d: pb.erad }, { k: "recover", d: pb.recover }]
      .forEach((ph) => ph.d.forEach((_, i) => { total++; if (pbChecks[`${pbId}_${ph.k}_${i}`]) done++; }));
    return total ? Math.round((done / total) * 100) : 0;
  };

  const assignToIncident = (pb: typeof PLAYBOOKS[0]) => {
    const caseId = Date.now();
    const subtasks = [
      { k: "iocs", l: "IOC Verification", d: pb.iocs },
      { k: "contain", l: "Containment", d: pb.contain },
      { k: "erad", l: "Eradication", d: pb.erad },
      { k: "recover", l: "Recovery", d: pb.recover },
    ].flatMap((phase) =>
      phase.d.map((step, i) => ({
        id: caseId + i + phase.k.charCodeAt(0),
        title: `[${phase.l}] ${step}`,
        priority: (phase.k === "contain" ? "Critical" : phase.k === "erad" ? "High" : "Medium") as "Critical" | "High" | "Medium",
        status: "Backlog" as const,
        assignee: incAssignee || "",
        updates: [],
        created: new Date().toLocaleDateString(),
        source: `Playbook: ${pb.name}`,
      }))
    );

    addTicket({
      id: caseId, title: incTitle || `Incident: ${pb.name}`, status: "Open",
      severity: incSev, phase: "Playbook Activated", assignee: incAssignee || "",
      created: new Date().toLocaleDateString(),
      details: `Playbook activated: ${pb.name}\nSeverity: ${pb.sev}\nCategory: ${pb.cat}\n\nMITRE ATT&CK: ${pb.mitre.join(", ")}\n\nSubtasks created: ${subtasks.length}`,
      actions: [{ text: `Playbook "${pb.name}" activated with ${subtasks.length} subtasks`, by: "System", time: new Date().toLocaleTimeString() }],
      playbookId: pb.id, subtaskCount: subtasks.length,
    });
    addTasks(subtasks);
    addCase({ title: incTitle || `Incident: ${pb.name}`, date: new Date().toLocaleDateString(), status: "Open", type: "Incident", playbook: pb.id, ticketId: caseId });
    setAssignModal(null); setIncTitle(""); setIncSev("High"); setIncAssignee(""); setSel(null);
    alert(`Incident created with ${subtasks.length} subtasks.`);
  };

  if (sel) {
    const pb = PLAYBOOKS.find((p) => p.id === sel);
    if (!pb) return null;
    const progress = getPbProgress(pb.id);
    const phases = [
      { k: "iocs", t: "Indicators of Compromise", sub: "Verify each IOC against your environment", d: pb.iocs, c: colors.red, ico: "🔍" },
      { k: "contain", t: "Containment Actions", sub: "Execute containment steps to stop the threat", d: pb.contain, c: colors.orange, ico: "🚧" },
      { k: "erad", t: "Eradication Steps", sub: "Remove the adversary and remediate root cause", d: pb.erad, c: colors.yellow, ico: "🧹" },
      { k: "recover", t: "Recovery Procedures", sub: "Restore operations and validate integrity", d: pb.recover, c: colors.green, ico: "🔄" },
    ];

    return (
      <div>
        <Button variant="ghost" onClick={() => setSel(null)} style={{ marginBottom: 12 }}>← Back to Playbooks</Button>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{pb.icon}</span>
                <h2 style={{ color: colors.white, margin: 0, fontSize: 17 }}>{pb.name}</h2>
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                <Badge>{pb.cat}</Badge>
                <Badge color={pb.sev === "Critical" ? colors.red : pb.sev === "High" ? colors.orange : colors.yellow}>{pb.sev}</Badge>
                <Badge color={progress >= 100 ? colors.green : progress > 0 ? colors.teal : colors.textDim}>{progress}% Complete</Badge>
              </div>
              <p style={{ color: colors.textMuted, fontSize: 12, margin: 0, lineHeight: 1.5, maxWidth: 600 }}>{pb.desc}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Button onClick={() => setAssignModal(pb)}>Assign to Incident</Button>
              <Button variant="outline" size="sm" onClick={() => {
                const txt = `SENTRY PLAYBOOK: ${pb.name}\nProgress: ${progress}%\n\n${phases.map((ph) => `${ph.t}\n${ph.d.map((s, i) => `  [${pbChecks[`${pb.id}_${ph.k}_${i}`] ? "✓" : " "}] ${s}`).join("\n")}`).join("\n\n")}\n\nMITRE: ${pb.mitre.join(", ")}`;
                const blob = new Blob([txt], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Sentry_Playbook_${pb.name.replace(/\s/g, "_")}.txt`; a.click();
              }}>Export Checklist</Button>
            </div>
          </div>
          <div style={{ marginTop: 12 }}><ProgressBar value={progress} color={progress >= 100 ? colors.green : colors.teal} height={6} /></div>
        </Card>

        {assignModal && (
          <Card style={{ marginBottom: 14, borderColor: colors.red + "44", background: `linear-gradient(135deg,${colors.red}06,${colors.panel})` }}>
            <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14 }}>Assign Playbook to Active Incident</h3>
            <p style={{ color: colors.textMuted, fontSize: 11, marginBottom: 12 }}>Creates a master ticket and {[...assignModal.iocs, ...assignModal.contain, ...assignModal.erad, ...assignModal.recover].length} individual subtasks.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
              <Input label="Incident Title" value={incTitle} onChange={setIncTitle} placeholder={`Incident: ${assignModal.name}`} />
              <Select label="Severity" value={incSev} onChange={setIncSev} options={["Low", "Medium", "High", "Critical"]} />
              <Input label="Primary Assignee" value={incAssignee} onChange={setIncAssignee} placeholder="Incident Manager name" />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <Button variant="danger" onClick={() => assignToIncident(assignModal)}>Create Incident + Subtasks</Button>
              <Button variant="secondary" onClick={() => setAssignModal(null)}>Cancel</Button>
            </div>
          </Card>
        )}

        {phases.map((ph) => {
          const phDone = ph.d.filter((_, i) => pbChecks[`${pb.id}_${ph.k}_${i}`]).length;
          return (
            <Card key={ph.k} style={{ marginBottom: 12, borderLeft: `3px solid ${ph.c}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{ph.ico}</span>
                  <div>
                    <h3 style={{ color: colors.white, margin: 0, fontSize: 13 }}>{ph.t}</h3>
                    <p style={{ color: colors.textDim, fontSize: 10, margin: "2px 0 0" }}>{ph.sub}</p>
                  </div>
                </div>
                <Badge color={phDone === ph.d.length ? colors.green : phDone > 0 ? ph.c : colors.textDim}>{phDone}/{ph.d.length}</Badge>
              </div>
              {ph.d.map((step, i) => {
                const isChecked = !!pbChecks[`${pb.id}_${ph.k}_${i}`];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                    <div onClick={() => togglePbCheck(pb.id, ph.k, i)} style={{
                      width: 18, height: 18, borderRadius: 4, border: `2px solid ${isChecked ? colors.green : colors.panelBorder}`,
                      background: isChecked ? colors.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0, marginTop: 1,
                    }}>{isChecked && <span style={{ color: colors.obsidian, fontSize: 11, fontWeight: 800 }}>✓</span>}</div>
                    <span style={{ color: isChecked ? colors.textDim : colors.text, fontSize: 11, lineHeight: 1.5, textDecoration: isChecked ? "line-through" : "none" }}>
                      <span style={{ color: ph.c, fontWeight: 600, marginRight: 6 }}>{i + 1}.</span>{step}
                    </span>
                  </div>
                );
              })}
            </Card>
          );
        })}

        <Card>
          <h3 style={{ color: colors.white, marginTop: 0, fontSize: 13 }}>MITRE ATT&CK Mapping</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{pb.mitre.map((m) => <Badge key={m} color={colors.blue}>{m}</Badge>)}</div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader sub={`${PLAYBOOKS.length} scenario playbooks with interactive checklists and incident assignment`}>Playbooks</SectionHeader>
      {activeAssignments.length > 0 && (
        <Card style={{ marginBottom: 14, borderLeft: `3px solid ${colors.red}` }}>
          <h3 style={{ color: colors.white, marginTop: 0, fontSize: 13 }}>Active Playbook Assignments</h3>
          {activeAssignments.map((a, i) => {
            const pb = PLAYBOOKS.find((p) => p.id === a.playbook);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{pb?.icon || "📋"}</span>
                  <span style={{ color: colors.text, fontSize: 12, fontWeight: 600 }}>{a.title}</span>
                  <Badge color={colors.orange}>{a.status}</Badge>
                </div>
                <span style={{ color: colors.textDim, fontSize: 10 }}>{a.date}</span>
              </div>
            );
          })}
        </Card>
      )}
      <div style={{ display: "flex", gap: 3, marginBottom: 16, flexWrap: "wrap" }}>
        {cats.map((c) => (
          <Button key={c} variant={filter === c ? "primary" : "secondary"} size="sm" onClick={() => setFilter(c)}>
            {c} ({c === "All" ? PLAYBOOKS.length : PLAYBOOKS.filter((p) => p.cat === c).length})
          </Button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
        {filtered.map((pb) => {
          const progress = getPbProgress(pb.id);
          const isAssigned = activeAssignments.some((a) => a.playbook === pb.id);
          return (
            <Card key={pb.id} onClick={() => setSel(pb.id)} style={{ cursor: "pointer", borderLeft: `3px solid ${pb.sev === "Critical" ? colors.red : pb.sev === "High" ? colors.orange : colors.yellow}`, borderColor: isAssigned ? colors.red + "44" : undefined }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 18 }}>{pb.icon}</span>
                  <h4 style={{ color: colors.white, margin: 0, fontSize: 12 }}>{pb.name}</h4>
                </div>
                {isAssigned && <Badge color={colors.red}>ACTIVE</Badge>}
              </div>
              <div style={{ display: "flex", gap: 3, marginBottom: 6, flexWrap: "wrap" }}>
                <Badge>{pb.cat}</Badge>
                <Badge color={pb.sev === "Critical" ? colors.red : pb.sev === "High" ? colors.orange : colors.yellow}>{pb.sev}</Badge>
                <Badge color={colors.textDim}>{pb.iocs.length + pb.contain.length + pb.erad.length + pb.recover.length} steps</Badge>
              </div>
              <p style={{ color: colors.textMuted, fontSize: 10, margin: "0 0 8px", lineHeight: 1.4 }}>{pb.desc.substring(0, 100)}...</p>
              {progress > 0 && <ProgressBar value={progress} color={progress >= 100 ? colors.green : colors.teal} height={3} />}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
