"use client";

import { useState, useCallback } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import type { TabletopExercise, TTXObjective, TTXFinding, TTXLesson, TTXActionItem, TTXWalkThroughStep } from "@/store";
import { Badge, Button, Card, Input, Select, SectionHeader, ProgressBar, useModal } from "@/components/ui";
import { PLAYBOOKS } from "@/data/playbooks";

const TLP_LEVELS = ["TLP:RED", "TLP:AMBER+STRICT", "TLP:AMBER", "TLP:GREEN", "TLP:CLEAR"];
const EX_TYPES = ["Discussion-Based", "Walkthrough", "Functional", "Full-Scale"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const NIST_CATS = ["GV.OC","GV.RM","ID.AM","ID.RA","PR.AA","PR.AT","PR.DS","PR.PS","PR.IR","DE.CM","DE.AE","RS.MA","RS.AN","RS.CO","RS.MI","RC.RP"];
// DOC_TYPES for future document management: AAR, Scenario, Injects, Facilitator Notes, Participant Guide, Other

function emptyExercise(): Omit<TabletopExercise, "id"> {
  return {
    title: "", date: "", status: "Scheduled", exerciseType: "Discussion-Based",
    tlpLevel: "TLP:AMBER+STRICT", scenario: "", scope: "", facilitator: "",
    facilitatorOrg: "", sponsor: "", participants: [], objectives: [],
    findings: [], lessonsLearned: [], actionItems: [], feedback: [],
    strengths: [], documents: [], notes: "", rating: 0, playbookId: "",
    walkThroughData: [], source: "manual",
  };
}

const ATLAS_SCENARIOS = [
  { icon: "💀", name: "Ransomware Response" },
  { icon: "📧", name: "BEC / Wire Fraud" },
  { icon: "☁️", name: "Cloud Breach" },
  { icon: "📦", name: "Supply Chain Attack" },
  { icon: "👤", name: "Insider Threat" },
  { icon: "📣", name: "Data Breach Notification" },
];

export function TabletopModule() {
  const { tabletopExercises, addTabletopExercise, updateTabletopExercise, addTask, addLesson, org } = useStore();
  const colors = useColors();
  const modal = useModal();

  const [mainTab, setMainTab] = useState<"exercises"|"light"|"atlas">("exercises");
  const [view, setView] = useState<"list"|"create"|"detail">("list");
  const [selId, setSelId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyExercise());

  // Light Tabletop state
  const [ltStep, setLtStep] = useState<"select"|"config"|"walkthrough"|"summary">("select");
  const [ltPlaybookId, setLtPlaybookId] = useState("");
  const [ltConfig, setLtConfig] = useState({ title: "", date: new Date().toISOString().split("T")[0], facilitator: "", participantNames: "" });
  const [ltSteps, setLtSteps] = useState<TTXWalkThroughStep[]>([]);
  const [ltCurrentPhase, setLtCurrentPhase] = useState(0);
  const [ltCurrentStep, setLtCurrentStep] = useState(0);

  // Helper to update selected exercise
  const updateEx = useCallback((id: number, updates: Partial<TabletopExercise>) => {
    updateTabletopExercise(id, updates);
  }, [updateTabletopExercise]);

  const createTaskFromFinding = useCallback((f: TTXFinding, exerciseTitle: string) => {
    addTask({ id: Date.now(), title: `[TTX] ${f.finding.substring(0, 70)}`, priority: f.priority, status: "Backlog", assignee: f.owner, source: `Tabletop: ${exerciseTitle}`, updates: [], created: new Date().toLocaleDateString(), irPhase: f.nistMapping?.startsWith("RS") ? "contain" : f.nistMapping?.startsWith("DE") ? "ident" : "prep" });
  }, [addTask]);

  const createTaskFromAction = useCallback((a: TTXActionItem, exerciseTitle: string) => {
    const taskId = Date.now();
    addTask({ id: taskId, title: `[TTX] ${a.text.substring(0, 70)}`, priority: a.priority, status: "Backlog", assignee: a.owner, source: `Tabletop: ${exerciseTitle}`, updates: [], created: new Date().toLocaleDateString() });
    return taskId;
  }, [addTask]);

  const addLessonToDashboard = useCallback((lesson: TTXLesson, exerciseTitle: string) => {
    addLesson({ text: lesson.text, date: new Date().toLocaleDateString(), src: `Tabletop: ${exerciseTitle}` });
  }, [addLesson]);

  const saveWalkThrough = useCallback(() => {
    const pb = PLAYBOOKS.find((p) => p.id === ltPlaybookId);
    if (!pb) return;
    const gapSteps = ltSteps.filter((s) => s.gapIdentified);
    const now = Math.floor(Math.random() * 1e12);
    const findings = gapSteps.map((s, i) => ({ id: now + i, finding: s.gapDescription || s.stepText, priority: (s.confidence === "Low" ? "High" : "Medium") as "High" | "Medium", nistMapping: "", owner: "", status: "Open" as const, notes: s.response, taskCreated: false }));
    addTabletopExercise({
      ...emptyExercise(), id: now, title: ltConfig.title || `${pb.name} Walk-Through`, date: ltConfig.date,
      scenario: pb.desc, facilitator: ltConfig.facilitator, exerciseType: "Walkthrough",
      source: "light_tabletop", playbookId: pb.id, walkThroughData: ltSteps, findings, status: "Complete",
    } as TabletopExercise);
    setMainTab("exercises"); setLtStep("select"); setLtSteps([]); setLtCurrentPhase(0); setLtCurrentStep(0);
  }, [ltPlaybookId, ltSteps, ltConfig, addTabletopExercise]);

  const sel = selId !== null ? tabletopExercises.find((e) => e.id === selId) : null;

  // Stats
  const totalEx = tabletopExercises.length;
  const completedEx = tabletopExercises.filter((e) => e.status === "Complete").length;
  const scheduledEx = tabletopExercises.filter((e) => e.status === "Scheduled").length;
  const openActions = tabletopExercises.reduce((a, e) => a + (e.actionItems?.filter((ai) => ai.status !== "Complete")?.length || 0), 0);

  // ═══ TAB HEADER ═══════════════════════════════════════════════════
  const tabBar = (
    <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: `1px solid ${colors.panelBorder}`, paddingBottom: 6 }}>
      {([["exercises", "Exercises"], ["light", "Light Tabletop"], ["atlas", "ATLAS"]] as const).map(([id, label]) => (
        <button key={id} onClick={() => { setMainTab(id); setView("list"); setSelId(null); setLtStep("select"); }}
          style={{ padding: "7px 16px", borderRadius: "7px 7px 0 0", border: "none", cursor: "pointer", background: mainTab === id ? colors.teal + "15" : "transparent", color: mainTab === id ? colors.teal : colors.textMuted, fontSize: 12, fontWeight: mainTab === id ? 700 : 500, fontFamily: "inherit", borderBottom: mainTab === id ? `2px solid ${colors.teal}` : "2px solid transparent", transition: "all 0.12s" }}>
          {label}
        </button>
      ))}
    </div>
  );

  // ═══ EXERCISES TAB ═════════════════════════════════════════════════
  if (mainTab === "exercises") {
    // Detail view
    if (view === "detail" && sel) {
      return (
        <div>
          <SectionHeader sub="Exercise management, playbook walk-throughs, and ATLAS integration">Tabletop Exercises</SectionHeader>
          {tabBar}
          <Button variant="ghost" onClick={() => { setView("list"); setSelId(null); }} style={{ marginBottom: 12 }}>← Back to Exercises</Button>

          {/* Header */}
          <Card style={{ marginBottom: 14, borderLeft: `3px solid ${sel.status === "Complete" ? colors.green : colors.teal}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
              <div>
                <h2 style={{ color: colors.white, margin: "0 0 6px", fontSize: 16, fontWeight: 800 }}>{sel.title}</h2>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <Badge color={sel.status === "Complete" ? colors.green : sel.status === "In Progress" ? colors.teal : colors.blue}>{sel.status}</Badge>
                  <Badge color={colors.textDim}>{sel.date}</Badge>
                  <Badge color={sel.tlpLevel?.includes("RED") ? colors.red : sel.tlpLevel?.includes("AMBER") ? colors.orange : colors.green}>{sel.tlpLevel}</Badge>
                  <Badge color={colors.purple}>{sel.exerciseType}</Badge>
                  {sel.rating > 0 && <Badge color={colors.yellow}>{"★".repeat(sel.rating)}{"☆".repeat(5 - sel.rating)}</Badge>}
                </div>
                <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 6 }}>
                  Facilitator: {sel.facilitator || "—"} {sel.facilitatorOrg ? `(${sel.facilitatorOrg})` : ""} · Sponsor: {sel.sponsor || "—"} · {sel.participants?.length || 0} participants
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Select value={sel.status} onChange={(v) => updateEx(sel.id, { status: v })} options={["Scheduled", "In Progress", "Complete"]} />
                <Select value={sel.rating.toString()} onChange={(v) => updateEx(sel.id, { rating: parseInt(v) || 0 })} options={[{ value: "0", label: "No rating" }, { value: "1", label: "★" }, { value: "2", label: "★★" }, { value: "3", label: "★★★" }, { value: "4", label: "★★★★" }, { value: "5", label: "★★★★★" }]} />
                <Button variant="outline" size="sm" onClick={() => {
                  const LN = "━".repeat(52);
                  let txt = `${LN}\n${org.name || "Organization"}\nTABLETOP EXERCISE — AFTER-ACTION REPORT\n${LN}\n\nExercise: ${sel.title}\nDate: ${sel.date}\nType: ${sel.exerciseType}\nTLP: ${sel.tlpLevel}\nFacilitator: ${sel.facilitator} (${sel.facilitatorOrg})\nSponsor: ${sel.sponsor}\nParticipants: ${sel.participants?.length || 0}\nRating: ${"★".repeat(sel.rating)}${"☆".repeat(5 - sel.rating)}\n\nSCENARIO\n${sel.scenario}\n\n`;
                  if (sel.objectives?.length) { txt += `OBJECTIVES\n${"─".repeat(40)}\n`; sel.objectives.forEach((o) => { txt += `  ${o.id}: ${o.title} — ${o.rating}\n  ${o.description}\n  Notes: ${o.notes}\n\n`; }); }
                  if (sel.findings?.length) { txt += `KEY FINDINGS\n${"─".repeat(40)}\n`; sel.findings.forEach((f, i) => { txt += `  ${i + 1}. [${f.priority}] ${f.finding}\n     Owner: ${f.owner} | Status: ${f.status} | NIST: ${f.nistMapping}\n\n`; }); }
                  if (sel.lessonsLearned?.length) { txt += `LESSONS LEARNED\n${"─".repeat(40)}\n`; sel.lessonsLearned.forEach((l) => { txt += `  • ${l.text}\n    Impact: ${l.impact}\n    Recommendation: ${l.recommendation}\n\n`; }); }
                  if (sel.actionItems?.length) { txt += `ACTION ITEMS\n${"─".repeat(40)}\n`; sel.actionItems.forEach((a) => { txt += `  • ${a.text} | Owner: ${a.owner} | Priority: ${a.priority} | Due: ${a.dueDate} | Status: ${a.status}\n`; }); txt += "\n"; }
                  if (sel.strengths?.length) { txt += `STRENGTHS\n${"─".repeat(40)}\n${sel.strengths.map((s) => `  • ${s}`).join("\n")}\n\n`; }
                  if (sel.notes) { txt += `NOTES\n${"─".repeat(40)}\n${sel.notes}\n\n`; }
                  txt += `${LN}\nGenerated by Dark Rock Labs Sentry\nConfidential\n${LN}\n`;
                  const blob = new Blob([txt], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `AAR_${sel.title.replace(/\s/g, "_")}.txt`; a.click();
                }}>Export AAR</Button>
              </div>
            </div>
            {sel.scenario && <p style={{ color: colors.textMuted, fontSize: 10, marginTop: 8, lineHeight: 1.5 }}>{sel.scenario}</p>}
          </Card>

          {/* Objectives */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ color: colors.white, margin: 0, fontSize: 13, fontWeight: 700 }}>Objectives</h3>
              <Button variant="ghost" size="sm" onClick={() => {
                const objs = [...(sel.objectives || [])];
                objs.push({ id: `OBJ-${(objs.length + 1).toString().padStart(2, "0")}`, title: "", description: "", rating: "Not Met", notes: "" });
                updateEx(sel.id, { objectives: objs });
              }}>+ Add Objective</Button>
            </div>
            {(sel.objectives || []).map((obj, idx) => {
              return (
                <div key={obj.id} style={{ padding: "10px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Badge color={colors.blue}>{obj.id}</Badge>
                      <Input value={obj.title} onChange={(v) => { const o = [...sel.objectives]; o[idx] = { ...o[idx], title: v }; updateEx(sel.id, { objectives: o }); }} placeholder="Objective title" style={{ marginBottom: 0, width: 300 }} />
                    </div>
                    <Select value={obj.rating} onChange={(v) => { const o = [...sel.objectives]; o[idx] = { ...o[idx], rating: v as TTXObjective["rating"] }; updateEx(sel.id, { objectives: o }); }} options={["Met", "Partially Met", "Not Met"]} />
                  </div>
                  <Input value={obj.description} onChange={(v) => { const o = [...sel.objectives]; o[idx] = { ...o[idx], description: v }; updateEx(sel.id, { objectives: o }); }} placeholder="Description" style={{ marginBottom: 4 }} />
                  <Input value={obj.notes} onChange={(v) => { const o = [...sel.objectives]; o[idx] = { ...o[idx], notes: v }; updateEx(sel.id, { objectives: o }); }} placeholder="Evaluation notes" textarea rows={2} style={{ marginBottom: 0 }} />
                </div>
              );
            })}
          </Card>

          {/* Findings */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ color: colors.white, margin: 0, fontSize: 13, fontWeight: 700 }}>Key Findings ({(sel.findings || []).filter((f) => f.status === "Resolved").length}/{(sel.findings || []).length} resolved)</h3>
              <Button variant="ghost" size="sm" onClick={() => {
                updateEx(sel.id, { findings: [...(sel.findings || []), { id: Date.now(), finding: "", priority: "Medium", nistMapping: "", owner: "", status: "Open", notes: "", taskCreated: false }] });
              }}>+ Add Finding</Button>
            </div>
            {(sel.findings || []).length > 0 && <ProgressBar value={(sel.findings || []).filter((f) => f.status === "Resolved").length} max={(sel.findings || []).length} color={(sel.findings || []).every((f) => f.status === "Resolved") ? colors.green : colors.teal} height={4} />}
            {(sel.findings || []).map((f, idx) => (
              <div key={f.id} style={{ padding: "8px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 6, alignItems: "center" }}>
                  <Input value={f.finding} onChange={(v) => { const fs = [...sel.findings]; fs[idx] = { ...fs[idx], finding: v }; updateEx(sel.id, { findings: fs }); }} placeholder="Finding" style={{ marginBottom: 0 }} />
                  <Select value={f.priority} onChange={(v) => { const fs = [...sel.findings]; fs[idx] = { ...fs[idx], priority: v as TTXFinding["priority"] }; updateEx(sel.id, { findings: fs }); }} options={PRIORITIES} />
                  <Select value={f.nistMapping} onChange={(v) => { const fs = [...sel.findings]; fs[idx] = { ...fs[idx], nistMapping: v }; updateEx(sel.id, { findings: fs }); }} options={NIST_CATS} />
                  <Input value={f.owner} onChange={(v) => { const fs = [...sel.findings]; fs[idx] = { ...fs[idx], owner: v }; updateEx(sel.id, { findings: fs }); }} placeholder="Owner" style={{ marginBottom: 0 }} />
                  <div style={{ display: "flex", gap: 3 }}>
                    <select value={f.status} onChange={(e) => { const fs = [...sel.findings]; fs[idx] = { ...fs[idx], status: e.target.value as TTXFinding["status"] }; updateEx(sel.id, { findings: fs }); }}
                      style={{ padding: "4px 6px", background: colors.obsidianM, border: `1px solid ${colors.panelBorder}`, borderRadius: 5, color: f.status === "Resolved" ? colors.green : f.status === "In Progress" ? colors.teal : colors.textMuted, fontSize: 9, fontFamily: "inherit", flex: 1 }}>
                      <option>Open</option><option>In Progress</option><option>Resolved</option>
                    </select>
                    {!f.taskCreated && (
                      <Button variant="ghost" size="sm" style={{ fontSize: 8, padding: "2px 5px" }} onClick={() => {
                        createTaskFromFinding(f, sel.title);
                        const fs = [...sel.findings]; fs[idx] = { ...fs[idx], taskCreated: true }; updateEx(sel.id, { findings: fs });
                      }}>Task →</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Card>

          {/* Lessons Learned */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ color: colors.white, margin: 0, fontSize: 13, fontWeight: 700 }}>Lessons Learned</h3>
              <Button variant="ghost" size="sm" onClick={async () => {
                const r = await modal.showPrompt("Add Lesson", [
                  { key: "text", label: "Lesson", required: true, type: "textarea" },
                  { key: "impact", label: "Impact" },
                  { key: "recommendation", label: "Recommendation" },
                ]);
                if (r) {
                  const lesson: TTXLesson = { id: Date.now(), text: r.text, impact: r.impact || "", recommendation: r.recommendation || "", addedToDashboard: true };
                  updateEx(sel.id, { lessonsLearned: [...(sel.lessonsLearned || []), lesson] });
                  addLessonToDashboard(lesson, sel.title);
                }
              }}>+ Add Lesson</Button>
            </div>
            {(sel.lessonsLearned || []).map((l) => (
              <div key={l.id} style={{ padding: "8px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ color: colors.text, fontSize: 11, fontWeight: 500, marginBottom: 3 }}>{l.text}</div>
                {l.impact && <div style={{ color: colors.textMuted, fontSize: 9 }}>Impact: {l.impact}</div>}
                {l.recommendation && <div style={{ color: colors.textMuted, fontSize: 9 }}>Recommendation: {l.recommendation}</div>}
                {l.addedToDashboard && <Badge color={colors.green} className="mt-1">Added to Dashboard</Badge>}
              </div>
            ))}
          </Card>

          {/* Action Items */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ color: colors.white, margin: 0, fontSize: 13, fontWeight: 700 }}>Action Items</h3>
              <Button variant="ghost" size="sm" onClick={async () => {
                const r = await modal.showPrompt("Add Action Item", [
                  { key: "text", label: "Action", required: true },
                  { key: "owner", label: "Owner" },
                  { key: "priority", label: "Priority", type: "select", options: PRIORITIES, defaultValue: "Medium" },
                  { key: "dueDate", label: "Due Date" },
                ]);
                if (r) {
                  updateEx(sel.id, { actionItems: [...(sel.actionItems || []), { id: Date.now(), text: r.text, owner: r.owner || "", priority: r.priority as TTXActionItem["priority"], dueDate: r.dueDate || "", status: "Open" }] });
                }
              }}>+ Add Action</Button>
            </div>
            {(sel.actionItems || []).map((a, idx) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: colors.text, fontSize: 10, fontWeight: 500 }}>{a.text}</span>
                  <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                    <Badge color={a.priority === "Critical" ? colors.red : a.priority === "High" ? colors.orange : colors.yellow}>{a.priority}</Badge>
                    {a.owner && <Badge color={colors.blue}>{a.owner}</Badge>}
                    {a.dueDate && <Badge color={colors.textDim}>{a.dueDate}</Badge>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  <select value={a.status} onChange={(e) => { const items = [...sel.actionItems]; items[idx] = { ...items[idx], status: e.target.value as TTXActionItem["status"] }; updateEx(sel.id, { actionItems: items }); }}
                    style={{ padding: "3px 6px", background: colors.obsidianM, border: `1px solid ${colors.panelBorder}`, borderRadius: 4, color: a.status === "Complete" ? colors.green : colors.textMuted, fontSize: 9, fontFamily: "inherit" }}>
                    <option>Open</option><option>In Progress</option><option>Complete</option>
                  </select>
                  {!a.taskId && <Button variant="ghost" size="sm" style={{ fontSize: 8 }} onClick={() => {
                    const taskId = createTaskFromAction(a, sel.title);
                    const items = [...sel.actionItems]; items[idx] = { ...items[idx], taskId }; updateEx(sel.id, { actionItems: items });
                  }}>Create →</Button>}
                  {a.taskId && <Badge color={colors.teal}>Task #{a.taskId}</Badge>}
                </div>
              </div>
            ))}
          </Card>

          {/* Strengths */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ color: colors.white, margin: 0, fontSize: 13, fontWeight: 700 }}>Strengths</h3>
              <Button variant="ghost" size="sm" onClick={async () => {
                const r = await modal.showPrompt("Add Strength", [{ key: "strength", label: "Strength", required: true }]);
                if (r) updateEx(sel.id, { strengths: [...(sel.strengths || []), r.strength] });
              }}>+ Add</Button>
            </div>
            {(sel.strengths || []).map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <span style={{ color: colors.green, fontSize: 10 }}>✓</span>
                <span style={{ color: colors.text, fontSize: 11 }}>{s}</span>
              </div>
            ))}
          </Card>

          {/* Notes */}
          <Card style={{ marginBottom: 12 }}>
            <h3 style={{ color: colors.white, marginTop: 0, fontSize: 13, fontWeight: 700 }}>Exercise Notes</h3>
            <Input value={sel.notes || ""} onChange={(v) => updateEx(sel.id, { notes: v })} textarea rows={4} placeholder="General observations, scenario variations, or additional notes..." />
          </Card>
        </div>
      );
    }

    // Create form
    if (view === "create") {
      return (
        <div>
          <SectionHeader sub="Exercise management, playbook walk-throughs, and ATLAS integration">Tabletop Exercises</SectionHeader>
          {tabBar}
          <Button variant="ghost" onClick={() => setView("list")} style={{ marginBottom: 12 }}>← Back</Button>
          <Card>
            <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14, fontWeight: 700 }}>New Exercise</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              <Input label="Exercise Title *" value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} placeholder="Q2 2026 Ransomware Response Exercise" />
              <Input label="Date *" value={form.date} onChange={(v) => setForm((p) => ({ ...p, date: v }))} type="date" />
              <Select label="Exercise Type" value={form.exerciseType} onChange={(v) => setForm((p) => ({ ...p, exerciseType: v }))} options={EX_TYPES} />
              <Select label="TLP Level" value={form.tlpLevel} onChange={(v) => setForm((p) => ({ ...p, tlpLevel: v }))} options={TLP_LEVELS} />
              <Input label="Facilitator" value={form.facilitator} onChange={(v) => setForm((p) => ({ ...p, facilitator: v }))} placeholder="Facilitator name" />
              <Input label="Facilitator Organization" value={form.facilitatorOrg} onChange={(v) => setForm((p) => ({ ...p, facilitatorOrg: v }))} placeholder="e.g., Internal, Dark Rock Labs" />
              <Input label="Sponsor" value={form.sponsor} onChange={(v) => setForm((p) => ({ ...p, sponsor: v }))} placeholder="e.g., CISO, Board of Directors" />
              <Input label="Scope" value={form.scope} onChange={(v) => setForm((p) => ({ ...p, scope: v }))} placeholder="e.g., IT incident response team" />
            </div>
            <Input label="Scenario / Description *" value={form.scenario} onChange={(v) => setForm((p) => ({ ...p, scenario: v }))} textarea rows={4} placeholder="Describe the exercise scenario..." />
            <div style={{ display: "flex", gap: 6 }}>
              <Button onClick={() => {
                if (!form.title || !form.date || !form.scenario) { modal.showAlert("Required Fields", "Title, date, and scenario are required."); return; }
                addTabletopExercise({ ...form, id: Date.now() } as TabletopExercise);
                setForm(emptyExercise());
                setView("list");
              }}>Create Exercise</Button>
              <Button variant="secondary" onClick={() => setView("list")}>Cancel</Button>
            </div>
          </Card>
        </div>
      );
    }

    // List view
    return (
      <div>
        <SectionHeader sub="Exercise management, playbook walk-throughs, and ATLAS integration">Tabletop Exercises</SectionHeader>
        {tabBar}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { l: "Total Exercises", v: totalEx, c: colors.blue },
            { l: "Completed", v: completedEx, c: colors.green },
            { l: "Scheduled", v: scheduledEx, c: colors.teal },
            { l: "Open Actions", v: openActions, c: openActions > 0 ? colors.orange : colors.green },
          ].map((x) => (
            <Card key={x.l} style={{ textAlign: "center", padding: "12px 8px" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: x.c }}>{x.v}</div>
              <div style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>{x.l}</div>
            </Card>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <Button onClick={() => setView("create")}>+ New Exercise</Button>
        </div>

        {tabletopExercises.length === 0 ? (
          <Card style={{ textAlign: "center", padding: "30px 18px" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
            <div style={{ color: colors.textDim, fontSize: 12 }}>No exercises yet. Create one or use the Light Tabletop for a quick playbook walk-through.</div>
          </Card>
        ) : tabletopExercises.map((ex) => (
          <Card key={ex.id} onClick={() => { setSelId(ex.id); setView("detail"); }} style={{ marginBottom: 8, cursor: "pointer", borderLeft: `3px solid ${ex.status === "Complete" ? colors.green : colors.teal}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: colors.white, fontSize: 13, fontWeight: 700 }}>{ex.title}</div>
                <div style={{ color: colors.textDim, fontSize: 10, marginTop: 3 }}>
                  {ex.date} · {ex.facilitator || "No facilitator"} · {ex.participants?.length || 0} participants
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  <Badge color={ex.status === "Complete" ? colors.green : colors.teal}>{ex.status}</Badge>
                  {ex.exerciseType && <Badge color={colors.purple}>{ex.exerciseType}</Badge>}
                  {(ex.findings?.length || 0) > 0 && <Badge color={colors.blue}>{ex.findings.length} findings</Badge>}
                  {(ex.actionItems?.filter((a) => a.status !== "Complete")?.length || 0) > 0 && <Badge color={colors.orange}>{ex.actionItems.filter((a) => a.status !== "Complete").length} open actions</Badge>}
                  {ex.rating > 0 && <Badge color={colors.yellow}>{"★".repeat(ex.rating)}</Badge>}
                </div>
              </div>
            </div>
            {ex.scenario && <p style={{ color: colors.textMuted, fontSize: 9, margin: "6px 0 0", lineHeight: 1.4 }}>{ex.scenario.substring(0, 120)}{ex.scenario.length > 120 ? "..." : ""}</p>}
          </Card>
        ))}
      </div>
    );
  }

  // ═══ LIGHT TABLETOP TAB ═══════════════════════════════════════════
  if (mainTab === "light") {
    const ltPlaybook = PLAYBOOKS.find((p) => p.id === ltPlaybookId);
    const phases = ltPlaybook ? [
      { k: "iocs", l: "IOC Verification", steps: ltPlaybook.iocs },
      { k: "contain", l: "Containment", steps: ltPlaybook.contain },
      { k: "erad", l: "Eradication", steps: ltPlaybook.erad },
      { k: "recover", l: "Recovery", steps: ltPlaybook.recover },
    ] : [];
    const allSteps = phases.flatMap((p) => p.steps.map((s, i) => ({ phase: p.k, phaseLabel: p.l, stepIndex: i, stepText: s })));

    // Walk-through active
    if (ltStep === "walkthrough" && ltPlaybook) {
      const flatIdx = phases.slice(0, ltCurrentPhase).reduce((a, p) => a + p.steps.length, 0) + ltCurrentStep;
      const currentPhase = phases[ltCurrentPhase];
      const currentStepText = currentPhase?.steps[ltCurrentStep] || "";
      const currentData = ltSteps.find((s) => s.phase === currentPhase?.k && s.stepIndex === ltCurrentStep);
      const totalSteps = allSteps.length;
      const gapCount = ltSteps.filter((s) => s.gapIdentified).length;

      return (
        <div>
          <SectionHeader sub="Exercise management, playbook walk-throughs, and ATLAS integration">Tabletop Exercises</SectionHeader>
          {tabBar}
          <Button variant="ghost" onClick={() => setLtStep("config")} style={{ marginBottom: 12 }}>← Back to Config</Button>

          <Card style={{ marginBottom: 12, borderLeft: `3px solid ${colors.teal}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: colors.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>PHASE: {currentPhase?.l}</div>
              <span style={{ color: colors.textMuted, fontSize: 9 }}>Step {flatIdx + 1} of {totalSteps} · {gapCount} gaps found</span>
            </div>
            <ProgressBar value={flatIdx + 1} max={totalSteps} height={4} />
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <div style={{ color: colors.white, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Step {ltCurrentStep + 1}: {currentStepText}</div>
            <div style={{ color: colors.textMuted, fontSize: 10, marginBottom: 12, lineHeight: 1.5 }}>
              How would your team handle this? What tools would you use? Who responds? What&apos;s the expected timeline?
            </div>
            <Input label="Team Response" value={currentData?.response || ""} onChange={(v) => {
              const updated = [...ltSteps];
              const idx = updated.findIndex((s) => s.phase === currentPhase.k && s.stepIndex === ltCurrentStep);
              if (idx >= 0) updated[idx] = { ...updated[idx], response: v };
              else updated.push({ phase: currentPhase.k, stepIndex: ltCurrentStep, stepText: currentStepText, response: v, gapIdentified: false, gapDescription: "", confidence: "Unknown" });
              setLtSteps(updated);
            }} textarea rows={4} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11, color: colors.text, padding: "6px 0" }}>
                  <input type="checkbox" checked={currentData?.gapIdentified || false} onChange={(e) => {
                    const updated = [...ltSteps];
                    const idx = updated.findIndex((s) => s.phase === currentPhase.k && s.stepIndex === ltCurrentStep);
                    if (idx >= 0) updated[idx] = { ...updated[idx], gapIdentified: e.target.checked };
                    else updated.push({ phase: currentPhase.k, stepIndex: ltCurrentStep, stepText: currentStepText, response: "", gapIdentified: e.target.checked, gapDescription: "", confidence: "Unknown" });
                    setLtSteps(updated);
                  }} style={{ accentColor: colors.teal }} />
                  Gap Identified
                </label>
                {currentData?.gapIdentified && (
                  <Input label="Gap Description" value={currentData?.gapDescription || ""} onChange={(v) => {
                    const updated = [...ltSteps]; const idx = updated.findIndex((s) => s.phase === currentPhase.k && s.stepIndex === ltCurrentStep);
                    if (idx >= 0) updated[idx] = { ...updated[idx], gapDescription: v }; setLtSteps(updated);
                  }} />
                )}
              </div>
              <Select label="Confidence Level" value={currentData?.confidence || "Unknown"} onChange={(v) => {
                const updated = [...ltSteps]; const idx = updated.findIndex((s) => s.phase === currentPhase.k && s.stepIndex === ltCurrentStep);
                if (idx >= 0) updated[idx] = { ...updated[idx], confidence: v as TTXWalkThroughStep["confidence"] };
                else updated.push({ phase: currentPhase.k, stepIndex: ltCurrentStep, stepText: currentStepText, response: "", gapIdentified: false, gapDescription: "", confidence: v as TTXWalkThroughStep["confidence"] });
                setLtSteps(updated);
              }} options={["High", "Medium", "Low", "Unknown"]} />
            </div>
          </Card>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button variant="secondary" disabled={flatIdx === 0} onClick={() => {
              if (ltCurrentStep > 0) setLtCurrentStep(ltCurrentStep - 1);
              else if (ltCurrentPhase > 0) { setLtCurrentPhase(ltCurrentPhase - 1); setLtCurrentStep(phases[ltCurrentPhase - 1].steps.length - 1); }
            }}>← Previous</Button>
            {flatIdx < totalSteps - 1 ? (
              <Button onClick={() => {
                if (ltCurrentStep < currentPhase.steps.length - 1) setLtCurrentStep(ltCurrentStep + 1);
                else if (ltCurrentPhase < phases.length - 1) { setLtCurrentPhase(ltCurrentPhase + 1); setLtCurrentStep(0); }
              }}>Next →</Button>
            ) : (
              <Button onClick={() => setLtStep("summary")}>Finish Walk-Through</Button>
            )}
          </div>
        </div>
      );
    }

    // Summary
    if (ltStep === "summary" && ltPlaybook) {
      const gapSteps = ltSteps.filter((s) => s.gapIdentified);
      return (
        <div>
          <SectionHeader sub="Exercise management, playbook walk-throughs, and ATLAS integration">Tabletop Exercises</SectionHeader>
          {tabBar}
          <Card style={{ marginBottom: 14, borderLeft: `3px solid ${colors.green}` }}>
            <div style={{ fontSize: 12, color: colors.green, fontWeight: 800, marginBottom: 8 }}>WALK-THROUGH COMPLETE</div>
            <div style={{ color: colors.text, fontSize: 11, marginBottom: 4 }}>Playbook: {ltPlaybook.name} · Steps: {allSteps.length} · Gaps: {gapSteps.length}</div>
            {phases.map((p) => {
              const phaseGaps = gapSteps.filter((s) => s.phase === p.k);
              return (
                <div key={p.k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                  <span style={{ color: colors.textMuted, fontSize: 10, width: 100 }}>{p.l}</span>
                  <Badge color={phaseGaps.length > 0 ? colors.orange : colors.green}>{phaseGaps.length} gaps</Badge>
                </div>
              );
            })}
          </Card>
          {gapSteps.length > 0 && (
            <Card style={{ marginBottom: 14 }}>
              <h3 style={{ color: colors.white, marginTop: 0, fontSize: 13, fontWeight: 700 }}>Gaps Identified</h3>
              {gapSteps.map((s, i) => (
                <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <div style={{ color: colors.text, fontSize: 10, fontWeight: 500 }}>{s.stepText}</div>
                  <div style={{ color: colors.orange, fontSize: 9, marginTop: 2 }}>{s.gapDescription}</div>
                  <Badge color={s.confidence === "Low" ? colors.red : s.confidence === "Medium" ? colors.yellow : colors.green}>{s.confidence}</Badge>
                </div>
              ))}
            </Card>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => saveWalkThrough()}>Save as Exercise</Button>
            <Button variant="secondary" onClick={() => { setLtStep("select"); setLtSteps([]); }}>Discard</Button>
          </div>
        </div>
      );
    }

    // Config
    if (ltStep === "config" && ltPlaybook) {
      return (
        <div>
          <SectionHeader sub="Exercise management, playbook walk-throughs, and ATLAS integration">Tabletop Exercises</SectionHeader>
          {tabBar}
          <Button variant="ghost" onClick={() => setLtStep("select")} style={{ marginBottom: 12 }}>← Back to Playbooks</Button>
          <Card style={{ marginBottom: 14, borderLeft: `3px solid ${colors.purple}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{ltPlaybook.icon}</span>
              <div>
                <div style={{ color: colors.white, fontSize: 14, fontWeight: 700 }}>{ltPlaybook.name}</div>
                <div style={{ color: colors.textMuted, fontSize: 10 }}>{ltPlaybook.desc.substring(0, 100)}...</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              <Input label="Exercise Title" value={ltConfig.title} onChange={(v) => setLtConfig((p) => ({ ...p, title: v }))} placeholder={`${ltPlaybook.name} Walk-Through`} />
              <Input label="Date" value={ltConfig.date} onChange={(v) => setLtConfig((p) => ({ ...p, date: v }))} type="date" />
              <Input label="Facilitator" value={ltConfig.facilitator} onChange={(v) => setLtConfig((p) => ({ ...p, facilitator: v }))} />
              <Input label="Participants" value={ltConfig.participantNames} onChange={(v) => setLtConfig((p) => ({ ...p, participantNames: v }))} placeholder="Names, comma-separated" />
            </div>
            <Button onClick={() => { setLtStep("walkthrough"); setLtCurrentPhase(0); setLtCurrentStep(0); setLtSteps([]); }}>Start Walk-Through →</Button>
          </Card>
        </div>
      );
    }

    // Select playbook
    return (
      <div>
        <SectionHeader sub="Exercise management, playbook walk-throughs, and ATLAS integration">Tabletop Exercises</SectionHeader>
        {tabBar}
        <Card style={{ marginBottom: 14, padding: 14 }}>
          <div style={{ color: colors.white, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Light Tabletop — Playbook Walk-Through</div>
          <p style={{ color: colors.textMuted, fontSize: 10, margin: 0, lineHeight: 1.5 }}>
            Select a playbook to walk through as a discussion-based exercise. Each step becomes a prompt for your team to evaluate their response capability.
          </p>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {PLAYBOOKS.map((pb) => (
            <Card key={pb.id} onClick={() => { setLtPlaybookId(pb.id); setLtStep("config"); }} style={{ cursor: "pointer", borderLeft: `3px solid ${pb.sev === "Critical" ? colors.red : pb.sev === "High" ? colors.orange : colors.yellow}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>{pb.icon}</span>
                <span style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{pb.name}</span>
              </div>
              <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                <Badge>{pb.cat}</Badge>
                <Badge color={pb.sev === "Critical" ? colors.red : colors.orange}>{pb.sev}</Badge>
                <Badge color={colors.textDim}>{pb.iocs.length + pb.contain.length + pb.erad.length + pb.recover.length} steps</Badge>
              </div>
              <p style={{ color: colors.textMuted, fontSize: 9, margin: 0, lineHeight: 1.3 }}>{pb.desc.substring(0, 80)}...</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ═══ ATLAS TAB ════════════════════════════════════════════════════
  return (
    <div>
      <SectionHeader sub="Exercise management, playbook walk-throughs, and ATLAS integration">Tabletop Exercises</SectionHeader>
      {tabBar}

      <Card style={{ marginBottom: 20, background: `linear-gradient(135deg, ${colors.teal}08, ${colors.panel})`, borderColor: colors.teal + "33" }}>
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>◫</div>
          <h2 style={{ color: colors.white, fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>ATLAS by Dark Rock Labs</h2>
          <p style={{ color: colors.textMuted, fontSize: 11, maxWidth: 560, margin: "0 auto 6px", lineHeight: 1.6 }}>
            ATLAS is Dark Rock Labs&apos; AI-led, fully autonomous cyber tabletop exercise platform. It delivers executive-grade, facilitated incident response exercises that adapt in real-time to your team&apos;s decisions.
          </p>
          <p style={{ color: colors.textMuted, fontSize: 10, maxWidth: 520, margin: "0 auto 16px", lineHeight: 1.5 }}>
            Unlike traditional tabletops that rely on a human facilitator reading from a script, ATLAS uses AI to generate dynamic, branching scenarios that respond to your team&apos;s actions — no two exercises play out the same. It evaluates response decisions against NIST and MITRE ATT&CK frameworks and generates a professional after-action report immediately upon completion.
          </p>
          <Badge color={colors.green} className="mb-3">LIVE</Badge>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
            <Button onClick={() => window.open("https://darkrocksec.com", "_blank")}>Launch ATLAS →</Button>
            <Button variant="outline" onClick={() => window.open("https://darkrocksec.com", "_blank")}>Learn More</Button>
          </div>
          <div style={{ color: colors.textDim, fontSize: 9, marginTop: 12 }}>darkrocksec.com</div>
        </div>
      </Card>

      <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Available ATLAS Scenarios</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {ATLAS_SCENARIOS.map((s) => (
          <Card key={s.name} onClick={() => window.open("https://darkrocksec.com", "_blank")} style={{ cursor: "pointer", textAlign: "center", padding: "16px 12px" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ color: colors.white, fontSize: 11, fontWeight: 700 }}>{s.name}</div>
            <Button variant="ghost" size="sm" style={{ marginTop: 8 }}>Launch →</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
