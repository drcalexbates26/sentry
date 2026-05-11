"use client";

import { useState, useEffect, useRef } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card, Checkbox, Input, Select, SectionHeader, ProgressBar, useModal } from "@/components/ui";
import { IR_PHASES } from "@/data/ir-phases";
import { PLAYBOOKS } from "@/data/playbooks";
import type { Incident, Deadline } from "@/types/incident";
import { buildNotification, copyNotification } from "@/lib/notifications";
import { NotificationCenter } from "./NotificationCenter";
import { NotificationTemplateBank } from "./NotificationTemplateBank";

const phaseToIR: Record<string, string> = { iocs: "ident", contain: "contain", erad: "erad", recover: "recover" };
const STAKEHOLDER_LABELS: Record<string, string> = {
  legalContact: "Legal Counsel", externalLegal: "External Legal", forensicsContact: "Forensic Contact",
  prContact: "PR / Communications", cyberInsuranceExternal: "Cyber Insurance",
  hrContacts: "Human Resources", securityEngineers: "Security Engineering", executivePOC: "Executive",
};

const defaultInc: Incident = {
  title: "", severity: "High", startTime: "", members: [], phaseStatus: {}, findings: [], summaries: [],
  iocs: [], affectedUsers: [], affectedAssets: [], affectedRegions: [], privacyConcern: false,
  attorneyPrivilege: false, privilegeEnforcedBy: "", privilegeEnforcedAt: "",
  timeline: [], workstreams: {}, escalation: [], expenses: [], notifications: [],
  internalCostRate: 150, status: "Active",
};

