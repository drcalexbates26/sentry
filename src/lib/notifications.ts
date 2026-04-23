import type { StakeholderData, StakeholderPerson } from "@/types/stakeholder";

export type NotificationEvent =
  | "incident.declared" | "incident.severity_changed" | "incident.privilege_invoked"
  | "incident.privacy_flagged" | "incident.phase_complete" | "incident.closed"
  | "deadline.warning" | "deadline.overdue"
  | "task.created" | "task.status_changed" | "task.overdue"
  | "ticket.created" | "ticket.escalated"
  | "playbook.assigned_to_incident" | "playbook.phase_complete"
  | "tabletop.scheduled" | "tabletop.complete" | "tabletop.action_item_created";

interface NotificationContext {
  what: string;
  who: string;
  when: string;
  where: string;
  why: string;
  actionRequired?: string;
  incidentTitle?: string;
  privileged?: boolean;
}

interface NotificationResult {
  subject: string;
  body: string;
  recipients: string[];
  privileged: boolean;
}

const LN = "━".repeat(60);

function getRecipientsByGroup(stakeholders: StakeholderData, groupKeys: string[]): string[] {
  const recipients: string[] = [];
  groupKeys.forEach((key) => {
    const people = (stakeholders[key] as StakeholderPerson[]) || [];
    people.forEach((p) => {
      if (p.email) recipients.push(p.email);
    });
  });
  return [...new Set(recipients)];
}

export function getRecipientsForEvent(event: NotificationEvent, stakeholders: StakeholderData): string[] {
  switch (event) {
    case "incident.declared":
      return getRecipientsByGroup(stakeholders, ["incidentCommander", "ciso", "securityEngineers"]);
    case "incident.severity_changed":
      return getRecipientsByGroup(stakeholders, ["incidentCommander", "ciso", "securityEngineers", "legalContact"]);
    case "incident.privilege_invoked":
      return getRecipientsByGroup(stakeholders, ["legalContact", "externalLegal"]);
    case "incident.privacy_flagged":
      return getRecipientsByGroup(stakeholders, ["privacyContact"]);
    case "incident.phase_complete":
      return getRecipientsByGroup(stakeholders, ["incidentCommander", "ciso"]);
    case "incident.closed":
      return getRecipientsByGroup(stakeholders, ["incidentCommander", "ciso", "securityEngineers", "legalContact", "executivePOC"]);
    case "deadline.warning":
    case "deadline.overdue":
      return getRecipientsByGroup(stakeholders, ["incidentCommander", "ciso"]);
    case "playbook.assigned_to_incident":
      return getRecipientsByGroup(stakeholders, ["incidentCommander", "securityEngineers"]);
    case "tabletop.scheduled":
    case "tabletop.complete":
      return getRecipientsByGroup(stakeholders, ["ciso", "securityEngineers"]);
    default:
      return [];
  }
}

export function buildNotification(
  event: NotificationEvent,
  ctx: NotificationContext,
  stakeholders: StakeholderData,
): NotificationResult {
  const recipients = getRecipientsForEvent(event, stakeholders);
  const privileged = ctx.privileged || event === "incident.privilege_invoked";
  const header = privileged ? "ATTORNEY-CLIENT PRIVILEGED AND CONFIDENTIAL" : "CONFIDENTIAL";

  const eventLabel = event.replace(/\./g, " — ").replace(/_/g, " ").toUpperCase();
  const subject = `[SENTRY] ${eventLabel} — ${ctx.incidentTitle || ctx.where}`;

  const body = `${LN}
${header}
${LN}

[SENTRY NOTIFICATION]
${eventLabel}

${LN}

WHAT:     ${ctx.what}

WHO:      ${ctx.who}

WHEN:     ${ctx.when}

WHERE:    ${ctx.where}

WHY:      ${ctx.why}

${ctx.actionRequired ? `ACTION REQUIRED:\n          ${ctx.actionRequired}\n` : ""}
${LN}
Dark Rock Labs Sentry | Do not forward without authorization
${LN}`;

  return { subject, body, recipients, privileged };
}

export function openMailtoNotification(result: NotificationResult): void {
  const mailto = `mailto:${result.recipients.join(",")}?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(result.body)}`;
  window.open(mailto, "_blank");
}

export function copyNotification(result: NotificationResult): void {
  const fullText = `TO: ${result.recipients.join(", ")}\nSUBJECT: ${result.subject}\n\n${result.body}`;
  navigator.clipboard?.writeText(fullText);
}
