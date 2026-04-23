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
}

export interface TaskUpdate {
  text: string;
  date: string;
}