export function Commander() {
  const { activeIncident, setActiveIncident, addCase, addTicket, addTickets, addIncidentLogEntry, recordIncidentMetric, updateIncidentLogEntry, updateTicket, incidentLog, stakeholders, addNotification, tasks, addTasks, addTask, updateTask, deleteTask } = useStore();
  const colors = useColors();
  const modal = useModal();
  const [inc, setInc] = useState<Incident>(activeIncident || { ...defaultInc });
  const [editing, setEditing] = useState(!activeIncident);
  const [elapsed, setElapsed] = useState("");
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [tab, setTab] = useState("overview");
  const [newFinding, setNewFinding] = useState("");
  const [newIoc, setNewIoc] = useState("");
  const [selectedPlaybook, setSelectedPlaybook] = useState("");
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [scopeAddField, setScopeAddField] = useState<"users"|"assets"|"regions"|null>(null);
  const [scopeAddValue, setScopeAddValue] = useState("");
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ vendor: "", amount: "", description: "", category: "", stakeholderGroup: "" });
  const [expenseDocs, setExpenseDocs] = useState<{ id: number; name: string; size: number; type: string; uploadedAt: string }[]>([]);
  const expenseFileRef = useRef<HTMLInputElement>(null);

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

  // One-shot migration: legacy demo-seed / older incidents stored workstream
  // tasks on inc.workstreams[k].tasks. The Workstreams tab now reads from the
  // global Tasks store so the two views stay in sync, so we lift legacy
  // entries into global tasks once per incident load and clear them locally.
  useEffect(() => {
    if (editing || !inc.id) return;
    const legacy: { ws: string; idx: number; text: string; done: boolean; ts: string }[] = [];
    Object.entries(inc.workstreams || {}).forEach(([ws, d]) => {
      (d?.tasks || []).forEach((t, idx) => legacy.push({ ws, idx, text: t.text, done: t.done, ts: t.ts }));
    });
    if (legacy.length === 0) return;
    // Skip if anything already migrated (avoid loops).
    const alreadyMigrated = tasks.some((t) => t.incidentId === inc.id && t.workstream);
    if (alreadyMigrated) return;
    const baseId = Date.now();
    addTasks(legacy.map((l, i) => ({
      id: baseId + i,
      title: l.text,
      priority: "Medium" as const,
      status: (l.done ? "Done" : "Backlog") as "Done" | "Backlog",
      assignee: "",
      source: `Workstream: ${l.ws}`,
      updates: [],
      created: l.ts,
      incidentId: inc.id,
      workstream: l.ws,
    })));
    // Clear local workstream task arrays so the migration is one-shot.
    setInc((p) => ({
      ...p,
      workstreams: Object.fromEntries(
        Object.entries(p.workstreams || {}).map(([k, v]) => [k, { ...v, tasks: [] }])
      ),
    }));
  }, [inc.id, editing, inc.workstreams, tasks, addTasks]);
  const addTL = (event: string) => setInc((p) => ({ ...p, timeline: [...p.timeline, { time: new Date().toLocaleString(), event, elapsed }] }));
  // Defensive: legacy data may have members as strings; normalize to hours=0
  // so the sum stays a number instead of NaN. Same shape-shim as the render.
  const totalHrs = inc.members.reduce((a, m) => {
    const hours = typeof m === "string" ? 0 : (typeof m.hours === "number" ? m.hours : 0);
    return a + hours;
  }, 0);
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
            <Select label="Playbook" value={selectedPlaybook} onChange={setSelectedPlaybook}
              options={[{ value: "", label: "N/A — No Playbook" }, ...PLAYBOOKS.map((pb) => ({ value: pb.id, label: `${pb.icon} ${pb.name}` }))]} />
            <Input label="Internal Cost Rate ($/hr)" value={inc.internalCostRate?.toString() || "150"} onChange={(v) => setInc((p) => ({ ...p, internalCostRate: parseFloat(v) || 150 }))} type="number" />
          </div>
          {selectedPlaybook && (() => {
            const pb = PLAYBOOKS.find((p) => p.id === selectedPlaybook);
            if (!pb) return null;
            const totalSteps = pb.iocs.length + pb.contain.length + pb.erad.length + pb.recover.length;
            return (
              <Card style={{ marginTop: 8, marginBottom: 8, borderLeft: `3px solid ${colors.purple}`, background: colors.obsidianM }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{pb.icon}</span>
                  <span style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{pb.name}</span>
                  <Badge color={colors.purple}>{totalSteps} tasks will be created</Badge>
                </div>
                <div style={{ color: colors.textMuted, fontSize: 10, lineHeight: 1.4 }}>{pb.desc.substring(0, 120)}...</div>
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  <Badge color={colors.red}>IOCs: {pb.iocs.length}</Badge>
                  <Badge color={colors.orange}>Contain: {pb.contain.length}</Badge>
                  <Badge color={colors.yellow}>Eradicate: {pb.erad.length}</Badge>
                  <Badge color={colors.green}>Recover: {pb.recover.length}</Badge>
                </div>
              </Card>
            );
          })()}
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
          <Button style={{ marginTop: 12 }} onClick={() => {
            const masterTicketId = Date.now();
            // Create master ticket
            addTicket({
              id: masterTicketId,
              title: `[INCIDENT] ${inc.title}`,
              severity: inc.severity,
              status: "Open",
              phase: "Incident Declared",
              assignee: "",
              details: `Master incident ticket for: ${inc.title}\nSeverity: ${inc.severity}\nDeclared: ${new Date(inc.startTime).toLocaleString()}\nIOCs: ${inc.iocs.join("; ") || "Under investigation"}\nPrivacy Concern: ${inc.privacyConcern ? "Yes" : "No"}\nAttorney-Client Privilege: ${inc.attorneyPrivilege ? "Yes" : "No"}`,
              actions: [{ text: "Incident declared — master ticket created", by: "System", time: new Date().toLocaleTimeString() }],
              created: new Date().toLocaleDateString(),
              ticketType: "master",
              incidentId: `INC-${masterTicketId}`,
              incidentTitle: inc.title,
              childIds: [],
            });
            // Create incident log entry
            addIncidentLogEntry({
              incidentId: `INC-${masterTicketId}`,
              title: inc.title,
              severity: inc.severity,
              masterTicketId,
              declaredAt: new Date().toLocaleString(),
              status: "Active",
            });
            // Record in metrics
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            recordIncidentMetric(monthNames[new Date().getMonth()]);
            // Import playbook tasks if selected
            if (selectedPlaybook) {
              const pb = PLAYBOOKS.find((p) => p.id === selectedPlaybook);
              if (pb) {
                const incidentId = `INC-${masterTicketId}`;
                const pbTasks = [
                  { k: "iocs", l: "IOC Verification", d: pb.iocs },
                  { k: "contain", l: "Containment", d: pb.contain },
                  { k: "erad", l: "Eradication", d: pb.erad },
                  { k: "recover", l: "Recovery", d: pb.recover },
                ].flatMap((phase) =>
                  phase.d.map((step, i) => ({
                    id: masterTicketId + 100 + i + phase.k.charCodeAt(0),
                    title: `[${phase.l}] ${step}`,
                    priority: (phase.k === "contain" ? "Critical" : phase.k === "erad" ? "High" : "Medium") as "Critical" | "High" | "Medium",
                    status: "Backlog" as const,
                    assignee: "",
                    updates: [],
                    created: new Date().toLocaleDateString(),
                    source: `Playbook: ${pb.name}`,
                    irPhase: phaseToIR[phase.k] || undefined,
                    incidentId,
                  }))
                );
                addTasks(pbTasks);
                // Create child tickets
                const childTickets = pbTasks.map((t) => ({
                  id: t.id + 2000000,
                  title: t.title,
                  severity: t.priority,
                  status: "Open",
                  phase: IR_PHASES.find((p) => p.id === t.irPhase)?.n || "",
                  assignee: "",
                  details: `From playbook: ${pb.name}`,
                  actions: [] as { text: string; by: string; time: string }[],
                  created: t.created,
                  parentId: masterTicketId,
                  incidentId,
                  incidentTitle: inc.title,
                  ticketType: "child" as const,
                }));
                addTickets(childTickets);
                // Update master ticket with child IDs
                updateTicket(masterTicketId, { childIds: childTickets.map((c) => c.id) });
              }
            }
            // Send notification
            const notif = buildNotification("incident.declared", {
              what: `Incident "${inc.title}" has been declared at severity ${inc.severity}`,
              who: "Incident Commander",
              when: new Date().toLocaleString(),
              where: "Commander Module",
              why: `${inc.severity} severity incident requiring immediate response coordination`,
              actionRequired: "Review incident details and join the response coordination in Commander.",
              incidentTitle: inc.title,
              privileged: inc.attorneyPrivilege,
            }, stakeholders);
            copyNotification(notif);
            addNotification({ id: Date.now(), event: "incident.declared", recipients: notif.recipients, subject: notif.subject, body: notif.body, timestamp: new Date().toLocaleString(), privileged: notif.privileged, module: "Commander" });
            // Save and activate. Stamp the incident id so downstream filters
            // (IR Phase progression, Workstreams ↔ Tasks sync) can correlate
            // global TaskItems back to this incident.
            const declared: Incident = { ...inc, id: `INC-${masterTicketId}` };
            setInc(declared);
            save(declared);
            setEditing(false);
            addTL("Incident declared: " + inc.title);
          }} disabled={!inc.title || !inc.startTime}>
            Activate Command →
          </Button>
        </Card>
      </div>
    );
  }

  // Active Incident
  const tabs = ["overview", "roster", "timeline", "escalation", "workstreams", "expenses", "notifications", "summaries"];
  // Author capture for timeline / escalation entries. Persisted in
  // localStorage so the IC doesn't re-enter their name every event.
  const currentAuthor = (typeof window !== "undefined" && window.localStorage.getItem("sentry_incident_author")) || "";

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
              <button
                key={i}
                type="button"
                onClick={() => {
                  // Switch to the Notifications tab and pre-select the matching
                  // template via a global hint the NotificationCenter reads.
                  try {
                    window.sessionStorage.setItem("sentry_notify_for_deadline", d.label);
                  } catch { /* private mode */ }
                  setTab("notifications");
                }}
                title={`Open notification draft for ${d.label}`}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "5px 8px",
                  borderRadius: 5, background: d.status !== "ON TRACK" ? tc + "10" : "transparent",
                  border: `1px solid ${tc}22`, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = tc + "22"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = d.status !== "ON TRACK" ? tc + "10" : "transparent"; }}
              >
                <span style={{ fontSize: 10 }}>{d.status === "OVERDUE" ? "🔴" : d.status === "WARNING" ? "🟡" : "🟢"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: colors.text, fontSize: 9, fontWeight: 600 }}>{d.label}</div>
                  <div style={{ color: colors.textDim, fontSize: 7 }}>{d.hrs < 24 ? d.hrs + "hr" : Math.round(d.hrs / 24) + "d"}</div>
                </div>
                <Badge color={tc} className="text-[7px]">{d.status}</Badge>
              </button>
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
              {([
                { l: "Affected Users", k: "users" as const, v: inc.affectedUsers, field: "affectedUsers" as const },
                { l: "Affected Assets", k: "assets" as const, v: inc.affectedAssets, field: "affectedAssets" as const },
                { l: "Affected Regions", k: "regions" as const, v: inc.affectedRegions, field: "affectedRegions" as const },
              ]).map((x) => (
                <div key={x.k} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <div style={{ color: colors.textDim, fontSize: 8, fontWeight: 600 }}>{x.l} ({x.v.length})</div>
                    <Button variant="ghost" size="sm" style={{ fontSize: 8, padding: "1px 5px" }} onClick={() => setScopeAddField(scopeAddField === x.k ? null : x.k)}>+ Add</Button>
                  </div>
                  {scopeAddField === x.k && (
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      <Input value={scopeAddValue} onChange={setScopeAddValue} placeholder={`Add ${x.l.toLowerCase().replace("affected ", "")}...`} style={{ marginBottom: 0, flex: 1 }} />
                      <Button size="sm" onClick={() => {
                        if (scopeAddValue.trim()) {
                          setInc((p) => ({ ...p, [x.field]: [...p[x.field], scopeAddValue.trim()] }));
                          addTL(`Scope: ${x.l} added — ${scopeAddValue.trim()}`);
                          setScopeAddValue(""); setScopeAddField(null);
                        }
                      }}>Add</Button>
                    </div>
                  )}
                  {x.v.length > 0 ? x.v.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                      <span style={{ color: colors.text, fontSize: 10 }}>{item}</span>
                      <Button variant="ghost" size="sm" style={{ color: colors.red, fontSize: 7, padding: "0 3px" }} onClick={() => {
                        setInc((p) => ({ ...p, [x.field]: p[x.field].filter((_, idx) => idx !== i) }));
                      }}>✕</Button>
                    </div>
                  )) : <div style={{ color: colors.textDim, fontSize: 9, fontStyle: "italic" }}>Under assessment</div>}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase" }}>IR Phases — Task Progression</div>
              {(() => {
                // Sourced purely from the global Tasks list, filtered to this
                // incident. No more manual phase slider — phase progress is
                // derived from real Task completion, single source of truth.
                const incTasks = tasks.filter((t) => t.incidentId === inc.id && t.irPhase);
                const done = incTasks.filter((t) => t.status === "Done").length;
                const total = incTasks.length;
                return total > 0
                  ? <Badge color={done === total ? colors.green : colors.teal}>{done}/{total} complete</Badge>
                  : <Badge color={colors.textDim}>No tasks yet</Badge>;
              })()}
            </div>
            <div style={{ color: colors.textDim, fontSize: 9, fontStyle: "italic", marginBottom: 6 }}>
              Phase progress is derived from the global Tasks board. Add tasks here or in the Tasks module — they stay in sync.
            </div>
            {IR_PHASES.map((ph) => {
              const phaseTasks = tasks.filter((t) => t.incidentId === inc.id && t.irPhase === ph.id);
              const done = phaseTasks.filter((t) => t.status === "Done").length;
              const total = phaseTasks.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const cl = pct >= 100 ? colors.green : pct > 0 ? colors.teal : colors.textDim;
              const isExpanded = expandedPhase === ph.id;
              const addTaskForPhase = async () => {
                const r = await modal.showPrompt(
                  `Add Task — ${ph.n}`,
                  [
                    { key: "title", label: "Task Title", required: true, placeholder: `e.g. ${ph.steps?.[0] || "Investigate alert"}` },
                    { key: "assignee", label: "Assignee", placeholder: "Optional — owner name" },
                    { key: "priority", label: "Priority", type: "select", options: ["Critical", "High", "Medium", "Low"], defaultValue: "Medium" },
                  ],
                  `New task will be added to the global Tasks board and tagged to ${ph.n}.`
                );
                if (!r) return;
                addTask({
                  id: Date.now(),
                  title: r.title.trim(),
                  priority: (r.priority || "Medium") as "Critical" | "High" | "Medium" | "Low",
                  status: "Backlog",
                  assignee: r.assignee?.trim() || "",
                  source: `Commander — ${ph.n}`,
                  updates: [],
                  created: new Date().toLocaleDateString(),
                  irPhase: ph.id,
                  incidentId: inc.id,
                });
                addTL(`Task added (${ph.n}): ${r.title.trim()}`);
              };
              return (
                <div key={ph.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                    <div onClick={() => total > 0 && setExpandedPhase(isExpanded ? null : ph.id)} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, cursor: total > 0 ? "pointer" : "default" }}>
                      <span style={{ fontSize: 9 }}>{ph.ico}</span>
                      <span style={{ color: colors.text, fontSize: 10, width: 90, fontWeight: isExpanded ? 700 : 400 }}>{ph.n}</span>
                      <div style={{ flex: 1 }}><ProgressBar value={pct} color={cl} height={4} /></div>
                      <span style={{ color: cl, fontWeight: 700, fontSize: 9, width: 55, textAlign: "right" }}>
                        {total > 0 ? `${done}/${total} (${pct}%)` : "—"}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={addTaskForPhase}>+ Task</Button>
                  </div>
                  {/* Expanded task list */}
                  {isExpanded && total > 0 && (
                    <div style={{ padding: "6px 0 6px 24px", background: colors.obsidianM, borderRadius: "0 0 6px 6px", marginBottom: 4 }}>
                      {phaseTasks.map((t) => {
                        const statusC = t.status === "Done" ? colors.green : t.status === "In Progress" ? colors.teal : t.status === "In Review" ? colors.blue : colors.textDim;
                        return (
                          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", borderBottom: `1px solid ${colors.panelBorder}` }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ color: t.status === "Done" ? colors.textDim : colors.text, fontSize: 10, textDecoration: t.status === "Done" ? "line-through" : "none" }}>{t.title}</span>
                              {t.assignee && <span style={{ color: colors.textDim, fontSize: 8, marginLeft: 6 }}>({t.assignee})</span>}
                              {t.workstream && <span style={{ color: colors.teal, fontSize: 8, marginLeft: 6 }}>·{t.workstream}</span>}
                            </div>
                            <select value={t.status} onChange={(e) => {
                              updateTask(t.id, { status: e.target.value as "Backlog" | "In Progress" | "In Review" | "Done" });
                            }} style={{ padding: "2px 5px", background: colors.obsidian, border: `1px solid ${colors.panelBorder}`, borderRadius: 3, color: statusC, fontSize: 8, fontFamily: "inherit" }}>
                              <option>Backlog</option><option>In Progress</option><option>In Review</option><option>Done</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>

          {/* Team management lives in the Roster tab — see below. The legacy
              inline Team card is intentionally removed; Roster handles Name /
              Title / Role / Email / Phone / Rate / Hours cleanly. */}
          {inc.members.length > 0 && (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Team</div>
                  <div style={{ color: colors.text, fontSize: 11, marginTop: 4 }}>
                    {inc.members.length} responder{inc.members.length === 1 ? "" : "s"} on the incident
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setTab("roster")}>Open Roster →</Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Timeline */}
      {tab === "timeline" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Incident Timeline</div>
            <Button size="sm" onClick={async () => { const r = await modal.showPrompt("Add Timeline Event", [{ key: "event", label: "Event Description", required: true }]); if (r) addTL(r.event); }}>+ Event</Button>
          </div>
          {inc.timeline.length === 0 ? <p style={{ color: colors.textDim, fontSize: 10 }}>Events appear as the incident progresses.</p>
            : inc.timeline.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 8, flexShrink: 0 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: colors.teal }} />
                  {i < inc.timeline.length - 1 && <div style={{ width: 1, flex: 1, background: colors.panelBorder, marginTop: 2 }} />}
                </div>
                <div>
                  <div style={{ color: colors.textDim, fontSize: 8, fontWeight: 600 }}>
                    {t.time} · {t.elapsed}
                    {t.by && <span style={{ color: colors.tealLight, marginLeft: 6 }}>· {t.by}</span>}
                  </div>
                  <div style={{ color: colors.text, fontSize: 10, marginTop: 1 }}>{t.event}</div>
                </div>
              </div>
            ))}
        </Card>
      )}

      {/* Roster — incident-active responders with contact + time-on-incident */}
      {tab === "roster" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ color: colors.white, fontSize: 13, fontWeight: 700 }}>Incident Roster</div>
              <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>
                Everyone actively working this incident. Hours roll up to the Expenses tab; per-member rates override the fallback.
              </div>
            </div>
            <Button size="sm" onClick={async () => {
              const r = await modal.showPrompt(
                "Add team member to roster",
                [
                  { key: "name",  label: "Full Name",  required: true },
                  { key: "title", label: "Title",      placeholder: "e.g. SOC Analyst" },
                  { key: "role",  label: "Incident Role", placeholder: "e.g. Forensics Lead", defaultValue: "Responder" },
                  { key: "email", label: "Email",      placeholder: "name@org.com" },
                  { key: "phone", label: "Phone",      placeholder: "(555) 000-0000" },
                  { key: "rate",  label: "Hourly Rate (USD)", placeholder: `${inc.internalCostRate} (fallback)` },
                ],
                "Per-member rate is optional — leave blank to use the incident fallback rate.",
              );
              if (!r) return;
              const rate = parseFloat(r.rate || "");
              setInc((p) => ({ ...p, members: [...p.members, {
                name: r.name, role: r.role || "Responder", hours: 0,
                title: r.title || undefined, email: r.email || undefined,
                phone: r.phone || undefined,
                rate: Number.isFinite(rate) && rate > 0 ? rate : undefined,
              }] }));
              void addTL(`${r.name} added to roster${r.title ? ` (${r.title})` : ""}`);
            }}>+ Add to roster</Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <Card style={{ textAlign: "center", padding: "10px 12px" }}>
              <div style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Active Responders</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: colors.teal }}>{inc.members.length}</div>
            </Card>
            <Card style={{ textAlign: "center", padding: "10px 12px" }}>
              <div style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Hours Booked</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: colors.text }}>{totalHrs.toFixed(1)}</div>
            </Card>
            <Card style={{ textAlign: "center", padding: "10px 12px" }}>
              <div style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Labor Cost To Date</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: colors.orange }}>${intCost.toLocaleString()}</div>
            </Card>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 9, color: colors.textMuted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              Fallback rate (used when a member has no rate override)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: colors.textMuted, fontSize: 12 }}>$</span>
              <Input
                type="number"
                value={String(inc.internalCostRate || 150)}
                onChange={(v) => setInc((p) => ({ ...p, internalCostRate: parseFloat(v) || 150 }))}
                style={{ marginBottom: 0, width: 100 }}
              />
              <span style={{ color: colors.textDim, fontSize: 11 }}>/ hour</span>
            </div>
          </div>

          {/* Roster table */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.3fr 0.7fr 0.7fr 0.4fr", gap: 6, padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
            {["Name / Role", "Title", "Contact", "Rate", "Hours", ""].map((h) => (
              <span key={h} style={{ color: colors.textDim, fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>
          {inc.members.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center", color: colors.textDim, fontSize: 11 }}>
              No one on the roster yet. Use <strong>+ Add to roster</strong> to log a responder.
            </div>
          ) : inc.members.map((raw, i) => {
            const m = typeof raw === "string"
              ? { name: raw, role: "Responder", hours: 0, title: "", email: "", phone: "", rate: undefined as number | undefined }
              : { name: raw.name ?? "Unknown", role: raw.role ?? "Responder", hours: raw.hours ?? 0, title: raw.title ?? "", email: raw.email ?? "", phone: raw.phone ?? "", rate: raw.rate };
            const memberCost = m.hours * (m.rate && m.rate > 0 ? m.rate : (inc.internalCostRate || 150));
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.3fr 0.7fr 0.7fr 0.4fr", gap: 6, padding: "8px 0", borderBottom: `1px solid ${colors.panelBorder}`, alignItems: "center" }}>
                <div>
                  <div style={{ color: colors.text, fontSize: 11, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ color: colors.textDim, fontSize: 9 }}>{m.role}</div>
                </div>
                <Input value={m.title} onChange={(v) => setInc((p) => ({ ...p, members: p.members.map((x, idx) => idx === i ? { ...(typeof x === "string" ? { name: x, role: "Responder", hours: 0 } : x), title: v } : x) }))} placeholder="Title" style={{ marginBottom: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Input value={m.email} onChange={(v) => setInc((p) => ({ ...p, members: p.members.map((x, idx) => idx === i ? { ...(typeof x === "string" ? { name: x, role: "Responder", hours: 0 } : x), email: v } : x) }))} placeholder="email" style={{ marginBottom: 0, fontSize: 10 }} />
                  <Input value={m.phone} onChange={(v) => setInc((p) => ({ ...p, members: p.members.map((x, idx) => idx === i ? { ...(typeof x === "string" ? { name: x, role: "Responder", hours: 0 } : x), phone: v } : x) }))} placeholder="phone" style={{ marginBottom: 0, fontSize: 10 }} />
                </div>
                <Input
                  type="number"
                  value={m.rate !== undefined ? String(m.rate) : ""}
                  onChange={(v) => {
                    const n = parseFloat(v);
                    setInc((p) => ({ ...p, members: p.members.map((x, idx) => idx === i ? { ...(typeof x === "string" ? { name: x, role: "Responder", hours: 0 } : x), rate: Number.isFinite(n) && n > 0 ? n : undefined } : x) }));
                  }}
                  placeholder={`$${inc.internalCostRate || 150}`}
                  style={{ marginBottom: 0 }}
                />
                <Input type="number" value={String(m.hours)} onChange={(v) => setInc((p) => ({ ...p, members: p.members.map((x, idx) => idx === i ? { ...(typeof x === "string" ? { name: x, role: "Responder", hours: 0 } : x), hours: parseFloat(v) || 0 } : x) }))} style={{ marginBottom: 0 }} />
                <Button variant="ghost" size="sm" onClick={() => {
                  setInc((p) => ({ ...p, members: p.members.filter((_, idx) => idx !== i) }));
                  void addTL(`${m.name} removed from roster`);
                }} style={{ color: colors.red }}>✕</Button>
              </div>
            );
          })}

          {inc.members.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0 0", color: colors.textMuted, fontSize: 10 }}>
              <span style={{ marginRight: 8 }}>Cost so far:</span>
              <span style={{ color: colors.orange, fontWeight: 700 }}>${intCost.toLocaleString()}</span>
            </div>
          )}
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
                { role: "Forensic Contact", owner: "", status: "Pending", p: 7 },
                { role: "External Legal", owner: "", status: "Pending", p: 8 },
                { role: "HR", owner: "", status: "Pending", p: 9 },
                { role: "PR / Communications", owner: "", status: "Pending", p: 10 },
                { role: "Law Enforcement", owner: "", status: "Pending", p: 11 },
              ] }))}>Generate Tree</Button>
            )}
          </div>
          {inc.escalation.map((e, i) => {
            const sc = e.status === "Complete" ? colors.green : e.status === "In Progress" ? colors.teal : colors.textDim;
            const decisionColor = e.decision === "Escalate" ? colors.red
              : e.decision === "Hold" ? colors.orange
              : e.decision === "Notified" ? colors.teal
              : e.decision === "Acknowledged" ? colors.green
              : colors.textDim;
            return (
              <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: sc + "22", color: sc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, flexShrink: 0 }}>{e.p}</div>
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <div style={{ color: colors.white, fontSize: 10, fontWeight: 600 }}>{e.role}</div>
                  </div>
                  <Input value={e.owner || ""} onChange={(v) => setInc((p) => ({ ...p, escalation: p.escalation.map((x, idx) => idx === i ? { ...x, owner: v } : x) }))} placeholder="Owner" style={{ marginBottom: 0, width: 110 }} />
                  <Input value={e.contact || ""} onChange={(v) => setInc((p) => ({ ...p, escalation: p.escalation.map((x, idx) => idx === i ? { ...x, contact: v } : x) }))} placeholder="email / phone" style={{ marginBottom: 0, width: 130 }} />
                  <select value={e.status}
                    onChange={(ev) => {
                      const v = ev.target.value as typeof e.status;
                      setInc((p) => ({ ...p, escalation: p.escalation.map((x, idx) => idx === i ? { ...x, status: v } : x) }));
                      if (v === "Complete") void addTL(`Escalation closed: ${e.role}${e.owner ? ` (${e.owner})` : ""}`);
                      else if (v === "In Progress") void addTL(`Escalation acknowledged: ${e.role}${e.owner ? ` (${e.owner})` : ""}`);
                    }}
                    style={{ padding: "3px 6px", background: colors.obsidianM, border: `1px solid ${colors.panelBorder}`, borderRadius: 4, color: sc, fontSize: 9, fontFamily: "inherit" }}>
                    <option>Pending</option><option>In Progress</option><option>Complete</option><option>N/A</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap", paddingLeft: 26 }}>
                  <span style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>DECISION:</span>
                  {(["Escalate", "Hold", "Notified", "Acknowledged", "N/A"] as const).map((d) => {
                    const active = e.decision === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const now = new Date().toLocaleString();
                          setInc((p) => ({
                            ...p,
                            escalation: p.escalation.map((x, idx) => idx === i
                              ? { ...x, decision: d, decidedAt: now, decidedBy: currentAuthor || x.decidedBy }
                              : x),
                          }));
                          // Auto-write a timeline entry for the decision so the chain of custody is captured.
                          void addTL(
                            `Escalation ${d.toLowerCase()}: ${e.role}` +
                            (e.owner ? ` → ${e.owner}` : "") +
                            (e.contact ? ` (${e.contact})` : "")
                          );
                        }}
                        style={{
                          padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, fontFamily: "inherit",
                          background: active ? decisionColor + "22" : "transparent",
                          color: active ? decisionColor : colors.textMuted,
                          border: `1px solid ${active ? decisionColor + "55" : colors.panelBorder}`,
                          cursor: "pointer",
                        }}
                      >{d}</button>
                    );
                  })}
                  {e.decidedAt && (
                    <span style={{ color: colors.textDim, fontSize: 8, marginLeft: 4 }}>
                      {e.decidedAt}{e.decidedBy ? ` · ${e.decidedBy}` : ""}
                    </span>
                  )}
                </div>
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
              { l: "Internal", v: `$${intCost.toLocaleString()}`, c: colors.teal, s: (() => {
                const overrides = inc.members.filter((m) => typeof m !== "string" && typeof m.rate === "number" && m.rate > 0).length;
                return overrides > 0
                  ? `${totalHrs.toFixed(1)}hrs · ${overrides} custom rate${overrides === 1 ? "" : "s"}`
                  : `${totalHrs.toFixed(1)}hrs × $${inc.internalCostRate}/hr`;
              })() },
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase" }}>External Expenses</div>
              <Button size="sm" onClick={() => setExpenseFormOpen(true)}>+ Add Expense</Button>
            </div>

            {/* Add Expense Form */}
            {expenseFormOpen && (
              <div style={{ background: colors.obsidianM, borderRadius: 8, padding: 14, marginBottom: 12, borderLeft: `3px solid ${colors.orange}` }}>
                <div style={{ fontSize: 10, color: colors.orange, fontWeight: 700, marginBottom: 10 }}>New Expense</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                  <Input label="Vendor *" value={expenseForm.vendor} onChange={(v) => setExpenseForm((p) => ({ ...p, vendor: v }))} placeholder="Vendor name" />
                  <Input label="Amount ($) *" value={expenseForm.amount} onChange={(v) => setExpenseForm((p) => ({ ...p, amount: v }))} type="number" placeholder="0.00" />
                  <Select label="Category *" value={expenseForm.category} onChange={(v) => setExpenseForm((p) => ({ ...p, category: v }))}
                    options={["Legal Fees", "Forensics", "IR Retainer", "Public Relations", "Insurance Deductible", "Breach Notification", "Credit Monitoring", "Regulatory Fines", "Hardware/Software", "Consulting", "Travel", "Other"]} />
                  <Select label="Stakeholder Group *" value={expenseForm.stakeholderGroup} onChange={(v) => setExpenseForm((p) => ({ ...p, stakeholderGroup: v }))}
                    options={[
                      { value: "legalContact", label: "Legal Counsel" },
                      { value: "externalLegal", label: "External Legal" },
                      { value: "forensicsContact", label: "Forensic Contact" },
                      { value: "prContact", label: "PR / Communications" },
                      { value: "cyberInsuranceExternal", label: "Cyber Insurance" },
                      { value: "hrContacts", label: "Human Resources" },
                      { value: "securityEngineers", label: "Security Engineering" },
                      { value: "executivePOC", label: "Executive" },
                    ]} />
                </div>
                <Input label="Description" value={expenseForm.description} onChange={(v) => setExpenseForm((p) => ({ ...p, description: v }))} textarea rows={2} placeholder="Description of the expense..." />

                {/* File Upload */}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: "block", fontSize: 10, color: colors.textMuted, marginBottom: 5, fontWeight: 600, letterSpacing: "0.04em" }}>
                    Supporting Documentation *
                  </label>
                  <div
                    onClick={() => expenseFileRef.current?.click()}
                    style={{
                      border: `2px dashed ${colors.panelBorder}`, borderRadius: 8,
                      padding: "16px 12px", textAlign: "center", cursor: "pointer",
                      background: colors.bg, transition: "border-color 0.15s",
                    }}
                  >
                    <input
                      ref={expenseFileRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.json,.png,.jpg,.jpeg,.msg,.csv"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files) {
                          const newDocs = Array.from(e.target.files).map((f, idx) => ({
                            id: Date.now() + idx,
                            name: f.name,
                            size: f.size,
                            type: f.type || f.name.split(".").pop() || "unknown",
                            uploadedAt: new Date().toLocaleString(),
                          }));
                          setExpenseDocs((prev) => [...prev, ...newDocs]);
                        }
                        e.target.value = "";
                      }}
                    />
                    <div style={{ color: colors.textMuted, fontSize: 11, fontWeight: 500 }}>Click to upload documentation</div>
                    <div style={{ color: colors.textDim, fontSize: 9, marginTop: 3 }}>PDF, Word, Excel, JSON, PNG, JPG, MSG, CSV</div>
                  </div>
                  {expenseDocs.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      {expenseDocs.map((doc) => (
                        <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11 }}>📎</span>
                            <span style={{ color: colors.text, fontSize: 10, fontWeight: 500 }}>{doc.name}</span>
                            <span style={{ color: colors.textDim, fontSize: 8 }}>({(doc.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <Button variant="ghost" size="sm" style={{ color: colors.red, padding: "0 4px" }} onClick={() => setExpenseDocs((prev) => prev.filter((d) => d.id !== doc.id))}>✕</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <Button onClick={() => {
                    if (!expenseForm.vendor || !expenseForm.amount || !expenseForm.category || !expenseForm.stakeholderGroup || expenseDocs.length === 0) {
                      modal.showAlert("Required Fields", "Vendor, amount, category, stakeholder group, and at least one supporting document are required.");
                      return;
                    }
                    setInc((p) => ({
                      ...p,
                      expenses: [...p.expenses, {
                        vendor: expenseForm.vendor,
                        amount: parseFloat(expenseForm.amount) || 0,
                        description: expenseForm.description,
                        date: new Date().toLocaleDateString(),
                        category: expenseForm.category,
                        stakeholderGroup: expenseForm.stakeholderGroup,
                        documents: expenseDocs,
                      }],
                    }));
                    addTL(`Expense: ${expenseForm.vendor} $${expenseForm.amount} (${expenseForm.category})`);
                    setExpenseForm({ vendor: "", amount: "", description: "", category: "", stakeholderGroup: "" });
                    setExpenseDocs([]);
                    setExpenseFormOpen(false);
                  }}>Submit Expense</Button>
                  <Button variant="secondary" onClick={() => { setExpenseFormOpen(false); setExpenseDocs([]); }}>Cancel</Button>
                </div>
              </div>
            )}

            {inc.expenses.length === 0 && !expenseFormOpen ? <p style={{ color: colors.textDim, fontSize: 9 }}>No external expenses. Add legal, forensics, PR costs with supporting documentation.</p>
              : inc.expenses.map((e, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ color: colors.white, fontSize: 11, fontWeight: 700 }}>{e.vendor}</span>
                        <Badge color={colors.orange}>{e.category}</Badge>
                        <Badge color={colors.blue}>{STAKEHOLDER_LABELS[e.stakeholderGroup] || e.stakeholderGroup}</Badge>
                      </div>
                      {e.description && <div style={{ color: colors.textMuted, fontSize: 9, marginBottom: 4 }}>{e.description}</div>}
                      {e.documents && e.documents.length > 0 && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {e.documents.map((doc) => (
                            <span key={doc.id} style={{
                              display: "inline-flex", alignItems: "center", gap: 3,
                              padding: "2px 7px", borderRadius: 4,
                              background: colors.obsidianM, color: colors.textMuted,
                              fontSize: 8,
                            }}>
                              📎 {doc.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ color: colors.orange, fontSize: 12, fontWeight: 800 }}>${e.amount.toLocaleString()}</div>
                      <div style={{ color: colors.textDim, fontSize: 8 }}>{e.date}</div>
                    </div>
                  </div>
                </div>
              ))}
          </Card>
        </div>
      )}

      {/* Workstreams — backed by the global Tasks store so the Workstreams tab
          and the Tasks module are always in sync. Each task is a TaskItem with
          { incidentId, workstream } tags. */}
      {tab === "workstreams" && (
        <div>
          <div style={{ color: colors.textDim, fontSize: 10, fontStyle: "italic", marginBottom: 8 }}>
            Workstream tasks live in the global Tasks board — adding here adds them there, and vice versa. Filter the Tasks module by incident to see them all together.
          </div>
          {[{ k: "Security", r: "Security Engineering" }, { k: "Legal", r: "Legal Counsel" }, { k: "Executive", r: "Executive Leadership" }, { k: "Insurance", r: "Cyber Insurance" }, { k: "Forensics", r: "Forensic Contact" }, { k: "HR", r: "Human Resources" }, { k: "PR", r: "Public Relations" }, { k: "Privacy", r: "Privacy Officer" }].map((ws) => {
            const wsTasks = tasks.filter((t) => t.incidentId === inc.id && t.workstream === ws.k);
            const dn = wsTasks.filter((t) => t.status === "Done").length;
            const total = wsTasks.length;
            const pct = total ? Math.round((dn / total) * 100) : 0;
            return (
              <Card key={ws.k} style={{ marginBottom: 10, borderLeft: `3px solid ${pct >= 100 ? colors.green : pct > 0 ? colors.teal : colors.textDim}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div style={{ color: colors.white, fontSize: 11, fontWeight: 700 }}>{ws.r}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                      <Badge color={pct >= 100 ? colors.green : colors.teal}>{pct}%</Badge>
                      <Badge color={colors.textDim}>{dn}/{total}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={async () => {
                    const r = await modal.showPrompt(
                      `Add Task — ${ws.r}`,
                      [
                        { key: "task", label: "Task Description", required: true },
                        { key: "assignee", label: "Assignee", placeholder: "Optional" },
                        { key: "irPhase", label: "IR Phase", type: "select",
                          options: IR_PHASES.map((p) => `${p.ico} ${p.n}`) },
                        { key: "priority", label: "Priority", type: "select",
                          options: ["Critical", "High", "Medium", "Low"], defaultValue: "Medium" },
                      ],
                      "This creates a TaskItem in the global Tasks board, tagged to this incident and workstream."
                    );
                    if (!r) return;
                    const phaseMatch = IR_PHASES.find((p) => `${p.ico} ${p.n}` === r.irPhase);
                    addTask({
                      id: Date.now(),
                      title: r.task.trim(),
                      priority: (r.priority || "Medium") as "Critical" | "High" | "Medium" | "Low",
                      status: "Backlog",
                      assignee: r.assignee?.trim() || "",
                      source: `Workstream: ${ws.r}`,
                      updates: [],
                      created: new Date().toLocaleString(),
                      incidentId: inc.id,
                      workstream: ws.k,
                      irPhase: phaseMatch?.id,
                    });
                    addTL(`WS ${ws.r}: + ${r.task.trim()}`);
                  }}>+ Task</Button>
                </div>
                {wsTasks.length === 0 && (
                  <div style={{ color: colors.textDim, fontSize: 10, fontStyle: "italic", padding: "4px 0" }}>
                    No tasks yet. Add one above, or tag a task in the Tasks module with workstream &quot;{ws.k}&quot;.
                  </div>
                )}
                {wsTasks.map((t) => {
                  const phaseLabel = t.irPhase ? IR_PHASES.find((p) => p.id === t.irPhase)?.n : null;
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                      <Checkbox
                        label=""
                        checked={t.status === "Done"}
                        onChange={(v) => {
                          updateTask(t.id, { status: v ? "Done" : "Backlog" });
                          if (v) addTL(`WS ${ws.r}: ${t.title} ✓`);
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{
                          color: t.status === "Done" ? colors.textDim : colors.text,
                          fontSize: 10,
                          textDecoration: t.status === "Done" ? "line-through" : "none",
                        }}>{t.title}</span>
                        {t.assignee && <span style={{ color: colors.textDim, fontSize: 8, marginLeft: 6 }}>({t.assignee})</span>}
                        {phaseLabel && <Badge color={colors.blue}>{phaseLabel}</Badge>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        const ok = await modal.showConfirm("Remove task?", `"${t.title}" will be removed from the workstream and the global Tasks board.`, "danger");
                        if (ok) deleteTask(t.id);
                      }}>×</Button>
                    </div>
                  );
                })}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "notifications" && (
        <>
          <NotificationTemplateBank incident={inc} />
          <NotificationCenter incident={inc} />
        </>
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
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(s.text); modal.showAlert("Copied", "Summary copied to clipboard."); }}>Copy</Button>
              </div>
              <pre style={{ background: colors.obsidianM, borderRadius: 5, padding: 10, color: colors.text, fontSize: 8, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono, monospace)", maxHeight: 200, overflow: "auto", margin: 0 }}>{s.text}</pre>
            </Card>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
        <Button variant="outline" onClick={() => { save(); modal.showAlert("Saved", "Incident data has been saved."); }}>Save</Button>
        <Button variant="secondary" onClick={() => setEditing(true)}>Edit Details</Button>
        <Button variant="danger" onClick={() => {
          // Dispositions are captured at close so post-mortem analytics can
          // distinguish a real incident from a false-positive or a downgrade
          // to a Security Event (an observable signal that didn't meet the
          // incident threshold).
          const DISPOSITION_LABELS: Record<string, "Resolved" | "FalsePositive" | "DeEscalated" | "Duplicate"> = {
            "Resolved — confirmed incident, response complete": "Resolved",
            "False Positive — alert was not a real incident": "FalsePositive",
            "De-escalated to Security Event — investigated, no incident threshold met": "DeEscalated",
            "Duplicate — same root cause as another incident": "Duplicate",
          };
          const PHASE_LABELS: Record<string, string> = Object.fromEntries(IR_PHASES.map((p) => [`${p.ico} ${p.n}`, p.id]));
          // Best-guess current phase: highest-id phase with any task progress.
          // Falls back to legacy phaseStatus (manual slider in older incidents).
          const phaseHasProgress = (phaseId: string) => {
            const phTasks = tasks.filter((t) => t.incidentId === inc.id && t.irPhase === phaseId);
            const phaseDone = phTasks.filter((t) => t.status === "Done").length;
            return phTasks.length > 0 && phaseDone > 0;
          };
          const currentPhaseId =
            IR_PHASES.slice().reverse().find((p) => phaseHasProgress(p.id))?.id ||
            IR_PHASES.slice().reverse().find((p) => (inc.phaseStatus?.[p.id] ?? 0) > 0)?.id ||
            "ident";
          const currentPhase = IR_PHASES.find((p) => p.id === currentPhaseId)!;
          modal.showPrompt(
            "Close Incident",
            [
              { key: "disposition", label: "Disposition", type: "select", required: true,
                options: Object.keys(DISPOSITION_LABELS), defaultValue: "Resolved — confirmed incident, response complete" },
              { key: "phase", label: "Phase at Close", type: "select", required: true,
                options: Object.keys(PHASE_LABELS), defaultValue: `${currentPhase.ico} ${currentPhase.n}` },
              { key: "rationale", label: "Rationale / Closure Notes", type: "textarea",
                placeholder: "e.g. AV signature on benign installer; user-submitted phish was a marketing email.", required: true },
            ],
            "Security Event = an observed occurrence (alert, anomaly, detection) that warrants investigation. It becomes an Incident only when investigation confirms unauthorized access, data exposure, or material disruption."
          ).then((r) => {
            if (!r) return;
            const disposition = DISPOSITION_LABELS[r.disposition];
            const closedPhase = PHASE_LABELS[r.phase];
            const closureRationale = r.rationale.trim();
            const closedDate = new Date().toLocaleDateString();
            const closedAt = new Date().toLocaleString();
            // Send close notification
            const closeNotif = buildNotification("incident.closed", {
              what: `Incident "${inc.title}" has been closed (${disposition})`,
              who: "Incident Commander",
              when: closedAt,
              where: "Commander Module",
              why: `Disposition: ${disposition}. Closed in ${IR_PHASES.find((p) => p.id === closedPhase)?.n || closedPhase}. ${closureRationale} Total cost: $${totalCost.toLocaleString()}. Team: ${inc.members.length} responders.`,
              incidentTitle: inc.title,
              privileged: inc.attorneyPrivilege,
            }, stakeholders);
            copyNotification(closeNotif);
            addNotification({ id: Date.now(), event: "incident.closed", recipients: closeNotif.recipients, subject: closeNotif.subject, body: closeNotif.body, timestamp: closedAt, privileged: closeNotif.privileged, module: "Commander" });
            addCase({ title: inc.title, date: closedDate, status: "Closed", cost: totalCost, members: inc.members.length });
            // Persist disposition on the active incident before we clear it (in case anything else reads it).
            setInc((p) => ({ ...p, status: "Closed", disposition, closedPhase, closureRationale, endTime: closedAt }));
            // Update incident log entry to Closed with disposition metadata
            const logEntry = incidentLog.find((e) => e.title === inc.title && e.status === "Active");
            if (logEntry) {
              updateIncidentLogEntry(logEntry.incidentId, { status: "Closed", closedAt, disposition, closedPhase, closureRationale });
              updateTicket(logEntry.masterTicketId, { status: "Closed" });
            }
            setActiveIncident(null);
            setEditing(true);
            setInc({ ...defaultInc });
          });
        }}>Close Incident</Button>
      </div>
    </div>
  );
}
