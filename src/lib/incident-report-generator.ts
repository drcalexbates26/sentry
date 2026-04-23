import type { IRPhase } from "@/data/ir-phases";
import type { StakeholderData, StakeholderPerson } from "@/types/stakeholder";

const LN = "━".repeat(72);
const LN2 = "─".repeat(72);
const V = "3.1.0";

interface IncidentData {
  title: string;
  severity: string;
  status: string;
  declaredAt: string;
  closedAt?: string;
  masterTicketId: number;
  incidentTasks: { title: string; status: string; priority: string; irPhase?: string; assignee: string; created: string }[];
  childTickets: { id: number; title: string; status: string; phase: string; assignee: string }[];
  incidentForensics: { title: string; classification: string; description: string; files: { name: string; sha256: string }[]; createdAt: string }[];
  incidentLessons: { text: string; date: string; src: string }[];
  phaseCompletion: (IRPhase & { done: number; total: number; pct: number })[];
  overallProgress: number;
  currentPhase: (IRPhase & { done: number; total: number; pct: number }) | null;
  activeStakeholderGroups: { key: string; label: string }[];
  totalTickets: number;
  openTickets: number;
}

interface StakeholderGroupDef {
  key: string;
  label: string;
}

export function generateIncidentReport(
  inc: IncidentData,
  irPhases: IRPhase[],
  stakeholderGroups: StakeholderGroupDef[],
  stakeholders: StakeholderData,
): string {
  const now = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  const completedTasks = inc.incidentTasks.filter((t) => t.status === "Done");
  const inProgressTasks = inc.incidentTasks.filter((t) => t.status === "In Progress");
  const backlogTasks = inc.incidentTasks.filter((t) => t.status === "Backlog" || t.status === "In Review");

  const readiness = inc.overallProgress >= 90
    ? "The incident response is in its final stages with the majority of actions completed."
    : inc.overallProgress >= 50
      ? "The incident response is actively progressing with significant work completed across multiple phases."
      : inc.overallProgress > 0
        ? "The incident response is in its early stages. Critical containment and analysis actions remain."
        : "The incident has been declared but response actions have not yet been assigned to IR phases.";

  let report = `${LN}

    DARK ROCK LABS — SENTRY
    INCIDENT RESPONSE REPORT

${LN}

Report Date:        ${now}
Prepared by:        Dark Rock Labs Sentry v${V}
Classification:     CONFIDENTIAL


${LN}
CONFIDENTIALITY STATEMENT
${LN}

This document contains confidential and proprietary information prepared by
Dark Rock Labs exclusively for the assessed organization. The contents of
this report are intended solely for the use of the designated recipients and
may contain security vulnerability details, incident response data, forensic
evidence references, and sensitive organizational information.

This report shall not be reproduced, distributed, or disclosed to any third
party without express written consent. Unauthorized disclosure may result in
legal liability and compromise the security posture of the organization.

The findings, observations, and recommendations contained in this report are
based on evidence collected during incident response activities and
information provided by organizational personnel.


${LN}
TABLE OF CONTENTS
${LN}

1.  Executive Summary
    1.1  Incident Overview
    1.2  Timeline
    1.3  Current Status
    1.4  Key Metrics
2.  Incident Response Phase Analysis
${irPhases.map((ph, i) => `    2.${i + 1}  ${ph.n}`).join("\n")}
3.  Ticket and Task Summary
    3.1  Master Ticket
    3.2  Child Tickets
    3.3  Task Breakdown by Phase
4.  Communications and Escalations
5.  Active Stakeholders
6.  Lessons Learned
7.  Appendix A — Forensic Evidence Reviewed
8.  Appendix B — Complete Ticket Register


${LN}
1.  EXECUTIVE SUMMARY
${LN}

1.1  Incident Overview
${LN2}

Incident Title:     ${inc.title}
Severity:           ${inc.severity}
Status:             ${inc.status}
Declared:           ${inc.declaredAt}
${inc.closedAt ? `Closed:             ${inc.closedAt}` : "Closed:             Ongoing"}
Master Ticket:      TKT-${inc.masterTicketId}
Total Tickets:      ${inc.totalTickets} (${inc.openTickets} open)
Total Tasks:        ${inc.incidentTasks.length}
Evidence Items:     ${inc.incidentForensics.length}
Lessons Captured:   ${inc.incidentLessons.length}

${readiness}

1.2  Timeline
${LN2}

  ${inc.declaredAt}    Incident declared — Severity: ${inc.severity}
  ${inc.declaredAt}    Master ticket TKT-${inc.masterTicketId} auto-generated
${completedTasks.length > 0 ? completedTasks.map((t) => `  ${t.created}          Task completed: ${t.title}`).join("\n") : "  [No completed tasks recorded]"}
${inc.closedAt ? `  ${inc.closedAt}    Incident closed` : "  [Incident remains active]"}

1.3  Current Status
${LN2}

Overall Incident Progression: ${inc.overallProgress}%
${"█".repeat(Math.floor(inc.overallProgress / 2.5))}${"░".repeat(40 - Math.floor(inc.overallProgress / 2.5))} ${inc.overallProgress}%

${inc.currentPhase && inc.currentPhase.total > 0
    ? `Current Phase: ${inc.currentPhase.n} (${inc.currentPhase.pct}% complete)`
    : "Current Phase: Awaiting task assignment to IR phases"}

1.4  Key Metrics
${LN2}

  Metric                          Value
  ${LN2.substring(0, 50)}
  Total Tickets                   ${inc.totalTickets}
  Open Tickets                    ${inc.openTickets}
  Closed Tickets                  ${inc.totalTickets - inc.openTickets}
  Total Tasks                     ${inc.incidentTasks.length}
  Tasks Completed                 ${completedTasks.length}
  Tasks In Progress               ${inProgressTasks.length}
  Tasks Outstanding               ${backlogTasks.length}
  Evidence Items                  ${inc.incidentForensics.length}
  Lessons Learned                 ${inc.incidentLessons.length}
  Active Stakeholder Groups       ${inc.activeStakeholderGroups.length}


`;

  // Section 2: Phase Analysis
  report += `${LN}\n2.  INCIDENT RESPONSE PHASE ANALYSIS\n${LN}\n\n`;

  inc.phaseCompletion.forEach((ph, idx) => {
    const cl = ph.pct >= 100 ? "COMPLETE" : ph.pct > 0 ? "IN PROGRESS" : "NOT STARTED";
    const bar = "█".repeat(Math.floor(ph.pct / 5)) + "░".repeat(20 - Math.floor(ph.pct / 5));
    const phaseTasks = inc.incidentTasks.filter((t) => t.irPhase === ph.id);

    report += `2.${idx + 1}  ${ph.n}
${LN2}

Status:     ${cl}
Progress:   ${bar} ${ph.pct}%  (${ph.done}/${ph.total} tasks)

`;
    if (phaseTasks.length > 0) {
      report += `Tasks:\n`;
      phaseTasks.forEach((t, i) => {
        const icon = t.status === "Done" ? "✓" : t.status === "In Progress" ? "►" : "○";
        report += `  ${icon} ${i + 1}. ${t.title}\n     Status: ${t.status} | Priority: ${t.priority} | Assignee: ${t.assignee || "Unassigned"}\n\n`;
      });
    } else {
      report += `  No tasks assigned to this phase.\n\n`;
    }
    report += `\n`;
  });

  // Section 3: Tickets
  report += `${LN}\n3.  TICKET AND TASK SUMMARY\n${LN}\n\n`;

  report += `3.1  Master Ticket\n${LN2}\n\n`;
  report += `  Ticket ID:    TKT-${inc.masterTicketId}\n  Title:        ${inc.title}\n  Severity:     ${inc.severity}\n  Status:       ${inc.status}\n  Child Tickets: ${inc.childTickets.length}\n\n`;

  report += `3.2  Child Tickets\n${LN2}\n\n`;
  if (inc.childTickets.length > 0) {
    report += `  #     Ticket ID    Title                                          Status      Phase\n`;
    report += `  ${"-".repeat(90)}\n`;
    inc.childTickets.forEach((t, i) => {
      report += `  ${(i + 1).toString().padEnd(5)} TKT-${t.id.toString().padEnd(9)} ${t.title.substring(0, 44).padEnd(46)} ${t.status.padEnd(11)} ${t.phase || "—"}\n`;
    });
  } else {
    report += `  No child tickets generated.\n`;
  }

  report += `\n3.3  Task Breakdown by Phase\n${LN2}\n\n`;
  irPhases.forEach((ph) => {
    const phaseTasks = inc.incidentTasks.filter((t) => t.irPhase === ph.id);
    if (phaseTasks.length > 0) {
      report += `  ${ph.ico} ${ph.n} (${phaseTasks.filter((t) => t.status === "Done").length}/${phaseTasks.length} complete)\n`;
      phaseTasks.forEach((t) => {
        report += `     [${t.status === "Done" ? "✓" : " "}] ${t.title}\n`;
      });
      report += `\n`;
    }
  });

  const unphased = inc.incidentTasks.filter((t) => !t.irPhase);
  if (unphased.length > 0) {
    report += `  Unassigned Phase (${unphased.length} tasks)\n`;
    unphased.forEach((t) => {
      report += `     [${t.status === "Done" ? "✓" : " "}] ${t.title}\n`;
    });
    report += `\n`;
  }

  // Section 4: Communications
  report += `\n${LN}\n4.  COMMUNICATIONS AND ESCALATIONS\n${LN}\n\n`;
  report += `  Communications are tracked in real-time within the Commander module.\n  See the Notifications and Escalation tabs for the full audit trail.\n\n`;

  // Section 5: Stakeholders
  report += `${LN}\n5.  ACTIVE STAKEHOLDERS\n${LN}\n\n`;
  stakeholderGroups.forEach((g) => {
    const people = (stakeholders[g.key] as StakeholderPerson[]) || [];
    if (people.length > 0) {
      report += `  ${g.label}\n  ${"-".repeat(40)}\n`;
      people.forEach((p) => {
        report += `    ${p.firstName} ${p.lastName}${p.title ? ` — ${p.title}` : ""}\n`;
        if (p.email) report += `      Email: ${p.email}\n`;
        if (p.cell) report += `      Cell:  ${p.cell}\n`;
      });
      report += `\n`;
    }
  });

  if (inc.activeStakeholderGroups.length === 0) {
    report += `  No stakeholders have been configured.\n\n`;
  }

  // Section 6: Lessons Learned
  report += `${LN}\n6.  LESSONS LEARNED\n${LN}\n\n`;
  if (inc.incidentLessons.length > 0) {
    inc.incidentLessons.forEach((l, i) => {
      report += `  ${i + 1}. ${l.text}\n     Source: ${l.src} | Date: ${l.date}\n\n`;
    });
  } else {
    report += `  No lessons learned have been captured for this incident.\n  Lessons should be documented during the Follow-Up phase.\n\n`;
  }

  // Appendix A: Forensics
  report += `${LN}\n7.  APPENDIX A — FORENSIC EVIDENCE REVIEWED\n${LN}\n\n`;
  if (inc.incidentForensics.length > 0) {
    inc.incidentForensics.forEach((f, i) => {
      report += `  Evidence ${i + 1}: ${f.title}\n  ${"-".repeat(50)}\n`;
      report += `  Classification:  ${f.classification}\n`;
      report += `  Collected:       ${f.createdAt}\n`;
      report += `  Description:     ${f.description || "No description provided."}\n`;
      if (f.files.length > 0) {
        report += `  Files:\n`;
        f.files.forEach((file) => {
          report += `    • ${file.name}\n      SHA256: ${file.sha256}\n`;
        });
      }
      report += `\n`;
    });
  } else {
    report += `  No forensic evidence has been collected for this incident.\n\n`;
  }

  // Appendix B: Full Ticket Register
  report += `${LN}\n8.  APPENDIX B — COMPLETE TICKET REGISTER\n${LN}\n\n`;
  report += `  Master Ticket: TKT-${inc.masterTicketId} — ${inc.title}\n\n`;
  if (inc.childTickets.length > 0) {
    inc.childTickets.forEach((t, i) => {
      report += `  ${i + 1}. TKT-${t.id}\n`;
      report += `     Title:    ${t.title}\n`;
      report += `     Status:   ${t.status}\n`;
      report += `     Phase:    ${t.phase || "Unassigned"}\n`;
      report += `     Assignee: ${t.assignee || "Unassigned"}\n\n`;
    });
  } else {
    report += `  No child tickets have been generated.\n\n`;
  }

  report += `\n${LN}

    END OF REPORT

    This report was generated by Dark Rock Labs Sentry v${V}
    on ${now}.

    Dark Rock Labs — Sentry Cyber Resilience Platform
    darkrocksecurity.com

    CONFIDENTIAL — Do not distribute without authorization.

${LN}\n`;

  return report;
}
