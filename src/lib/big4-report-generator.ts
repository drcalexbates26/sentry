/**
 * Big-4 executive summary report generator.
 *
 * Produces an HTML deliverable in the style of an executive incident
 * post-mortem from a major consultancy (Deloitte / EY / KPMG / PwC).
 * The output is print-styled so users can open in a new window and
 * "Save as PDF" with a clean leadership-grade layout.
 *
 * Why HTML over plain text: executive readers expect formatted
 * sections, tables, classification headers, and a cover page —
 * none of which translate cleanly from monospace text. The existing
 * generateIncidentReport() in incident-report-generator.ts produces
 * the operational deep-dive; this is the leadership companion.
 */

import type { IRPhase } from "@/data/ir-phases";
import type { Incident } from "@/types/incident";
import type { TaskItem } from "@/types/task";
import type { ForensicLogEntry, Lesson, IncidentLogEntry } from "@/store";
import type { StakeholderData, StakeholderPerson } from "@/types/stakeholder";

const V = "3.1.0";

// Disposition labels mirror Commander/IncidentLog to keep terminology consistent.
const DISPOSITION_NARRATIVE: Record<string, string> = {
  Resolved: "Confirmed incident, response complete.",
  FalsePositive: "Investigation determined the alert was not a real incident.",
  DeEscalated: "Investigation determined the event did not meet the incident threshold and was de-escalated to a Security Event.",
  Duplicate: "Determined to share root cause with another incident; consolidated.",
};

const SEVERITY_NARRATIVE: Record<string, string> = {
  Critical: "Critical severity — material threat to operations, safety, or reputation requiring rapid executive engagement.",
  High: "High severity — confirmed loss of confidentiality, data integrity, or significant availability impact.",
  Medium: "Medium severity — potential but unconfirmed loss of confidentiality or data integrity.",
  Low: "Low severity — no significant impact expected; primarily availability considerations.",
};

export interface Big4Input {
  // Log-entry facts (always present after close).
  entry: IncidentLogEntry;
  // Commander-side state. May be null/partial for incidents closed before
  // the data model captured it.
  incident?: Partial<Incident> | null;
  // Cross-module joins, all filtered to this incident at the call site.
  tasks: TaskItem[];
  forensics: ForensicLogEntry[];
  lessons: Lesson[];
  // Master + child tickets for the appendix.
  tickets: { id: number; title: string; status: string; phase: string; assignee: string; created: string }[];
  // Reference data.
  irPhases: IRPhase[];
  stakeholders: StakeholderData;
  // Tenant / org metadata for the cover page.
  org: { name: string; industry?: string };
}

