// Approval workflow for external (Tier 4) notifications

export interface ApprovalRule {
  groupKey: string;
  requiredFrom: string[];
  mandatory: boolean;
}

export const APPROVAL_RULES: ApprovalRule[] = [
  { groupKey: "externalLegal", requiredFrom: ["incidentCommander", "legalContact"], mandatory: true },
  { groupKey: "prContact", requiredFrom: ["legalContact"], mandatory: true },
  { groupKey: "lawEnforcement", requiredFrom: ["legalContact"], mandatory: true },
  { groupKey: "forensicsContact", requiredFrom: ["incidentCommander"], mandatory: false },
  { groupKey: "hrContacts", requiredFrom: ["incidentCommander", "legalContact"], mandatory: false },
  { groupKey: "cyberInsuranceExternal", requiredFrom: ["incidentCommander", "legalContact"], mandatory: false },
];

export function requiresApproval(groupKey: string): boolean {
  return APPROVAL_RULES.some((r) => r.groupKey === groupKey);
}

export function getApprovalRule(groupKey: string): ApprovalRule | undefined {
  return APPROVAL_RULES.find((r) => r.groupKey === groupKey);
}

export function isTier4(groupKey: string): boolean {
  const tier4Groups = ["externalLegal", "forensicsContact", "hrContacts", "prContact", "lawEnforcement", "cyberInsuranceExternal"];
  return tier4Groups.includes(groupKey);
}
