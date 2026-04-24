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
    desc: "Full platform access including user management, RBAC, settings, and all operational modules.",
    color: "#F56565",
    permissions: [
      "All modules", "User management", "RBAC assignments", "Settings",
      "Integrations", "Data export", "Incident declaration", "Policy generation",
      "Assign stakeholder groups", "Manage team members",
    ],
    stakeholderAccess: [
      "incidentCommander", "ciso", "securityEngineers", "legalContact",
      "riskContact", "executivePOC", "cyberInsuranceInternal", "cyberInsuranceExternal",
      "externalLegal", "forensicsContact", "hrContacts", "prContact",
      "privacyContact", "lawEnforcement",
    ],
  },
  {
    role: "manager", label: "Manager",
    desc: "Full operational access. Can declare incidents, manage tickets and tasks, activate playbooks, and view all stakeholders.",
    color: "#ED8936",
    permissions: [
      "All operational modules", "Incident declaration", "Ticket management",
      "Playbook activation", "Report generation", "Evidence vault",
      "View all stakeholders", "Manage operational contacts",
    ],
    stakeholderAccess: [
      "incidentCommander", "ciso", "securityEngineers", "legalContact",
      "riskContact", "forensicsContact",
    ],
  },
  {
    role: "analyst", label: "Analyst",
    desc: "Can view all modules and create/edit own work items. Cannot declare incidents or manage RBAC.",
    color: "#4299E1",
    permissions: [
      "View all modules", "Create own tickets", "Create own tasks",
      "Run assessments", "Add evidence", "View reports",
      "View assigned stakeholders",
    ],
    stakeholderAccess: [
      "securityEngineers",
    ],
  },
  {
    role: "viewer", label: "Viewer",
    desc: "Read-only access. Can view dashboards, reports, and ticket status but cannot create or modify anything.",
    color: "#A0AEC0",
    permissions: [
      "View Dashboard", "View Threat Intel", "View assessments",
      "View tickets", "View reports", "View incident log",
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
