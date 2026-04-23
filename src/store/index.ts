"use client";

import { create } from "zustand";
import type { Organization, TechStack, TeamMember } from "@/types/organization";
import type { Assessment } from "@/types/assessment";
import type { Incident } from "@/types/incident";
import type { Ticket } from "@/types/ticket";
import type { TaskItem } from "@/types/task";
import type { StakeholderData } from "@/types/stakeholder";
import type { PlaybookCase } from "@/types/playbook";

export interface Lesson {
  text: string;
  date: string;
  src: string;
}

export interface MetricPoint {
  l: string;
  v: number;
}

interface AppState {
  // Navigation
  page: string;
  sidebarOpen: boolean;
  setPage: (page: string) => void;
  setSidebarOpen: (open: boolean) => void;

  // Onboarding
  onboardDone: boolean;
  org: Organization;
  tech: TechStack;
  comp: string[];
  setOnboardDone: (done: boolean) => void;
  setOrg: (org: Organization) => void;
  setTech: (tech: TechStack) => void;
  setComp: (comp: string[]) => void;

  // Team
  team: TeamMember[];
  addTeamMember: (member: TeamMember) => void;

  // Assessments
  assessments: Assessment[];
  addAssessment: (assessment: Assessment) => void;

  // IR Data
  irData: {
    checked: Record<string, boolean>;
    notes: Record<string, string>;
    contacts: { core: IRContact[]; extended: IRContact[]; external: IRContact[] };
  };
  updateIRData: (fn: (prev: AppState["irData"]) => AppState["irData"]) => void;

  // Commander
  activeIncident: Incident | null;
  setActiveIncident: (incident: Incident | null) => void;

  // Tickets
  tickets: Ticket[];
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: number, updates: Partial<Ticket>) => void;

  // Tasks
  tasks: TaskItem[];
  addTask: (task: TaskItem) => void;
  addTasks: (tasks: TaskItem[]) => void;
  updateTask: (id: number, updates: Partial<TaskItem>) => void;

  // Cases
  cases: PlaybookCase[];
  addCase: (c: PlaybookCase) => void;

  // Stakeholders
  stakeholders: StakeholderData;
  updateStakeholders: (fn: (prev: StakeholderData) => StakeholderData) => void;

  // Forensics
  forensicLogs: ForensicLogEntry[];
  addForensicLog: (log: ForensicLogEntry) => void;

  // Lessons
  lessons: Lesson[];
  addLesson: (lesson: Lesson) => void;

  // Tabletop Exercises
  tabletopExercises: TabletopExercise[];
  addTabletopExercise: (exercise: TabletopExercise) => void;

  // Policies
  policiesGen: string[];
  addPolicyGen: (id: string) => void;

  // Metrics
  metrics: MetricPoint[];
}

export interface IRContact {
  name: string;
  role: string;
  email: string;
}

export interface TabletopExercise {
  id: number;
  title: string;
  scenario: string;
  date: string;
  facilitator: string;
  participants: string;
  status: string;
  rating: number;
  notes: string;
}

export interface ForensicLogEntry {
  id: number;
  title: string;
  classification: string;
  caseRef: string;
  description: string;
  encKey?: string;
  locked: boolean;
  created: string;
}

const defaultOrg: Organization = {
  name: "", industry: "", size: "", website: "",
  contactName: "", contactEmail: "", contactPhone: "",
  techStack: {} as TechStack, compliance: [],
};

const defaultTech: TechStack = {
  identity: "", endpoint: "", siem: "", firewall: "",
  email: "", cloud: "", backup: "", mfa: "",
  vulnerability: "", dlp: "",
};

const defaultStakeholders: StakeholderData = {
  incidentCommander: [], ciso: [], securityEngineers: [], legalContact: [],
  riskContact: [], executivePOC: [], cyberInsuranceInternal: [],
  cyberInsuranceExternal: [], externalLegal: [], forensicsContact: [],
  hrContacts: [], prContact: [], privacyContact: [], lawEnforcement: [],
  keySystems: [],
};

const generateMetrics = (): MetricPoint[] =>
  ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
    .map((l) => ({ l, v: Math.floor(Math.random() * 6) + 1 }));

export const useStore = create<AppState>((set) => ({
  page: "dash",
  sidebarOpen: true,
  setPage: (page) => set({ page }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  onboardDone: false,
  org: defaultOrg,
  tech: defaultTech,
  comp: [],
  setOnboardDone: (onboardDone) => set({ onboardDone }),
  setOrg: (org) => set({ org }),
  setTech: (tech) => set({ tech }),
  setComp: (comp) => set({ comp }),

  team: [{ name: "Admin", email: "admin@org.com", role: "Administrator", active: true }],
  addTeamMember: (member) => set((s) => ({ team: [...s.team, member] })),

  assessments: [],
  addAssessment: (assessment) => set((s) => ({ assessments: [...s.assessments, assessment] })),

  irData: { checked: {}, notes: {}, contacts: { core: [], extended: [], external: [] } },
  updateIRData: (fn) => set((s) => ({ irData: fn(s.irData) })),

  activeIncident: null,
  setActiveIncident: (activeIncident) => set({ activeIncident }),

  tickets: [],
  addTicket: (ticket) => set((s) => ({ tickets: [ticket, ...s.tickets] })),
  updateTicket: (id, updates) =>
    set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

  tasks: [],
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  addTasks: (newTasks) => set((s) => ({ tasks: [...newTasks, ...s.tasks] })),
  updateTask: (id, updates) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

  cases: [],
  addCase: (c) => set((s) => ({ cases: [c, ...s.cases] })),

  stakeholders: defaultStakeholders,
  updateStakeholders: (fn) => set((s) => ({ stakeholders: fn(s.stakeholders) })),

  forensicLogs: [],
  addForensicLog: (log) => set((s) => ({ forensicLogs: [log, ...s.forensicLogs] })),

  lessons: [],
  addLesson: (lesson) => set((s) => ({ lessons: [lesson, ...s.lessons] })),

  tabletopExercises: [],
  addTabletopExercise: (exercise) => set((s) => ({ tabletopExercises: [exercise, ...s.tabletopExercises] })),

  policiesGen: [],
  addPolicyGen: (id) => set((s) => ({ policiesGen: [...new Set([...s.policiesGen, id])] })),

  metrics: generateMetrics(),
}));
