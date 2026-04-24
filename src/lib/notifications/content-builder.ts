import type { Incident } from "@/types/incident";
import type { IncidentSnapshot, NotificationType, NotificationTier, DeltaItem } from "@/types/notification";
import { formatDeltaSummary } from "./delta-engine";
import { GROUP_LABELS } from "./cadence";

const LN = "━".repeat(52);
const LN2 = "─".repeat(52);

export function buildNotificationContent(
  incident: Incident,
  snapshot: IncidentSnapshot,
  groupKey: string,
  tier: NotificationTier,
  type: NotificationType,
  version: number,
  deltas: DeltaItem[] | null,
  senderName: string,
): { subject: string; body: string; classification: string } {
  const classification = incident.attorneyPrivilege
    ? "ATTORNEY-CLIENT PRIVILEGED AND CONFIDENTIAL"
    : "CONFIDENTIAL";

  const groupLabel = GROUP_LABELS[groupKey] || groupKey;
  const typeLabel = type.replace(/_/g, " ").toUpperCase();
  const timestamp = new Date().toLocaleString();

  const subject = `[SENTRY] ${typeLabel} — ${incident.title} (v${version})`;

  let body = `${classification}\nSENTRY INCIDENT NOTIFICATION\n${LN}\n\n`;
  body += `TO:         ${groupLabel}\n`;
  body += `FROM:       ${senderName} via Sentry\n`;
  body += `DATE:       ${timestamp}\n`;
  body += `INCIDENT:   ${incident.title}\n`;
  body += `SEVERITY:   ${incident.severity}\n`;
  body += `TYPE:       ${typeLabel}\n`;
  body += `VERSION:    ${version}\n\n${LN}\n\n`;

  // Delta summary for updates after kick-off
  if (deltas && deltas.length > 0 && type !== "kick_off") {
    body += formatDeltaSummary(deltas);
  }

  // WHO
  body += `WHO\n${LN2}\n`;
  body += `  Incident Commander: ${senderName}\n`;
  body += `  Responding Team: ${snapshot.memberCount > 0 ? snapshot.memberNames.join(", ") : "Being assembled"}\n`;
  body += `  Affected Users: ${snapshot.affectedUserCount}\n`;
  body += `  Affected Assets: ${snapshot.affectedAssetCount}\n\n`;

  // WHAT
  body += `WHAT\n${LN2}\n`;
  body += `  ${incident.title} has been declared as a ${incident.severity} severity\n  cybersecurity incident.\n\n`;

  // WHEN
  body += `WHEN\n${LN2}\n`;
  body += `  Declared: ${incident.startTime ? new Date(incident.startTime).toLocaleString() : "Pending"}\n`;
  body += `  Notification Time: ${timestamp}\n\n`;

  // WHERE
  body += `WHERE\n${LN2}\n`;
  body += `  Affected Regions: ${snapshot.affectedRegions.join(", ") || "Under assessment"}\n\n`;

  // WHY — tiered detail
  body += `WHY\n${LN2}\n`;
  if (tier === 1) {
    body += `  Indicators of Compromise (${snapshot.iocCount}):\n`;
    snapshot.iocList.forEach((ioc) => { body += `    • ${ioc}\n`; });
  } else if (tier === 2) {
    body += `  ${snapshot.iocCount} indicators of compromise confirmed.\n`;
    body += `  Types: Network, file, and behavioral indicators under analysis.\n`;
  } else if (tier === 3) {
    body += `  Multiple indicators confirmed. Technical details available on request.\n`;
  } else {
    body += `  Details scoped to your functional area. Contact IC for full briefing.\n`;
  }
  body += "\n";

  // HOW
  body += `HOW (Response Plan)\n${LN2}\n`;
  body += `  Active Playbook: ${snapshot.playbooks.length > 0 ? snapshot.playbooks.join(", ") : "Under determination"}\n`;
  body += `  Current Phase: ${snapshot.phase}\n`;
  body += `  Open Tickets: ${snapshot.ticketsOpen}\n`;
  body += `  Tasks: ${snapshot.tasksDone}/${snapshot.tasksTotal} complete\n\n`;

  // REGULATORY
  body += `REGULATORY / REPORTING\n${LN2}\n`;
  body += `  Privacy Concern: ${snapshot.privacyConcern ? "YES" : "Under assessment"}\n`;
  body += `  Attorney-Client Privilege: ${snapshot.privilegeActive ? "ACTIVE" : "Not invoked"}\n\n`;

  // Cost (Tier 2-3 only)
  if (tier >= 2) {
    body += `COST\n${LN2}\n`;
    body += `  Total to date: $${snapshot.totalCost.toLocaleString()}\n\n`;
  }

  body += `NEXT UPDATE\n${LN2}\n`;
  body += `  The next status update will be provided per battle rhythm.\n`;
  body += `  For questions, contact the Incident Commander directly.\n`;
  body += `  Do not forward this communication without authorization.\n\n`;
  body += `${LN}\nDark Rock Labs Sentry | ${classification}\n${LN}\n`;

  return { subject, body, classification };
}
