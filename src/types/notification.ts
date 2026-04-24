export type NotificationType = "kick_off" | "status_update" | "phase_progression" | "escalation" | "closure" | "correction" | "retraction";
export type NotificationTier = 1 | 2 | 3 | 4;
export type ApprovalStatus = "pending" | "approved" | "rejected" | "escalated";
export type SendMethod = "clipboard" | "email_client" | "marked_sent" | "api";
export type NotificationChannel = "email" | "signal" | "whatsapp" | "sms" | "phone";
export type SLAStatus = "on_track" | "due_soon" | "overdue" | "standing_by";
export type FilingStatus = "Not Applicable" | "Not Filed" | "In Preparation" | "Filed" | "Acknowledged";

export interface IncidentSnapshot {
  severity: string;
  phase: string;
  iocCount: number;
  iocList: string[];
  affectedUserCount: number;
  affectedAssetCount: number;
  affectedRegions: string[];
  tasksDone: number;
  tasksInProgress: number;
  tasksBacklog: number;
  tasksTotal: number;
  findingsCount: number;
  findingsList: string[];
  memberCount: number;
  memberNames: string[];
  totalCost: number;
  escalationComplete: string[];
  playbooks: string[];
  ticketsOpen: number;
  ticketsClosed: number;
  privilegeActive: boolean;
  privacyConcern: boolean;
  phaseStatus: Record<string, number>;
}

export interface DeltaItem {
  field: string;
  from?: string;
  to?: string;
  detail?: string;
  type: "changed" | "advanced" | "added" | "progress" | "escalation" | "milestone" | "unchanged";
}

export interface NotificationRecipient {
  name: string;
  email: string;
  cell?: string;
  title?: string;
  included: boolean;
}

export interface IncidentNotificationRecord {
  id: string;
  incidentId: string;
  type: NotificationType;
  tier: NotificationTier;
  groupKey: string;
  groupLabel: string;
  recipients: NotificationRecipient[];
  recipientCount: number;
  subject: string;
  body: string;
  classification: string;
  channel: NotificationChannel;
  deltaFromId?: string;
  deltaSummary?: string;
  version: number;
  incidentSnapshot: IncidentSnapshot;
  correctionOfId?: string;
  correctionReason?: string;
  retracted: boolean;
  retractedBy?: string;
  retractedAt?: string;
  retractedReason?: string;
  generatedBy: string;
  generatedByEmail?: string;
  generatedAt: string;
  approvalRequired: boolean;
  approvedBy?: string;
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string;
  sentBy: string;
  sentAt: string;
  sendMethod: SendMethod;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface GroupClock {
  groupKey: string;
  groupLabel: string;
  tier: NotificationTier;
  lastNotifiedAt: string | null;
  lastNotifiedBy: string | null;
  version: number;
  nextDueAt: string | null;
  cadenceHours: number | null;
  cadenceLabel: string;
  status: SLAStatus;
  elapsedMs: number;
  percentElapsed: number;
  contactCount: number;
}

export interface RegulatoryFiling {
  id: string;
  regulation: string;
  deadline: string;
  status: FilingStatus;
  applicableReason?: string;
  filedBy?: string;
  filedAt?: string;
  filingMethod?: string;
  confirmationNumber?: string;
  filingContent?: string;
  statusHistory: { status: string; changedBy: string; changedAt: string; notes?: string }[];
}

export interface ThirdPartyContact {
  id: string;
  name: string;
  organization: string;
  email: string;
  phone?: string;
  role: string;
  relationship: "Vendor" | "Customer" | "Partner" | "Regulator" | "Other";
  scope: "summary" | "technical" | "full";
}

export interface CommHoldEntry {
  invokedBy: string;
  invokedAt: string;
  releasedBy?: string;
  releasedAt?: string;
  reason?: string;
}
