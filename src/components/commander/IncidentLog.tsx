"use client";

import { useMemo } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card, ProgressBar, SectionHeader, useModal } from "@/components/ui";
import { IR_PHASES } from "@/data/ir-phases";
import { STAKEHOLDER_GROUPS } from "@/data/stakeholder-groups";
import type { StakeholderPerson } from "@/types/stakeholder";
import { generateIncidentReport } from "@/lib/incident-report-generator";
import { generateBig4Report, openBig4ReportWindow } from "@/lib/big4-report-generator";

// Human-readable labels for closure dispositions captured in Commander.
const DISPOSITION_LABEL: Record<string, string> = {
  Resolved: "Resolved",
  FalsePositive: "False Positive",
  DeEscalated: "De-escalated → Security Event",
  Duplicate: "Duplicate",
};

export function IncidentLog() {
  const {
    incidentLog, tickets, tasks, activeIncident, stakeholders,
    forensicLogs, lessons, setPage, org,
    updateIncidentLogEntry, deleteIncidentLogEntry, updateTicket,
  } = useStore();
  const colors = useColors();
  const modal = useModal();

  const allIncidents = useMemo(() => {
    return incidentLog.map((entry) => {
      const masterTicket = tickets.find((t) => t.id === entry.masterTicketId);
      const childTickets = tickets.filter((t) => t.parentId === entry.masterTicketId);
      const incidentTasks = tasks.filter((t) => t.incidentId === entry.incidentId);
      const incidentForensics = forensicLogs.filter((f) =>
        f.incidentId === entry.incidentId ||
        f.incidentId?.includes(entry.title) ||
        f.incidentTitle?.includes(entry.title)
      );
      const incidentLessons = lessons.filter((l) =>
        l.src?.includes(entry.title) || l.src === entry.incidentId
      );

      // Phase completion
      const phaseCompletion = IR_PHASES.map((ph) => {
        const phaseTasks = incidentTasks.filter((t) => t.irPhase === ph.id);
        const done = phaseTasks.filter((t) => t.status === "Done").length;
        const total = phaseTasks.length;
        return { ...ph, done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
      });

      const totalPhaseTasks = phaseCompletion.reduce((a, p) => a + p.total, 0);
      const totalPhaseDone = phaseCompletion.reduce((a, p) => a + p.done, 0);
      const overallProgress = totalPhaseTasks > 0 ? Math.round((totalPhaseDone / totalPhaseTasks) * 100) : 0;
      const currentPhase = phaseCompletion.find((p) => p.pct < 100 && p.total > 0) || phaseCompletion[0];

      // Active stakeholders
      const activeStakeholderGroups = STAKEHOLDER_GROUPS.filter((g) => {
        const people = (stakeholders[g.key] as StakeholderPerson[]) || [];
        return people.length > 0;
      });

      return {
        ...entry,
        masterTicket,
        childTickets,
        incidentTasks,
        incidentForensics,
        incidentLessons,
        phaseCompletion,
        overallProgress,
        currentPhase,
        activeStakeholderGroups,
        totalTickets: 1 + childTickets.length,
        openTickets: childTickets.filter((t) => t.status !== "Closed").length,
      };
    });
  }, [incidentLog, tickets, tasks, forensicLogs, lessons, stakeholders]);

  if (allIncidents.length === 0) {
    return (
      <div>
        <SectionHeader sub="Centralized incident tracking with auto-discovery and reporting">Incident Log</SectionHeader>
        <Card style={{ textAlign: "center", padding: "40px 18px" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ color: colors.white, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>No Incidents Recorded</div>
          <div style={{ color: colors.textDim, fontSize: 11, maxWidth: 400, margin: "0 auto 16px", lineHeight: 1.5 }}>
            When an incident is declared in Commander, a master ticket is automatically created here with full tracking.
          </div>
          <Button size="sm" onClick={() => setPage("commander")}>Go to Commander →</Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader sub="Centralized incident tracking with auto-discovery and reporting">Incident Log</SectionHeader>

      {allIncidents.map((inc) => (
        <Card key={inc.incidentId} style={{ marginBottom: 16, borderLeft: `3px solid ${inc.status === "Active" ? colors.red : colors.green}` }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{inc.status === "Active" ? "🔴" : "✅"}</span>
                <h3 style={{ color: colors.white, margin: 0, fontSize: 15, fontWeight: 700 }}>{inc.title}</h3>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <Badge color={inc.severity === "Critical" ? colors.red : inc.severity === "High" ? colors.orange : colors.yellow}>{inc.severity}</Badge>
                <Badge color={inc.status === "Active" ? colors.red : colors.green}>{inc.status}</Badge>
                <Badge color={colors.blue}>TKT-{inc.masterTicketId}</Badge>
                <Badge color={colors.textDim}>Declared: {inc.declaredAt}</Badge>
                {inc.closedAt && <Badge color={colors.green}>Closed: {inc.closedAt}</Badge>}
                {inc.status === "Closed" && inc.disposition && (
                  <Badge color={
                    inc.disposition === "FalsePositive" ? colors.yellow :
                    inc.disposition === "DeEscalated" ? colors.blue :
                    inc.disposition === "Duplicate" ? colors.purple : colors.green
                  }>{DISPOSITION_LABEL[inc.disposition]}</Badge>
                )}
                {inc.status === "Closed" && inc.closedPhase && (() => {
                  const p = IR_PHASES.find((x) => x.id === inc.closedPhase);
                  return p ? <Badge color={colors.teal}>Closed in {p.ico} {p.n}</Badge> : null;
                })()}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Button variant="outline" size="sm" onClick={() => {
                const report = generateIncidentReport(inc, IR_PHASES, STAKEHOLDER_GROUPS, stakeholders);
                const blob = new Blob([report], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url;
                a.download = `Sentry_Incident_Report_${inc.title.replace(/\s/g, "_")}.txt`;
                a.click();
              }}>Operational Report</Button>
              <Button variant="outline" size="sm" onClick={() => {
                // Big-4-styled executive summary. Opens in a new window so the
                // user can save as PDF or share with leadership.
                const allTickets = [
                  ...(inc.masterTicket ? [{ id: inc.masterTicket.id, title: inc.masterTicket.title, status: inc.masterTicket.status, phase: inc.masterTicket.phase || "", assignee: inc.masterTicket.assignee || "", created: inc.masterTicket.created }] : []),
                  ...inc.childTickets.map((t) => ({ id: t.id, title: t.title, status: t.status, phase: t.phase || "", assignee: t.assignee || "", created: t.created })),
                ];
                const html = generateBig4Report({
                  entry: {
                    incidentId: inc.incidentId,
                    title: inc.title,
                    severity: inc.severity,
                    masterTicketId: inc.masterTicketId,
                    declaredAt: inc.declaredAt,
                    closedAt: inc.closedAt,
                    status: inc.status,
                    disposition: inc.disposition,
                    closedPhase: inc.closedPhase,
                    closureRationale: inc.closureRationale,
                    summary: inc.summary,
                  },
                  // Use the Commander-side incident state if this is the active one,
                  // otherwise the rich data isn't available post-close.
                  incident: activeIncident && activeIncident.title === inc.title ? activeIncident : null,
                  tasks: inc.incidentTasks,
                  forensics: inc.incidentForensics,
                  lessons: inc.incidentLessons,
                  tickets: allTickets,
                  irPhases: IR_PHASES,
                  stakeholders,
                  org: { name: org.name || "Organization", industry: org.industry },
                });
                openBig4ReportWindow(html);
              }}>Executive Summary</Button>
              <Button variant="ghost" size="sm" onClick={() => {
                // Edit log entry metadata (title / severity / summary / disposition / closed-phase).
                // Active incidents only expose title + severity since the close metadata is captured at close time.
                const isClosed = inc.status === "Closed";
                const dispositionOptions = Object.entries(DISPOSITION_LABEL).map(([, label]) => label);
                const phaseOptions = IR_PHASES.map((p) => `${p.ico} ${p.n}`);
                const currentDispLabel = inc.disposition ? DISPOSITION_LABEL[inc.disposition] : "";
                const currentPhaseLabel = inc.closedPhase
                  ? (() => { const p = IR_PHASES.find((x) => x.id === inc.closedPhase); return p ? `${p.ico} ${p.n}` : ""; })()
                  : "";
                modal.showPrompt(
                  "Edit Incident Log Entry",
                  [
                    { key: "title", label: "Title", type: "text", required: true, defaultValue: inc.title },
                    { key: "severity", label: "Severity", type: "select", required: true,
                      options: ["Low", "Medium", "High", "Critical"], defaultValue: inc.severity },
                    { key: "summary", label: "Summary / Notes", type: "textarea",
                      placeholder: "Editable narrative describing the incident.", defaultValue: inc.summary || "" },
                    ...(isClosed ? [
                      { key: "disposition", label: "Disposition", type: "select" as const,
                        options: dispositionOptions, defaultValue: currentDispLabel || "Resolved" },
                      { key: "phase", label: "Closed in Phase", type: "select" as const,
                        options: phaseOptions, defaultValue: currentPhaseLabel || phaseOptions[1] },
                      { key: "rationale", label: "Closure Rationale", type: "textarea" as const,
                        defaultValue: inc.closureRationale || "" },
                    ] : []),
                  ],
                  "Edit the fields below. Closed-incident dispositions feed post-mortem analytics."
                ).then((r) => {
                  if (!r) return;
                  const updates: Record<string, unknown> = {
                    title: r.title.trim(),
                    severity: r.severity,
                    summary: r.summary.trim() || undefined,
                  };
                  if (isClosed) {
                    const dispEntry = Object.entries(DISPOSITION_LABEL).find(([, label]) => label === r.disposition);
                    if (dispEntry) updates.disposition = dispEntry[0] as "Resolved" | "FalsePositive" | "DeEscalated" | "Duplicate";
                    const phaseEntry = IR_PHASES.find((p) => `${p.ico} ${p.n}` === r.phase);
                    if (phaseEntry) updates.closedPhase = phaseEntry.id;
                    updates.closureRationale = (r.rationale || "").trim() || undefined;
                  }
                  updateIncidentLogEntry(inc.incidentId, updates);
                });
              }}>Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => {
                modal.showConfirm(
                  "Delete Incident Log Entry",
                  `Permanently remove "${inc.title}" from the Incident Log? The linked master ticket TKT-${inc.masterTicketId} will remain. This cannot be undone.`,
                  "danger"
                ).then((confirmed) => {
                  if (!confirmed) return;
                  deleteIncidentLogEntry(inc.incidentId);
                  // Also mark the master ticket closed so it doesn't dangle as Active.
                  if (inc.masterTicket && inc.masterTicket.status !== "Closed") {
                    updateTicket(inc.masterTicketId, { status: "Closed" });
                  }
                });
              }}>Delete</Button>
            </div>
          </div>

          {/* Auto-Discovery: Executive Summary */}
          <div style={{ background: colors.obsidianM, borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: colors.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Auto-Discovery — Executive Summary</div>
            <p style={{ color: colors.text, fontSize: 11, margin: 0, lineHeight: 1.6 }}>
              <strong>{inc.title}</strong> was declared at <strong>{inc.declaredAt}</strong> with a severity of <strong>{inc.severity}</strong>.
              {inc.incidentTasks.length > 0
                ? ` There are ${inc.incidentTasks.length} task${inc.incidentTasks.length !== 1 ? "s" : ""} assigned across ${inc.phaseCompletion.filter((p) => p.total > 0).length} IR phases. `
                : " No tasks have been assigned to IR phases yet. "}
              {inc.incidentTasks.filter((t) => t.status === "Done").length > 0
                ? `${inc.incidentTasks.filter((t) => t.status === "Done").length} task${inc.incidentTasks.filter((t) => t.status === "Done").length !== 1 ? "s" : ""} completed. `
                : ""}
              {inc.incidentForensics.length > 0
                ? `${inc.incidentForensics.length} evidence item${inc.incidentForensics.length !== 1 ? "s" : ""} collected. `
                : ""}
              {inc.incidentLessons.length > 0
                ? `${inc.incidentLessons.length} lesson${inc.incidentLessons.length !== 1 ? "s" : ""} learned captured.`
                : ""}
              {" "}Overall incident progression: <strong>{inc.overallProgress}%</strong>.
            </p>
          </div>

          {/* Phase Completion */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>IR Phase Progression</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {inc.currentPhase && inc.currentPhase.total > 0 && (
                  <Badge color={colors.teal}>Current: {inc.currentPhase.n}</Badge>
                )}
                <span style={{ color: inc.overallProgress >= 100 ? colors.green : colors.teal, fontSize: 12, fontWeight: 700 }}>{inc.overallProgress}%</span>
              </div>
            </div>
            <ProgressBar value={inc.overallProgress} color={inc.overallProgress >= 100 ? colors.green : colors.teal} height={6} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 6, marginTop: 10 }}>
              {inc.phaseCompletion.map((ph) => {
                const cl = ph.pct >= 100 ? colors.green : ph.pct > 0 ? colors.teal : colors.textDim;
                return (
                  <div key={ph.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
                    <span style={{ fontSize: 10 }}>{ph.ico}</span>
                    <span style={{ color: colors.textMuted, fontSize: 9, fontWeight: 600, width: 80 }}>{ph.n}</span>
                    <div style={{ flex: 1 }}><ProgressBar value={ph.pct} color={cl} height={3} /></div>
                    <span style={{ color: cl, fontSize: 8, fontWeight: 700, width: 40, textAlign: "right" }}>
                      {ph.total > 0 ? `${ph.done}/${ph.total}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tickets Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div style={{ background: colors.obsidianM, borderRadius: 6, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: colors.blue }}>{inc.totalTickets}</div>
              <div style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>Total Tickets</div>
            </div>
            <div style={{ background: colors.obsidianM, borderRadius: 6, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: inc.openTickets > 0 ? colors.orange : colors.green }}>{inc.openTickets}</div>
              <div style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>Open</div>
            </div>
            <div style={{ background: colors.obsidianM, borderRadius: 6, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: colors.teal }}>{inc.incidentTasks.length}</div>
              <div style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>Tasks</div>
            </div>
          </div>

          {/* Communications & Escalations */}
          {activeIncident && inc.status === "Active" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Communications & Escalations</div>
              {activeIncident.notifications.length > 0 ? (
                activeIncident.notifications.slice(0, 5).map((n, i) => (
                  <div key={i} style={{ padding: "3px 0", borderBottom: `1px solid ${colors.panelBorder}`, fontSize: 9 }}>
                    <span style={{ color: colors.teal }}>[{n.time}]</span> <span style={{ color: colors.text }}>{n.type}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: colors.textDim, fontSize: 10 }}>No notifications sent yet.</div>
              )}
              {activeIncident.escalation.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {activeIncident.escalation.filter((e) => e.status !== "Pending").slice(0, 5).map((e, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
                      <Badge color={e.status === "Complete" ? colors.green : colors.teal}>{e.status}</Badge>
                      <span style={{ color: colors.text, fontSize: 10 }}>{e.role}</span>
                      {e.owner && <span style={{ color: colors.textDim, fontSize: 9 }}>({e.owner})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Stakeholders */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Active Stakeholders</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {inc.activeStakeholderGroups.length > 0
                ? inc.activeStakeholderGroups.map((g) => {
                    const count = ((stakeholders[g.key] as StakeholderPerson[]) || []).length;
                    return <Badge key={g.key} color={g.color}>{g.label} ({count})</Badge>;
                  })
                : <span style={{ color: colors.textDim, fontSize: 10 }}>No stakeholders configured. Add contacts in the Stakeholders module.</span>
              }
            </div>
          </div>

          {/* Editable Summary (free-text) */}
          {inc.summary && (
            <div style={{ background: colors.obsidianM, borderRadius: 8, padding: 12, marginBottom: 12, borderLeft: `2px solid ${colors.teal}` }}>
              <div style={{ fontSize: 9, color: colors.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Incident Summary</div>
              <p style={{ color: colors.text, fontSize: 11, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{inc.summary}</p>
            </div>
          )}

          {/* Closed-in-Phase Tracker */}
          {inc.status === "Closed" && (() => {
            const closedPhaseId = inc.closedPhase;
            const closedPhase = closedPhaseId ? IR_PHASES.find((p) => p.id === closedPhaseId) : null;
            const dispLabel = inc.disposition ? DISPOSITION_LABEL[inc.disposition] : "Resolved";
            const dispColor =
              inc.disposition === "FalsePositive" ? colors.yellow :
              inc.disposition === "DeEscalated" ? colors.blue :
              inc.disposition === "Duplicate" ? colors.purple : colors.green;
            return (
              <div style={{ background: colors.obsidianM, borderRadius: 8, padding: 12, marginTop: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Closure Tracker
                  </div>
                  <Badge color={dispColor}>{dispLabel}</Badge>
                </div>
                {/* Phase row: highlights the phase the incident was closed in */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                  {IR_PHASES.map((ph, i) => {
                    const isClosePhase = closedPhaseId === ph.id;
                    const closeIdx = closedPhase ? IR_PHASES.findIndex((p) => p.id === closedPhase.id) : IR_PHASES.length - 1;
                    const reached = i <= closeIdx;
                    return (
                      <div key={ph.id} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{
                          height: 4, borderRadius: 2,
                          background: reached ? (isClosePhase ? dispColor : colors.teal) : colors.panelBorder,
                          marginBottom: 4,
                        }} />
                        <div style={{
                          fontSize: 8, color: isClosePhase ? dispColor : reached ? colors.text : colors.textDim,
                          fontWeight: isClosePhase ? 800 : 600,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                        }}>
                          <span>{ph.ico}</span>
                          <span>{ph.n}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 6 }}>
                  Closed in <strong style={{ color: dispColor }}>{closedPhase ? closedPhase.n : "—"}</strong>
                  {inc.closedAt && <> on <span style={{ color: colors.text }}>{inc.closedAt}</span></>}
                  .
                </div>
                {inc.closureRationale && (
                  <div style={{ fontSize: 10, color: colors.text, marginTop: 6, fontStyle: "italic", lineHeight: 1.5 }}>
                    “{inc.closureRationale}”
                  </div>
                )}
              </div>
            );
          })()}

          {/* Child Tickets */}
          {inc.childTickets.length > 0 && (
            <div>
              <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Linked Tickets</div>
              {inc.childTickets.slice(0, 8).map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: colors.textDim, fontSize: 8, fontFamily: "var(--font-mono)" }}>TKT-{t.id}</span>
                    <span style={{ color: colors.text, fontSize: 10 }}>{t.title.substring(0, 60)}{t.title.length > 60 ? "..." : ""}</span>
                  </div>
                  <div style={{ display: "flex", gap: 3 }}>
                    {t.phase && <Badge color={colors.blue}>{t.phase}</Badge>}
                    <Badge color={t.status === "Closed" ? colors.green : colors.orange}>{t.status}</Badge>
                  </div>
                </div>
              ))}
              {inc.childTickets.length > 8 && (
                <div style={{ color: colors.textDim, fontSize: 9, padding: "4px 0" }}>+ {inc.childTickets.length - 8} more tickets</div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
