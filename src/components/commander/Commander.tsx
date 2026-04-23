"use client";

import { useState, useEffect } from "react";
import { colors } from "@/lib/tokens";
import { useStore } from "@/store";
import { Badge, Button, Card, Checkbox, Input, Select, SectionHeader, ProgressBar } from "@/components/ui";
import { IR_PHASES } from "@/data/ir-phases";
import type { Incident, Deadline } from "@/types/incident";

const defaultInc: Incident = {
  title: "", severity: "High", startTime: "", members: [], phaseStatus: {}, findings: [], summaries: [],
  iocs: [], affectedUsers: [], affectedAssets: [], affectedRegions: [], privacyConcern: false,
  attorneyPrivilege: false, privilegeEnforcedBy: "", privilegeEnforcedAt: "",
  timeline: [], workstreams: {}, escalation: [], expenses: [], notifications: [],
  internalCostRate: 150, status: "Active",
};

export function Commander() {
  const { activeIncident, setActiveIncident, addCase } = useStore();
  const [inc, setInc] = useState<Incident>(activeIncident || { ...defaultInc });
  const [editing, setEditing] = useState(!activeIncident);
  const [elapsed, setElapsed] = useState("");
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [tab, setTab] = useState("overview");
  const [newFinding, setNewFinding] = useState("");
  const [newIoc, setNewIoc] = useState("");

  useEffect(() => {
    if (!inc.startTime || editing) return;
    const tick = () => {
      const start = new Date(inc.startTime).getTime();
      const diff = Date.now() - start;
      if (diff < 0) { setElapsed("00:00:00"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      const eh = diff / 3600000;
      setDeadlines([
        { label: "Internal Management", hrs: 1, status: eh >= 1 ? "OVERDUE" : eh >= 0.75 ? "WARNING" : "ON TRACK", template: "management" },
        { label: "Legal Counsel", hrs: 2, status: eh >= 2 ? "OVERDUE" : eh >= 1.5 ? "WARNING" : "ON TRACK", template: "legal" },
        { label: "Executive Leadership", hrs: 4, status: eh >= 4 ? "OVERDUE" : eh >= 3 ? "WARNING" : "ON TRACK", template: "executive" },
        { label: "Cyber Insurance Carrier", hrs: 24, status: eh >= 24 ? "OVERDUE" : eh >= 18 ? "WARNING" : "ON TRACK", template: "insurance" },
        { label: "Board / Audit Committee", hrs: 48, status: eh >= 48 ? "OVERDUE" : eh >= 36 ? "WARNING" : "ON TRACK", template: "board" },
        { label: "DFARS DIBNet Report", hrs: 72, status: eh >= 72 ? "OVERDUE" : eh >= 60 ? "WARNING" : "ON TRACK", template: "dfars" },
      ]);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [inc.startTime, editing]);

  const save = (d?: Incident) => setActiveIncident(d || inc);

  // Auto-save incident state to store when local state changes
  useEffect(() => {
    if (!editing && inc.title) {
      const timeout = setTimeout(() => setActiveIncident(inc), 500);
      return () => clearTimeout(timeout);
    }
  }, [inc, editing, setActiveIncident]);
  const addTL = (event: string) => setInc((p) => ({ ...p, timeline: [...p.timeline, { time: new Date().toLocaleString(), event, elapsed }] }));
  const totalHrs = inc.members.reduce((a, m) => a + m.hours, 0);
  const intCost = totalHrs * (inc.internalCostRate || 150);
  const extCost = (inc.expenses || []).reduce((a, e) => a + e.amount, 0);
  const totalCost = intCost + extCost;
  const sevC = inc.severity === "Critical" ? colors.red : inc.severity === "High" ? colors.orange : colors.yellow;

  // Incident Creation
  if (editing) {
    return (
      <div>
        <SectionHeader sub="Declare and configure incident command">Incident Commander</SectionHeader>
        <Card style={{ marginBottom: 14 }}>
          <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14 }}>Declare Incident</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <Input label="Incident Title *" value={inc.title} onChange={(v) => setInc((p) => ({ ...p, title: v }))} placeholder="Ransomware - Server Farm Alpha" />
            <Select label="Severity *" value={inc.severity} onChange={(v) => setInc((p) => ({ ...p, severity: v as Incident["severity"] }))} options={["Low", "Medium", "High", "Critical"]} />
            <Input label="Start Time *" value={inc.startTime} onChange={(v) => setInc((p) => ({ ...p, startTime: v }))} type="datetime-local" />
            <Input label="Internal Cost Rate ($/hr)" value={inc.internalCostRate?.toString() || "150"} onChange={(v) => setInc((p) => ({ ...p, internalCostRate: parseFloat(v) || 150 }))} type="number" />
          </div>
          <Input label="Initial IOCs (one per line)" value={(inc.iocs || []).join("\n")} onChange={(v) => setInc((p) => ({ ...p, iocs: v.split("\n").filter((x) => x.trim()) }))} textarea rows={3} placeholder="Encrypted files with .locked extension" />
          <div style={{ display: "flex", gap: 16, padding: "8px 0" }}>
            <Checkbox checked={inc.privacyConcern} onChange={(v) => setInc((p) => ({ ...p, privacyConcern: v }))} label="Privacy Concern (PII/PHI involved)" />
          </div>
          <div style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: `1px solid ${colors.panelBorder}`, alignItems: "center" }}>
            <Checkbox checked={inc.attorneyPrivilege} onChange={(v) => setInc((p) => ({ ...p, attorneyPrivilege: v }))} label="Attorney-Client Privilege" />
            {inc.attorneyPrivilege && (
              <Input label="Enforced By" value={inc.privilegeEnforcedBy || ""} onChange={(v) => setInc((p) => ({ ...p, privilegeEnforcedBy: v, privilegeEnforcedAt: new Date().toLocaleString() }))} placeholder="Legal counsel name" style={{ marginBottom: 0, flex: 1 }} />
            )}
          </div>
          <Button style={{ marginTop: 12 }} onClick={() => { save(inc); setEditing(false); addTL("Incident declared: " + inc.title); }} disabled={!inc.title || !inc.startTime}>
            Activate Command →
          </Button>
        </Card>
      </div>
    );
  }

  // Active Incident
  const tabs = ["overview", "timeline", "escalation", "workstreams", "expenses", "notifications", "summaries"];

  return (
    <div>
      <SectionHeader sub="Real-time coordination, escalation, and reporting">Incident Commander</SectionHeader>

      {/* Header */}
      <Card style={{ marginBottom: 14, borderLeft: `3px solid ${sevC}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            {inc.attorneyPrivilege && <Badge color={colors.red} className="text-[7px]">ATTORNEY-CLIENT PRIVILEGE</Badge>}
            {inc.privacyConcern && <Badge color={colors.purple} className="text-[7px] ml-1">PRIVACY CONCERN</Badge>}
            <h2 style={{ color: colors.white, margin: "3px 0 0", fontSize: 16 }}>{inc.title}</h2>
            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
              <Badge color={sevC}>{inc.severity}</Badge><Badge color={colors.green}>ACTIVE</Badge>
              <Badge color={colors.blue}>{inc.members.length} Responders</Badge><Badge color={colors.teal}>{inc.iocs.length} IOCs</Badge>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ textAlign: "center", background: colors.obsidianM, borderRadius: 8, padding: "8px 14px", border: `1px solid ${colors.panelBorder}` }}>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 22, fontWeight: 800, color: colors.white }}>{elapsed || "00:00:00"}</div>
              <div style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Elapsed</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: colors.teal, fontSize: 16, fontWeight: 700 }}>${totalCost.toLocaleString()}</div>
              <div style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase" }}>Cost</div>
            </div>
          </div>
        </div>
      </Card>

      {/* SLA Tickers */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Reporting Deadlines</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 5 }}>
          {deadlines.map((d, i) => {
            const tc = d.status === "OVERDUE" ? colors.red : d.status === "WARNING" ? colors.orange : colors.green;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 5, background: d.status !== "ON TRACK" ? tc + "10" : "transparent", border: `1px solid ${tc}22` }}>
                <span style={{ fontSize: 10 }}>{d.status === "OVERDUE" ? "🔴" : d.status === "WARNING" ? "🟡" : "🟢"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: colors.text, fontSize: 9, fontWeight: 600 }}>{d.label}</div>
                  <div style={{ color: colors.textDim, fontSize: 7 }}>{d.hrs < 24 ? d.hrs + "hr" : Math.round(d.hrs / 24) + "d"}</div>
                </div>
                <Badge color={tc} className="text-[7px]">{d.status}</Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 14, borderBottom: `1px solid ${colors.panelBorder}`, paddingBottom: 5, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "4px 10px", borderRadius: "5px 5px 0 0", border: "none", cursor: "pointer", background: tab === t ? colors.teal + "22" : "transparent", color: tab === t ? colors.teal : colors.textMuted, fontSize: 10, fontWeight: 600, fontFamily: "inherit", textTransform: "capitalize", borderBottom: tab === t ? `2px solid ${colors.teal}` : "2px solid transparent" }}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase" }}>IOCs</div>
                <Button size="sm" variant="ghost" onClick={() => { if (newIoc.trim()) { setInc((p) => ({ ...p, iocs: [...p.iocs, newIoc] })); addTL("IOC: " + newIoc); setNewIoc(""); } }}>+ Add</Button>
              </div>
              <Input value={newIoc} onChange={setNewIoc} placeholder="Add IOC..." style={{ marginBottom: 4 }} />
              {inc.iocs.map((x, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <span style={{ color: colors.text, fontSize: 10 }}>{x}</span>
                  <Button variant="ghost" size="sm" style={{ color: colors.red, fontSize: 8, padding: "0 3px" }} onClick={() => setInc((p) => ({ ...p, iocs: p.iocs.filter((_, idx) => idx !== i) }))}>✕</Button>
                </div>
              ))}
            </Card>
            <Card>
              <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Scope</div>
              {[{ l: "Users", v: inc.affectedUsers }, { l: "Assets", v: inc.affectedAssets }, { l: "Regions", v: inc.affectedRegions }].map((x) => (
                <div key={x.l} style={{ marginBottom: 6 }}>
                  <div style={{ color: colors.textDim, fontSize: 8, fontWeight: 600 }}>{x.l} ({x.v.length})</div>
                  <div style={{ color: colors.text, fontSize: 10 }}>{x.v.join(", ") || "Under assessment"}</div>
                </div>
              ))}
            </Card>
          </div>

          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Key Findings</div>
              <Button size="sm" variant="ghost" onClick={() => { if (newFinding.trim()) { setInc((p) => ({ ...p, findings: [...p.findings, { text: newFinding, time: new Date().toLocaleString() }] })); addTL("Finding: " + newFinding); setNewFinding(""); } }}>+ Log</Button>
            </div>
            <Input value={newFinding} onChange={setNewFinding} placeholder="Document finding..." style={{ marginBottom: 4 }} />
            {inc.findings.map((f, i) => (
              <div key={i} style={{ padding: "3px 0", borderBottom: `1px solid ${colors.panelBorder}`, fontSize: 10 }}>
                <span style={{ color: colors.teal }}>[{f.time}]</span> <span style={{ color: colors.text }}>{f.text}</span>
              </div>
            ))}
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Phases</div>
            {IR_PHASES.map((ph) => {
              const pct = inc.phaseStatus[ph.id] || 0;
              const cl = pct >= 100 ? colors.green : pct > 0 ? colors.teal : colors.textDim;
              return (
                <div key={ph.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <span style={{ fontSize: 9 }}>{ph.ico}</span>
                  <span style={{ color: colors.text, fontSize: 10, width: 90 }}>{ph.n}</span>
                  <div style={{ flex: 1 }}><ProgressBar value={pct} color={cl} height={4} /></div>
                  <input type="range" min="0" max="100" value={pct}
                    onChange={(e) => { const v = parseInt(e.target.value); setInc((p) => ({ ...p, phaseStatus: { ...p.phaseStatus, [ph.id]: v } })); if (v === 100) addTL(`Phase complete: ${ph.n}`); }}
                    style={{ width: 45, accentColor: colors.teal }} />
                  <span style={{ color: cl, fontWeight: 700, fontSize: 9, width: 28, textAlign: "right" }}>{pct}%</span>
                </div>
              );
            })}
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Team</div>
              <Button size="sm" onClick={() => { const n = prompt("Name:"); const r = prompt("Role:"); if (n) { setInc((p) => ({ ...p, members: [...p.members, { name: n, role: r || "Responder", hours: 0 }] })); addTL(`${n} joined`); } }}>+ Add</Button>
            </div>
            {inc.members.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: colors.white, fontSize: 10, fontWeight: 600 }}>{m.name}</span>
                  <span style={{ color: colors.textDim, fontSize: 8, marginLeft: 4 }}>{m.role}</span>
                </div>
                <Input value={m.hours.toString()} onChange={(v) => setInc((p) => ({ ...p, members: p.members.map((x, idx) => idx === i ? { ...x, hours: parseFloat(v) || 0 } : x) }))} type="number" style={{ marginBottom: 0, width: 55 }} />
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Timeline */}
      {tab === "timeline" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Incident Timeline</div>
            <Button size="sm" onClick={() => { const e = prompt("Event:"); if (e) addTL(e); }}>+ Event</Button>
          </div>
          {inc.timeline.length === 0 ? <p style={{ color: colors.textDim, fontSize: 10 }}>Events appear as the incident progresses.</p>
            : inc.timeline.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 8, flexShrink: 0 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: colors.teal }} />
                  {i < inc.timeline.length - 1 && <div style={{ width: 1, flex: 1, background: colors.panelBorder, marginTop: 2 }} />}
                </div>
                <div>
                  <div style={{ color: colors.textDim, fontSize: 8, fontWeight: 600 }}>{t.time} · {t.elapsed}</div>
                  <div style={{ color: colors.text, fontSize: 10, marginTop: 1 }}>{t.event}</div>
                </div>
              </div>
            ))}
        </Card>
      )}

      {/* Escalation */}
      {tab === "escalation" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Escalation Tree</div>
            {inc.escalation.length === 0 && (
              <Button size="sm" onClick={() => setInc((p) => ({ ...p, escalation: [
                { role: "Security Engineering", owner: "", status: "Pending", p: 1 },
                { role: "Incident Commander", owner: "", status: "Pending", p: 2 },
                { role: "CISO", owner: "", status: "Pending", p: 3 },
                { role: "Legal Counsel", owner: "", status: "Pending", p: 4 },
                { role: "Cyber Insurance", owner: "", status: "Pending", p: 5 },
                { role: "Executive Leadership", owner: "", status: "Pending", p: 6 },
                { role: "Dark Rock Forensics", owner: "", status: "Pending", p: 7 },
                { role: "External Legal", owner: "", status: "Pending", p: 8 },
                { role: "HR", owner: "", status: "Pending", p: 9 },
                { role: "PR / Communications", owner: "", status: "Pending", p: 10 },
                { role: "Law Enforcement", owner: "", status: "Pending", p: 11 },
              ] }))}>Generate Tree</Button>
            )}
          </div>
          {inc.escalation.map((e, i) => {
            const sc = e.status === "Complete" ? colors.green : e.status === "In Progress" ? colors.teal : colors.textDim;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: sc + "22", color: sc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, flexShrink: 0 }}>{e.p}</div>
                <div style={{ flex: 1, minWidth: 80 }}>
                  <div style={{ color: colors.white, fontSize: 10, fontWeight: 600 }}>{e.role}</div>
                </div>
                <Input value={e.owner || ""} onChange={(v) => setInc((p) => ({ ...p, escalation: p.escalation.map((x, idx) => idx === i ? { ...x, owner: v } : x) }))} placeholder="Owner" style={{ marginBottom: 0, width: 100 }} />
                <select value={e.status}
                  onChange={(ev) => { const v = ev.target.value as typeof e.status; setInc((p) => ({ ...p, escalation: p.escalation.map((x, idx) => idx === i ? { ...x, status: v } : x) })); if (v === "Complete") addTL(`Escalation: ${e.role} complete`); }}
                  style={{ padding: "3px 6px", background: colors.obsidianM, border: `1px solid ${colors.panelBorder}`, borderRadius: 4, color: sc, fontSize: 9, fontFamily: "inherit" }}>
                  <option>Pending</option><option>In Progress</option><option>Complete</option><option>N/A</option>
                </select>
              </div>
            );
          })}
        </Card>
      )}

      {/* Expenses */}
      {tab === "expenses" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[
              { l: "Internal", v: `$${intCost.toLocaleString()}`, c: colors.teal, s: `${totalHrs.toFixed(1)}hrs × $${inc.internalCostRate}/hr` },
              { l: "External", v: `$${extCost.toLocaleString()}`, c: colors.orange, s: `${inc.expenses.length} items` },
              { l: "Total", v: `$${totalCost.toLocaleString()}`, c: colors.white, s: "" },
            ].map((x) => (
              <Card key={x.l} style={{ textAlign: "center", padding: 12 }}>
                <div style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{x.l}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: x.c }}>{x.v}</div>
                {x.s && <div style={{ fontSize: 7, color: colors.textDim }}>{x.s}</div>}
              </Card>
            ))}
          </div>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase" }}>External Expenses</div>
              <Button size="sm" onClick={() => { const v = prompt("Vendor:"); const d = prompt("Description:"); const a = prompt("Amount ($):"); if (v && a) { setInc((p) => ({ ...p, expenses: [...p.expenses, { vendor: v, description: d || "", amount: parseFloat(a) || 0, date: new Date().toLocaleDateString() }] })); addTL(`Expense: ${v} $${a}`); } }}>+ Add</Button>
            </div>
            {inc.expenses.length === 0 ? <p style={{ color: colors.textDim, fontSize: 9 }}>No external expenses. Add legal, forensics, PR costs.</p>
              : inc.expenses.map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <div><div style={{ color: colors.white, fontSize: 10, fontWeight: 600 }}>{e.vendor}</div><div style={{ color: colors.textDim, fontSize: 8 }}>{e.description}</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ color: colors.orange, fontSize: 10, fontWeight: 700 }}>${e.amount.toLocaleString()}</div><div style={{ color: colors.textDim, fontSize: 7 }}>{e.date}</div></div>
                </div>
              ))}
          </Card>
        </div>
      )}

      {/* Workstreams / Notifications / Summaries - simplified */}
      {tab === "workstreams" && (
        <div>
          {[{ k: "Security", r: "Security Engineering" }, { k: "Legal", r: "Legal Counsel" }, { k: "Executive", r: "Executive Leadership" }, { k: "Insurance", r: "Cyber Insurance" }, { k: "Forensics", r: "Dark Rock Forensics" }, { k: "HR", r: "Human Resources" }, { k: "PR", r: "Public Relations" }, { k: "Privacy", r: "Privacy Officer" }].map((ws) => {
            const d = inc.workstreams[ws.k] || { tasks: [], docs: [], accomplishments: [], risks: [] };
            const dn = d.tasks.filter((t) => t.done).length;
            const pct = d.tasks.length ? Math.round((dn / d.tasks.length) * 100) : 0;
            return (
              <Card key={ws.k} style={{ marginBottom: 10, borderLeft: `3px solid ${pct >= 100 ? colors.green : pct > 0 ? colors.teal : colors.textDim}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div style={{ color: colors.white, fontSize: 11, fontWeight: 700 }}>{ws.r}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 2 }}><Badge color={pct >= 100 ? colors.green : colors.teal}>{pct}%</Badge><Badge color={colors.textDim}>{dn}/{d.tasks.length}</Badge></div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { const t = prompt(`Task for ${ws.r}:`); if (t) setInc((p) => ({ ...p, workstreams: { ...p.workstreams, [ws.k]: { ...d, tasks: [...d.tasks, { text: t, done: false, ts: new Date().toLocaleString() }] } } })); }}>+ Task</Button>
                </div>
                {d.tasks.map((t, i) => (
                  <Checkbox key={i} label={t.text} checked={t.done} onChange={(v) => {
                    setInc((p) => ({ ...p, workstreams: { ...p.workstreams, [ws.k]: { ...d, tasks: d.tasks.map((x, idx) => idx === i ? { ...x, done: v } : x) } } }));
                    if (v) addTL(`WS ${ws.r}: ${t.text} ✓`);
                  }} />
                ))}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "notifications" && (
        <Card>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Generate Notification</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 6 }}>
            {[{ k: "management", l: "Management", i: "👔" }, { k: "executive", l: "Executive", i: "🏛️" }, { k: "legal", l: "Legal", i: "⚖️" }, { k: "insurance", l: "Insurance", i: "📋" }, { k: "board", l: "Board", i: "📊" }].map((n) => (
              <Card key={n.k} style={{ padding: 10, cursor: "pointer" }} onClick={() => {
                addTL(`Notification: ${n.l}`);
                setInc((p) => ({ ...p, notifications: [...p.notifications, { type: n.l, time: new Date().toLocaleString() }] }));
                alert(`${n.l} notification generated.`);
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 14 }}>{n.i}</span>
                  <div><div style={{ color: colors.white, fontSize: 10, fontWeight: 600 }}>{n.l}</div><div style={{ color: colors.textDim, fontSize: 7 }}>Click to generate</div></div>
                </div>
              </Card>
            ))}
          </div>
          {inc.notifications.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Notification Log</div>
              {inc.notifications.map((n, i) => (
                <div key={i} style={{ padding: "3px 0", borderBottom: `1px solid ${colors.panelBorder}`, fontSize: 9 }}>
                  <span style={{ color: colors.teal }}>[{n.time}]</span> <span style={{ color: colors.text }}>{n.type}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "summaries" && (
        <div>
          <Button style={{ marginBottom: 12 }} onClick={() => {
            const txt = `TACTICAL SUMMARY: ${inc.title}\nTimestamp: ${new Date().toLocaleString()} | Severity: ${inc.severity} | Elapsed: ${elapsed}\nTeam: ${inc.members.length} | Hours: ${totalHrs.toFixed(1)} | Cost: $${totalCost.toLocaleString()}\n\nIOCs: ${inc.iocs.join("; ") || "Under investigation"}\nFindings: ${inc.findings.map((f) => f.text).join("; ") || "In progress"}\n`;
            const entry = { id: Date.now(), timestamp: new Date().toLocaleString(), elapsed, text: txt };
            setInc((p) => ({ ...p, summaries: [entry, ...(p.summaries || [])] }));
          }}>Generate Tactical Summary</Button>
          {(inc.summaries || []).map((s) => (
            <Card key={s.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: colors.textMuted, fontSize: 8 }}>{s.timestamp}</span>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(s.text); alert("Copied."); }}>Copy</Button>
              </div>
              <pre style={{ background: colors.obsidianM, borderRadius: 5, padding: 10, color: colors.text, fontSize: 8, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono, monospace)", maxHeight: 200, overflow: "auto", margin: 0 }}>{s.text}</pre>
            </Card>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
        <Button variant="outline" onClick={() => { save(); alert("Saved."); }}>Save</Button>
        <Button variant="secondary" onClick={() => setEditing(true)}>Edit Details</Button>
        <Button variant="danger" onClick={() => {
          if (confirm("Close incident?")) {
            addCase({ title: inc.title, date: new Date().toLocaleDateString(), status: "Closed", cost: totalCost, members: inc.members.length });
            setActiveIncident(null);
            setEditing(true);
            setInc({ ...defaultInc });
          }
        }}>Close Incident</Button>
      </div>
    </div>
  );
}
