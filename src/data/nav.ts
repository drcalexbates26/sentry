import {
  LayoutDashboard, ShieldAlert, Rocket, Shield, FileText, Swords, BookOpen,
  Target, Crosshair, TicketCheck, ListTodo, Microscope, Users, FileKey,
  Radio, Lock, Puzzle, ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dash", label: "Dashboard", icon: LayoutDashboard },
  { id: "threatintel", label: "Threat Intel", icon: ShieldAlert },
  { id: "onboard", label: "Onboarding", icon: Rocket },
  { id: "assess", label: "Assessment", icon: Shield },
  { id: "irplan", label: "IR Planner", icon: FileText },
  { id: "commander", label: "Commander", icon: Swords },
  { id: "incidentlog", label: "Incident Log", icon: ClipboardList },
  { id: "playbooks", label: "Playbooks", icon: BookOpen },
  { id: "tabletop", label: "Tabletop", icon: Target },
  { id: "pentesting", label: "Pen Testing", icon: Crosshair },
  { id: "tickets", label: "Tickets", icon: TicketCheck },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "forensics", label: "Forensics", icon: Microscope },
  { id: "stakeholders", label: "Stakeholders", icon: Users },
  { id: "policies", label: "Policies", icon: FileKey },
  { id: "comms", label: "Comms", icon: Radio },
  { id: "access", label: "Access", icon: Lock },
  { id: "integrations", label: "Integrations", icon: Puzzle },
];
