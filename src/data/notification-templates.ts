/**
 * Bank of pre-written incident notification email templates.
 *
 * Each template renders to plain text with variable substitution from the
 * current Incident record. The Notifications tab in Commander lets the IC
 * pick a template, choose recipients (from platform users + stakeholders),
 * and send via the existing sendNotificationEmail server action.
 *
 * Adding a new template? Pick a stable id, fill in suggestedAudience as a
 * hint for the UI, and write the body() function. Template strings should
 * stay reasonably short — auditors scan, they don't read.
 */

import type { Incident } from "@/types/incident";

export interface NotificationTemplateCtx {
  incident: Incident;
  orgName: string;
  /** When the IC clicks "send" — used to stamp the email. */
  sentAt?: string;
}

export interface NotificationTemplate {
  id: string;
  /** Short label shown on the picker button. */
  label: string;
  /** One-line description shown under the label. */
  description: string;
  /** UI grouping. */
  category: "Declaration" | "Update" | "Regulatory" | "Stakeholder" | "Closure";
  /** Hint shown next to the recipient picker. */
  suggestedAudience: string;
  /** Classification banner (Privileged & Confidential etc.). */
  classification: "INTERNAL ONLY" | "ATTORNEY-CLIENT PRIVILEGED" | "REGULATORY SUBMISSION" | "EXTERNAL";
  privileged: boolean;
  subject(ctx: NotificationTemplateCtx): string;
  body(ctx: NotificationTemplateCtx): string;
}

const fmtList = (items: string[]) =>
  items.length === 0 ? "*To be confirmed*" : items.map((x) => `  • ${x}`).join("\n");

const fmtRoster = (incident: Incident) => {
  const members = incident.members || [];
  if (members.length === 0) return "*To be confirmed*";
  return members
    .map((m) => {
      const name = typeof m === "string" ? m : (m.name || "Unknown");
      const role = typeof m === "string" ? "Responder" : (m.role || "Responder");
      return `  • ${name} — ${role}`;
    })
    .join("\n");
};

