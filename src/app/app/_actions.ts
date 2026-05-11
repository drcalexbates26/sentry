"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, emailConfigured } from "@/lib/email";
import { retry } from "@/lib/retry";
import { appRoleToPrismaRole, recommendedRoleForGroup } from "@/data/role-recommendations";
import type { UserRole } from "@/store";
import type * as runtime from "@prisma/client/runtime/client";

export type StateBlob = Record<string, unknown>;

interface AssessmentRow {
  id: number; framework?: string; orgName: string; date: string; score: number;
  answers: Record<string, number>; fnScores: unknown; catScores?: unknown;
  warnings: unknown; recs: unknown; hitlist?: unknown;
}
interface PersonRow {
  id: number; firstName: string; lastName: string;
  title?: string; responsibilities?: string; email?: string; cell?: string;
  // Invite-state fields: written by inviteStakeholder(), read by the UI to
  // show invite status badges. Client-side edits never touch these directly.
  userId?: string | null;
  invitedAt?: string | null;
  inviteStatus?: string | null;
  appRole?: string | null;
}
interface KeySystemRow {
  id: number; systemName: string; category: string; criticality: string;
  owner?: string; ownerEmail?: string; ownerCell?: string; notes?: string;
}
interface VendorRow {
  id: number; category: string; vendorName: string; productName?: string;
  accountId?: string; contactName?: string; contactEmail?: string; contactPhone?: string;
  supportPortal?: string; supportTier?: string; slaResponse?: string;
  isPrimary?: boolean; notes?: string;
}
interface TicketRow {
  id: number; title: string; severity: string; status: string;
  phase?: string; assignee?: string; details?: string;
  actions: unknown; created?: string;
  parentId?: number; childIds?: number[];
  ticketType?: string; incidentId?: string; incidentTitle?: string;
  threatIntelId?: string; threatIntelTitle?: string;
  applicability?: string; verifiedExploit?: boolean;
  playbookId?: string; subtaskCount?: number;
}
interface TaskRow {
  id: number; title: string; priority: string; status: string;
  assignee?: string; source?: string; updates: unknown; created?: string;
  irPhase?: string; incidentId?: string; ticketId?: number;
}
interface IncidentLogRow {
  incidentId: string; title: string; severity: string;
  masterTicketId?: number; startTime?: string;
  declaredAt: string; closedAt?: string;
  status: "Active" | "Closed";
}
interface ForensicLogRow {
  id: number; title: string; classification: string;
  incidentId?: string; incidentTitle?: string;
  description?: string; chainOfCustody?: string;
  createdBy?: string; createdAt?: string;
  accessList?: unknown; files?: unknown; locked?: boolean;
}
interface TabletopRow {
  id: number; title: string; status: string;
  date: string; rating?: number;
  [k: string]: unknown;
}
interface LessonRow {
  text: string; date: string; src: string;
}

