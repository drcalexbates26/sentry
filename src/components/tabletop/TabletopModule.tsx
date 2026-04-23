"use client";

import { useState, useCallback } from "react";
import { colors } from "@/lib/tokens";
import { useStore } from "@/store";
import { Badge, Button, Card, Input, Select, SectionHeader, ProgressBar } from "@/components/ui";

interface AARObjective {
  id: string; title: string; description: string;
  rating: "Met" | "Partially Met" | "Not Met";
  findings: string[]; recommendations: string[];
}

interface AARFinding {
  id: number; finding: string; recommendation: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  owner: string; status: "Open" | "In Progress" | "Resolved";
  dueDate: string; nistMapping: string;
}

interface AARData {
  scope: string; purpose: string; tlpLevel: string;
  threatProfile: { confidentiality: string[]; integrity: string[]; availability: string[] };
  objectives: AARObjective[];
  findings: AARFinding[];
  strengths: string[];
  executiveSummary: string; notableObservations: string; conclusion: string;
  overallRating: number;
}

const TLP_LEVELS = ["TLP:RED", "TLP:AMBER+STRICT", "TLP:AMBER", "TLP:GREEN", "TLP:CLEAR"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const NIST_CATS = ["GV.OC", "GV.RM", "GV.RR", "ID.AM", "ID.RA", "PR.AA", "PR.AT", "PR.DS", "PR.PS", "PR.IR", "DE.CM", "DE.AE", "RS.MA", "RS.AN", "RS.CO", "RS.MI", "RC.RP", "RC.CO"];

const emptyAAR = (): AARData => ({
  scope: "Discussion-based, facilitated IT Tabletop Exercise", purpose: "", tlpLevel: "TLP:AMBER+STRICT",
  threatProfile: { confidentiality: [], integrity: [], availability: [] },
  objectives: [], findings: [], strengths: [],
  executiveSummary: "", notableObservations: "", conclusion: "",
  overallRating: 0,
});

export function TabletopModule() {
  const { tabletopExercises, addTabletopExercise, updateTabletopExercise, addTask, addLesson } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [selId, setSelId] = useState<number | null>(null);
  const [nf, setNf] = useState({ title: "", scenario: "", date: "", facilitator: "", participants: "", notes: "" });
  const [aarData, setAarData] = useState<Record<number, AARData>>({});
  const [aarEditId, setAarEditId] = useState<number | null>(null);

  // ── AAR editing helpers ────────────────────────────────────────────
  const getAAR = useCallback((id: number) => aarData[id] || emptyAAR(), [aarData]);

  const updateAAR = useCallback((id: number, updates: Partial<AARData>) => {
    setAarData((p) => ({ ...p, [id]: { ...getAAR(id), ...updates } }));
  }, [getAAR]);

  const addObjective = useCallback((id: number) => {
    const aar = getAAR(id);
    const objId = `OBJ-${(aar.objectives.length + 1).toString().padStart(2, "0")}`;
    updateAAR(id, { objectives: [...aar.objectives, { id: objId, title: "", description: "", rating: "Not Met", findings: [], recommendations: [] }] });
  }, [getAAR, updateAAR]);

  const addFinding = useCallback((id: number) => {
    const aar = getAAR(id);
    updateAAR(id, { findings: [...aar.findings, { id: Date.now(), finding: "", recommendation: "", priority: "Medium", owner: "", status: "Open", dueDate: "", nistMapping: "" }] });
  }, [getAAR, updateAAR]);

  const createTaskFromFinding = useCallback((f: AARFinding, exerciseTitle: string) => {
    addTask({
      id: Date.now(), title: `[AAR] ${f.finding.substring(0, 80)}`, priority: f.priority as "Critical" | "High" | "Medium" | "Low",
      status: "Backlog", assignee: f.owner, source: `Tabletop: ${exerciseTitle}`,
      updates: [], created: new Date().toLocaleDateString(),
      irPhase: f.nistMapping?.startsWith("PR") ? "prep" : f.nistMapping?.startsWith("DE") ? "ident" : f.nistMapping?.startsWith("RS") ? "contain" : undefined,
    });
    addLesson({ text: f.finding, date: new Date().toLocaleDateString(), src: `Tabletop: ${exerciseTitle}` });
  }, [addTask, addLesson]);

  // ── AAR DASHBOARD VIEW ─────────────────────────────────────────────
  if (selId !== null) {
    const ex = tabletopExercises.find((e) => e.id === selId);
    if (!ex) { setSelId(null); return null; }
    const aar = getAAR(selId);
    const isEditing = aarEditId === selId;
    const resolvedFindings = aar.findings.filter((f) => f.status === "Resolved").length;
    const totalFindings = aar.findings.length;
    const metObjs = aar.objectives.filter((o) => o.rating === "Met").length;
    const partialObjs = aar.objectives.filter((o) => o.rating === "Partially Met").length;
    const notMetObjs = aar.objectives.filter((o) => o.rating === "Not Met").length;

    return (
      <div>
        <Button variant="ghost" onClick={() => { setSelId(null); setAarEditId(null); }} style={{ marginBottom: 12 }}>← Back to Exercises</Button>

        {/* Header */}
        <Card style={{ marginBottom: 14, borderLeft: `3px solid ${ex.status === "Completed" ? colors.green : colors.teal}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ color: colors.white, margin: "0 0 6px", fontSize: 16 }}>{ex.title}</h2>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <Badge color={ex.status === "Completed" ? colors.green : colors.teal}>{ex.status}</Badge>
                <Badge color={colors.textDim}>{ex.date}</Badge>
                {aar.tlpLevel && <Badge color={aar.tlpLevel.includes("RED") ? colors.red : aar.tlpLevel.includes("AMBER") ? colors.orange : colors.green}>{aar.tlpLevel}</Badge>}
                {aar.overallRating > 0 && <Badge color={colors.yellow}>{"★".repeat(aar.overallRating)}{"☆".repeat(5 - aar.overallRating)}</Badge>}
              </div>
              <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 6 }}>
                Facilitator: {ex.facilitator || "—"} · Participants: {ex.participants || "—"}
              </div>
              {aar.scope && <div style={{ color: colors.textDim, fontSize: 9, marginTop: 2 }}>Scope: {aar.scope}</div>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Button variant={isEditing ? "secondary" : "outline"} size="sm" onClick={() => setAarEditId(isEditing ? null : selId)}>
                {isEditing ? "Done Editing" : "Edit AAR"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                let txt = `AFTER-ACTION REPORT\n${"━".repeat(60)}\n\nExercise: ${ex.title}\nDate: ${ex.date}\nFacilitator: ${ex.facilitator}\nScope: ${aar.scope}\nTLP: ${aar.tlpLevel}\nOverall Rating: ${"★".repeat(aar.overallRating)}${"☆".repeat(5 - aar.overallRating)}\n\n`;
                if (aar.executiveSummary) txt += `EXECUTIVE SUMMARY\n${"─".repeat(40)}\n${aar.executiveSummary}\n\n`;
                if (aar.objectives.length > 0) {
                  txt += `OBJECTIVES\n${"─".repeat(40)}\n`;
                  aar.objectives.forEach((o) => { txt += `  ${o.id}: ${o.title} — ${o.rating}\n    ${o.description}\n\n`; });
                }
                if (aar.findings.length > 0) {
                  txt += `FINDINGS\n${"─".repeat(40)}\n`;
                  aar.findings.forEach((f, i) => { txt += `  ${i + 1}. [${f.priority}] ${f.finding}\n     Recommendation: ${f.recommendation}\n     Owner: ${f.owner || "Unassigned"} | Status: ${f.status} | NIST: ${f.nistMapping || "—"}\n\n`; });
                }
                if (aar.strengths.length > 0) { txt += `STRENGTHS\n${"─".repeat(40)}\n${aar.strengths.map((s) => `  • ${s}`).join("\n")}\n\n`; }
                if (aar.conclusion) txt += `CONCLUSION\n${"─".repeat(40)}\n${aar.conclusion}\n\n`;
                txt += `${"━".repeat(60)}\nDark Rock Labs Sentry v3.1.0\n`;
                const blob = new Blob([txt], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `AAR_${ex.title.replace(/\s/g, "_")}.txt`; a.click();
              }}>Export AAR</Button>
            </div>
          </div>
        </Card>

        {/* Edit mode: AAR metadata */}
        {isEditing && (
          <Card style={{ marginBottom: 14, borderColor: colors.teal + "44" }}>
            <h3 style={{ color: colors.white, marginTop: 0, fontSize: 13 }}>AAR Configuration</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              <Input label="Scope" value={aar.scope} onChange={(v) => updateAAR(selId, { scope: v })} placeholder="Discussion-based, facilitated IT TTX" />
              <Select label="TLP Level" value={aar.tlpLevel} onChange={(v) => updateAAR(selId, { tlpLevel: v })} options={TLP_LEVELS} />
              <Input label="Purpose" value={aar.purpose} onChange={(v) => updateAAR(selId, { purpose: v })} placeholder="What was being tested" />
              <Select label="Overall Rating (1-5)" value={aar.overallRating.toString()} onChange={(v) => updateAAR(selId, { overallRating: parseInt(v) || 0 })} options={["0", "1", "2", "3", "4", "5"]} />
            </div>
          </Card>
        )}

        {/* Threat Profile */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Threat Profile</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {([["confidentiality", "Confidentiality", colors.red], ["integrity", "Integrity", colors.orange], ["availability", "Availability", colors.yellow]] as const).map(([key, label, color]) => (
              <div key={key} style={{ background: colors.obsidianM, borderRadius: 6, padding: 12, borderTop: `2px solid ${color}` }}>
                <div style={{ color, fontSize: 10, fontWeight: 700, marginBottom: 8 }}>{label}</div>
                {(aar.threatProfile[key] || []).map((t, i) => <Badge key={i} color={color} className="mr-1 mb-1">{t}</Badge>)}
                {isEditing && <Button variant="ghost" size="sm" style={{ marginTop: 4 }} onClick={() => {
                  const t = prompt(`Add ${label} threat:`);
                  if (t) updateAAR(selId, { threatProfile: { ...aar.threatProfile, [key]: [...aar.threatProfile[key], t] } });
                }}>+ Add</Button>}
                {(aar.threatProfile[key] || []).length === 0 && !isEditing && <span style={{ color: colors.textDim, fontSize: 9 }}>None defined</span>}
              </div>
            ))}
          </div>
        </Card>

        {/* Objectives Scorecard */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Objectives Scorecard</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Badge color={colors.green}>{metObjs} Met</Badge>
              <Badge color={colors.yellow}>{partialObjs} Partial</Badge>
              <Badge color={colors.red}>{notMetObjs} Not Met</Badge>
              {isEditing && <Button variant="ghost" size="sm" onClick={() => addObjective(selId)}>+ Objective</Button>}
            </div>
          </div>
          {aar.objectives.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: colors.textDim, fontSize: 10 }}>
              {isEditing ? "Click '+ Objective' to add objectives." : "No objectives defined. Edit the AAR to add objectives."}
            </div>
          ) : aar.objectives.map((obj, idx) => {
            const ratingColor = obj.rating === "Met" ? colors.green : obj.rating === "Partially Met" ? colors.yellow : colors.red;
            return (
              <div key={obj.id} style={{ padding: "10px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Badge color={colors.blue}>{obj.id}</Badge>
                    {isEditing
                      ? <Input value={obj.title} onChange={(v) => { const objs = [...aar.objectives]; objs[idx] = { ...objs[idx], title: v }; updateAAR(selId, { objectives: objs }); }} placeholder="Objective title" style={{ marginBottom: 0, width: 300 }} />
                      : <span style={{ color: colors.white, fontSize: 12, fontWeight: 600 }}>{obj.title || "Untitled Objective"}</span>
                    }
                  </div>
                  {isEditing
                    ? <Select value={obj.rating} onChange={(v) => { const objs = [...aar.objectives]; objs[idx] = { ...objs[idx], rating: v as AARObjective["rating"] }; updateAAR(selId, { objectives: objs }); }} options={["Met", "Partially Met", "Not Met"]} />
                    : <Badge color={ratingColor}>{obj.rating}</Badge>
                  }
                </div>
                {isEditing && <Input value={obj.description} onChange={(v) => { const objs = [...aar.objectives]; objs[idx] = { ...objs[idx], description: v }; updateAAR(selId, { objectives: objs }); }} placeholder="Objective description" style={{ marginBottom: 0 }} />}
                {!isEditing && obj.description && <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{obj.description}</div>}
              </div>
            );
          })}
        </Card>

        {/* Findings Table */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Findings ({resolvedFindings}/{totalFindings} resolved)
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {totalFindings > 0 && <div style={{ width: 100 }}><ProgressBar value={resolvedFindings} max={totalFindings} color={resolvedFindings === totalFindings ? colors.green : colors.teal} height={4} /></div>}
              {isEditing && <Button variant="ghost" size="sm" onClick={() => addFinding(selId)}>+ Finding</Button>}
            </div>
          </div>

          {aar.findings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: colors.textDim, fontSize: 10 }}>
              {isEditing ? "Click '+ Finding' to add findings." : "No findings documented."}
            </div>
          ) : aar.findings.map((f, idx) => {
            const priColor = f.priority === "Critical" ? colors.red : f.priority === "High" ? colors.orange : f.priority === "Medium" ? colors.yellow : colors.green;
            return (
              <div key={f.id} style={{ padding: "10px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                {isEditing ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <Input label="Finding" value={f.finding} onChange={(v) => { const fs = [...aar.findings]; fs[idx] = { ...fs[idx], finding: v }; updateAAR(selId, { findings: fs }); }} style={{ marginBottom: 6 }} />
                    <Input label="Recommendation" value={f.recommendation} onChange={(v) => { const fs = [...aar.findings]; fs[idx] = { ...fs[idx], recommendation: v }; updateAAR(selId, { findings: fs }); }} style={{ marginBottom: 6 }} />
                    <Select label="Priority" value={f.priority} onChange={(v) => { const fs = [...aar.findings]; fs[idx] = { ...fs[idx], priority: v as AARFinding["priority"] }; updateAAR(selId, { findings: fs }); }} options={PRIORITIES} />
                    <Input label="Owner" value={f.owner} onChange={(v) => { const fs = [...aar.findings]; fs[idx] = { ...fs[idx], owner: v }; updateAAR(selId, { findings: fs }); }} style={{ marginBottom: 6 }} />
                    <Select label="NIST Mapping" value={f.nistMapping} onChange={(v) => { const fs = [...aar.findings]; fs[idx] = { ...fs[idx], nistMapping: v }; updateAAR(selId, { findings: fs }); }} options={NIST_CATS} />
                    <Select label="Status" value={f.status} onChange={(v) => { const fs = [...aar.findings]; fs[idx] = { ...fs[idx], status: v as AARFinding["status"] }; updateAAR(selId, { findings: fs }); }} options={["Open", "In Progress", "Resolved"]} />
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: colors.white, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{f.finding || "—"}</div>
                        <div style={{ color: colors.textMuted, fontSize: 10 }}>{f.recommendation}</div>
                      </div>
                      <div style={{ display: "flex", gap: 3, flexShrink: 0, marginLeft: 8 }}>
                        <Badge color={priColor}>{f.priority}</Badge>
                        <select value={f.status} onChange={(e) => { const fs = [...aar.findings]; fs[idx] = { ...fs[idx], status: e.target.value as AARFinding["status"] }; updateAAR(selId, { findings: fs }); }}
                          style={{ padding: "2px 6px", background: colors.obsidianM, border: `1px solid ${colors.panelBorder}`, borderRadius: 4, color: f.status === "Resolved" ? colors.green : f.status === "In Progress" ? colors.teal : colors.textMuted, fontSize: 9, fontFamily: "inherit" }}>
                          <option>Open</option><option>In Progress</option><option>Resolved</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {f.owner && <span style={{ color: colors.textDim, fontSize: 9 }}>Owner: {f.owner}</span>}
                      {f.nistMapping && <Badge color={colors.cyan}>{f.nistMapping}</Badge>}
                      <Button variant="ghost" size="sm" onClick={() => createTaskFromFinding(f, ex.title)}>Create Task →</Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        {/* Strengths */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Strengths Identified</div>
            {isEditing && <Button variant="ghost" size="sm" onClick={() => { const s = prompt("Strength:"); if (s) updateAAR(selId, { strengths: [...aar.strengths, s] }); }}>+ Add</Button>}
          </div>
          {aar.strengths.length === 0
            ? <div style={{ color: colors.textDim, fontSize: 10 }}>No strengths documented.</div>
            : aar.strengths.map((s, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}` }}><span style={{ color: colors.green, fontSize: 10 }}>✓</span><span style={{ color: colors.text, fontSize: 11 }}>{s}</span></div>)
          }
        </Card>

        {/* Executive Summary */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Executive Summary</div>
          {isEditing ? (
            <>
              <Input label="Executive Summary" value={aar.executiveSummary} onChange={(v) => updateAAR(selId, { executiveSummary: v })} textarea rows={4} />
              <Input label="Notable Observations" value={aar.notableObservations} onChange={(v) => updateAAR(selId, { notableObservations: v })} textarea rows={3} />
              <Input label="Conclusion" value={aar.conclusion} onChange={(v) => updateAAR(selId, { conclusion: v })} textarea rows={3} />
            </>
          ) : (
            <>
              {aar.executiveSummary ? <p style={{ color: colors.text, fontSize: 11, lineHeight: 1.6, margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{aar.executiveSummary}</p> : <p style={{ color: colors.textDim, fontSize: 10 }}>No executive summary. Edit the AAR to add one.</p>}
              {aar.notableObservations && <><div style={{ color: colors.textMuted, fontSize: 9, fontWeight: 700, marginBottom: 4 }}>Notable Observations</div><p style={{ color: colors.text, fontSize: 11, lineHeight: 1.5, margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{aar.notableObservations}</p></>}
              {aar.conclusion && <><div style={{ color: colors.textMuted, fontSize: 9, fontWeight: 700, marginBottom: 4 }}>Conclusion</div><p style={{ color: colors.text, fontSize: 11, lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>{aar.conclusion}</p></>}
            </>
          )}
        </Card>
      </div>
    );
  }

  // ── MAIN LIST VIEW ─────────────────────────────────────────────────
  return (
    <div>
      <SectionHeader sub="ATLAS integration, exercise tracking, and after-action reports">Tabletop Exercises</SectionHeader>

      <Card style={{ marginBottom: 16, background: `linear-gradient(135deg,${colors.teal}08,${colors.panel})`, borderColor: colors.teal + "33" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: colors.teal + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎯</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: colors.teal, fontWeight: 700, fontSize: 13 }}>Dark Rock Labs ATLAS</div>
            <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>Automated tabletop exercise platform</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <Button size="sm" onClick={() => window.open("https://darkrocksec.com", "_blank")}>Launch ATLAS →</Button>
              <Badge color={colors.green}>LIVE</Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16, borderLeft: `3px solid ${colors.orange}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🛡️</span>
          <div>
            <div style={{ color: colors.orange, fontWeight: 700, fontSize: 12 }}>Dark Rock IR Retainer</div>
            <div style={{ color: colors.textMuted, fontSize: 10 }}>$350/hr · 10hr minimum ($3,500) · IncidentResponse@Darkrocklabs.com</div>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Button onClick={() => setShowNew(true)}>+ Schedule Exercise</Button>
      </div>

      {showNew && (
        <Card style={{ marginBottom: 12, borderColor: colors.teal + "44" }}>
          <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14 }}>Schedule Tabletop Exercise</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Input label="Exercise Title" value={nf.title} onChange={(v) => setNf((p) => ({ ...p, title: v }))} placeholder="Annual Ransomware TTX" />
            <Input label="Date" value={nf.date} onChange={(v) => setNf((p) => ({ ...p, date: v }))} type="date" />
            <Input label="Facilitator" value={nf.facilitator} onChange={(v) => setNf((p) => ({ ...p, facilitator: v }))} placeholder="Dark Rock Labs" />
            <Input label="Participants" value={nf.participants} onChange={(v) => setNf((p) => ({ ...p, participants: v }))} placeholder="Core IRT, Executive Team" />
          </div>
          <Input label="Scenario Description" value={nf.scenario} onChange={(v) => setNf((p) => ({ ...p, scenario: v }))} textarea rows={3} placeholder="Ransomware attack scenario..." />
          <div style={{ display: "flex", gap: 6 }}>
            <Button onClick={() => { if (nf.title) { addTabletopExercise({ id: Date.now(), ...nf, status: "Scheduled", rating: 0, notes: "" }); setShowNew(false); setNf({ title: "", scenario: "", date: "", facilitator: "", participants: "", notes: "" }); } }}>Schedule</Button>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {tabletopExercises.length === 0 && !showNew ? (
        <Card style={{ textAlign: "center", padding: "30px 18px" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          <div style={{ color: colors.textDim, fontSize: 12, marginBottom: 4 }}>No exercises scheduled.</div>
          <div style={{ color: colors.textDim, fontSize: 10 }}>Use ATLAS for automated exercises or schedule one manually.</div>
        </Card>
      ) : tabletopExercises.map((ex) => (
        <Card key={ex.id} onClick={() => setSelId(ex.id)} style={{ marginBottom: 10, cursor: "pointer", borderLeft: `3px solid ${ex.status === "Completed" ? colors.green : colors.teal}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: colors.white, fontSize: 13, fontWeight: 600 }}>{ex.title}</div>
              <div style={{ color: colors.textDim, fontSize: 10, marginTop: 2 }}>{ex.date} · {ex.facilitator} · {ex.participants}</div>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {aarData[ex.id]?.findings?.length > 0 && <Badge color={colors.blue}>{aarData[ex.id].findings.length} findings</Badge>}
              <Badge color={ex.status === "Completed" ? colors.green : colors.teal}>{ex.status}</Badge>
              <select value={ex.status} onClick={(e) => e.stopPropagation()} onChange={(e) => {
                updateTabletopExercise(ex.id, { status: e.target.value });
              }} style={{ padding: "2px 6px", background: colors.obsidianM, border: `1px solid ${colors.panelBorder}`, borderRadius: 4, color: colors.textMuted, fontSize: 8, fontFamily: "inherit" }}>
                <option>Scheduled</option><option>In Progress</option><option>Completed</option>
              </select>
            </div>
          </div>
          {ex.scenario && <p style={{ color: colors.textMuted, fontSize: 10, margin: "8px 0 0", lineHeight: 1.4 }}>{ex.scenario.substring(0, 120)}{ex.scenario.length > 120 ? "..." : ""}</p>}
        </Card>
      ))}
    </div>
  );
}
