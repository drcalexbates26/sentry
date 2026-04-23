"use client";

import { colors } from "@/lib/tokens";
import { useStore } from "@/store";
import { Badge, Button, Card, ProgressBar, ScoreGauge, MiniChart } from "@/components/ui";
import { IR_PHASES } from "@/data/ir-phases";
import { PLAYBOOKS } from "@/data/playbooks";

const V = "3.1.0";

export function Dashboard() {
  const {
    assessments, tasks, tickets, cases, activeIncident, stakeholders,
    policiesGen, forensicLogs, lessons, irData, onboardDone, org, tech, comp,
    metrics, setPage, addLesson,
  } = useStore();

  const lastAss = assessments.length ? assessments[assessments.length - 1] : null;
  const openTasks = tasks.filter((t) => t.status !== "Done").length;
  const openTickets = tickets.filter((t) => t.status !== "Closed").length;
  const openCases = cases.filter((c) => c.status === "Open").length;
  const totalContacts = Object.entries(stakeholders || {})
    .filter(([k]) => k !== "keySystems")
    .reduce((s, e) => s + (e[1] as unknown[]).length, 0);
  const totalSystems = (stakeholders?.keySystems || []).length;
  const policiesCount = policiesGen?.length || 0;
  const forensicCount = forensicLogs?.length || 0;

  const status = activeIncident ? "red" : openCases > 0 || openTickets > 2 ? "yellow" : "green";
  const statusLabel = status === "red" ? "ACTIVE INCIDENT" : status === "yellow" ? "ELEVATED AWARENESS" : "ALL CLEAR";
  const statusDesc = status === "red"
    ? `Incident "${activeIncident?.title}" is active. Commander engaged.`
    : status === "yellow"
      ? `${openCases} open case${openCases !== 1 ? "s" : ""} and ${openTickets} open ticket${openTickets !== 1 ? "s" : ""} require attention.`
      : "No active incidents. Continue monitoring and preparedness activities.";

  const closedCases = cases.filter((c) => c.status === "Closed");
  const lastIncDate = closedCases.length ? new Date(closedCases[0].date) : null;
  const daysSince = lastIncDate ? Math.floor((Date.now() - lastIncDate.getTime()) / 86400000) : null;

  const sh: React.CSSProperties = { color: colors.textMuted, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 };
  const dot = (c: string): React.CSSProperties => ({ width: 6, height: 6, borderRadius: "50%", background: c, display: "inline-block" });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ color: colors.white, fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>Sentry</h1>
          <p style={{ color: colors.textDim, fontSize: 11, margin: "3px 0 0", fontWeight: 500 }}>Dark Rock Labs &middot; Cyber Resilience Platform</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {org?.name && <Badge color={colors.teal}>{org.name}</Badge>}
          <Badge color={colors.textDim}>v{V}</Badge>
        </div>
      </div>

      {/* Status Page */}
      <div style={{
        borderRadius: 10, padding: 0, marginBottom: 20, overflow: "hidden",
        border: `1px solid ${status === "red" ? colors.red + "55" : status === "yellow" ? colors.orange + "44" : colors.green + "44"}`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          padding: "16px 20px",
          background: status === "red" ? "linear-gradient(135deg,#7f1d1d,#450a0a)" : status === "yellow" ? "linear-gradient(135deg,#78350f,#451a03)" : "linear-gradient(135deg,#14532d,#052e16)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: (status === "red" ? colors.red : status === "yellow" ? colors.orange : colors.green) + "33", position: "absolute" }} />
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: status === "red" ? colors.red : status === "yellow" ? colors.orange : colors.green, position: "relative", boxShadow: `0 0 20px ${(status === "red" ? colors.red : status === "yellow" ? colors.orange : colors.green)}66` }} />
            </div>
            <div>
              <div style={{ color: colors.white, fontSize: 16, fontWeight: 800, letterSpacing: "0.04em" }}>{statusLabel}</div>
              <p style={{ color: status === "red" ? "#fecaca" : status === "yellow" ? "#fed7aa" : "#bbf7d0", fontSize: 11, margin: "3px 0 0", maxWidth: 480 }}>{statusDesc}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "center", background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "10px 18px", minWidth: 80 }}>
              <div style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: 28, fontWeight: 800, color: colors.white, lineHeight: 1 }}>
                {status === "red" ? "0" : daysSince !== null ? daysSince : "—"}
              </div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 3 }}>Days Without Incident</div>
            </div>
            {status === "red"
              ? <Button variant="danger" onClick={() => setPage("commander")} style={{ background: "#dc2626", fontWeight: 700 }}>Open Commander →</Button>
              : <Button variant="outline" size="sm" onClick={() => setPage("commander")} style={{ borderColor: "rgba(255,255,255,0.3)", color: colors.white }}>Declare Incident</Button>
            }
          </div>
        </div>
        {activeIncident && (
          <div style={{ padding: "12px 20px", background: colors.panel, borderTop: `1px solid ${colors.red}22`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: colors.red, fontSize: 12, fontWeight: 700 }}>●</span>
              <span style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{activeIncident.title}</span>
              <Badge color={activeIncident.severity === "Critical" ? colors.red : colors.orange}>{activeIncident.severity}</Badge>
              <Badge color={colors.blue}>{activeIncident.members?.length || 0} Responders</Badge>
            </div>
            <span style={{ color: colors.textMuted, fontSize: 10 }}>Started: {activeIncident.startTime ? new Date(activeIncident.startTime).toLocaleString() : "—"}</span>
          </div>
        )}
      </div>

      {/* KPI Grid */}
      <div style={sh}><span style={dot(colors.teal)} />Operational Metrics</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, marginBottom: 24 }}>
        {[
          { l: "Resilience Score", v: lastAss ? lastAss.score : "—", c: lastAss ? (lastAss.score >= 70 ? colors.green : lastAss.score >= 50 ? colors.yellow : colors.red) : colors.textDim, u: lastAss ? "/100" : "" },
          { l: "Open Tickets", v: openTickets, c: openTickets > 0 ? colors.orange : colors.green, u: "active" },
          { l: "Open Tasks", v: openTasks, c: openTasks > 3 ? colors.red : openTasks > 0 ? colors.yellow : colors.green, u: "pending" },
          { l: "Active Cases", v: openCases, c: openCases > 0 ? colors.orange : colors.green, u: "open" },
          { l: "Stakeholders", v: totalContacts, c: totalContacts > 0 ? colors.teal : colors.textDim, u: "contacts" },
          { l: "Key Systems", v: totalSystems, c: totalSystems > 0 ? colors.blue : colors.textDim, u: "mapped" },
          { l: "Policies", v: policiesCount, c: policiesCount > 0 ? colors.purple : colors.textDim, u: "generated" },
          { l: "Forensic Logs", v: forensicCount, c: forensicCount > 0 ? colors.cyan : colors.textDim, u: "entries" },
        ].map((x, i) => (
          <Card key={i} style={{ textAlign: "center", padding: "14px 10px" }}>
            <div style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, fontWeight: 600 }}>{x.l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: x.c, lineHeight: 1 }}>{x.v}</div>
            {x.u && <div style={{ fontSize: 8, color: colors.textDim, marginTop: 3, fontWeight: 500 }}>{x.u}</div>}
          </Card>
        ))}
      </div>

      {/* Assessment + Chart Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <Card>
          <div style={sh}><span style={dot(colors.teal)} />Resilience Assessment</div>
          {lastAss ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <ScoreGauge score={lastAss.score} size={80} />
                <div>
                  <div style={{ color: colors.white, fontSize: 14, fontWeight: 700 }}>
                    {lastAss.score >= 80 ? "Strong" : lastAss.score >= 60 ? "Moderate" : lastAss.score >= 40 ? "Needs Improvement" : "Critical Gaps"}
                  </div>
                  <div style={{ color: colors.textDim, fontSize: 10, marginTop: 2 }}>Last assessed: {lastAss.date?.split(",")[0]}</div>
                  <div style={{ color: colors.textDim, fontSize: 10 }}>Framework: NIST CSF 2.0</div>
                  {lastAss.warnings?.length > 0 && <Badge color={colors.orange} className="mt-1">{lastAss.warnings.length} validation warnings</Badge>}
                </div>
              </div>
              {(lastAss.fnScores || []).map((f) => {
                const cl = f.score >= 80 ? colors.green : f.score >= 60 ? colors.yellow : f.score >= 40 ? colors.orange : colors.red;
                return (
                  <div key={f.fn} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ color: colors.textMuted, fontSize: 10, fontWeight: 600, width: 62 }}>{f.fn}</span>
                    <div style={{ flex: 1 }}><ProgressBar value={f.score} color={cl} height={4} /></div>
                    <span style={{ color: cl, fontSize: 10, fontWeight: 700, width: 30, textAlign: "right" }}>{f.score}%</span>
                  </div>
                );
              })}
              <Button variant="ghost" size="sm" onClick={() => setPage("assess")} style={{ marginTop: 8 }}>View Full Report →</Button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 10 }}>No assessment completed yet.</div>
              <Button size="sm" onClick={() => setPage("assess")}>Start Assessment →</Button>
            </div>
          )}
        </Card>

        <Card>
          <div style={sh}><span style={dot(colors.orange)} />Incident Trend — 12 Months</div>
          <MiniChart data={metrics} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <span style={{ fontSize: 8, color: colors.textMuted }}>■ <span style={{ color: colors.teal }}>Normal</span></span>
              <span style={{ fontSize: 8, color: colors.textMuted }}>■ <span style={{ color: colors.orange }}>Elevated</span></span>
              <span style={{ fontSize: 8, color: colors.textMuted }}>■ <span style={{ color: colors.red }}>Critical</span></span>
            </div>
            <span style={{ fontSize: 9, color: colors.textDim }}>Total: {metrics.reduce((a, x) => a + x.v, 0)}</span>
          </div>
        </Card>
      </div>

      {/* IR Readiness + Tasks Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <Card>
          <div style={sh}><span style={dot(colors.orange)} />IR Plan Readiness</div>
          {IR_PHASES.map((ph) => {
            const done = ph.steps.filter((_, i) => irData.checked[`${ph.id}_${i}`]).length;
            const pct = ph.steps.length ? Math.round((done / ph.steps.length) * 100) : 0;
            const cl = pct >= 100 ? colors.green : pct > 0 ? colors.teal : colors.textDim;
            return (
              <div key={ph.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 10 }}>{ph.ico}</span>
                <span style={{ color: colors.textMuted, fontSize: 10, fontWeight: 600, width: 85 }}>{ph.n}</span>
                <div style={{ flex: 1 }}><ProgressBar value={pct} color={cl} height={4} /></div>
                <span style={{ color: cl, fontSize: 9, fontWeight: 700, width: 28, textAlign: "right" }}>{pct}%</span>
              </div>
            );
          })}
          <Button variant="ghost" size="sm" onClick={() => setPage("irplan")} style={{ marginTop: 8 }}>Open IR Planner →</Button>
        </Card>

        <Card>
          <div style={sh}><span style={dot(colors.cyan)} />Remediation Tasks</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {(["Backlog", "In Progress", "In Review", "Done"] as const).map((col) => {
              const count = tasks.filter((t) => t.status === col).length;
              const cl = col === "Done" ? colors.green : col === "In Progress" ? colors.teal : col === "In Review" ? colors.blue : colors.textDim;
              return (
                <div key={col} style={{ textAlign: "center", background: colors.obsidianM, borderRadius: 6, padding: "8px 4px" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: cl }}>{count}</div>
                  <div style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{col}</div>
                </div>
              );
            })}
          </div>
          {tasks.filter((t) => t.status !== "Done" && (t.priority === "Critical" || t.priority === "High")).slice(0, 3).map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.priority === "Critical" ? colors.red : colors.orange, flexShrink: 0 }} />
              <span style={{ color: colors.text, fontSize: 10, flex: 1 }}>{t.title.substring(0, 50)}{t.title.length > 50 ? "..." : ""}</span>
              <Badge color={t.priority === "Critical" ? colors.red : colors.orange}>{t.priority}</Badge>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setPage("tasks")} style={{ marginTop: 8 }}>Open Tasks Board →</Button>
        </Card>
      </div>

      {/* Playbooks + Lessons Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <Card>
          <div style={sh}><span style={dot(colors.purple)} />Playbooks</div>
          {cases.filter((c) => c.playbook && c.status === "Open").length > 0
            ? cases.filter((c) => c.playbook && c.status === "Open").slice(0, 3).map((c, i) => {
                const pb = PLAYBOOKS.find((p) => p.id === c.playbook);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                    <span style={{ fontSize: 12 }}>{pb?.icon || "📋"}</span>
                    <span style={{ color: colors.text, fontSize: 11, fontWeight: 600, flex: 1 }}>{c.title}</span>
                    <Badge color={colors.red}>Active</Badge>
                  </div>
                );
              })
            : (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
                <span style={{ color: colors.green, fontSize: 10 }}>●</span>
                <span style={{ color: colors.textDim, fontSize: 10 }}>No active playbook engagements.</span>
              </div>
            )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <span style={{ color: colors.textDim, fontSize: 9 }}>{PLAYBOOKS.length} playbooks available across {new Set(PLAYBOOKS.map((p) => p.cat)).size} categories</span>
            <Button variant="ghost" size="sm" onClick={() => setPage("playbooks")}>Browse →</Button>
          </div>
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...sh }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={dot(colors.yellow)} />Lessons Learned</div>
            <Button variant="ghost" size="sm" onClick={() => {
              const t = prompt("Add lesson learned:");
              if (t) addLesson({ text: t, date: new Date().toLocaleDateString(), src: "Manual" });
            }}>+ Add</Button>
          </div>
          {lessons.length === 0
            ? <div style={{ padding: "4px 0" }}><span style={{ color: colors.textDim, fontSize: 10 }}>No lessons captured. Lessons are recorded during IR follow-up phases.</span></div>
            : lessons.slice(0, 4).map((l, i) => (
                <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <div style={{ color: colors.text, fontSize: 11, lineHeight: 1.4 }}>{l.text}</div>
                  <div style={{ color: colors.textDim, fontSize: 8, marginTop: 2, fontWeight: 500 }}>{l.date} · {l.src}</div>
                </div>
              ))
          }
        </Card>
      </div>

      {/* Onboarding + Stakeholders Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <Card>
          <div style={sh}><span style={dot(onboardDone ? colors.green : colors.orange)} />Environment Configuration</div>
          {onboardDone ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                {[
                  { l: "Organization", v: org?.name || "—" }, { l: "Industry", v: org?.industry || "—" },
                  { l: "Identity", v: tech?.identity || "—" }, { l: "Endpoint", v: tech?.endpoint || "—" },
                  { l: "SIEM", v: tech?.siem || "—" }, { l: "Firewall", v: tech?.firewall || "—" },
                  { l: "Cloud", v: tech?.cloud || "—" }, { l: "Backup", v: tech?.backup || "—" },
                ].map((x) => (
                  <div key={x.l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                    <span style={{ color: colors.textMuted, fontSize: 9, fontWeight: 600 }}>{x.l}</span>
                    <span style={{ color: colors.text, fontSize: 9, fontWeight: 500 }}>{x.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ color: colors.textDim, fontSize: 8 }}>Compliance: </span>
                <span style={{ color: colors.textMuted, fontSize: 8 }}>{(comp || []).join(" · ") || "None configured"}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPage("onboard")} style={{ marginTop: 6 }}>Edit Configuration →</Button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ color: colors.orange, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Onboarding Incomplete</div>
              <div style={{ color: colors.textDim, fontSize: 10, marginBottom: 10 }}>Configure your tech stack for personalized assessments.</div>
              <Button size="sm" onClick={() => setPage("onboard")}>Complete Setup →</Button>
            </div>
          )}
        </Card>

        <Card>
          <div style={sh}><span style={dot(totalContacts > 5 ? colors.green : totalContacts > 0 ? colors.yellow : colors.red)} />Stakeholder Coverage</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 14px" }}>
            {[
              { l: "Incident Commander", k: "incidentCommander" }, { l: "CISO / Security", k: "ciso" },
              { l: "Security Engineers", k: "securityEngineers" }, { l: "Legal (Internal)", k: "legalContact" },
              { l: "Risk Management", k: "riskContact" }, { l: "Executive POC", k: "executivePOC" },
              { l: "Insurance (Int)", k: "cyberInsuranceInternal" }, { l: "Insurance (Ext)", k: "cyberInsuranceExternal" },
              { l: "External Legal", k: "externalLegal" }, { l: "Forensics", k: "forensicsContact" },
              { l: "HR", k: "hrContacts" }, { l: "PR / Comms", k: "prContact" },
              { l: "Privacy / DPO", k: "privacyContact" }, { l: "Law Enforcement", k: "lawEnforcement" },
            ].map((x) => {
              const count = ((stakeholders as Record<string, unknown[]>)?.[x.k] || []).length;
              return (
                <div key={x.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <span style={{ color: colors.textMuted, fontSize: 9, fontWeight: 500 }}>{x.l}</span>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: count > 0 ? colors.green : colors.red }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ color: colors.textDim, fontSize: 8 }}>{totalContacts} contacts · {totalSystems} systems mapped</span>
            <Button variant="ghost" size="sm" onClick={() => setPage("stakeholders")}>Manage →</Button>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div style={sh}><span style={dot(colors.blue)} />Quick Actions</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
        {[
          { l: "Assessment", d: "NIST CSF 2.0", c: colors.teal, p: "assess" },
          { l: "IR Planner", d: "9-phase lifecycle", c: colors.orange, p: "irplan" },
          { l: "Commander", d: "Incident coordination", c: colors.red, p: "commander" },
          { l: "Playbooks", d: `${PLAYBOOKS.length} scenarios`, c: colors.purple, p: "playbooks" },
          { l: "Tasks", d: "Kanban board", c: colors.cyan, p: "tasks" },
          { l: "Stakeholders", d: `${totalContacts} contacts`, c: colors.yellow, p: "stakeholders" },
          { l: "Policies", d: `${policiesCount} generated`, c: colors.blue, p: "policies" },
          { l: "Forensics", d: "Evidence vault", c: colors.textDim, p: "forensics" },
          { l: "Comms", d: "Out-of-band", c: colors.green, p: "comms" },
          { l: "Integrations", d: "APIs & pen testing", c: colors.purple, p: "integrations" },
        ].map((x) => (
          <Card key={x.p} onClick={() => setPage(x.p)} style={{ cursor: "pointer", borderLeft: `3px solid ${x.c}`, padding: "12px 14px" }}>
            <div style={{ color: colors.white, fontWeight: 700, fontSize: 11, marginBottom: 2 }}>{x.l}</div>
            <div style={{ color: colors.textDim, fontSize: 9 }}>{x.d}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