// ─── loadTenantState ─────────────────────────────────────────────────
export async function loadTenantState(): Promise<StateBlob | null> {
  const session = await requireUser();
  const tenantId = session.activeTenantId ?? session.user!.tenantId;

  const [
    stateRow, assessRows, stakeholderRows, keySystemRows, vendorRows,
    ticketRows, taskRows, incidentRows, forensicRows, tabletopRows,
    lessonRows, policyRows,
  ] = await Promise.all([
    prisma.tenantState.findUnique({ where: { tenantId } }),
    prisma.assessment.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } }),
    prisma.stakeholder.findMany({ where: { tenantId }, orderBy: { createdAt: "asc" } }),
    prisma.keySystem.findMany({ where: { tenantId }, orderBy: { createdAt: "asc" } }),
    prisma.vendor.findMany({ where: { tenantId }, orderBy: { createdAt: "asc" } }),
    prisma.ticket.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } }),
    prisma.task.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } }),
    prisma.incident.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } }),
    prisma.forensicLog.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } }),
    prisma.tabletop.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } }),
    prisma.lesson.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } }),
    prisma.policy.findMany({ where: { tenantId } }),
  ]);

  const blob = (stateRow?.data as StateBlob) ?? null;

  const assessments: AssessmentRow[] = assessRows.map((r) => ({
    id: Number(r.id), framework: r.framework, orgName: r.orgName, date: r.date,
    score: r.score, answers: r.answers as Record<string, number>,
    fnScores: r.fnScores, catScores: r.catScores ?? [],
    warnings: r.warnings, recs: r.recs, hitlist: r.hitlist ?? null,
  }));

  const stakeholders: Record<string, unknown[]> = {};
  for (const r of stakeholderRows) {
    if (!stakeholders[r.groupKey]) stakeholders[r.groupKey] = [];
    (stakeholders[r.groupKey] as PersonRow[]).push({
      id: Number(r.id),
      firstName: r.firstName, lastName: r.lastName,
      title: r.title ?? "", responsibilities: r.responsibilities ?? "",
      email: r.email ?? "", cell: r.cell ?? "",
      userId: r.userId ?? null,
      invitedAt: r.invitedAt?.toISOString() ?? null,
      inviteStatus: r.inviteStatus ?? null,
      appRole: r.appRole ?? null,
    });
  }
  stakeholders.keySystems = keySystemRows.map<KeySystemRow>((r) => ({
    id: Number(r.id), systemName: r.systemName, category: r.category, criticality: r.criticality,
    owner: r.owner ?? "", ownerEmail: r.ownerEmail ?? "", ownerCell: r.ownerCell ?? "", notes: r.notes ?? "",
  }));
  stakeholders.vendors = vendorRows.map<VendorRow>((r) => ({
    id: Number(r.id), category: r.category, vendorName: r.vendorName, productName: r.productName ?? "",
    accountId: r.accountId ?? "", contactName: r.contactName ?? "", contactEmail: r.contactEmail ?? "",
    contactPhone: r.contactPhone ?? "", supportPortal: r.supportPortal ?? "", supportTier: r.supportTier ?? "",
    slaResponse: r.slaResponse ?? "", isPrimary: r.isPrimary, notes: r.notes ?? "",
  }));

  const tickets: TicketRow[] = ticketRows.map((r) => ({
    id: Number(r.id), title: r.title, severity: r.severity, status: r.status,
    phase: r.phase ?? "", assignee: r.assignee ?? "", details: r.details ?? "",
    actions: r.actions, created: r.created ?? r.createdAt.toLocaleDateString(),
    parentId: r.parentId ? Number(r.parentId) : undefined,
    childIds: (r.childIds as string[] | null)?.map((x) => Number(x)),
    ticketType: r.ticketType ?? undefined,
    incidentId: r.incidentId ?? undefined, incidentTitle: r.incidentTitle ?? undefined,
    threatIntelId: r.threatIntelId ?? undefined, threatIntelTitle: r.threatIntelTitle ?? undefined,
    applicability: r.applicability ?? undefined, verifiedExploit: r.verifiedExploit ?? undefined,
    playbookId: r.playbookId ?? undefined, subtaskCount: r.subtaskCount ?? undefined,
  }));

  const tasks: TaskRow[] = taskRows.map((r) => ({
    id: Number(r.id), title: r.title, priority: r.priority, status: r.status,
    assignee: r.assignee ?? "", source: r.source ?? "", updates: r.updates,
    created: r.created ?? r.createdAt.toLocaleDateString(),
    irPhase: r.irPhase ?? undefined, incidentId: r.incidentId ?? undefined,
    ticketId: r.ticketId ? Number(r.ticketId) : undefined,
  }));

  // Incident: rows produce both incidentLog (summaries) and activeIncident (current full record)
  const incidentLog: IncidentLogRow[] = incidentRows.map((r) => {
    const fullData = (r.data ?? {}) as Record<string, unknown>;
    return {
      incidentId: r.id,
      title: r.title,
      severity: r.severity,
      masterTicketId: r.masterTicketId ?? undefined,
      // startTime lives in the JSON `data` column for any incident that has
      // had its full record persisted (active now, or active-then-closed).
      startTime: typeof fullData.startTime === "string" ? fullData.startTime : undefined,
      declaredAt: r.declaredAt,
      closedAt: r.closedAt ?? undefined,
      status: r.status === "Active" ? "Active" : "Closed",
    };
  });
  const activeIncidentRow = incidentRows.find((r) => r.status === "Active" && r.data);
  const activeIncident = activeIncidentRow?.data ?? null;

  const forensicLogs: ForensicLogRow[] = forensicRows.map((r) => {
    const d = (r.data ?? {}) as Record<string, unknown>;
    return {
      id: Number(r.id),
      title: r.title,
      classification: r.classification,
      incidentId: r.incidentId ?? undefined,
      incidentTitle: (d.incidentTitle as string) ?? undefined,
      description: (d.description as string) ?? "",
      chainOfCustody: (d.chainOfCustody as string) ?? "",
      createdBy: (d.createdBy as string) ?? "",
      createdAt: (d.createdAt as string) ?? r.createdAt.toISOString(),
      accessList: d.accessList ?? [],
      files: d.files ?? [],
      locked: (d.locked as boolean) ?? false,
    };
  });

  const tabletopExercises: TabletopRow[] = tabletopRows.map((r) => {
    const d = (r.data ?? {}) as Record<string, unknown>;
    return {
      id: Number(r.id),
      title: r.title,
      status: r.status,
      date: r.date,
      rating: r.rating ?? undefined,
      ...d,
    };
  });

  const lessons: LessonRow[] = lessonRows.map((r) => ({
    text: r.text,
    src: r.src ?? "",
    date: r.date ?? r.createdAt.toLocaleDateString(),
  }));

  const policiesGen: string[] = policyRows.map((r) => r.templateId);

  if (
    !blob && assessments.length === 0 && stakeholderRows.length === 0 &&
    keySystemRows.length === 0 && vendorRows.length === 0 &&
    ticketRows.length === 0 && taskRows.length === 0 &&
    incidentRows.length === 0 && forensicRows.length === 0 &&
    tabletopRows.length === 0 && lessonRows.length === 0 && policyRows.length === 0
  ) return null;

  return {
    ...(blob ?? {}),
    assessments,
    stakeholders,
    tickets,
    tasks,
    activeIncident,
    incidentLog,
    forensicLogs,
    tabletopExercises,
    lessons,
    policiesGen,
  };
}

