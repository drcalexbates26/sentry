export interface Playbook {
  id: string;
  cat: string;
  name: string;
  sev: "Low" | "Medium" | "High" | "Critical";
  icon: string;
  desc: string;
  iocs: string[];
  contain: string[];
  erad: string[];
  recover: string[];
  mitre: string[];
}

export interface PlaybookCase {
  title: string;
  date: string;
  status: "Open" | "Closed";
  type?: string;
  playbook?: string;
  ticketId?: number;
  cost?: number;
  members?: number;
}
