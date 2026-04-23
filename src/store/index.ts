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

export interface IncidentLogEntry {
  incidentId: string;
  title: string;
  severity: string;
  masterTicketId: number;
  declaredAt: string;
  closedAt?: string;
  status: "Active" | "Closed";
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

  // Incident Log
  incidentLog: IncidentLogEntry[];
  addIncidentLogEntry: (entry: IncidentLogEntry) => void;
  updateIncidentLogEntry: (incidentId: string, updates: Partial<IncidentLogEntry>) => void;

  // Tickets
  tickets: Ticket[];
  addTicket: (ticket: Ticket) => void;
  addTickets: (tickets: Ticket[]) => void;
  updateTicket: (id: number, updates: Partial<Ticket>) => void;
  addChildTicket: (parentId: number, child: Ticket) => void;

  // Tasks
  tasks: TaskItem[];
  addTask: (task: TaskItem) => void;
  addTasks: (tasks: TaskItem[]) => void;
  updateTask: (id: number, updates: Partial<TaskItem>) => void;
  addTaskWithTicket: (task: TaskItem, incidentTitle: string) => void;

  // Cases
  cases: PlaybookCase[];
  addCase: (c: PlaybookCase) => void;

  // Stakeholders
  stakeholders: StakeholderData;
  updateStakeholders: (fn: (prev: StakeholderData) => StakeholderData) => void;

  // Forensics
  forensicLogs: ForensicLogEntry[];
  addForensicLog: (log: ForensicLogEntry) => void;
  updateForensicLog: (id: number, updates: Partial<ForensicLogEntry>) => void;

  // Lessons
  lessons: Lesson[];
  addLesson: (lesson: Lesson) => void;

  // Tabletop Exercises
  tabletopExercises: TabletopExercise[];
  addTabletopExercise: (exercise: TabletopExercise) => void;
  updateTabletopExercise: (id: number, updates: Partial<TabletopExercise>) => void;

  // Pen Test Requests
  penTestRequests: PenTestRequest[];
  addPenTestRequest: (req: PenTestRequest) => void;

  // Notification Log
  notificationLog: NotificationEntry[];
  addNotification: (entry: NotificationEntry) => void;

  // Policies
  policiesGen: string[];
  addPolicyGen: (id: string) => void;

  // Metrics - real data only
  metrics: MetricPoint[];
  recordIncidentMetric: (month: string) => void;
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

export interface EvidenceFile {
  id: number;
  name: string;
  size: number;
  type: string;
  sha256: string;
  uploadedAt: string;
}

export interface ForensicLogEntry {
  id: number;
  title: string;
  classification: "Internal" | "Confidential" | "Restricted" | "Privileged & Confidential";
  incidentId: string;
  incidentTitle: string;
  description: string;
  chainOfCustody: string;
  createdBy: string;
  createdAt: string;
  accessList: string[];
  files: EvidenceFile[];
  locked: boolean;
}

export interface PenTestRequest {
  id: number;
  testType: string;
  orgName: string;
  contactEmail: string;
  status: "Submitted" | "In Review" | "Scheduled" | "Complete";
  submittedAt: string;
  formData: Record<string, string>;
  notes: string;
}

export interface NotificationEntry {
  id: number;
  event: string;
  recipients: string[];
  subject: string;
  body: string;
  timestamp: string;
  privileged: boolean;
  module: string;
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

// Empty metrics - only real incidents populate this
const emptyMetrics = (): MetricPoint[] =>
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    .map((l) => ({ l, v: 0 }));

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

  // Incident Log
  incidentLog: [],
  addIncidentLogEntry: (entry) => set((s) => ({ incidentLog: [entry, ...s.incidentLog] })),
  updateIncidentLogEntry: (incidentId, updates) =>
    set((s) => ({ incidentLog: s.incidentLog.map((e) => (e.incidentId === incidentId ? { ...e, ...updates } : e)) })),

  // Tickets with hierarchy
  tickets: [],
  addTicket: (ticket) => set((s) => ({ tickets: [ticket, ...s.tickets] })),
  addTickets: (newTickets) => set((s) => ({ tickets: [...newTickets, ...s.tickets] })),
  updateTicket: (id, updates) =>
    set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
  addChildTicket: (parentId, child) =>
    set((s) => ({
      tickets: [
        child,
        ...s.tickets.map((t) =>
          t.id === parentId
            ? { ...t, childIds: [...(t.childIds || []), child.id] }
            : t
        ),
      ],
    })),

  // Tasks - addTaskWithTicket creates a child ticket automatically
  tasks: [],
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  addTasks: (newTasks) => set((s) => ({ tasks: [...newTasks, ...s.tasks] })),
  updateTask: (id, updates) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
  addTaskWithTicket: (task, incidentTitle) =>
    set((s) => {
      const ticketId = task.id + 1000000;
      const masterTicket = s.tickets.find((t) => t.ticketType === "master" && t.incidentTitle === incidentTitle);
      const childTicket: Ticket = {
        id: ticketId,
        title: task.title,
        severity: task.priority,
        status: "Open",
        phase: task.irPhase || "",
        assignee: task.assignee,
        details: `Auto-generated from task. Source: ${task.source}`,
        actions: [{ text: "Ticket created from task", by: "System", time: new Date().toLocaleTimeString() }],
        created: task.created,
        parentId: masterTicket?.id,
        incidentId: task.incidentId,
        incidentTitle,
        ticketType: "child",
      };
      const taskWithTicket = { ...task, ticketId };
      const updatedTickets = masterTicket
        ? [childTicket, ...s.tickets.map((t) => t.id === masterTicket.id ? { ...t, childIds: [...(t.childIds || []), ticketId] } : t)]
        : [childTicket, ...s.tickets];
      return {
        tasks: [taskWithTicket, ...s.tasks],
        tickets: updatedTickets,
      };
    }),

  cases: [],
  addCase: (c) => set((s) => ({ cases: [c, ...s.cases] })),

  stakeholders: defaultStakeholders,
  updateStakeholders: (fn) => set((s) => ({ stakeholders: fn(s.stakeholders) })),

  forensicLogs: [],
  addForensicLog: (log) => set((s) => ({ forensicLogs: [log, ...s.forensicLogs] })),
  updateForensicLog: (id, updates) =>
    set((s) => ({ forensicLogs: s.forensicLogs.map((l) => (l.id === id ? { ...l, ...updates } : l)) })),

  lessons: [],
  addLesson: (lesson) => set((s) => ({ lessons: [lesson, ...s.lessons] })),

  tabletopExercises: [],
  addTabletopExercise: (exercise) => set((s) => ({ tabletopExercises: [exercise, ...s.tabletopExercises] })),
  updateTabletopExercise: (id, updates) =>
    set((s) => ({ tabletopExercises: s.tabletopExercises.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

  penTestRequests: [],
  addPenTestRequest: (req) => set((s) => ({ penTestRequests: [req, ...s.penTestRequests] })),

  notificationLog: [],
  addNotification: (entry) => set((s) => ({ notificationLog: [entry, ...s.notificationLog] })),

  policiesGen: [],
  addPolicyGen: (id) => set((s) => ({ policiesGen: [...new Set([...s.policiesGen, id])] })),

  // Real metrics only
  metrics: emptyMetrics(),
  recordIncidentMetric: (month) =>
    set((s) => ({
      metrics: s.metrics.map((m) => (m.l === month ? { ...m, v: m.v + 1 } : m)),
    })),
}));