// ─── saveTenantState ─────────────────────────────────────────────────
export async function saveTenantState(data: StateBlob): Promise<{ ok: boolean }> {
  const session = await requireUser();
  const tenantId = session.activeTenantId ?? session.user!.tenantId;

  const slices = data as {
    assessments?: AssessmentRow[];
    stakeholders?: Record<string, unknown> & { keySystems?: KeySystemRow[]; vendors?: VendorRow[] };
    tickets?: TicketRow[];
    tasks?: TaskRow[];
    activeIncident?: Record<string, unknown> | null;
    incidentLog?: IncidentLogRow[];
    forensicLogs?: ForensicLogRow[];
    tabletopExercises?: TabletopRow[];
    lessons?: LessonRow[];
    policiesGen?: string[];
  } & StateBlob;

  const {
    assessments, stakeholders, tickets, tasks,
    activeIncident, incidentLog, forensicLogs,
    tabletopExercises, lessons, policiesGen,
    ...rest
  } = slices;

  const groups: Record<string, PersonRow[]> = {};
  let keySystems: KeySystemRow[] = [];
  let vendors: VendorRow[] = [];
  if (stakeholders) {
    const { keySystems: ks, vendors: vs, ...rawGroups } = stakeholders;
    keySystems = (ks as KeySystemRow[]) ?? [];
    vendors = (vs as VendorRow[]) ?? [];
    for (const [k, v] of Object.entries(rawGroups)) {
      if (Array.isArray(v)) groups[k] = v as PersonRow[];
    }
  }

  await Promise.all([
    prisma.tenantState.upsert({
      where: { tenantId },
      create: { tenantId, data: rest as unknown as runtime.InputJsonValue },
      update: { data: rest as unknown as runtime.InputJsonValue },
    }),
    syncAssessmentsTo(tenantId, assessments ?? []),
    syncStakeholdersTo(tenantId, groups),
    syncKeySystemsTo(tenantId, keySystems),
    syncVendorsTo(tenantId, vendors),
    syncTicketsTo(tenantId, tickets ?? []),
    syncTasksTo(tenantId, tasks ?? []),
    syncIncidentsTo(tenantId, incidentLog ?? [], activeIncident ?? null),
    syncForensicLogsTo(tenantId, forensicLogs ?? []),
    syncTabletopsTo(tenantId, tabletopExercises ?? []),
    syncLessonsTo(tenantId, lessons ?? []),
    syncPoliciesTo(tenantId, policiesGen ?? []),
  ]);
  return { ok: true };
}

// ─── per-module sync helpers ─────────────────────────────────────────

async function syncAssessmentsTo(tenantId: string, list: AssessmentRow[]): Promise<void> {
  const incoming = [...new Set(list.map((a) => String(a.id)))];
  await prisma.assessment.deleteMany({
    where: incoming.length === 0 ? { tenantId } : { tenantId, NOT: { id: { in: incoming } } },
  });
  await Promise.all(list.map((a) => {
    const id = String(a.id);
    const data = {
      tenantId, framework: a.framework ?? "NIST CSF 2.0", orgName: a.orgName ?? "",
      date: a.date ?? "", score: Number.isFinite(a.score) ? a.score : 0,
      answers: a.answers as runtime.InputJsonValue,
      fnScores: (a.fnScores ?? []) as runtime.InputJsonValue,
      catScores: (a.catScores ?? []) as runtime.InputJsonValue,
      warnings: (a.warnings ?? []) as runtime.InputJsonValue,
      recs: (a.recs ?? []) as runtime.InputJsonValue,
      hitlist: a.hitlist == null ? undefined : (a.hitlist as runtime.InputJsonValue),
    };
    return prisma.assessment.upsert({ where: { id }, create: { id, ...data }, update: data });
  }));
}

async function syncStakeholdersTo(tenantId: string, groups: Record<string, PersonRow[]>): Promise<void> {
  const flat: Array<PersonRow & { groupKey: string }> = [];
  for (const [groupKey, people] of Object.entries(groups)) {
    for (const p of people) flat.push({ ...p, groupKey });
  }
  const incoming = [...new Set(flat.map((p) => String(p.id)))];
  await prisma.stakeholder.deleteMany({
    where: incoming.length === 0 ? { tenantId } : { tenantId, NOT: { id: { in: incoming } } },
  });
  await Promise.all(flat.map((p) => {
    const id = String(p.id);
    // `update` intentionally omits invite-tracking fields so client-driven
    // edits (firstName, email, etc.) cannot clobber a previously-issued invite.
    // Only inviteStakeholder() writes those columns.
    const updateData = {
      groupKey: p.groupKey,
      firstName: p.firstName, lastName: p.lastName,
      title: p.title || null, responsibilities: p.responsibilities || null,
      email: p.email || null, cell: p.cell || null,
    };
    const createData = {
      ...updateData, tenantId,
      userId: p.userId ?? null,
      invitedAt: p.invitedAt ? new Date(p.invitedAt) : null,
      inviteStatus: p.inviteStatus ?? null,
      appRole: p.appRole ?? null,
    };
    return prisma.stakeholder.upsert({ where: { id }, create: { id, ...createData }, update: updateData });
  }));
}

