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
}

export interface Finding {
  text: string;
  time: string;
}

export interface TimelineEntry {
  time: string;
  event: string;
  elapsed: string;
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
}

export interface Expense {
  vendor: string;
  amount: number;
  description: string;
  date: string;
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
}

export interface Deadline {
  label: string;
  hrs: number;
  status: "ON TRACK" | "WARNING" | "OVERDUE";
  template: string;
}
