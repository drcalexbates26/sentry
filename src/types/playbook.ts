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
  /** `preset` = shipped in src/data/playbooks.ts and immutable.
   *  `custom` = tenant-created or tenant-edited clone from CustomPlaybook table. */
  source?: "preset" | "custom";
  /** For customs cloned from a preset, the preset id we forked from. */
  sourcePlaybookId?: string;
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