async function syncKeySystemsTo(tenantId: string, list: KeySystemRow[]): Promise<void> {
  const incoming = [...new Set(list.map((s) => String(s.id)))];
  await prisma.keySystem.deleteMany({
    where: incoming.length === 0 ? { tenantId } : { tenantId, NOT: { id: { in: incoming } } },
  });
  await Promise.all(list.map((s) => {
    const id = String(s.id);
    const data = {
      tenantId, systemName: s.systemName, category: s.category, criticality: s.criticality,
      owner: s.owner || null, ownerEmail: s.ownerEmail || null, ownerCell: s.ownerCell || null,
      notes: s.notes || null,
    };
    return prisma.keySystem.upsert({ where: { id }, create: { id, ...data }, update: data });
  }));
}

async function syncVendorsTo(tenantId: string, list: VendorRow[]): Promise<void> {
  const incoming = [...new Set(list.map((v) => String(v.id)))];
  await prisma.vendor.deleteMany({
    where: incoming.length === 0 ? { tenantId } : { tenantId, NOT: { id: { in: incoming } } },
  });
  await Promise.all(list.map((v) => {
    const id = String(v.id);
    const data = {
      tenantId, category: v.category, vendorName: v.vendorName,
      productName: v.productName || null, accountId: v.accountId || null,
      contactName: v.contactName || null, contactEmail: v.contactEmail || null,
      contactPhone: v.contactPhone || null, supportPortal: v.supportPortal || null,
      supportTier: v.supportTier || null, slaResponse: v.slaResponse || null,
      isPrimary: v.isPrimary ?? false, notes: v.notes || null,
    };
    return prisma.vendor.upsert({ where: { id }, create: { id, ...data }, update: data });
  }));
}

async function syncTicketsTo(tenantId: string, list: TicketRow[]): Promise<void> {
  const incoming = [...new Set(list.map((t) => String(t.id)))];
  await prisma.ticket.deleteMany({
    where: incoming.length === 0 ? { tenantId } : { tenantId, NOT: { id: { in: incoming } } },
  });
  await Promise.all(list.map((t) => {
    const id = String(t.id);
    const data = {
      tenantId, title: t.title, severity: t.severity, status: t.status,
      phase: t.phase || null, assignee: t.assignee || null, details: t.details || null,
      actions: (t.actions ?? []) as runtime.InputJsonValue, created: t.created || null,
      parentId: t.parentId == null ? null : String(t.parentId),
      childIds: t.childIds ? (t.childIds.map(String) as unknown as runtime.InputJsonValue) : undefined,
      ticketType: t.ticketType || null,
      incidentId: t.incidentId || null, incidentTitle: t.incidentTitle || null,
      threatIntelId: t.threatIntelId || null, threatIntelTitle: t.threatIntelTitle || null,
      applicability: t.applicability || null, verifiedExploit: t.verifiedExploit ?? null,
      playbookId: t.playbookId || null, subtaskCount: t.subtaskCount ?? null,
    };
    return prisma.ticket.upsert({ where: { id }, create: { id, ...data }, update: data });
  }));
}

async function syncTasksTo(tenantId: string, list: TaskRow[]): Promise<void> {
  const incoming = [...new Set(list.map((t) => String(t.id)))];
  await prisma.task.deleteMany({
    where: incoming.length === 0 ? { tenantId } : { tenantId, NOT: { id: { in: incoming } } },
  });
  await Promise.all(list.map((t) => {
    const id = String(t.id);
    const data = {
      tenantId, title: t.title, priority: t.priority, status: t.status,
      assignee: t.assignee || null, source: t.source || null,
      updates: (t.updates ?? []) as runtime.InputJsonValue, created: t.created || null,
      irPhase: t.irPhase || null, incidentId: t.incidentId || null,
      ticketId: t.ticketId == null ? null : String(t.ticketId),
    };
    return prisma.task.upsert({ where: { id }, create: { id, ...data }, update: data });
  }));
}

async function syncIncidentsTo(
  tenantId: string,
  log: IncidentLogRow[],
  activeIncident: Record<string, unknown> | null,
): Promise<void> {
  // The incidentLog is the source of truth for which incidents exist.
  // activeIncident, if set, contains the full data for the row matching its id.
  const activeId = activeIncident && typeof activeIncident.id === "string" ? activeIncident.id : null;
  const incoming = [...new Set(log.map((e) => e.incidentId))];
  await prisma.incident.deleteMany({
    where: incoming.length === 0 ? { tenantId } : { tenantId, NOT: { id: { in: incoming } } },
  });
  await Promise.all(log.map((e) => {
    const id = e.incidentId;
    const isActive = activeId === id;
    const baseData = {
      tenantId,
      title: e.title,
      severity: e.severity,
      status: e.status,
      declaredAt: e.declaredAt,
      closedAt: e.closedAt ?? null,
      masterTicketId: e.masterTicketId ?? null,
    };
    // For non-active log entries, mirror startTime into data so MTTD survives
    // round-trips even when the full activeIncident record isn't present.
    const summaryData = e.startTime ? { startTime: e.startTime } : null;
    return prisma.incident.upsert({
      where: { id },
      create: {
        id, ...baseData,
        data: isActive
          ? (activeIncident as unknown as runtime.InputJsonValue)
          : (summaryData as unknown as runtime.InputJsonValue | undefined),
      },
      update: {
        ...baseData,
        // Only overwrite data when this row is the active incident; otherwise
        // leave existing data column untouched (preserved on close).
        ...(isActive ? { data: activeIncident as unknown as runtime.InputJsonValue } : {}),
      },
    });
  }));
}

