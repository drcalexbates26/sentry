import type { UserRole } from "@/store";
import { ROLE_DEFS } from "./rbac";

/**
 * Recommended platform role for a stakeholder, derived from the group they
 * belong to. Inverse of ROLE_DEFS.stakeholderAccess: for each group, pick the
 * lowest-privilege role whose stakeholderAccess includes that group.
 *
 * Why lowest-privilege: a stakeholder should get the *least* access that lets
 * them do their job. A "CISO" doesn't automatically need Admin — Manager is
 * usually right.
 *
 * Rationale strings are surfaced in the invite UI so the admin understands
 * why a role was suggested and can override before sending.
 */

export interface RoleRecommendation {
  role: UserRole;
  rationale: string;
}

const ROLE_PRIORITY: UserRole[] = ["viewer", "analyst", "manager", "admin"];

function lowestRoleWithAccess(groupKey: string): UserRole | null {
  for (const role of ROLE_PRIORITY) {
    const def = ROLE_DEFS.find((r) => r.role === role);
    if (def?.stakeholderAccess.includes(groupKey)) return role;
  }
  return null;
}

const RATIONALE: Record<string, string> = {
  incidentCommander: "Incident Commanders drive response — they need to declare incidents, activate playbooks, and approve notifications.",
  ciso: "Security leadership oversees response strategy and stakeholder communications.",
  securityEngineers: "Day-to-day operators need ticket, task, evidence, and report access.",
  legalContact: "Internal counsel reviews regulatory exposure and approves external communications.",
  riskContact: "Risk management quantifies business impact during and after incidents.",
  forensicsContact: "Forensic responders upload evidence and run analyses.",
  privacyContact: "Privacy/DPO determines breach-notification triggers and tracks PII/PHI exposure.",
  executivePOC: "C-suite escalation only — admin-level visibility, infrequent direct action.",
  cyberInsuranceInternal: "Internal claims liaison needs full visibility to file and substantiate claims.",
  cyberInsuranceExternal: "Carrier-side contact — invited only for active claims; admin-level for breach coach work.",
  hrContacts: "HR partners on insider threat and personnel actions; sensitive scope.",
  prContact: "Communications lead drafts and approves public messaging.",
  externalLegal: "Outside counsel — privileged work; admin tier mirrors internal legal access.",
  lawEnforcement: "Coordinated through Legal; admin-tier access controls who can engage.",
};

const FALLBACK: RoleRecommendation = {
  role: "viewer",
  rationale: "No recommended role for this group — defaulting to read-only Viewer. An Admin can elevate after invite.",
};

export function recommendedRoleForGroup(groupKey: string): RoleRecommendation {
  const role = lowestRoleWithAccess(groupKey);
  if (!role) return FALLBACK;
  return {
    role,
    rationale: RATIONALE[groupKey] ?? `Recommended based on group access in the RBAC matrix.`,
  };
}

/**
 * Map a fine-grained app role to the closest prisma UserRole enum value.
 * The prisma enum (super_admin / tenant_admin / analyst / viewer) is the
 * auth-tier; appRole is the in-tenant role used by the RBAC matrix.
 */
export function appRoleToPrismaRole(appRole: UserRole): "tenant_admin" | "analyst" | "viewer" {
  if (appRole === "admin") return "tenant_admin";
  if (appRole === "manager" || appRole === "analyst") return "analyst";
  return "viewer";
}
