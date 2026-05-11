export interface Incident {
  id?: string;
  title: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Active" | "Closed";
  startTime: string;
  endTime?: string;
  internalCostRate: number;
  iocs: string[];
  affectedUsers: string[];
  affectedAssets: string[];
  affectedRegions: string[];
  privacyConcern: boolean;
  attorneyPrivilege: boolean;
  privilegeEnforcedBy: string;
  privilegeEnforcedAt: string;
  phaseStatus: Record<string, number>;
  findings: Finding[];
  timeline: TimelineEntry[];
  workstreams: Record<string, Workstream>;
  escalation: EscalationEntry[];
  expenses: Expense[];
  summaries: Summary[];
  notifications: IncidentNotification[];
  members: IncidentMember[];
  /**
   * Final disposition captured at close. See IncidentLogEntry.disposition for
   * the canonical definitions of each value.
   */
  disposition?: "Resolved" | "FalsePositive" | "DeEscalated" | "Duplicate";
  /** IR-phase id (from src/data/ir-phases.ts) at the moment the incident was closed. */
  closedPhase?: string;
  /** Free-text rationale captured alongside the disposition. */
  closureRationale?: string;
}

export interface Finding {
  text: string;
  time: string;
}

export interface TimelineEntry {
  time: string;
  event: string;
  elapsed: string;
  /** Who entered the event. Captured at write time; survives later renames. */
  by?: string;
}

export interface Workstream {
  tasks: WorkstreamTask[];
  docs: WorkstreamDoc[];
  accomplishments: WorkstreamAccomplishment[];
  risks: string[];
}

export interface WorkstreamTask {
  text: string;
  done: boolean;
  ts: string;
}

export interface WorkstreamDoc {
  name: string;
  ts: string;
  ver: string;
}

export interface WorkstreamAccomplishment {
  text: string;
  ts: string;
}

export interface EscalationEntry {
  role: string;
  owner: string;
  status: "Pending" | "In Progress" | "Complete" | "N/A";
  p: number;
  /** Contact detail (email/phone) for the named owner. */
  contact?: string;
  /** Decision recorded by the IC for this escalation chain step. */
  decision?: "Escalate" | "Hold" | "Notified" | "Acknowledged" | "N/A";
  /** When the decision was made — feeds the auto-timeline entry. */
  decidedAt?: string;
  /** Who made the decision (typically the IC). */
  decidedBy?: string;
}

export interface ExpenseDocument {
  id: number;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface Expense {
  vendor: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  stakeholderGroup: string;
  documents: ExpenseDocument[];
}

export interface Summary {
  id: number;
  timestamp: string;
  elapsed: string;
  text: string;
}

export interface IncidentNotification {
  type: string;
  time: string;
}

export interface IncidentMember {
  name: string;
  role: string;
  hours: number;
  /** Optional contact + organizational info captured for the incident roster. */
  email?: string;
  phone?: string;
  title?: string;
  /** Hourly rate override. When omitted, the incident's internalCostRate applies. */
  rate?: number;
}

export interface Deadline {
  label: string;
  hrs: number;
  status: "ON TRACK" | "WARNING" | "OVERDUE";
  template: string;
}