async function syncForensicLogsTo(tenantId: string, list: ForensicLogRow[]): Promise<void> {
  const incoming = [...new Set(list.map((f) => String(f.id)))];
  await prisma.forensicLog.deleteMany({
    where: incoming.length === 0 ? { tenantId } : { tenantId, NOT: { id: { in: incoming } } },
  });
  await Promise.all(list.map((f) => {
    const id = String(f.id);
    const { id: _id, title, classification, incidentId, ...rest } = f as ForensicLogRow & { [k: string]: unknown };
    void _id;
    const baseData = {
      tenantId, title, classification,
      incidentId: incidentId || null,
      data: rest as unknown as runtime.InputJsonValue,
    };
    return prisma.forensicLog.upsert({ where: { id }, create: { id, ...baseData }, update: baseData });
  }));
}

async function syncTabletopsTo(tenantId: string, list: TabletopRow[]): Promise<void> {
  const incoming = [...new Set(list.map((t) => String(t.id)))];
  await prisma.tabletop.deleteMany({
    where: incoming.length === 0 ? { tenantId } : { tenantId, NOT: { id: { in: incoming } } },
  });
  await Promise.all(list.map((t) => {
    const id = String(t.id);
    const { id: _id, title, status, date, rating, ...rest } = t as TabletopRow & { [k: string]: unknown };
    void _id;
    const baseData = {
      tenantId, title,
      status: status ?? "Scheduled",
      date: date ?? "",
      rating: rating ?? null,
      data: rest as unknown as runtime.InputJsonValue,
    };
    return prisma.tabletop.upsert({ where: { id }, create: { id, ...baseData }, update: baseData });
  }));
}

async function syncLessonsTo(tenantId: string, list: LessonRow[]): Promise<void> {
  // Lessons don't have stable ids in the TS shape — derive one from the text + date.
  const withIds = list.map((l) => ({
    ...l,
    id: hashLessonId(tenantId, l),
  }));
  const incoming = [...new Set(withIds.map((l) => l.id))];
  await prisma.lesson.deleteMany({
    where: incoming.length === 0 ? { tenantId } : { tenantId, NOT: { id: { in: incoming } } },
  });
  await Promise.all(withIds.map((l) => {
    const data = {
      tenantId,
      text: l.text,
      src: l.src || null,
      date: l.date || null,
    };
    return prisma.lesson.upsert({ where: { id: l.id }, create: { id: l.id, ...data }, update: data });
  }));
}

