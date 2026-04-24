import type { UserRole } from "@/store";

export interface RoleDef {
  role: UserRole;
  label: string;
  desc: string;
  color: string;
  permissions: string[];
  stakeholderAccess: string[];
}

export const ROLE_DEFS: RoleDef[] = [
  {
    role: "admin", label: "Administrator",
    desc: "Platform administration — user management, RBAC, settings, integrations. Reserved for IT/security leadership.",
    color: "#F56565",
    permissions: [
      "User management", "RBAC assignments", "Settings",
      "Integrations", "Manage team members", "Assign stakeholder groups",
      "All Manager permissions",
    ],
    stakeholderAccess: [
      "incidentCommander", "ciso", "executivePOC",
      "cyberInsuranceInternal", "cyberInsuranceExternal",
      "externalLegal", "hrContacts", "prContact", "lawEnforcement",
    ],
  },
  {
    role: "manager", label: "Manager",
    desc: "Operational leadership — declare incidents, activate playbooks, manage escalations, approve notifications.",
    color: "#ED8936",
    permissions: [
      "Incident declaration", "Playbook activation", "Escalation management",
      "Notification approval", "Report generation", "Policy generation",
      "All Analyst permissions",
    ],
    stakeholderAccess: [
      "incidentCommander", "ciso", "legalContact",
      "riskContact", "forensicsContact", "privacyContact",
    ],
  },
  {
    role: "analyst", label: "Analyst",
    desc: "Day-to-day operations — manage tickets, tasks, assessments, evidence, and coordinate with technical contacts.",
    color: "#4299E1",
    permissions: [
      "Create and edit tickets", "Create and edit tasks",
      "Run assessments", "Upload evidence", "View reports",
      "View operational stakeholders", "Data export",
    ],
    stakeholderAccess: [
      "securityEngineers", "forensicsContact", "riskContact",
    ],
  },
  {
    role: "viewer", label: "Viewer",
    desc: "Read-only access — dashboards, reports, ticket status, and threat intelligence. Cannot create or modify.",
    color: "#A0AEC0",
    permissions: [
      "View Dashboard", "View Threat Intel", "View assessments",
      "View tickets (read-only)", "View reports", "View incident log",
    ],
    stakeholderAccess: [],
  },
];

export const PLATFORM_ROLES = ROLE_DEFS.map((r) => ({ value: r.role, label: r.label }));

export function getRoleDef(role: UserRole): RoleDef {
  return ROLE_DEFS.find((r) => r.role === role) || ROLE_DEFS[3];
}

export function getRoleColor(role: string): string {
  const def = ROLE_DEFS.find((r) => r.label === role || r.role === role);
  return def?.color || "#A0AEC0";
}
