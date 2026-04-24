import {
  LayoutDashboard, ShieldAlert, Building2, Shield, FileText, Users, FileKey,
  Swords, ClipboardList, ListTodo, TicketCheck, Microscope, BookOpen,
  Target, Crosshair, Puzzle, Radio, Lock, Settings, ChevronDown, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  id: string;
  label: string;
  collapsible: boolean;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "top",
    label: "",
    collapsible: false,
    items: [
      { id: "dash", label: "Dashboard", icon: LayoutDashboard },
      { id: "threatintel", label: "Threat Intel", icon: ShieldAlert },
    ],
  },
  {
    id: "onboarding",
    label: "Onboarding",
    collapsible: true,
    items: [
      { id: "onboard", label: "Organization", icon: Building2 },
      { id: "assess", label: "Assessment", icon: Shield },
      { id: "irplan", label: "IR Planner", icon: FileText },
      { id: "stakeholders", label: "Stakeholders", icon: Users },
      { id: "policies", label: "Policies", icon: FileKey },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    collapsible: true,
    items: [
      { id: "commander", label: "Commander", icon: Swords },
      { id: "incidentlog", label: "Incident Log", icon: ClipboardList },
      { id: "tasks", label: "Tasks", icon: ListTodo },
      { id: "tickets", label: "Tickets", icon: TicketCheck },
      { id: "forensics", label: "Forensics", icon: Microscope },
      { id: "playbooks", label: "Playbooks", icon: BookOpen },
      { id: "tabletop", label: "Tabletop", icon: Target },
      { id: "pentesting", label: "Pen Testing", icon: Crosshair },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    collapsible: true,
    items: [
      { id: "integrations", label: "Integrations", icon: Puzzle },
      { id: "comms", label: "Communications", icon: Radio },
      { id: "access", label: "Access Control", icon: Lock },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

// Flat list for route validation
export const ALL_NAV_IDS = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id));

// Icons for group collapse
export { ChevronDown, ChevronRight };