function hashLessonId(tenantId: string, l: LessonRow): string {
  // Deterministic short hash so the same lesson maps to the same row across saves
  const s = `${tenantId}|${l.text}|${l.date}|${l.src}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return `lesson_${Math.abs(h).toString(36)}_${s.length}`;
}

async function syncPoliciesTo(tenantId: string, templateIds: string[]): Promise<void> {
  const unique = [...new Set(templateIds)];
  const ids = unique.map((tpl) => `${tenantId}:${tpl}`);
  await prisma.policy.deleteMany({
    where: ids.length === 0 ? { tenantId } : { tenantId, NOT: { id: { in: ids } } },
  });
  await Promise.all(unique.map((templateId) => {
    const id = `${tenantId}:${templateId}`;
    return prisma.policy.upsert({
      where: { id },
      create: { id, tenantId, templateId },
      update: { templateId },
    });
  }));
}

// ─── ancillary actions ────────────────────────────────────────────────

export async function getTenantContext(): Promise<{
  tenantId: string;
  tenantName: string;
  isDemoTenant: boolean;
  userRole: string;
  userEmail: string;
  isImpersonating: boolean;
  homeTenantId: string;
  homeTenantName: string;
  availableTenants: { id: string; name: string; slug: string; isDemoTenant: boolean }[];
}> {
  const session = await requireUser();
  const homeTenantId = session.user!.tenantId;
  const activeTenantId = session.activeTenantId ?? homeTenantId;

  const [activeTenant, homeTenant] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: activeTenantId },
      select: { id: true, name: true, isDemoTenant: true },
    }),
    activeTenantId === homeTenantId
      ? null
      : prisma.tenant.findUnique({ where: { id: homeTenantId }, select: { id: true, name: true } }),
  ]);

  // For super_admins: list every tenant they can jump into
  let availableTenants: { id: string; name: string; slug: string; isDemoTenant: boolean }[] = [];
  if (session.user!.role === "super_admin") {
    availableTenants = await prisma.tenant.findMany({
      orderBy: [{ isDemoTenant: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, isDemoTenant: true },
    });
  }

  return {
    tenantId: activeTenantId,
    tenantName: activeTenant?.name ?? "—",
    isDemoTenant: activeTenant?.isDemoTenant ?? false,
    userRole: session.user!.role,
    userEmail: session.email,
    isImpersonating: session.isImpersonating,
    homeTenantId,
    homeTenantName: homeTenant?.name ?? activeTenant?.name ?? "—",
    availableTenants,
  };
}

/** Switch the super_admin's active view tenant. Pass null to return home. */
export async function setViewTenant(tenantId: string | null): Promise<{ ok: boolean; error?: string }> {
  const session = await requireUser();
  if (session.user!.role !== "super_admin") return { ok: false, error: "Forbidden" };

  const cookieStore = await import("next/headers").then((m) => m.cookies()).then((c) => c);
  const COOKIE = "sentry_view_tenant";
  if (!tenantId || tenantId === session.user!.tenantId) {
    cookieStore.delete(COOKIE);
  } else {
    const target = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!target) return { ok: false, error: "Tenant not found" };
    cookieStore.set(COOKIE, tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }
  revalidatePath("/app");
  return { ok: true };
}

// ─── Notification email send ────────────────────────────────────────

export interface SendNotificationEmailInput {
  to: string[];
  subject: string;
  body: string;
  /** Classification banner — prepended to subject and surfaced in HTML header. */
  classification?: string;
  /** Privileged & Confidential? Adds a stronger banner. */
  privileged?: boolean;
}

export type SendNotificationEmailResult =
  | { ok: true; id: string; recipientCount: number }
  | { ok: false; error: string; reason?: "not_configured" | "send_failed" | "invalid_input" | "no_recipients" };

/** Sends an incident-notification email via Resend. Returns a structured
 *  result the client can render. Auth-gated to the signed-in user. */
export async function sendNotificationEmail(input: SendNotificationEmailInput): Promise<SendNotificationEmailResult> {
  await requireUser();

  if (!emailConfigured()) {
    return { ok: false, reason: "not_configured", error: "Email is not configured. Set RESEND_API_KEY + EMAIL_FROM in env." };
  }
  const recipients = (input.to ?? []).map((r) => r.trim()).filter((r) => r && r.includes("@"));
  if (recipients.length === 0) return { ok: false, reason: "no_recipients", error: "No valid recipients." };
  if (!input.subject?.trim()) return { ok: false, reason: "invalid_input", error: "Subject is required." };
  if (!input.body?.trim()) return { ok: false, reason: "invalid_input", error: "Body is required." };

  const subject = input.classification
    ? `[${input.classification.toUpperCase()}] ${input.subject}`
    : input.subject;

  const html = renderNotificationHtml(input.body, input.classification, input.privileged ?? false);

  try {
    const result = await retry(async () => {
      const r = await sendEmail({
        to: recipients,
        subject,
        text: input.body,
        html,
        tags: [{ name: "module", value: "notifications" }],
      });
      if (!r.ok) throw Object.assign(new Error(r.reason === "not_configured" ? "not_configured" : r.error), { reason: r.reason });
      return r;
    });
    return { ok: true, id: result.id, recipientCount: recipients.length };
  } catch (err) {
    const e = err as Error & { reason?: string };
    return { ok: false, reason: (e.reason as "not_configured" | "send_failed") ?? "send_failed", error: e.message };
  }
}

/** Whether email delivery is configured in this deployment. Surfaced to
 *  the client so it can hide or label the "Send via Email" button. */
export async function isEmailConfigured(): Promise<boolean> {
  return emailConfigured();
}

// ─── Pen-test request notification ──────────────────────────────────

const DARK_ROCK_IR_DESK = "IncidentResponse@darkrocklabs.com";

export interface PenTestNotifyInput {
  testType: string;
  orgName: string;
  contactEmail: string;
  contactName?: string;
  formData: Record<string, string>;
  notes?: string;
  requestId: string | number;
}

export async function notifyPenTestSubmitted(input: PenTestNotifyInput): Promise<SendNotificationEmailResult> {
  await requireUser();
  if (!emailConfigured()) {
    return { ok: false, reason: "not_configured", error: "Email is not configured." };
  }

  const lines: string[] = [];
  lines.push(`PEN TEST REQUEST — ${input.testType}`);
  lines.push("━".repeat(60));
  lines.push(`Organization:  ${input.orgName}`);
  if (input.contactName) lines.push(`Contact:       ${input.contactName}`);
  lines.push(`Contact email: ${input.contactEmail}`);
  lines.push(`Request ID:    PT-${input.requestId}`);
  lines.push(`Submitted:     ${new Date().toLocaleString()}`);
  lines.push("");
  lines.push("SCOPE & DETAILS");
  lines.push("─".repeat(60));
  for (const [k, v] of Object.entries(input.formData)) {
    if (!v) continue;
    lines.push(`${k}:`.padEnd(24) + String(v).slice(0, 200));
  }
  if (input.notes) {
    lines.push("");
    lines.push("NOTES");
    lines.push("─".repeat(60));
    lines.push(input.notes);
  }
  lines.push("");
  lines.push("Reply to the contact above to start scoping. Track in Sentry → Pen Testing.");

  const body = lines.join("\n");

  return sendNotificationEmail({
    to: [DARK_ROCK_IR_DESK, input.contactEmail].filter(Boolean),
    subject: `Pen Test Request — ${input.testType} — ${input.orgName}`,
    body,
    classification: "Confidential",
  });
}

// ─── Assessment report email ────────────────────────────────────────

export interface AssessmentEmailInput {
  to: string[];
  orgName: string;
  date: string;
  score: number;
  reportText: string;
}

export async function emailAssessmentReport(input: AssessmentEmailInput): Promise<SendNotificationEmailResult> {
  await requireUser();
  if (!emailConfigured()) return { ok: false, reason: "not_configured", error: "Email is not configured." };

  const subject = `Cyber Resilience Assessment — ${input.orgName} — Score ${input.score}/100`;
  const body = input.reportText;
  return sendNotificationEmail({
    to: input.to,
    subject,
    body,
    classification: "Confidential",
  });
}

function renderNotificationHtml(body: string, classification?: string, privileged = false): string {
  const banner = privileged
    ? `<div style="background:#7f1d1d;color:#fef2f2;padding:10px 14px;font-family:Figtree,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;border-radius:4px 4px 0 0">PRIVILEGED &amp; CONFIDENTIAL — ATTORNEY-CLIENT WORK PRODUCT</div>`
    : classification
      ? `<div style="background:#0F1623;color:#33C4B8;padding:10px 14px;font-family:Figtree,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;border-radius:4px 4px 0 0">${escapeHtml(classification)}</div>`
      : "";

  const escapedBody = escapeHtml(body);
  return [
    `<div style="background:#F7F8FA;padding:24px;font-family:Figtree,system-ui,sans-serif">`,
    `<div style="max-width:680px;margin:0 auto;background:#FFFFFF;border:1px solid #D1D9E6;border-radius:6px;overflow:hidden">`,
    banner,
    `<div style="padding:20px 24px">`,
    `<pre style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;font-size:13px;line-height:1.55;color:#1A202C;margin:0">${escapedBody}</pre>`,
    `</div>`,
    `<div style="padding:14px 24px;border-top:1px solid #E2E7EE;color:#718096;font-size:11px;line-height:1.5">`,
    `Sent by Sentry by Dark Rock Labs &middot; This message may contain confidential information. If received in error, delete and notify the sender.`,
    `</div>`,
    `</div>`,
    `</div>`,
  ].join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Stakeholder → Sentry invite ─────────────────────────────────────
