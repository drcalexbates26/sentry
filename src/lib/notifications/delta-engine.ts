import type { IncidentSnapshot, DeltaItem } from "@/types/notification";

export function calculateDelta(previous: IncidentSnapshot, current: IncidentSnapshot): DeltaItem[] {
  const deltas: DeltaItem[] = [];

  if (previous.severity !== current.severity)
    deltas.push({ field: "Severity", from: previous.severity, to: current.severity, type: "changed" });

  if (previous.phase !== current.phase)
    deltas.push({ field: "Phase", from: previous.phase, to: current.phase, type: "advanced" });

  if (current.iocCount > previous.iocCount)
    deltas.push({ field: "IOCs", detail: `+${current.iocCount - previous.iocCount} new confirmed`, type: "added" });

  if (current.affectedUserCount !== previous.affectedUserCount)
    deltas.push({ field: "Affected Users", from: String(previous.affectedUserCount), to: String(current.affectedUserCount), type: "changed" });

  if (current.affectedAssetCount !== previous.affectedAssetCount)
    deltas.push({ field: "Affected Assets", from: String(previous.affectedAssetCount), to: String(current.affectedAssetCount), type: "changed" });

  if (current.tasksDone > previous.tasksDone)
    deltas.push({ field: "Tasks Completed", detail: `+${current.tasksDone - previous.tasksDone} since last update`, type: "progress" });

  if (current.tasksTotal > previous.tasksTotal)
    deltas.push({ field: "Tasks Created", detail: `+${current.tasksTotal - previous.tasksTotal} new tasks assigned`, type: "added" });

  if (current.findingsCount > previous.findingsCount)
    deltas.push({ field: "Findings", detail: `+${current.findingsCount - previous.findingsCount} new`, type: "added" });

  if (current.memberCount > previous.memberCount)
    deltas.push({ field: "Team", detail: `+${current.memberCount - previous.memberCount} responders added`, type: "added" });

  if (current.totalCost !== previous.totalCost)
    deltas.push({ field: "Cost", from: `$${previous.totalCost.toLocaleString()}`, to: `$${current.totalCost.toLocaleString()}`, type: "changed" });

  if (current.ticketsOpen !== previous.ticketsOpen || current.ticketsClosed !== previous.ticketsClosed)
    deltas.push({ field: "Tickets", detail: `${current.ticketsOpen} open (was ${previous.ticketsOpen}), ${current.ticketsClosed} closed`, type: "changed" });

  if (!previous.privilegeActive && current.privilegeActive)
    deltas.push({ field: "Attorney-Client Privilege", detail: "INVOKED", type: "escalation" });

  if (!previous.privacyConcern && current.privacyConcern)
    deltas.push({ field: "Privacy Concern", detail: "FLAGGED — PII/PHI potentially involved", type: "escalation" });

  const newEscalations = current.escalationComplete.filter((e) => !previous.escalationComplete.includes(e));
  if (newEscalations.length > 0)
    deltas.push({ field: "Escalation", detail: `${newEscalations.join(", ")} contacted`, type: "progress" });

  for (const [phase, pct] of Object.entries(current.phaseStatus)) {
    const prevPct = previous.phaseStatus[phase] || 0;
    if (pct === 100 && prevPct < 100)
      deltas.push({ field: "Phase Complete", detail: `${phase} reached 100%`, type: "milestone" });
  }

  if (deltas.length === 0)
    deltas.push({ field: "Status", detail: "No material changes since last notification", type: "unchanged" });

  return deltas;
}

export function formatDeltaSummary(deltas: DeltaItem[]): string {
  const LN = "━".repeat(50);
  let summary = `${LN}\nCHANGES SINCE LAST NOTIFICATION\n${LN}\n\n`;
  for (const d of deltas) {
    if (d.from && d.to) {
      summary += `${d.field}: ${d.from} → ${d.to}\n`;
    } else if (d.detail) {
      summary += `${d.field}: ${d.detail}\n`;
    }
  }
  return summary + "\n";
}
