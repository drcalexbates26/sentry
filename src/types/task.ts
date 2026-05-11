export type TaskStatus = "Backlog" | "In Progress" | "In Review" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export interface TaskItem {
  id: number;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  source: string;
  updates: TaskUpdate[];
  created: string;
  irPhase?: string;
  incidentId?: string;
  ticketId?: number;
  /**
   * Workstream key (e.g. "Security", "Legal", "Executive") when this task
   * belongs to an incident workstream. Lets the Commander's Workstreams tab
   * and the global Tasks board stay in sync — same TaskItem, two views.
   */
  workstream?: string;
}

export interface TaskUpdate {
  text: string;
  date: string;
  /** Who recorded the update. Captured at write time; survives later user renames/deletes. */
  by?: string;
}