export function generateBig4Report(input: Big4Input): string {
  const { entry, incident, tasks, forensics, lessons, tickets, irPhases, stakeholders, org } = input;
  const now = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  const declared = entry.declaredAt || "—";
  const closed = entry.closedAt || (entry.status === "Closed" ? "(unrecorded)" : "Incident is still active");
  const disposition = entry.disposition ? DISPOSITION_NARRATIVE[entry.disposition] : "Active — not yet dispositioned.";
  const sevNarrative = SEVERITY_NARRATIVE[entry.severity] || "";
  const closedPhase = entry.closedPhase ? irPhases.find((p) => p.id === entry.closedPhase) : null;

  // ── Cost computations ────────────────────────────────────────────────
  const members = incident?.members || [];
  const rate = typeof incident?.internalCostRate === "number" ? incident.internalCostRate : 150;
  const internalCost = members.reduce((sum, raw) => {
    if (typeof raw === "string") return sum;
    const hrs = typeof raw.hours === "number" ? raw.hours : 0;
    const memberRate = typeof raw.rate === "number" ? raw.rate : rate;
    return sum + (hrs * memberRate);
  }, 0);
  const externalCost = (incident?.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalCost = internalCost + externalCost;

  // ── Tasks breakdown by phase ─────────────────────────────────────────
  const tasksByPhase = irPhases.map((ph) => {
    const phTasks = tasks.filter((t) => t.irPhase === ph.id);
    return {
      phase: ph,
      total: phTasks.length,
      done: phTasks.filter((t) => t.status === "Done").length,
      tasks: phTasks,
    };
  }).filter((p) => p.total > 0);
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "Done").length;
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // ── Stakeholder roster ───────────────────────────────────────────────
  const allInvolved: { group: string; person: StakeholderPerson }[] = [];
  for (const [groupKey, value] of Object.entries(stakeholders)) {
    if (groupKey === "keySystems" || groupKey === "vendors") continue;
    if (Array.isArray(value)) {
      (value as StakeholderPerson[]).forEach((p) => {
        if (p && p.firstName) allInvolved.push({ group: groupKey, person: p });
      });
    }
  }

  // ── Executive Summary narrative ──────────────────────────────────────
  const execSummary = buildExecutiveSummary({
    entry, incident, disposition, sevNarrative, closedPhase: closedPhase?.n || null,
    totalCost, completionPct, doneTasks, totalTasks, forensicsCount: forensics.length,
    lessonsCount: lessons.length, memberCount: members.length,
  });

  // ── Render ───────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Executive Incident Summary — ${escapeHtml(entry.title)}</title>
<style>
  @page { size: letter; margin: 0.75in; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Georgia, serif; color: #1A1A1A; max-width: 8.5in; margin: 0 auto; padding: 40px; background: #FFFFFF; line-height: 1.55; }
  h1 { font-size: 22pt; color: #0A0E14; margin: 0 0 8px; letter-spacing: -0.01em; }
  h2 { font-size: 14pt; color: #0A0E14; margin: 28px 0 10px; padding-bottom: 4px; border-bottom: 2px solid #00B4A6; letter-spacing: 0.02em; text-transform: uppercase; }
  h3 { font-size: 11pt; color: #0A0E14; margin: 16px 0 6px; letter-spacing: 0.04em; text-transform: uppercase; }
  p { font-size: 11pt; margin: 0 0 10px; text-align: justify; }
  .cover { page-break-after: always; padding-top: 1.5in; text-align: center; }
  .cover .brand { font-size: 10pt; letter-spacing: 0.3em; color: #00B4A6; font-weight: 700; margin-bottom: 32px; }
  .cover h1 { font-size: 28pt; margin-bottom: 6px; }
  .cover .subtitle { font-size: 13pt; color: #4A4A4A; margin-bottom: 60px; font-style: italic; }
  .cover .facts { border-top: 1px solid #B0B0B0; border-bottom: 1px solid #B0B0B0; padding: 22px 0; margin: 0 1in; }
  .cover .facts dt { font-size: 9pt; color: #4A4A4A; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 12px; }
  .cover .facts dt:first-child { margin-top: 0; }
  .cover .facts dd { font-size: 12pt; color: #0A0E14; margin: 2px 0 0; font-weight: 600; }
  .cover .classification { margin-top: 60px; font-size: 10pt; color: #C00000; letter-spacing: 0.2em; font-weight: 700; }
  .confidentiality { background: #F5F5F0; border-left: 3px solid #00B4A6; padding: 14px 18px; font-size: 10pt; margin: 16px 0; color: #2A2A2A; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 10pt; }
  th { background: #0A0E14; color: #FFFFFF; padding: 7px 9px; text-align: left; font-size: 9pt; letter-spacing: 0.08em; text-transform: uppercase; }
  td { padding: 6px 9px; border-bottom: 1px solid #DDDDDD; vertical-align: top; }
  tr:nth-child(even) td { background: #F8F8F8; }
  .kv { display: grid; grid-template-columns: max-content 1fr; column-gap: 16px; row-gap: 4px; margin: 6px 0 14px; font-size: 10pt; }
  .kv dt { color: #4A4A4A; font-weight: 600; }
  .kv dd { color: #1A1A1A; margin: 0; }
  .pill { display: inline-block; padding: 2px 9px; border-radius: 12px; font-size: 9pt; font-weight: 700; letter-spacing: 0.04em; }
  .pill-critical { background: #FEF2F2; color: #B91C1C; }
  .pill-high { background: #FEF3C7; color: #B45309; }
  .pill-medium { background: #FEFCE8; color: #854D0E; }
  .pill-low { background: #ECFDF5; color: #065F46; }
  .pill-resolved { background: #ECFDF5; color: #065F46; }
  .pill-falsepositive { background: #FEFCE8; color: #854D0E; }
  .pill-deescalated { background: #EFF6FF; color: #1E40AF; }
  .pill-duplicate { background: #F5F3FF; color: #5B21B6; }
  .timeline-item { padding: 6px 0; border-bottom: 1px solid #EEE; font-size: 10pt; }
  .timeline-item .ts { color: #4A4A4A; font-weight: 600; font-size: 9pt; }
  .lessons li, .recommendations li { margin-bottom: 6px; font-size: 10pt; line-height: 1.5; }
  .appendix { font-size: 9pt; }
  .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #DDDDDD; font-size: 9pt; color: #6A6A6A; text-align: center; letter-spacing: 0.06em; }
  .section-intro { font-size: 11pt; font-style: italic; color: #4A4A4A; margin-bottom: 14px; }
  @media print {
    body { padding: 0; }
    h2 { page-break-after: avoid; }
    .no-print { display: none; }
  }
  .toolbar { position: fixed; top: 14px; right: 14px; background: #00B4A6; color: white; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-family: -apple-system, sans-serif; font-size: 11pt; font-weight: 600; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
</style>
</head>
<body>
<button class="toolbar no-print" onclick="window.print()">Print / Save as PDF</button>

<!-- ── COVER PAGE ─────────────────────────────────────────────────── -->
<section class="cover">
  <div class="brand">DARK ROCK LABS · SENTRY</div>
  <h1>Executive Incident Summary</h1>
  <div class="subtitle">${escapeHtml(entry.title)}</div>

  <dl class="facts">
    <dt>Prepared For</dt>
    <dd>${escapeHtml(org.name)}${org.industry ? ` · ${escapeHtml(org.industry)}` : ""}</dd>
    <dt>Report Date</dt>
    <dd>${now}</dd>
    <dt>Incident Period</dt>
    <dd>${escapeHtml(declared)} → ${escapeHtml(closed)}</dd>
    <dt>Severity</dt>
    <dd><span class="pill pill-${entry.severity.toLowerCase()}">${escapeHtml(entry.severity)}</span></dd>
    <dt>Disposition</dt>
    <dd>${entry.disposition ? `<span class="pill pill-${entry.disposition.toLowerCase()}">${escapeHtml(formatDisposition(entry.disposition))}</span>` : `<span class="pill pill-medium">Active</span>`}</dd>
    <dt>Closed In Phase</dt>
    <dd>${closedPhase ? escapeHtml(closedPhase.n) : "—"}</dd>
    <dt>Master Ticket</dt>
    <dd>TKT-${entry.masterTicketId}</dd>
  </dl>

  <div class="classification">CONFIDENTIAL · PREPARED FOR EXECUTIVE LEADERSHIP</div>
</section>

<!-- ── EXECUTIVE SUMMARY ──────────────────────────────────────────── -->
<h2>Executive Summary</h2>
<div class="confidentiality">
  This summary is prepared for senior leadership and the board. It distills the operational record of the incident into the decisions, impacts, and recommendations most relevant to the organization's risk posture. The operational appendix accompanies this document for technical reviewers.
</div>
${execSummary.map((p) => `<p>${p}</p>`).join("\n")}

<!-- ── INCIDENT OVERVIEW ──────────────────────────────────────────── -->
<h2>1. Incident Overview</h2>
<dl class="kv">
  <dt>Title</dt><dd>${escapeHtml(entry.title)}</dd>
  <dt>Severity</dt><dd>${escapeHtml(entry.severity)} — ${escapeHtml(sevNarrative)}</dd>
  <dt>Declared</dt><dd>${escapeHtml(declared)}</dd>
  <dt>Closed</dt><dd>${escapeHtml(closed)}</dd>
  <dt>Status</dt><dd>${escapeHtml(entry.status)}</dd>
  <dt>Disposition</dt><dd>${escapeHtml(disposition)}</dd>
  ${entry.closureRationale ? `<dt>Rationale</dt><dd>${escapeHtml(entry.closureRationale)}</dd>` : ""}
  ${entry.summary ? `<dt>Summary Notes</dt><dd>${escapeHtml(entry.summary)}</dd>` : ""}
</dl>

${incident?.iocs && incident.iocs.length > 0 ? `
<h3>Indicators of Compromise</h3>
<p>${incident.iocs.map((i) => escapeHtml(i)).join("; ")}</p>
` : ""}

${(incident?.affectedAssets?.length || incident?.affectedUsers?.length || incident?.affectedRegions?.length) ? `
<h3>Scope</h3>
<dl class="kv">
  ${incident?.affectedUsers && incident.affectedUsers.length > 0 ? `<dt>Affected Users</dt><dd>${incident.affectedUsers.map((x) => escapeHtml(x)).join(", ")}</dd>` : ""}
  ${incident?.affectedAssets && incident.affectedAssets.length > 0 ? `<dt>Affected Assets</dt><dd>${incident.affectedAssets.map((x) => escapeHtml(x)).join(", ")}</dd>` : ""}
  ${incident?.affectedRegions && incident.affectedRegions.length > 0 ? `<dt>Affected Regions</dt><dd>${incident.affectedRegions.map((x) => escapeHtml(x)).join(", ")}</dd>` : ""}
</dl>
` : ""}

<!-- ── 2. RESPONSE TIMELINE ───────────────────────────────────────── -->
<h2>2. Timeline of Events</h2>
${incident?.timeline && incident.timeline.length > 0 ? `
<p class="section-intro">Key events captured during the incident response, in chronological order.</p>
<div>
${incident.timeline.map((t) => `
  <div class="timeline-item">
    <div class="ts">${escapeHtml(t.time)}${t.elapsed ? ` · ${escapeHtml(t.elapsed)}` : ""}${t.by ? ` · ${escapeHtml(t.by)}` : ""}</div>
    <div>${escapeHtml(t.event)}</div>
  </div>
`).join("")}
</div>
` : `<p>Detailed timeline events were not captured for this incident.</p>`}

<!-- ── 3. RESPONSE ACTIONS BY PHASE ──────────────────────────────── -->
<h2>3. Response Actions</h2>
<p class="section-intro">Actions taken across the NIST 800-61 incident response lifecycle. Overall completion: <strong>${completionPct}%</strong> (${doneTasks} of ${totalTasks} actions complete).</p>
${tasksByPhase.length > 0 ? `
<table>
  <thead>
    <tr><th style="width: 25%">Phase</th><th style="width: 12%">Completion</th><th>Key Actions</th></tr>
  </thead>
  <tbody>
${tasksByPhase.map((p) => `
    <tr>
      <td><strong>${escapeHtml(p.phase.n)}</strong></td>
      <td>${p.done}/${p.total} (${p.total > 0 ? Math.round((p.done / p.total) * 100) : 0}%)</td>
      <td>${p.tasks.slice(0, 5).map((t) => `<div>${t.status === "Done" ? "✓" : "○"} ${escapeHtml(t.title)}${t.assignee ? ` <em style="color:#6A6A6A">(${escapeHtml(t.assignee)})</em>` : ""}</div>`).join("")}${p.tasks.length > 5 ? `<div style="color:#6A6A6A; font-style:italic">+ ${p.tasks.length - 5} additional actions</div>` : ""}</td>
    </tr>
`).join("")}
  </tbody>
</table>
` : `<p>No phase-tagged actions were recorded for this incident.</p>`}

<!-- ── 4. FINDINGS & ROOT CAUSE ───────────────────────────────────── -->
<h2>4. Findings &amp; Root Cause</h2>
${incident?.findings && incident.findings.length > 0 ? `
<table>
  <thead><tr><th style="width: 22%">Time</th><th>Finding</th></tr></thead>
  <tbody>
${incident.findings.map((f) => `<tr><td>${escapeHtml(f.time)}</td><td>${escapeHtml(f.text)}</td></tr>`).join("")}
  </tbody>
</table>
` : `<p>No findings were logged during the response.</p>`}

<!-- ── 5. IMPACT ASSESSMENT ───────────────────────────────────────── -->
<h2>5. Impact Assessment</h2>
<dl class="kv">
  <dt>Internal Response Cost</dt><dd>$${internalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span style="color:#6A6A6A">(${members.length} responders, blended)</span></dd>
  <dt>External / Vendor Cost</dt><dd>$${externalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</dd>
  <dt>Total Estimated Cost</dt><dd><strong>$${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></dd>
  <dt>Privacy Concern</dt><dd>${incident?.privacyConcern ? "Yes — privacy considerations triggered" : "No"}</dd>
  <dt>Attorney-Client Privilege</dt><dd>${incident?.attorneyPrivilege ? `Yes${incident.privilegeEnforcedBy ? ` — enforced by ${escapeHtml(incident.privilegeEnforcedBy)}` : ""}` : "Not invoked"}</dd>
</dl>

${incident?.expenses && incident.expenses.length > 0 ? `
<h3>External Expense Detail</h3>
<table>
  <thead><tr><th>Vendor</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>
${incident.expenses.map((e) => `<tr><td>${escapeHtml(e.vendor)}</td><td>${escapeHtml(e.category)}</td><td>${escapeHtml(e.description)}</td><td style="text-align:right">$${e.amount.toLocaleString()}</td></tr>`).join("")}
  </tbody>
</table>
` : ""}

<!-- ── 6. LESSONS LEARNED & RECOMMENDATIONS ──────────────────────── -->
<h2>6. Lessons Learned &amp; Recommendations</h2>
${lessons.length > 0 ? `
<p class="section-intro">Lessons captured during and after the response, with corresponding remediation tasks tracked in the global Tasks board.</p>
<ul class="lessons">
${lessons.map((l) => `<li><strong>${escapeHtml(l.src || "General")}:</strong> ${escapeHtml(l.text)} <span style="color:#6A6A6A">(${escapeHtml(l.date)})</span></li>`).join("")}
</ul>
` : `<p>No formal lessons learned have been captured yet. We recommend completing a structured post-mortem within 30 days of close.</p>`}

<h3>Forward Recommendations</h3>
<ul class="recommendations">
${buildRecommendations(entry, completionPct, lessons.length, forensics.length, incident).map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
</ul>

<!-- ── 7. APPENDICES ─────────────────────────────────────────────── -->
<h2>7. Appendices</h2>

<h3>A. Response Team Roster</h3>
${members.length > 0 ? `
<table class="appendix">
  <thead><tr><th>Name</th><th>Title</th><th>Role</th><th>Hours</th><th style="text-align:right">Rate</th></tr></thead>
  <tbody>
${members.map((raw) => {
  if (typeof raw === "string") return `<tr><td>${escapeHtml(raw)}</td><td>—</td><td>Responder</td><td>0</td><td style="text-align:right">$${rate}/hr</td></tr>`;
  const memberRate = typeof raw.rate === "number" ? raw.rate : rate;
  return `<tr><td>${escapeHtml(raw.name || "Unknown")}</td><td>${escapeHtml(raw.title || "—")}</td><td>${escapeHtml(raw.role || "Responder")}</td><td>${typeof raw.hours === "number" ? raw.hours.toFixed(1) : "0"}</td><td style="text-align:right">$${memberRate}/hr</td></tr>`;
}).join("")}
  </tbody>
</table>
` : `<p>No team members were logged on the incident roster.</p>`}

<h3>B. Stakeholder Groups Engaged</h3>
${allInvolved.length > 0 ? `
<p class="appendix">${countUniqueGroups(allInvolved)} stakeholder group${countUniqueGroups(allInvolved) === 1 ? "" : "s"} configured at incident close, representing ${allInvolved.length} individual${allInvolved.length === 1 ? "" : "s"}.</p>
` : `<p>No stakeholders were configured.</p>`}

${incident?.escalation && incident.escalation.length > 0 ? `
<h3>C. Escalation Decisions</h3>
<table class="appendix">
  <thead><tr><th>Role</th><th>Owner</th><th>Decision</th><th>Decided</th></tr></thead>
  <tbody>
${incident.escalation.filter((e) => e.decision).map((e) => `<tr><td>${escapeHtml(e.role)}</td><td>${escapeHtml(e.owner || "—")}</td><td>${escapeHtml(e.decision || "—")}</td><td>${escapeHtml(e.decidedAt || "—")}${e.decidedBy ? ` (${escapeHtml(e.decidedBy)})` : ""}</td></tr>`).join("")}
  </tbody>
</table>
` : ""}

<h3>D. Tickets</h3>
${tickets.length > 0 ? `
<table class="appendix">
  <thead><tr><th>ID</th><th>Title</th><th>Phase</th><th>Status</th><th>Owner</th></tr></thead>
  <tbody>
${tickets.slice(0, 30).map((t) => `<tr><td>TKT-${t.id}</td><td>${escapeHtml(t.title)}</td><td>${escapeHtml(t.phase || "—")}</td><td>${escapeHtml(t.status)}</td><td>${escapeHtml(t.assignee || "—")}</td></tr>`).join("")}
  </tbody>
</table>
${tickets.length > 30 ? `<p style="font-size:9pt; color:#6A6A6A">Showing the first 30 of ${tickets.length} tickets. Full ticket log available in Sentry.</p>` : ""}
` : `<p>No tickets were generated.</p>`}

<h3>E. Forensic Evidence Inventory</h3>
${forensics.length > 0 ? `
<table class="appendix">
  <thead><tr><th>Title</th><th>Classification</th><th>Files</th><th>Collected</th></tr></thead>
  <tbody>
${forensics.map((f) => `<tr><td>${escapeHtml(f.title)}</td><td>${escapeHtml(f.classification)}</td><td>${(f.files || []).length}</td><td>${escapeHtml(f.createdAt)}</td></tr>`).join("")}
  </tbody>
</table>
<p style="font-size:9pt; color:#6A6A6A">Chain-of-custody and SHA-256 file hashes available in Sentry Forensics module.</p>
` : `<p>No forensic evidence was logged.</p>`}

<!-- ── FOOTER ────────────────────────────────────────────────────── -->
<div class="footer">
  Generated by Dark Rock Labs · Sentry v${V} · ${now}<br/>
  This document contains confidential information. Treat as restricted.
</div>

</body>
</html>`;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function buildExecutiveSummary(args: {
  entry: IncidentLogEntry;
  incident: Partial<Incident> | null | undefined;
  disposition: string;
  sevNarrative: string;
  closedPhase: string | null;
  totalCost: number;
  completionPct: number;
  doneTasks: number;
  totalTasks: number;
  forensicsCount: number;
  lessonsCount: number;
  memberCount: number;
}): string[] {
  const paragraphs: string[] = [];

  // Paragraph 1 — what happened and how it concluded.
  const concludedClause = args.entry.status === "Closed"
    ? `The incident was closed on ${escapeHtml(args.entry.closedAt || "an unrecorded date")}${args.closedPhase ? ` in the <strong>${escapeHtml(args.closedPhase)}</strong> phase` : ""}, with disposition: ${escapeHtml(args.disposition)}`
    : `The incident remains active as of this report.`;
  paragraphs.push(
    `On ${escapeHtml(args.entry.declaredAt)}, the organization declared a <strong>${escapeHtml(args.entry.severity.toLowerCase())}-severity</strong> incident — <em>${escapeHtml(args.entry.title)}</em>. ${escapeHtml(args.sevNarrative)} ${concludedClause}`
  );

  // Paragraph 2 — response intensity and posture.
  if (args.memberCount > 0 || args.totalTasks > 0) {
    paragraphs.push(
      `The response engaged <strong>${args.memberCount}</strong> responder${args.memberCount === 1 ? "" : "s"} and tracked <strong>${args.totalTasks}</strong> phase-tagged action${args.totalTasks === 1 ? "" : "s"} across the NIST 800-61 lifecycle, of which ${args.doneTasks} (${args.completionPct}%) were completed by close. Forensic evidence and chain-of-custody records were preserved through the Sentry platform${args.forensicsCount > 0 ? `, totaling ${args.forensicsCount} evidence item${args.forensicsCount === 1 ? "" : "s"}` : ""}.`
    );
  }

  // Paragraph 3 — impact.
  if (args.totalCost > 0) {
    paragraphs.push(
      `The estimated cost of this incident, combining internal responder hours at blended rates and external vendor or counsel charges, is approximately <strong>$${args.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>. Privacy and privilege considerations are documented in Section 5.`
    );
  }

  // Paragraph 4 — disposition-specific narrative.
  if (args.entry.disposition === "FalsePositive") {
    paragraphs.push(
      `Following triage, the security team determined that this alert did not represent a real incident. The detection logic and contextual data points that produced the alert have been documented for tuning consideration to reduce future false-positive volume.`
    );
  } else if (args.entry.disposition === "DeEscalated") {
    paragraphs.push(
      `Following investigation, the event did not meet the threshold for a formal incident — defined as confirmed unauthorized access, data exposure, or material disruption — and was de-escalated to a Security Event for continued monitoring.`
    );
  } else if (args.entry.disposition === "Resolved" && args.lessonsCount > 0) {
    paragraphs.push(
      `${args.lessonsCount} formal lesson${args.lessonsCount === 1 ? " was" : "s were"} captured during the response. Corresponding remediation actions have been opened on the Tasks board and are tracked through closure. Section 6 enumerates lessons and forward-looking recommendations.`
    );
  } else if (args.entry.disposition === "Duplicate") {
    paragraphs.push(
      `This incident was consolidated with another active investigation determined to share root cause. Consolidation prevents duplicative response effort and ensures a single source of truth for findings and remediation.`
    );
  } else if (args.lessonsCount === 0 && args.entry.status === "Closed") {
    paragraphs.push(
      `No formal lessons learned were captured during the response. We recommend a structured post-mortem within thirty days of close to derive durable improvements from this event.`
    );
  }

  return paragraphs;
}

function buildRecommendations(
  entry: IncidentLogEntry,
  completionPct: number,
  lessonsCount: number,
  forensicsCount: number,
  incident?: Partial<Incident> | null,
): string[] {
  const recs: string[] = [];
  if (entry.disposition === "FalsePositive") {
    recs.push("Tune the detection logic that produced this alert. Capture the false-positive signature in the SIEM/EDR exclusion catalog with a documented owner for periodic review.");
  }
  if (entry.disposition === "DeEscalated") {
    recs.push("Add this event pattern to the Security Event tracking dashboard so similar future signals are triaged without re-declaring incidents.");
  }
  if (completionPct < 100 && entry.status === "Closed") {
    recs.push(`Open response actions remain at close (${100 - completionPct}% incomplete). Recommend a 30-day follow-up review to confirm residual actions are completed or formally accepted as risk.`);
  }
  if (lessonsCount === 0 && entry.status === "Closed") {
    recs.push("Schedule a structured post-mortem within thirty days. The Big-4 standard is a blameless review with documented root-cause analysis and at least three forward-looking improvements.");
  }
  if (forensicsCount === 0 && entry.severity !== "Low") {
    recs.push("No forensic evidence was preserved. For medium-and-above incidents, recommend establishing a minimum evidence collection baseline (memory image, key logs, network capture) as part of the response playbook.");
  }
  if (incident?.attorneyPrivilege && !incident.privilegeEnforcedBy) {
    recs.push("Attorney-client privilege was invoked but no enforcing counsel was recorded. Update incident workflow to require an enforcing counsel name at privilege invocation to preserve defensibility.");
  }
  if (recs.length === 0) {
    recs.push("Maintain the current incident response cadence. Continue scheduled tabletop exercises and post-mortem reviews to keep the program calibrated.");
    recs.push("Ensure all phase-tagged tasks roll into the global Tasks board for cross-incident trend analysis.");
  }
  return recs;
}

function countUniqueGroups(items: { group: string }[]): number {
  return new Set(items.map((i) => i.group)).size;
}

function formatDisposition(d: string): string {
  return d === "FalsePositive" ? "False Positive"
    : d === "DeEscalated" ? "De-escalated → Security Event"
    : d;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Open the report in a new window so the user can print/save as PDF. */
export function openBig4ReportWindow(html: string): void {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