const fmtStart = (s: string) => {
  if (!s) return "*To be confirmed*";
  try { return new Date(s).toLocaleString(); } catch { return s; }
};

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // ─── Declaration ──────────────────────────────────────────────────
  {
    id: "declaration_internal",
    label: "Incident Declaration — Internal",
    description: "Initial notification to Incident Commander, Security Engineering, and CISO.",
    category: "Declaration",
    suggestedAudience: "Incident Commander · Security Engineering · CISO",
    classification: "INTERNAL ONLY",
    privileged: false,
    subject: ({ incident }) => `[INCIDENT DECLARED] ${incident.title}`,
    body: ({ incident, orgName, sentAt }) => `${orgName} — SECURITY INCIDENT DECLARATION

We are declaring an active security incident at ${orgName}.

WHAT HAPPENED
${incident.title}

SEVERITY
${incident.severity}

DECLARED AT
${fmtStart(incident.startTime)}

CURRENT RESPONSE TEAM
${fmtRoster(incident)}

INDICATORS OF COMPROMISE (initial)
${fmtList(incident.iocs)}

AFFECTED SCOPE (initial)
Users:   ${incident.affectedUsers.join(", ") || "TBD"}
Assets:  ${incident.affectedAssets.join(", ") || "TBD"}
Regions: ${incident.affectedRegions.join(", ") || "TBD"}

NEXT UPDATE
A status update will be issued within the next reporting window.

Incident Commander will be your single point of contact during this incident.

— Sent ${sentAt ?? new Date().toLocaleString()} via Sentry by Dark Rock Labs`,
  },

  {
    id: "declaration_executive",
    label: "Executive Briefing — Declaration",
    description: "Concise executive summary at incident declaration. Privilege-tagged.",
    category: "Declaration",
    suggestedAudience: "Executive Leadership · General Counsel",
    classification: "ATTORNEY-CLIENT PRIVILEGED",
    privileged: true,
    subject: ({ incident }) => `[EXEC BRIEFING — PRIVILEGED] Security Incident: ${incident.title}`,
    body: ({ incident, orgName, sentAt }) => `PRIVILEGED & CONFIDENTIAL — ATTORNEY-CLIENT WORK PRODUCT

${orgName} has declared a ${incident.severity}-severity security incident.

INCIDENT
${incident.title}

DECLARED
${fmtStart(incident.startTime)}

RESPONSE POSTURE
${fmtRoster(incident)}

INITIAL ASSESSMENT
${incident.findings[0]?.text ?? "Initial assessment is in progress. The Incident Commander will provide a fuller picture in the next briefing."}

WHAT WE'RE DOING NOW
  • Containment activities are underway.
  • Forensic preservation in progress.
  • Outside counsel and breach coach notified per policy.

WHAT WE NEED FROM LEADERSHIP
  • Acknowledgment of receipt — no immediate action required.
  • Hold on any public statements until Communications coordinates.

We will update on a regular cadence. Reply with any questions through counsel.

— Sent ${sentAt ?? new Date().toLocaleString()} via Sentry by Dark Rock Labs`,
  },

  // ─── Update (mid-incident) ────────────────────────────────────────
  {
    id: "confirmed_breach",
    label: "Confirmed Security Incident — Broad Audience",
    description: "Sent once impact is confirmed. Adds parties beyond the core team.",
    category: "Update",
    suggestedAudience: "All Incident Command + Legal + HR + Comms + Insurance",
    classification: "ATTORNEY-CLIENT PRIVILEGED",
    privileged: true,
    subject: ({ incident }) => `[CONFIRMED INCIDENT] ${incident.title}`,
    body: ({ incident, orgName, sentAt }) => `PRIVILEGED & CONFIDENTIAL

The ${incident.severity}-severity incident declared at ${fmtStart(incident.startTime)} is now CONFIRMED with material impact.

INCIDENT
${incident.title}

CONFIRMED IMPACT
${incident.findings.length > 0 ? incident.findings.map((f) => "  • " + f.text).join("\n") : "*Detailed impact assessment in progress.*"}

INDICATORS OF COMPROMISE
${fmtList(incident.iocs)}

AFFECTED SCOPE
Users (${incident.affectedUsers.length}):   ${incident.affectedUsers.slice(0, 8).join(", ") || "TBD"}${incident.affectedUsers.length > 8 ? " …" : ""}
Assets (${incident.affectedAssets.length}): ${incident.affectedAssets.slice(0, 8).join(", ") || "TBD"}${incident.affectedAssets.length > 8 ? " …" : ""}
Regions: ${incident.affectedRegions.join(", ") || "TBD"}

EXTENDED RESPONSE TEAM
${fmtRoster(incident)}

ACTIVE WORKSTREAMS
${Object.keys(incident.workstreams || {}).length > 0
  ? Object.keys(incident.workstreams).map((k) => `  • ${k}`).join("\n")
  : "  • Containment, Forensics, Communications, Legal — see Sentry Commander for live status."}

NOTIFICATION OBLIGATIONS
We are evaluating regulatory notification timelines (HIPAA 60d / GDPR 72h / state-specific) and will confirm reportable thresholds shortly.

— Sent ${sentAt ?? new Date().toLocaleString()} via Sentry by Dark Rock Labs`,
  },

  {
    id: "hourly_update",
    label: "Hourly Status Update",
    description: "Tight situation report for the active response team.",
    category: "Update",
    suggestedAudience: "Incident Command (current responders)",
    classification: "INTERNAL ONLY",
    privileged: false,
    subject: ({ incident }) => `[SITREP] ${incident.title} — ${new Date().toLocaleTimeString()}`,
    body: ({ incident, sentAt }) => `SITUATION REPORT

INCIDENT: ${incident.title}
SEVERITY: ${incident.severity}
ELAPSED:  ${incident.startTime ? Math.round((Date.now() - new Date(incident.startTime).getTime()) / 3600000) + "h" : "—"}

LAST 1H ACTIVITY
${incident.timeline.slice(-5).reverse().map((t) => `  • ${t.time}: ${t.event}${t.by ? ` (${t.by})` : ""}`).join("\n") || "  • No new timeline entries."}

OPEN ITEMS
${incident.findings.length > 0 ? incident.findings.slice(0, 5).map((f) => `  • ${f.text}`).join("\n") : "  • No outstanding findings."}

ON SHIFT
${fmtRoster(incident)}

— Sent ${sentAt ?? new Date().toLocaleString()} via Sentry by Dark Rock Labs`,
  },

  // ─── Regulatory ───────────────────────────────────────────────────
  {
    id: "dpa_initial",
    label: "Data Protection Authority — Initial Notice",
    description: "GDPR / state-AG initial 72-hour notice. Proactive, factual.",
    category: "Regulatory",
    suggestedAudience: "Supervisory Authority · State Attorney General · DPO",
    classification: "REGULATORY SUBMISSION",
    privileged: false,
    subject: ({ incident, orgName }) => `Initial Notice of Personal Data Breach — ${orgName} — ${incident.title}`,
    body: ({ incident, orgName, sentAt }) => `${orgName.toUpperCase()}
INITIAL NOTICE OF PERSONAL DATA BREACH

This is the initial notification pursuant to applicable data-protection law of a personal data breach affecting ${orgName}.

1. NATURE OF THE BREACH
${incident.title}

Categories of data subjects affected: *To be confirmed; investigation ongoing.*
Approximate number of data subjects: ${incident.affectedUsers.length || "*to be confirmed*"}
Categories of personal data affected: *To be confirmed; investigation ongoing.*

2. WHEN AND HOW WE BECAME AWARE
Incident declared internally at ${fmtStart(incident.startTime)}.
First indicators: ${fmtList(incident.iocs)}

3. LIKELY CONSEQUENCES
${incident.findings.length > 0 ? incident.findings.map((f) => "  • " + f.text).join("\n") : "Currently being assessed. We will update this section as the forensic investigation progresses."}

4. MEASURES TAKEN OR PROPOSED
  • Activated formal incident-response procedure.
  • Engaged external forensics partner (Dark Rock Cybersecurity).
  • Contained the affected systems pending detailed analysis.
  • Counsel and breach coach engaged.

5. DATA PROTECTION OFFICER
Name: *Set in Stakeholders → Privacy Officer*
Email: privacy@${orgName.replace(/\\s+/g, "").toLowerCase()}.com

6. STATUS
This is an INITIAL notice. We will provide further detail and any required updates as soon as practicable and in any event in line with applicable timing requirements.

— Sent ${sentAt ?? new Date().toLocaleString()} via Sentry by Dark Rock Labs`,
  },

  {
    id: "dpa_followup",
    label: "Data Protection Authority — Follow-up",
    description: "Substantive update with confirmed scope. Sent within 72h of initial.",
    category: "Regulatory",
    suggestedAudience: "Supervisory Authority · DPO",
    classification: "REGULATORY SUBMISSION",
    privileged: false,
    subject: ({ incident, orgName }) => `Follow-up Notice of Personal Data Breach — ${orgName} — ${incident.title}`,
    body: ({ incident, orgName, sentAt }) => `${orgName.toUpperCase()}
FOLLOW-UP NOTICE OF PERSONAL DATA BREACH

Further to the initial notice provided on [DATE OF INITIAL], we now provide the following substantive update.

1. CONFIRMED IMPACT
${incident.findings.length > 0 ? incident.findings.map((f) => "  • " + f.text).join("\n") : "*Final impact assessment is pending closure of containment activities.*"}

2. AFFECTED DATA SUBJECTS
Approximate count: ${incident.affectedUsers.length || "*to be confirmed*"}
Geographic scope: ${incident.affectedRegions.join(", ") || "*to be confirmed*"}

3. MITIGATION COMPLETED
  • Containment confirmed at ${incident.timeline.find((t) => /contain/i.test(t.event))?.time ?? "*pending*"}.
  • Affected accounts disabled; credentials rotated.
  • Forensic acquisition complete; chain-of-custody preserved.

4. OUTSTANDING ITEMS
${incident.workstreams && Object.keys(incident.workstreams).length > 0
  ? Object.keys(incident.workstreams).map((k) => `  • ${k}`).join("\n")
  : "  • Eradication and recovery activities continuing."}

5. NOTIFICATION TO DATA SUBJECTS
${incident.findings.length > 0 ? "We are preparing direct notification to affected individuals. Templates and a press statement are being reviewed by counsel." : "Notification scope is under evaluation."}

— Sent ${sentAt ?? new Date().toLocaleString()} via Sentry by Dark Rock Labs`,
  },

  // ─── Stakeholder ──────────────────────────────────────────────────
  {
    id: "stakeholder_update",
    label: "Stakeholder Update",
    description: "Non-technical summary for board / customer / partner audiences.",
    category: "Stakeholder",
    suggestedAudience: "Board · Audit Committee · Affected Partners",
    classification: "EXTERNAL",
    privileged: false,
    subject: ({ incident, orgName }) => `Status Update — ${orgName} Security Incident`,
    body: ({ incident, orgName, sentAt }) => `${orgName} — STATUS UPDATE

You are receiving this because you are a designated stakeholder for ${orgName}'s incident-response program. Please treat this as confidential.

WHAT HAPPENED
On ${fmtStart(incident.startTime)}, ${orgName} identified a ${incident.severity.toLowerCase()}-severity security incident. The incident involves: ${incident.title}.

WHAT WE'VE DONE
  • Activated our formal incident-response process and stood up an Incident Commander.
  • Engaged outside forensic and legal counsel.
  • Contained the affected systems and preserved evidence.

WHAT'S NEXT
  • Forensic analysis continues. We expect a fuller picture within the next 24–48 hours.
  • We will issue another update at the next reporting interval, or sooner if material new facts emerge.

WHAT YOU CAN DO
${incident.severity === "Critical" || incident.severity === "High"
  ? "  • If you operate dependent systems, please monitor for unusual activity and report anything anomalous to your usual point of contact at " + orgName + "."
  : "  • No action required at this time."}

Thank you for your patience as we work through this responsibly.

— Sent ${sentAt ?? new Date().toLocaleString()} on behalf of ${orgName}`,
  },

  // ─── Closure ──────────────────────────────────────────────────────
  {
    id: "closure_internal",
    label: "Incident Closed — Internal",
    description: "Closing brief once recovery is complete.",
    category: "Closure",
    suggestedAudience: "Incident Command · Executive Leadership",
    classification: "INTERNAL ONLY",
    privileged: false,
    subject: ({ incident }) => `[INCIDENT CLOSED] ${incident.title}`,
    body: ({ incident, orgName, sentAt }) => `${orgName} — INCIDENT CLOSED

The security incident declared at ${fmtStart(incident.startTime)} is formally CLOSED as of ${incident.endTime ? fmtStart(incident.endTime) : new Date().toLocaleString()}.

FINAL DISPOSITION
${incident.findings.length > 0 ? incident.findings.slice(-1).map((f) => f.text).join("") : "Incident closed without confirmed material impact."}

ROOT-CAUSE SUMMARY
*To be completed in the after-action review.*

OUTSTANDING ITEMS (transferred to remediation)
${incident.workstreams && Object.keys(incident.workstreams).length > 0
  ? Object.keys(incident.workstreams).map((k) => `  • ${k}`).join("\n")
  : "  • None — all workstreams completed."}

THANK YOU TO THE RESPONSE TEAM
${fmtRoster(incident)}

The after-action report and any policy updates will be circulated within 10 business days.

— Sent ${sentAt ?? new Date().toLocaleString()} via Sentry by Dark Rock Labs`,
  },
];

export function getTemplate(id: string): NotificationTemplate | undefined {
  return NOTIFICATION_TEMPLATES.find((t) => t.id === id);
}

export function templatesForDeadline(deadlineLabel: string): NotificationTemplate[] {
  // Map reporting-deadline labels to the most relevant template(s).
  const map: Record<string, string[]> = {
    "Internal Management": ["declaration_internal"],
    "Legal Counsel": ["declaration_executive", "confirmed_breach"],
    "Executive Leadership": ["declaration_executive", "stakeholder_update"],
    "Cyber Insurance Carrier": ["confirmed_breach"],
    "Board / Audit Committee": ["stakeholder_update", "declaration_executive"],
    "DFARS DIBNet Report": ["dpa_initial"],
  };
  const ids = map[deadlineLabel] ?? [];
  return ids.map((id) => getTemplate(id)).filter((t): t is NotificationTemplate => !!t);
}
