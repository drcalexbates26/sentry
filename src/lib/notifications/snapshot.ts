import type { Incident } from "@/types/incident";
import type { TaskItem } from "@/types/task";
import type { Ticket } from "@/types/ticket";
import type { IncidentSnapshot } from "@/types/notification";

export function captureIncidentSnapshot(
  incident: Incident,
  tasks: TaskItem[],
  tickets: Ticket[],
): IncidentSnapshot {
  const incidentTasks = tasks.filter((t) => t.source?.includes("Playbook:") || t.irPhase);
  const incidentTickets = tickets.filter((t) => t.incidentTitle === incident.title || t.incidentId?.includes(incident.title));
  const totalHrs = incident.members.reduce((a, m) => a + m.hours, 0);
  const extCost = incident.expenses.reduce((a, e) => a + e.amount, 0);
  const intCost = totalHrs * (incident.internalCostRate || 150);

  // Determine current phase
  const phases = ["prep", "ident", "notif", "contain", "analysis", "erad", "recover", "followup"];
  const currentPhase = phases.find((p) => (incident.phaseStatus[p] || 0) < 100 && (incident.phaseStatus[p] || 0) > 0) || phases.find((p) => (incident.phaseStatus[p] || 0) === 0) || "prep";

  return {
    severity: incident.severity,
    phase: currentPhase,
    iocCount: incident.iocs.length,
    iocList: incident.iocs.slice(0, 10),
    affectedUserCount: incident.affectedUsers.length,
    affectedAssetCount: incident.affectedAssets.length,
    affectedRegions: incident.affectedRegions,
    tasksDone: incidentTasks.filter((t) => t.status === "Done").length,
    tasksInProgress: incidentTasks.filter((t) => t.status === "In Progress").length,
    tasksBacklog: incidentTasks.filter((t) => t.status === "Backlog" || t.status === "In Review").length,
    tasksTotal: incidentTasks.length,
    findingsCount: incident.findings.length,
    findingsList: incident.findings.slice(-5).map((f) => f.text),
    memberCount: incident.members.length,
    memberNames: incident.members.map((m) => m.name),
    totalCost: intCost + extCost,
    escalationComplete: incident.escalation.filter((e) => e.status === "Complete").map((e) => e.role),
    playbooks: [],
    ticketsOpen: incidentTickets.filter((t) => t.status !== "Closed").length,
    ticketsClosed: incidentTickets.filter((t) => t.status === "Closed").length,
    privilegeActive: incident.attorneyPrivilege,
    privacyConcern: incident.privacyConcern,
    phaseStatus: incident.phaseStatus,
  };
}
