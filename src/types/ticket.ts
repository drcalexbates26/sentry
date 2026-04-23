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
}

export interface TicketAction {
  text: string;
  by: string;
  time: string;
}
