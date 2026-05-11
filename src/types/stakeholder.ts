export interface StakeholderPerson {
  id: number;
  firstName: string;
  lastName: string;
  title: string;
  responsibilities: string;
  email: string;
  cell: string;
  // Invite-state — written by inviteStakeholder server action.
  userId?: string | null;
  invitedAt?: string | null;
  inviteStatus?: "invited" | "accepted" | null;
  appRole?: "admin" | "manager" | "analyst" | "viewer" | null;
}

export interface StakeholderGroup {
  key: string;
  label: string;
  icon: string;
  desc: string;
  color: string;
}

export interface KeySystem {
  id: number;
  systemName: string;
  category: string;
  criticality: string;
  owner: string;
  ownerEmail: string;
  ownerCell: string;
  notes: string;
}

export interface Vendor {
  id: number;
  category: string;
  vendorName: string;
  productName: string;
  accountId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  supportPortal: string;
  supportTier: string;
  slaResponse: string;
  isPrimary: boolean;
  notes: string;
}

export interface StakeholderData {
  incidentCommander: StakeholderPerson[];
  ciso: StakeholderPerson[];
  securityEngineers: StakeholderPerson[];
  legalContact: StakeholderPerson[];
  riskContact: StakeholderPerson[];
  executivePOC: StakeholderPerson[];
  cyberInsuranceInternal: StakeholderPerson[];
  cyberInsuranceExternal: StakeholderPerson[];
  externalLegal: StakeholderPerson[];
  forensicsContact: StakeholderPerson[];
  hrContacts: StakeholderPerson[];
  prContact: StakeholderPerson[];
  privacyContact: StakeholderPerson[];
  lawEnforcement: StakeholderPerson[];
  keySystems: KeySystem[];
  vendors: Vendor[];
  [key: string]: StakeholderPerson[] | KeySystem[] | Vendor[];
}
