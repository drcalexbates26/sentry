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

export type UserRole = "viewer" | "analyst" | "manager" | "admin";

interface AppState {
  // Navigation & UI
  page: string;
  sidebarOpen: boolean;
  collapsedGroups: Record<string, boolean>;
  themeMode: "dark" | "light";
  currentUserRole: UserRole;
  setPage: (page: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleGroup: (groupId: string) => void;
  setThemeMode: (mode: "dark" | "light") => void;
  setCurrentUserRole: (role: UserRole) => void;

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
  updatePenTestRequest: (id: number, updates: Partial<PenTestRequest>) => void;

  // Notification Log
  notificationLog: NotificationEntry[];
  addNotification: (entry: NotificationEntry) => void;

  // Threat Intel
  threatIntelItems: ThreatIntelStoreItem[];
  threatIntelLoading: boolean;
  threatIntelLastFetch: string;
  setThreatIntelItems: (items: ThreatIntelStoreItem[]) => void;
  setThreatIntelLoading: (loading: boolean) => void;
  updateThreatIntelItem: (id: string, updates: Partial<ThreatIntelStoreItem>) => void;

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

export type PenTestStatus = "Submitted" | "Under Review" | "Pricing Sent" | "Approved" | "Active" | "Complete" | "Cancelled";

export interface PenTestCommsEntry {
  id: number;
  from: string;
  message: string;
  timestamp: string;
  type: "note" | "status" | "approval" | "finding" | "system";
}

export interface PenTestTimelineEntry {
  event: string;
  timestamp: string;
  by: string;
}

export interface PenTestFinding {
  id: number;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Informational";
  status: "Open" | "In Progress" | "Remediated" | "Accepted Risk";
  description: string;
  recommendation: string;
  evidence: string;
  testSource: string;
  cvss: string;
  nistMapping: string;
  remediationNotes: string;
  remediatedAt: string;
  remediatedBy: string;
}

export interface PenTestRequest {
  id: number;
  testType: string;
  orgName: string;
  contactEmail: string;
  status: PenTestStatus;
  submittedAt: string;
  formData: Record<string, string>;
  notes: string;

  // Dark Rock review
  reviewer: string;
  reviewNotes: string;
  pricing: { amount: number; description: string; sentAt: string } | null;

  // Approval
  approvedAt: string;
  approvedBy: string;

  // Active testing
  tester: string;
  testerEmail: string;
  startedAt: string;
  completedAt: string;

  // Communication & timeline
  commsLog: PenTestCommsEntry[];
  timeline: PenTestTimelineEntry[];

  // Findings
  findings: PenTestFinding[];

  // Report
  reportTitle: string;
  reportUploadedAt: string;
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

export interface ThreatIntelStoreItem {
  id: string;
  feedSource: string;
  feedCategory: string;
  industryTag?: string;
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  cveId?: string;
  cvssScore?: number;
  cvssVector?: string;
  cweId?: string;
  affectedVendors: string[];
  affectedProducts: string[];
  severityRank: string;
  impactScore: number;
  likelihoodScore: number;
  riskScore: number;
  isZeroDay: boolean;
  isActivelyExploited: boolean;
  tags: string[];
  mitreAttackIds: string[];
  recommendations?: string;
  executiveSummary?: string;
  applicability?: "applicable" | "not-applicable" | "pending";
  securityEventTicketId?: number;
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
  collapsedGroups: {},
  themeMode: "dark",
  currentUserRole: "admin",
  setPage: (page) => set({ page }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleGroup: (groupId) => set((s) => ({ collapsedGroups: { ...s.collapsedGroups, [groupId]: !s.collapsedGroups[groupId] } })),
  setThemeMode: (themeMode) => set({ themeMode }),
  setCurrentUserRole: (currentUserRole) => set({ currentUserRole }),

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
  updatePenTestRequest: (id, updates) =>
    set((s) => ({ penTestRequests: s.penTestRequests.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),

  notificationLog: [],
  addNotification: (entry) => set((s) => ({ notificationLog: [entry, ...s.notificationLog] })),

  threatIntelItems: [],
  threatIntelLoading: false,
  threatIntelLastFetch: "",
  setThreatIntelItems: (items) => set({ threatIntelItems: items, threatIntelLastFetch: new Date().toLocaleString() }),
  setThreatIntelLoading: (loading) => set({ threatIntelLoading: loading }),
  updateThreatIntelItem: (id, updates) =>
    set((s) => ({ threatIntelItems: s.threatIntelItems.map((i) => (i.id === id ? { ...i, ...updates } : i)) })),

  policiesGen: [],
  addPolicyGen: (id) => set((s) => ({ policiesGen: [...new Set([...s.policiesGen, id])] })),

  // Real metrics only
  metrics: emptyMetrics(),
  recordIncidentMetric: (month) =>
    set((s) => ({
      metrics: s.metrics.map((m) => (m.l === month ? { ...m, v: m.v + 1 } : m)),
    })),
}));
