"use client";

import { useState, useMemo } from "react";
import { colors } from "@/lib/tokens";
import { useStore } from "@/store";
import { Badge, Button, Card, ProgressBar, ScoreGauge, SectionHeader } from "@/components/ui";
import { CSF2 } from "@/data/csf2-controls";
import { SCORE_LABELS } from "@/types/assessment";
import type { Assessment, SmartQuestion } from "@/types/assessment";
import { generateAssessmentReport } from "@/lib/assessment-report-generator";

export function AssessmentModule() {
  const { assessments, addAssessment, org, tech, comp, addTask, forensicLogs } = useStore();
  const [mode, setMode] = useState(assessments.length > 0 ? "history" : "new");
  const [ans, setAns] = useState<Record<string, number>>({});
  const [activeFn, setActiveFn] = useState(0);
  const [showReport, setShowReport] = useState<Assessment | null>(null);

  const allQs = useMemo(() => CSF2.flatMap((fn) => fn.cats.flatMap((cat) => cat.qs)), []);
  const smartQs = useMemo((): SmartQuestion[] => {
    return allQs.map((q) => {
      let relevant = true;
      let hint = "";
      if (q.smart && tech[q.smart]) hint = `Your stack: ${tech[q.smart]}`;
      if (q.smart === "siem" && tech.siem === "None") relevant = false;
      return { ...q, relevant, hint };
    });
  }, [allQs, tech]);

  const aCnt = allQs.filter((q) => ans[q.id] !== undefined).length;
  const calcScore = () => { let tw = 0, e = 0; allQs.forEach((q) => { tw += q.w * 4; e += (ans[q.id] || 0) * q.w; }); return tw ? Math.round((e / tw) * 100) : 0; };
  const calcFnScore = (fn: typeof CSF2[0]) => { const fqs = fn.cats.flatMap((c) => c.qs); let tw = 0, e = 0; fqs.forEach((q) => { tw += q.w * 4; e += (ans[q.id] || 0) * q.w; }); return tw ? Math.round((e / tw) * 100) : 0; };
  const calcCatScore = (cat: typeof CSF2[0]["cats"][0]) => { let tw = 0, e = 0; cat.qs.forEach((q) => { tw += q.w * 4; e += (ans[q.id] || 0) * q.w; }); return tw ? Math.round((e / tw) * 100) : 0; };

  const validateInputs = () => {
    const warnings: { type: string; msg: string }[] = [];
    const vals = Object.values(ans);
    if (vals.length > 5) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (avg > 3.8) warnings.push({ type: "high_bias", msg: "Assessment shows uniformly high scores. Ensure responses reflect actual implementation maturity." });
      if (avg < 0.5) warnings.push({ type: "low_bias", msg: "Assessment shows uniformly low scores. Consider whether some controls may be partially implemented." });
      if (vals.every((v) => v === vals[0]) && vals.length > 10) warnings.push({ type: "uniform", msg: "All responses are identical. Please review each control individually." });
    }
    if (ans["PR.AA-03"] >= 3 && tech.mfa === "Not Implemented") warnings.push({ type: "contradiction", msg: "Authentication scored as Managed but MFA is marked as Not Implemented." });
    if (ans["DE.CM-01"] >= 3 && tech.siem === "None") warnings.push({ type: "contradiction", msg: "Network monitoring scored as Managed but no SIEM is configured." });
    if (ans["PR.PS-04"] >= 3 && tech.siem === "None") warnings.push({ type: "contradiction", msg: "Log generation scored as Managed but no SIEM/log platform is configured." });
    return warnings;
  };

  const submitAssessment = () => {
    const score = calcScore();
    const warnings = validateInputs();
    const assessment: Assessment = {
      id: Date.now(), date: new Date().toLocaleString(), score, answers: { ...ans },
      fnScores: CSF2.map((fn) => ({ fn: fn.fn, score: calcFnScore(fn) })),
      catScores: CSF2.flatMap((fn) => fn.cats.map((cat) => ({ cat: cat.n, fn: fn.fn, score: calcCatScore(cat) }))),
      warnings,
      orgName: org.name || "Organization",
      recs: allQs.filter((q) => (ans[q.id] || 0) < 3).sort((a, b) => (b.w * (4 - (ans[b.id] || 0))) - (a.w * (4 - (ans[a.id] || 0)))).slice(0, 15),
    };
    addAssessment(assessment);
    setShowReport(assessment);
    setMode("report");
  };

  // Report View
  if (mode === "report" && showReport) {
    const rpt = showReport;
    const ir = rpt.score >= 80 ? "Strong" : rpt.score >= 60 ? "Moderate" : rpt.score >= 40 ? "Needs Improvement" : "Critical Gaps";
    const irc = rpt.score >= 80 ? colors.green : rpt.score >= 60 ? colors.yellow : rpt.score >= 40 ? colors.orange : colors.red;

    return (
      <div>
        <Button variant="ghost" onClick={() => setMode("history")} style={{ marginBottom: 14 }}>← Assessment History</Button>
        <Card style={{ marginBottom: 14, background: `linear-gradient(135deg,${colors.teal}08,${colors.panel})`, borderColor: colors.teal + "33" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>SENTRY CYBER RESILIENCE ASSESSMENT REPORT</div>
              <h2 style={{ color: colors.white, margin: 0, fontSize: 18 }}>{rpt.orgName}</h2>
              <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>Assessment Date: {rpt.date} | Framework: NIST CSF 2.0</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              const report = generateAssessmentReport({
                assessment: rpt, csf2: CSF2, org, tech, compliance: comp, forensics: forensicLogs,
              });
              const blob = new Blob([report], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${rpt.orgName.replace(/\s/g, "_")}_Cyber_Resilience_Assessment_Report.txt`;
              a.click();
            }}>Export Full Report</Button>
          </div>
        </Card>

        {rpt.warnings.length > 0 && (
          <Card style={{ marginBottom: 14, borderColor: colors.orange + "44", borderLeft: `3px solid ${colors.orange}` }}>
            <h3 style={{ color: colors.orange, marginTop: 0, fontSize: 13 }}>Assessment Validation Warnings</h3>
            {rpt.warnings.map((w, i) => (
              <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}`, color: colors.text, fontSize: 11, lineHeight: 1.5 }}>
                <Badge color={w.type === "contradiction" ? colors.red : colors.orange} className="mr-2">{w.type}</Badge>{w.msg}
              </div>
            ))}
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Card style={{ textAlign: "center" }}><ScoreGauge score={rpt.score} label="Overall Score" /></Card>
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Insurance Readiness</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: irc }}>{ir}</div>
            <p style={{ color: colors.textDim, fontSize: 10, marginTop: 6 }}>Share with your insurance broker</p>
          </Card>
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Controls Assessed</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.teal }}>{allQs.length}</div>
            <p style={{ color: colors.textDim, fontSize: 10, marginTop: 6 }}>Across {CSF2.length} functions</p>
          </Card>
        </div>

        <Card style={{ marginBottom: 14 }}>
          <h3 style={{ color: colors.white, marginTop: 0, fontSize: 13 }}>Function Breakdown</h3>
          {rpt.fnScores.map((f) => {
            const cl = f.score >= 80 ? colors.green : f.score >= 60 ? colors.yellow : f.score >= 40 ? colors.orange : colors.red;
            const fn = CSF2.find((x) => x.fn === f.fn);
            return (
              <div key={f.fn} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <span style={{ fontSize: 14, width: 22 }}>{fn?.ico}</span>
                <span style={{ color: colors.text, fontSize: 12, fontWeight: 500, width: 100 }}>{f.fn}</span>
                <div style={{ flex: 1 }}><ProgressBar value={f.score} color={cl} height={7} /></div>
                <span style={{ color: cl, fontWeight: 700, fontSize: 13, width: 45, textAlign: "right" }}>{f.score}%</span>
              </div>
            );
          })}
        </Card>

        <Card>
          <h3 style={{ color: colors.white, marginTop: 0, fontSize: 13 }}>Priority Recommendations</h3>
          {rpt.recs.map((r, i) => (
            <div key={r.id} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: `1px solid ${colors.panelBorder}`, alignItems: "flex-start" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: i < 3 ? colors.red + "22" : i < 7 ? colors.orange + "22" : colors.yellow + "22", color: i < 3 ? colors.red : i < 7 ? colors.orange : colors.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>
                #{i + 1}
              </div>
              <div>
                <div style={{ display: "flex", gap: 4, marginBottom: 2 }}>
                  <Badge>{r.id}</Badge>
                  <Badge color={colors.orange}>{SCORE_LABELS[rpt.answers[r.id] || 0]}</Badge>
                </div>
                <div style={{ color: colors.text, fontSize: 11 }}>{r.q}</div>
                <Button variant="ghost" size="sm" style={{ marginTop: 4 }} onClick={() => {
                  addTask({ id: Date.now(), title: `Remediate: ${r.id} - ${r.q.substring(0, 60)}`, priority: r.w >= 3 ? "High" : "Medium", status: "Backlog", assignee: "", updates: [], created: new Date().toLocaleDateString(), source: "Assessment" });
                }}>Create Task →</Button>
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  // History View
  if (mode === "history") {
    return (
      <div>
        <SectionHeader sub="Track your resilience posture over time">Assessment History</SectionHeader>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <Button onClick={() => { setAns({}); setActiveFn(0); setMode("new"); }}>+ New Assessment</Button>
        </div>
        {assessments.length === 0 ? (
          <Card style={{ textAlign: "center" }}>
            <p style={{ color: colors.textDim, fontSize: 12 }}>No assessments completed yet. Start your first NIST CSF 2.0 assessment.</p>
            <Button style={{ marginTop: 10 }} onClick={() => setMode("new")}>Start Assessment</Button>
          </Card>
        ) : (
          assessments.map((a) => (
            <Card key={a.id} style={{ marginBottom: 10, cursor: "pointer" }} onClick={() => { setShowReport(a); setMode("report"); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: colors.white, fontSize: 13, fontWeight: 600 }}>{a.orgName} Assessment</div>
                  <div style={{ color: colors.textDim, fontSize: 10, marginTop: 2 }}>{a.date} | {allQs.length} controls assessed</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ScoreGauge score={a.score} size={50} />
                  {a.warnings.length > 0 && <Badge color={colors.orange}>{a.warnings.length} warnings</Badge>}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    );
  }

  // Assessment Quiz
  const fn = CSF2[activeFn];
  const score = calcScore();

  return (
    <div>
      <SectionHeader sub="NIST CSF 2.0 Interactive Assessment">Cyber Resilience Assessment</SectionHeader>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}><ProgressBar value={aCnt} max={allQs.length} /></div>
        <span style={{ color: colors.textMuted, fontSize: 11, whiteSpace: "nowrap" }}>{aCnt}/{allQs.length} controls</span>
        <span style={{ color: colors.teal, fontSize: 11, fontWeight: 600 }}>Score: {score}</span>
      </div>

      <div style={{ display: "flex", gap: 3, marginBottom: 16, flexWrap: "wrap" }}>
        {CSF2.map((f, i) => {
          const fs = calcFnScore(f);
          const fc = fs >= 80 ? colors.green : fs >= 60 ? colors.yellow : fs >= 40 ? colors.orange : f.cats.flatMap((c) => c.qs).some((q) => ans[q.id] !== undefined) ? colors.red : colors.textDim;
          return (
            <button key={f.id} onClick={() => setActiveFn(i)} style={{
              padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer",
              background: activeFn === i ? colors.teal + "22" : "transparent",
              color: activeFn === i ? colors.teal : colors.textMuted,
              fontSize: 11, fontWeight: 600, fontFamily: "inherit",
              borderBottom: activeFn === i ? `2px solid ${colors.teal}` : "2px solid transparent",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span>{f.ico}</span>{f.fn}
              {ans[f.cats[0]?.qs[0]?.id] !== undefined && <span style={{ width: 6, height: 6, borderRadius: "50%", background: fc, display: "inline-block" }} />}
            </button>
          );
        })}
      </div>

      {fn.cats.map((cat) => (
        <Card key={cat.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <h3 style={{ color: colors.white, margin: 0, fontSize: 13 }}>{cat.n}</h3>
            <Badge>{cat.qs.length}</Badge>
          </div>
          {cat.qs.map((q) => {
            const sm = smartQs.find((sq) => sq.id === q.id);
            return (
              <div key={q.id} style={{ padding: "10px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4, flexWrap: "wrap" }}>
                  <Badge>{q.id}</Badge>
                  {q.w === 3 && <Badge color={colors.orange}>Critical</Badge>}
                  {sm?.hint && <Badge color={colors.cyan}>{sm.hint}</Badge>}
                  {sm && !sm.relevant && <Badge color={colors.textDim}>N/A for your stack</Badge>}
                </div>
                <p style={{ color: colors.text, fontSize: 12, margin: "0 0 8px", lineHeight: 1.5 }}>{q.q}</p>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {SCORE_LABELS.map((lb, v) => (
                    <button key={v} onClick={() => setAns((p) => ({ ...p, [q.id]: v }))} style={{
                      padding: "3px 9px", borderRadius: 5, cursor: "pointer",
                      border: `1px solid ${ans[q.id] === v ? colors.teal : colors.panelBorder}`,
                      background: ans[q.id] === v ? colors.teal + "22" : "transparent",
                      color: ans[q.id] === v ? colors.teal : colors.textMuted,
                      fontSize: 10, fontWeight: 500, fontFamily: "inherit",
                    }}>
                      {v}: {lb}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </Card>
      ))}

      <div style={{ height: 16 }} />
      <div style={{ position: "sticky", bottom: 0, background: colors.obsidian, padding: "10px 0", borderTop: `1px solid ${colors.panelBorder}`, zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {activeFn > 0 && <Button variant="secondary" size="sm" onClick={() => setActiveFn((p) => p - 1)}>← Prev</Button>}
            {activeFn < CSF2.length - 1 && <Button variant="secondary" size="sm" onClick={() => setActiveFn((p) => p + 1)}>Next →</Button>}
          </div>
          <Button onClick={submitAssessment} disabled={aCnt < allQs.length * 0.3}>Submit Assessment ({aCnt}/{allQs.length})</Button>
        </div>
      </div>
    </div>
  );
}