//
// Sends an invite email via Supabase Auth, creates a User row in the
// active tenant, and links the resulting userId back onto the Stakeholder.
// Idempotent: re-inviting an already-invited stakeholder resends the magic-link.

export interface InviteStakeholderInput {
  stakeholderId: string | number;
  /** Override the recommendation if the admin wants a different role. */
  role?: UserRole;
}

export type InviteStakeholderResult =
  | { ok: true; userId: string; email: string; alreadyExisted: boolean }
  | { ok: false; error: string };

export async function inviteStakeholder(input: InviteStakeholderInput): Promise<InviteStakeholderResult> {
  const session = await requireUser();
  const tenantId = session.activeTenantId ?? session.user!.tenantId;

  // Only tenant admins and super_admins can invite stakeholders.
  const callerRole = session.user!.role;
  if (callerRole !== "tenant_admin" && callerRole !== "super_admin") {
    return { ok: false, error: "Only tenant admins can invite stakeholders." };
  }

  const stakeholderIdStr = String(input.stakeholderId);
  const stakeholder = await prisma.stakeholder.findFirst({
    where: { id: stakeholderIdStr, tenantId },
  });
  if (!stakeholder) return { ok: false, error: "Stakeholder not found." };
  if (!stakeholder.email) return { ok: false, error: "Stakeholder has no email address. Add one before inviting." };

  // Decide role: caller override first, then stakeholder's stored role, then recommendation.
  const appRole: UserRole = input.role ?? (stakeholder.appRole as UserRole | null) ?? recommendedRoleForGroup(stakeholder.groupKey).role;
  const prismaRole = appRoleToPrismaRole(appRole);
  const fullName = `${stakeholder.firstName} ${stakeholder.lastName}`.trim();
  const email = stakeholder.email.toLowerCase();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/callback?next=/app`;

  const supabase = createServiceRoleClient();

  // Find or create auth user
  let authUserId: string;
  let alreadyExisted = false;
  try {
    const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = existing?.users.find((u) => u.email?.toLowerCase() === email);
    if (found) {
      authUserId = found.id;
      alreadyExisted = true;
      await retry(async () => {
        const { error } = await supabase.auth.admin.generateLink({
          type: "magiclink", email, options: { redirectTo },
        });
        if (error) throw Object.assign(new Error(error.message), { status: error.status });
      });
    } else {
      const created = await retry(async () => {
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: { full_name: fullName, invited_as: appRole, source: "stakeholder" },
          redirectTo,
        });
        if (error || !data.user) throw Object.assign(new Error(error?.message ?? "createUser failed"), { status: error?.status });
        return data.user.id;
      });
      authUserId = created;
    }
  } catch (err) {
    return { ok: false, error: `Failed to send invite email: ${(err as Error).message}` };
  }

  // Upsert the User row in this tenant
  const existingUser = await prisma.user.findUnique({ where: { id: authUserId } });
  if (existingUser) {
    if (existingUser.tenantId !== tenantId) {
      return { ok: false, error: "This email is already a Sentry user in another tenant. Contact support to transfer." };
    }
    await prisma.user.update({
      where: { id: authUserId },
      data: { fullName: fullName || existingUser.fullName, role: prismaRole, appRole, invitedAt: new Date() },
    });
  } else {
    await prisma.user.create({
      data: {
        id: authUserId,
        email,
        fullName: fullName || null,
        role: prismaRole,
        appRole,
        tenantId,
        invitedBy: session.authId,
        invitedAt: new Date(),
      },
    });
  }

  // Link back onto the Stakeholder row
  await prisma.stakeholder.update({
    where: { id: stakeholderIdStr },
    data: { userId: authUserId, invitedAt: new Date(), inviteStatus: "invited", appRole },
  });

  revalidatePath("/app");
  return { ok: true, userId: authUserId, email, alreadyExisted };
}

// ─── Add team member directly (Access Module) ────────────────────────
//
// Sister action to inviteStakeholder, but for users added via the Access
// Module's "Add Team Member" flow (no underlying Stakeholder row).

export interface AddTeamMemberInput {
  email: string;
  fullName: string;
  role: UserRole;
}

export async function addTeamMemberAction(input: AddTeamMemberInput): Promise<InviteStakeholderResult> {
  const session = await requireUser();
  const tenantId = session.activeTenantId ?? session.user!.tenantId;
  const callerRole = session.user!.role;
  if (callerRole !== "tenant_admin" && callerRole !== "super_admin") {
    return { ok: false, error: "Only tenant admins can add team members." };
  }
  const email = input.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const prismaRole = appRoleToPrismaRole(input.role);
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/callback?next=/app`;
  const supabase = createServiceRoleClient();

  let authUserId: string;
  let alreadyExisted = false;
  try {
    const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = existing?.users.find((u) => u.email?.toLowerCase() === email);
    if (found) {
      authUserId = found.id;
      alreadyExisted = true;
      await retry(async () => {
        const { error } = await supabase.auth.admin.generateLink({
          type: "magiclink", email, options: { redirectTo },
        });
        if (error) throw Object.assign(new Error(error.message), { status: error.status });
      });
    } else {
      const created = await retry(async () => {
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: { full_name: input.fullName, invited_as: input.role, source: "team" },
          redirectTo,
        });
        if (error || !data.user) throw Object.assign(new Error(error?.message ?? "createUser failed"), { status: error?.status });
        return data.user.id;
      });
      authUserId = created;
    }
  } catch (err) {
    return { ok: false, error: `Failed to send invite email: ${(err as Error).message}` };
  }

  const existingUser = await prisma.user.findUnique({ where: { id: authUserId } });
  if (existingUser) {
    if (existingUser.tenantId !== tenantId) {
      return { ok: false, error: "This email is already a Sentry user in another tenant." };
    }
    await prisma.user.update({
      where: { id: authUserId },
      data: { fullName: input.fullName || existingUser.fullName, role: prismaRole, appRole: input.role, invitedAt: new Date() },
    });
  } else {
    await prisma.user.create({
      data: {
        id: authUserId, email,
        fullName: input.fullName || null,
        role: prismaRole, appRole: input.role,
        tenantId,
        invitedBy: session.authId,
        invitedAt: new Date(),
      },
    });
  }

  revalidatePath("/app");
  return { ok: true, userId: authUserId, email, alreadyExisted };
}

export async function clearTenantState(): Promise<{ ok: boolean }> {
  const session = await requireUser();
  const tenantId = session.activeTenantId ?? session.user!.tenantId;
  await Promise.all([
    prisma.tenantState.delete({ where: { tenantId } }).catch(() => {}),
    prisma.assessment.deleteMany({ where: { tenantId } }),
    prisma.stakeholder.deleteMany({ where: { tenantId } }),
    prisma.keySystem.deleteMany({ where: { tenantId } }),
    prisma.vendor.deleteMany({ where: { tenantId } }),
    prisma.ticket.deleteMany({ where: { tenantId } }),
    prisma.task.deleteMany({ where: { tenantId } }),
    prisma.incident.deleteMany({ where: { tenantId } }),
    prisma.forensicLog.deleteMany({ where: { tenantId } }),
    prisma.tabletop.deleteMany({ where: { tenantId } }),
    prisma.lesson.deleteMany({ where: { tenantId } }),
    prisma.policy.deleteMany({ where: { tenantId } }),
  ]);
  revalidatePath("/app");
  return { ok: true };
}
