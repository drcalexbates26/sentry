export interface Ticket {
  id: number;
  title: string;
  severity: string;
  status: string;
  phase: string;
  assignee: string;
  details: string;
  actions: TicketAction[];
  created: string;
  playbookId?: string;
  subtaskCount?: number;
  // Hierarchy
  parentId?: number;
  childIds?: number[];
  // Incident linkage
  incidentId?: string;
  incidentTitle?: string;
  ticketType?: "master" | "child" | "standalone";
}

export interface TicketAction {
  text: string;
  by: string;
  time: string;
}
