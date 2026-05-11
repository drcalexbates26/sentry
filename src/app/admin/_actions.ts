"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import { buildDemoState } from "@/lib/demo-seed";
import { retry } from "@/lib/retry";
import { INDUSTRIES, ORG_SIZES, PLANS, STATUSES, ROLES } from "./_constants";
import { getPlan, type PlanId } from "@/data/plans";
import type * as runtime from "@prisma/client/runtime/client";

/** Default credential retention window. Short on purpose. */
const CREDENTIAL_TTL_DAYS = 7;
function credentialExpiry(): Date {
  return new Date(Date.now() + CREDENTIAL_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Plan-aware tenant defaults (status, trialEndsAt, seatLimit). */
function defaultsForPlan(planId: PlanId): { status: "trial" | "active"; trialEndsAt: Date | null; seatLimit: number | null } {
  const tier = getPlan(planId);
  const status: "trial" | "active" = planId === "trial" || planId === "demo" ? "trial" : "active";
  const trialEndsAt = tier.trialDurationDays
    ? new Date(Date.now() + tier.trialDurationDays * 24 * 60 * 60 * 1000)
    : null;
  return { status, trialEndsAt, seatLimit: tier.defaultSeatLimit };
}

/**
 * Persist a generated provisioning credential (magic link or temp password)
 * so super-admins can re-view it from the tenant detail page within the TTL
 * window. Replaces the old "shown once, lost forever" behavior.
 */
async function storeProvisioningCredential(input: {
  tenantId: string;
  userId: string | null;
  userEmail: string;
  kind: "magiclink" | "password";
  value: string;
  source: "tenant_created" | "manual_resend" | "user_added";
  createdByUserId: string;
  createdByName: string | null;
}): Promise<void> {
  await prisma.provisioningCredential.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      userEmail: input.userEmail,
      kind: input.kind,
      value: input.value,
      expiresAt: credentialExpiry(),
      source: input.source,
      createdByUserId: input.createdByUserId,
      createdByName: input.createdByName,
    },
  }).catch((err) => {
    // Storing credentials is best-effort — if it fails, the original flow
    // still showed them on the success page.
    console.warn("storeProvisioningCredential failed:", err);
  });
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "tenant";
}

export type CreateTenantState =
  | { ok: false; error: string }
  | { ok: true; tenantId: string; userEmail: string; emailSent?: boolean; magicLink?: string; password?: string };

export async function createTenant(_prev: CreateTenantState | null, form: FormData): Promise<CreateTenantState> {
  await requireSuperAdmin();

  const companyName = String(form.get("companyName") || "").trim();
  const slugInput = String(form.get("slug") || "").trim();
  const industry = String(form.get("industry") || "").trim();
  const size = String(form.get("size") || "").trim();
  const website = String(form.get("website") || "").trim();
  const contactName = String(form.get("contactName") || "").trim();
  const contactEmail = String(form.get("contactEmail") || "").trim().toLowerCase();
  const contactPhone = String(form.get("contactPhone") || "").trim();
  const plan = String(form.get("plan") || "trial").trim();
  const adminEmail = String(form.get("adminEmail") || "").trim().toLowerCase();
  const adminName = String(form.get("adminName") || "").trim();
  const adminPassword = String(form.get("adminPassword") || "");
  const method = String(form.get("authMethod") || "email") as "email" | "magiclink" | "password";
  const isDemo = form.get("isDemo") === "on";

  if (!companyName) return { ok: false, error: "Company name is required." };
  if (!adminEmail) return { ok: false, error: "Admin email is required." };
  if (method === "password" && (!adminPassword || adminPassword.length < 8))
    return { ok: false, error: "Admin password must be at least 8 characters." };
  if (!PLANS.includes(plan as typeof PLANS[number])) return { ok: false, error: "Invalid plan." };
  if (industry && !INDUSTRIES.includes(industry as typeof INDUSTRIES[number])) return { ok: false, error: "Invalid industry." };
  if (size && !ORG_SIZES.includes(size as typeof ORG_SIZES[number])) return { ok: false, error: "Invalid org size." };

  let slug = slugInput ? slugify(slugInput) : slugify(companyName);
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${slugify(companyName)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const auth = await provisionAuth(adminEmail, adminName, method, adminPassword || undefined, isDemo);
  if (!auth.ok) return { ok: false, error: auth.error ?? "Auth provisioning failed" };

  const tenantId = `tenant_${slug.replace(/-/g, "_")}_${Math.random().toString(36).slice(2, 6)}`;
  const planId = plan as PlanId;
  const tenantDefaults = defaultsForPlan(planId);
  // Allow the wizard to override seat limit (e.g. enterprise picks a contractual cap).
  const seatLimitOverride = (() => {
    const raw = String(form.get("seatLimit") ?? "").trim();
    if (!raw) return tenantDefaults.seatLimit;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) return tenantDefaults.seatLimit;
    return n;
  })();

  try {
    await prisma.$transaction([
      prisma.tenant.create({
        data: {
          id: tenantId,
          name: companyName,
          slug,
          status: tenantDefaults.status,
          plan: planId,
          seatLimit: seatLimitOverride,
          isDemoTenant: isDemo,
          trialEndsAt: tenantDefaults.trialEndsAt,
          contactName: contactName || null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
        },
      }),
      prisma.organization.create({
        data: {
          name: companyName,
          industry: industry || null,
          size: size || null,
          website: website || null,
          contactName: contactName || null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          tenantId,
          compliance: [],
        },
      }),
      prisma.user.upsert({
        where: { id: auth.authUserId! },
        create: {
          id: auth.authUserId!,
          email: adminEmail,
          fullName: adminName || null,
          role: "tenant_admin",
          tenantId,
          active: true,
          invitedAt: new Date(),
        },
        update: {
          tenantId,
          role: "tenant_admin",
          active: true,
          fullName: adminName || null,
          invitedAt: new Date(),
        },
      }),
    ]);
  } catch (e) {
    return { ok: false, error: `Database error: ${(e as Error).message.slice(0, 160)}` };
  }

  // Persist generated credentials so the super-admin can re-view them later.
  // This is the fix for "credentials vanish on page reload" — caller still
  // gets them in the return value so the wizard success page shows them
  // immediately, AND they're retrievable from the tenant detail page.
  const session = await requireSuperAdmin();
  if (auth.magicLink) {
    await storeProvisioningCredential({
      tenantId, userId: auth.authUserId ?? null, userEmail: adminEmail,
      kind: "magiclink", value: auth.magicLink, source: "tenant_created",
      createdByUserId: session.authId, createdByName: session.user!.fullName ?? session.email,
    });
  }
  if (auth.password) {
    await storeProvisioningCredential({
      tenantId, userId: auth.authUserId ?? null, userEmail: adminEmail,
      kind: "password", value: auth.password, source: "tenant_created",
      createdByUserId: session.authId, createdByName: session.user!.fullName ?? session.email,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/tenants");
  return {
    ok: true,
    tenantId,
    userEmail: adminEmail,
    emailSent: auth.emailSent,
    magicLink: auth.magicLink,
    password: auth.password,
  };
}

export async function provisionUser(tenantId: string, form: FormData): Promise<{ ok: boolean; error?: string; emailSent?: boolean; magicLink?: string; password?: string }> {
  const session = await requireSuperAdmin();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const fullName = String(form.get("fullName") || "").trim();
  const role = String(form.get("role") || "viewer");
  const method = String(form.get("method") || "email") as AuthMethod;
  const password = String(form.get("password") || "");
  if (!email) return { ok: false, error: "Email required" };
  if (method === "password" && (!password || password.length < 8)) return { ok: false, error: "Password must be at least 8 chars" };
  if (!ROLES.includes(role as typeof ROLES[number])) return { ok: false, error: "Invalid role" };

  // Block adding past the seat limit. Enterprise (seatLimit=null) is unlimited.
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { seatLimit: true, plan: true },
  });
  if (tenant?.seatLimit != null) {
    const currentSeats = await prisma.user.count({ where: { tenantId, active: true } });
    if (currentSeats >= tenant.seatLimit) {
      return {
        ok: false,
        error: `Seat limit reached (${currentSeats} of ${tenant.seatLimit}). Upgrade the plan in Plan & Billing or disable an inactive user before adding another.`,
      };
    }
  }

  const auth = await provisionAuth(email, fullName, method, password || undefined, false);
  if (!auth.ok) return { ok: false, error: auth.error };

  await prisma.user.upsert({
    where: { id: auth.authUserId! },
    create: { id: auth.authUserId!, email, fullName: fullName || null, role: role as typeof ROLES[number], tenantId, active: true, invitedAt: new Date() },
    update: { tenantId, role: role as typeof ROLES[number], active: true, fullName: fullName || null, invitedAt: new Date() },
  });

  // Persist generated credentials so the super-admin can re-view them.
  if (auth.magicLink) {
    await storeProvisioningCredential({
      tenantId, userId: auth.authUserId ?? null, userEmail: email,
      kind: "magiclink", value: auth.magicLink, source: "user_added",
      createdByUserId: session.authId, createdByName: session.user!.fullName ?? session.email,
    });
  }
  if (auth.password) {
    await storeProvisioningCredential({
      tenantId, userId: auth.authUserId ?? null, userEmail: email,
      kind: "password", value: auth.password, source: "user_added",
      createdByUserId: session.authId, createdByName: session.user!.fullName ?? session.email,
    });
  }

  revalidatePath(`/admin/tenants/${tenantId}`);
  return { ok: true, emailSent: auth.emailSent, magicLink: auth.magicLink, password: auth.password };
}

// ─── Provisioning credential management ─────────────────────────────
//
// Super-admins can re-view the magic links and temporary passwords that
// were generated for a tenant within a 7-day window. Every reveal is
// audit-stamped (viewedAt, viewedByUserId, viewedByName).

export interface ProvisioningCredentialDTO {
  id: string;
  userEmail: string;
  kind: "magiclink" | "password";
  source: string;
  createdByName: string | null;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  isInvalidated: boolean;
  viewedAt: string | null;
  viewedByName: string | null;
}

export async function listProvisioningCredentials(tenantId: string): Promise<ProvisioningCredentialDTO[]> {
  await requireSuperAdmin();
  const rows = await prisma.provisioningCredential.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const now = new Date();
  return rows.map((c) => ({
    id: c.id,
    userEmail: c.userEmail,
    kind: c.kind as "magiclink" | "password",
    source: c.source,
    createdByName: c.createdByName,
    createdAt: c.createdAt.toISOString(),
    expiresAt: c.expiresAt.toISOString(),
    isExpired: c.expiresAt < now,
    isInvalidated: !!c.invalidatedAt,
    viewedAt: c.viewedAt?.toISOString() ?? null,
    viewedByName: c.viewedByName,
  }));
}

/**
 * Reveal a stored credential to the requesting super-admin. Stamps the
 * reveal with timestamp + reviewer for audit. The value is returned only
 * after the row is updated, so a failed write keeps it hidden.
 */
export async function revealProvisioningCredential(credentialId: string): Promise<{ ok: boolean; value?: string; kind?: "magiclink" | "password"; userEmail?: string; error?: string }> {
  const session = await requireSuperAdmin();
  const row = await prisma.provisioningCredential.findUnique({ where: { id: credentialId } });
  if (!row) return { ok: false, error: "Credential not found." };
  if (row.invalidatedAt) return { ok: false, error: "This credential has been invalidated. Generate a new one." };
  if (row.expiresAt < new Date()) return { ok: false, error: "This credential has expired. Generate a new one." };

  await prisma.provisioningCredential.update({
    where: { id: credentialId },
    data: {
      viewedAt: new Date(),
      viewedByUserId: session.authId,
      viewedByName: session.user!.fullName ?? session.email,
    },
  });
  return { ok: true, value: row.value, kind: row.kind as "magiclink" | "password", userEmail: row.userEmail };
}

export async function invalidateProvisioningCredential(credentialId: string): Promise<{ ok: boolean; error?: string }> {
  await requireSuperAdmin();
  const row = await prisma.provisioningCredential.findUnique({ where: { id: credentialId }, select: { tenantId: true, invalidatedAt: true } });
  if (!row) return { ok: false, error: "Credential not found." };
  if (row.invalidatedAt) return { ok: true }; // idempotent
  await prisma.provisioningCredential.update({
    where: { id: credentialId },
    data: { invalidatedAt: new Date() },
  });
  revalidatePath(`/admin/tenants/${row.tenantId}`);
  return { ok: true };
}

/**
 * Regenerate a magic-link or password for an existing user. Issues a fresh
 * credential, stores it for re-view, and returns the new value.
 */
export async function regenerateUserCredential(input: { tenantId: string; userId: string; method: AuthMethod; password?: string }): Promise<{ ok: boolean; magicLink?: string; password?: string; emailSent?: boolean; error?: string }> {
  const session = await requireSuperAdmin();
  const user = await prisma.user.findFirst({ where: { id: input.userId, tenantId: input.tenantId } });
  if (!user) return { ok: false, error: "User not found in this tenant." };

  const auth = await provisionAuth(user.email, user.fullName ?? "", input.method, input.password);
  if (!auth.ok) return { ok: false, error: auth.error };

  // Invalidate the user's prior active credentials before recording the new one.
  await prisma.provisioningCredential.updateMany({
    where: { tenantId: input.tenantId, userId: user.id, invalidatedAt: null, expiresAt: { gt: new Date() } },
    data: { invalidatedAt: new Date() },
  });
  if (auth.magicLink) {
    await storeProvisioningCredential({
      tenantId: input.tenantId, userId: user.id, userEmail: user.email,
      kind: "magiclink", value: auth.magicLink, source: "manual_resend",
      createdByUserId: session.authId, createdByName: session.user!.fullName ?? session.email,
    });
  }
  if (auth.password) {
    await storeProvisioningCredential({
      tenantId: input.tenantId, userId: user.id, userEmail: user.email,
      kind: "password", value: auth.password, source: "manual_resend",
      createdByUserId: session.authId, createdByName: session.user!.fullName ?? session.email,
    });
  }
  await prisma.user.update({ where: { id: user.id }, data: { invitedAt: new Date(), active: true } });
  revalidatePath(`/admin/tenants/${input.tenantId}`);
  return { ok: true, magicLink: auth.magicLink, password: auth.password, emailSent: auth.emailSent };
}

// ─── Plan & seat management ──────────────────────────────────────────

export async function changeTenantPlan(input: { tenantId: string; plan: PlanId; seatLimit?: number | null; trialEndsAt?: string | null }): Promise<{ ok: boolean; error?: string }> {
  await requireSuperAdmin();
  if (!PLANS.includes(input.plan as typeof PLANS[number])) return { ok: false, error: "Invalid plan." };
  const tier = getPlan(input.plan);
  const seatLimit = input.seatLimit === undefined ? tier.defaultSeatLimit : input.seatLimit;
  // Validate against current active-user count if a finite limit was chosen.
  if (seatLimit !== null) {
    const currentSeats = await prisma.user.count({ where: { tenantId: input.tenantId, active: true } });
    if (currentSeats > seatLimit) {
      return { ok: false, error: `Cannot lower seat limit below current active users (${currentSeats}). Disable users first or pick a larger limit.` };
    }
  }
  const trialEndsAt = input.trialEndsAt === undefined
    ? (tier.trialDurationDays ? new Date(Date.now() + tier.trialDurationDays * 24 * 60 * 60 * 1000) : null)
    : (input.trialEndsAt ? new Date(input.trialEndsAt) : null);
  const status: "trial" | "active" = input.plan === "trial" || input.plan === "demo" ? "trial" : "active";

  await prisma.tenant.update({
    where: { id: input.tenantId },
    data: { plan: input.plan, seatLimit, trialEndsAt, status },
  });
  revalidatePath(`/admin/tenants/${input.tenantId}`);
  revalidatePath("/admin/tenants");
  return { ok: true };
}

export interface TenantMetricsDTO {
  tenantId: string;
  plan: PlanId;
  status: string;
  seatLimit: number | null;
  activeSeats: number;
  totalUsers: number;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
}

export async function getTenantMetrics(tenantId: string): Promise<TenantMetricsDTO | null> {
  await requireSuperAdmin();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, plan: true, status: true, seatLimit: true, trialEndsAt: true },
  });
  if (!tenant) return null;
  const [activeSeats, totalUsers] = await Promise.all([
    prisma.user.count({ where: { tenantId, active: true } }),
    prisma.user.count({ where: { tenantId } }),
  ]);
  const trialDaysRemaining = tenant.trialEndsAt
    ? Math.max(0, Math.ceil((tenant.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;
  return {
    tenantId: tenant.id,
    plan: tenant.plan as PlanId,
    status: tenant.status,
    seatLimit: tenant.seatLimit,
    activeSeats,
    totalUsers,
    trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
    trialDaysRemaining,
  };
}

export async function deprovisionUser(userId: string, tenantId: string): Promise<{ ok: boolean; error?: string }> {
  await requireSuperAdmin();
  const supabase = createServiceRoleClient();
  await prisma.user.update({ where: { id: userId }, data: { active: false } });
  await supabase.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { ok: true };
}

export async function reactivateUser(userId: string, tenantId: string): Promise<{ ok: boolean; error?: string }> {
  await requireSuperAdmin();
  const supabase = createServiceRoleClient();
  await prisma.user.update({ where: { id: userId }, data: { active: true } });
  await supabase.auth.admin.updateUserById(userId, { ban_duration: "none" });
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { ok: true };
}

export async function updateTenantStatus(tenantId: string, status: typeof STATUSES[number]): Promise<{ ok: boolean }> {
  await requireSuperAdmin();
  await prisma.tenant.update({ where: { id: tenantId }, data: { status } });
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { ok: true };
}

/** Wipes any demo tenant's state and reseeds with the master template's fresh fictional dataset.
 *  Writes assessments to the proper Assessment table, the rest to TenantState.data. */
export async function resetDemoTenant(tenantId: string): Promise<{ ok: boolean; error?: string }> {
  await requireSuperAdmin();
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { ok: false, error: "Tenant not found" };
  if (!tenant.isDemoTenant) return { ok: false, error: "Refusing to reset a non-demo tenant" };

  await applyDemoSeed(tenantId);
  revalidatePath(`/admin/demo`);
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { ok: true };
}

/** Apply the demo seed to a tenant: state blob to TenantState (sans assessments)
 *  and assessments to the typed Assessment table. */
async function applyDemoSeed(tenantId: string): Promise<void> {
  const seed = buildDemoState() as Record<string, unknown> & {
    assessments?: Array<Record<string, unknown>>;
    stakeholders?: Record<string, unknown>;
    tickets?: Array<Record<string, unknown>>;
    tasks?: Array<Record<string, unknown>>;
    activeIncident?: Record<string, unknown> | null;
    incidentLog?: Array<Record<string, unknown>>;
    forensicLogs?: Array<Record<string, unknown>>;
    tabletopExercises?: Array<Record<string, unknown>>;
    lessons?: Array<Record<string, unknown>>;
    policiesGen?: string[];
  };
  const {
    assessments = [], stakeholders, tickets = [], tasks = [],
    activeIncident, incidentLog = [], forensicLogs = [],
    tabletopExercises = [], lessons = [], policiesGen = [],
    ...rest
  } = seed;

  // Regenerate IDs per-call so isolated demo sessions don't collide on
  // global primary keys. Each row gets a unique counter slice.
  const idBase = Date.now() + Math.floor(Math.random() * 1_000_000);
  let counter = idBase;
  const newId = () => String(counter++);

  // ── Reshape stakeholders ──
  const stakeholderGroups: Record<string, Array<Record<string, unknown>>> = {};
  let keySystems: Array<Record<string, unknown>> = [];
  let vendors: Array<Record<string, unknown>> = [];
  if (stakeholders) {
    const { keySystems: ks, vendors: vs, ...rawGroups } = stakeholders as Record<string, unknown>;
    keySystems = ((ks ?? []) as Array<Record<string, unknown>>).map((k) => ({ ...k, id: newId() }));
    vendors = ((vs ?? []) as Array<Record<string, unknown>>).map((v) => ({ ...v, id: newId() }));
    for (const [groupKey, people] of Object.entries(rawGroups)) {
      if (Array.isArray(people)) {
        stakeholderGroups[groupKey] = (people as Array<Record<string, unknown>>).map((p) => ({ ...p, id: newId() }));
      }
    }
  }

  const freshAssessments: Array<Record<string, unknown>> = assessments.map((a) => ({ ...a, id: newId() }));
  const freshTickets: Array<Record<string, unknown>> = tickets.map((t) => ({ ...t, id: newId() }));
  const freshTasks: Array<Record<string, unknown>> = tasks.map((t) => ({ ...t, id: newId() }));
  const freshForensic: Array<Record<string, unknown>> = forensicLogs.map((f) => ({ ...f, id: newId() }));
  const freshTabletops: Array<Record<string, unknown>> = tabletopExercises.map((t) => ({ ...t, id: newId() }));

  // Incident IDs are strings (e.g. "INC-DEMO-001"); make them unique per session by appending a tenant suffix
  const incidentSuffix = tenantId.slice(-6);
  const remapIncidentId = (id: string) => `${id}-${incidentSuffix}`;
  const freshIncidents: Array<Record<string, unknown>> = incidentLog.map((e) => ({
    ...e,
    incidentId: remapIncidentId((e.incidentId as string) ?? ""),
    // masterTicketId is a denormalized hint, not an FK. Demo doesn't need a
    // real ticket pointer — the seed's tickets get fresh ids anyway.
    masterTicketId: null,
  }));
  const freshActive = activeIncident
    ? { ...activeIncident, id: remapIncidentId((activeIncident.id as string) ?? "") }
    : null;

  await prisma.$transaction([
    // JSON blob (everything else)
    prisma.tenantState.upsert({
      where: { tenantId },
      create: { tenantId, data: rest as unknown as runtime.InputJsonValue, version: 1 },
      update: { data: rest as unknown as runtime.InputJsonValue, version: { increment: 1 } },
    }),

    // Wipe existing typed-table rows for this tenant
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

    // Bulk-insert fresh rows
    prisma.assessment.createMany({
      data: freshAssessments.map((a) => ({
        id: String(a.id),
        tenantId,
        framework: (a.framework as string) ?? "NIST CSF 2.0",
        orgName: (a.orgName as string) ?? "",
        date: (a.date as string) ?? "",
        score: (a.score as number) ?? 0,
        answers: a.answers as runtime.InputJsonValue,
        fnScores: (a.fnScores ?? []) as runtime.InputJsonValue,
        catScores: (a.catScores ?? []) as runtime.InputJsonValue,
        warnings: (a.warnings ?? []) as runtime.InputJsonValue,
        recs: (a.recs ?? []) as runtime.InputJsonValue,
      })),
    }),

    prisma.stakeholder.createMany({
      data: Object.entries(stakeholderGroups).flatMap(([groupKey, people]) =>
        people.map((p) => ({
          id: String(p.id),
          tenantId,
          groupKey,
          firstName: (p.firstName as string) ?? "",
          lastName: (p.lastName as string) ?? "",
          title: (p.title as string) || null,
          responsibilities: (p.responsibilities as string) || null,
          email: (p.email as string) || null,
          cell: (p.cell as string) || null,
        }))
      ),
    }),

    prisma.keySystem.createMany({
      data: keySystems.map((k) => ({
        id: String(k.id),
        tenantId,
        systemName: (k.systemName as string) ?? "",
        category: (k.category as string) ?? "",
        criticality: (k.criticality as string) ?? "Medium",
        owner: (k.owner as string) || null,
        ownerEmail: (k.ownerEmail as string) || null,
        ownerCell: (k.ownerCell as string) || null,
        notes: (k.notes as string) || null,
      })),
    }),

    prisma.vendor.createMany({
      data: vendors.map((v) => ({
        id: String(v.id),
        tenantId,
        category: (v.category as string) ?? "",
        vendorName: (v.vendorName as string) ?? "",
        productName: (v.productName as string) || null,
        accountId: (v.accountId as string) || null,
        contactName: (v.contactName as string) || null,
        contactEmail: (v.contactEmail as string) || null,
        contactPhone: (v.contactPhone as string) || null,
        supportPortal: (v.supportPortal as string) || null,
        supportTier: (v.supportTier as string) || null,
        slaResponse: (v.slaResponse as string) || null,
        isPrimary: (v.isPrimary as boolean) ?? false,
        notes: (v.notes as string) || null,
      })),
    }),

    prisma.ticket.createMany({
      data: freshTickets.map((t) => ({
        id: String(t.id),
        tenantId,
        title: (t.title as string) ?? "",
        severity: (t.severity as string) ?? "Medium",
        status: (t.status as string) ?? "Open",
        phase: (t.phase as string) || null,
        assignee: (t.assignee as string) || null,
        details: (t.details as string) || null,
        actions: ((t.actions ?? []) as runtime.InputJsonValue),
        created: (t.created as string) || null,
        ticketType: (t.ticketType as string) || null,
        incidentId: (t.incidentId as string) || null,
        incidentTitle: (t.incidentTitle as string) || null,
        threatIntelId: (t.threatIntelId as string) || null,
        threatIntelTitle: (t.threatIntelTitle as string) || null,
      })),
    }),

    prisma.task.createMany({
      data: freshTasks.map((t) => ({
        id: String(t.id),
        tenantId,
        title: (t.title as string) ?? "",
        priority: (t.priority as string) ?? "Medium",
        status: (t.status as string) ?? "Backlog",
        assignee: (t.assignee as string) || null,
        source: (t.source as string) || null,
        updates: ((t.updates ?? []) as runtime.InputJsonValue),
        created: (t.created as string) || null,
        irPhase: (t.irPhase as string) || null,
      })),
    }),

    // Incidents — log entries plus optional active full record on the matching row.
    // Always preserve startTime in the data column so MTTD survives across saves
    // even when the incident isn't currently active.
    prisma.incident.createMany({
      data: freshIncidents.map((e) => {
        const id = e.incidentId as string;
        const isActive = freshActive && (freshActive.id as string) === id;
        const fallbackData = e.startTime ? { startTime: e.startTime } : null;
        return {
          id,
          tenantId,
          title: (e.title as string) ?? "",
          severity: (e.severity as string) ?? "High",
          status: (e.status as string) ?? "Active",
          declaredAt: (e.declaredAt as string) ?? "",
          closedAt: (e.closedAt as string) ?? null,
          masterTicketId: (e.masterTicketId as number) ?? null,
          data: isActive
            ? (freshActive as unknown as runtime.InputJsonValue)
            : (fallbackData as unknown as runtime.InputJsonValue | undefined),
        };
      }),
    }),

    prisma.forensicLog.createMany({
      data: freshForensic.map((f) => {
        const { id, title, classification, incidentId, ...rest } = f as Record<string, unknown>;
        const remapped = incidentId ? remapIncidentId(incidentId as string) : null;
        return {
          id: String(id),
          tenantId,
          title: (title as string) ?? "",
          classification: (classification as string) ?? "Internal",
          incidentId: remapped,
          data: rest as unknown as runtime.InputJsonValue,
        };
      }),
    }),

    prisma.tabletop.createMany({
      data: freshTabletops.map((t) => {
        const { id, title, status, date, rating, ...rest } = t as Record<string, unknown>;
        return {
          id: String(id),
          tenantId,
          title: (title as string) ?? "",
          status: (status as string) ?? "Scheduled",
          date: (date as string) ?? "",
          rating: (rating as number) ?? null,
          data: rest as unknown as runtime.InputJsonValue,
        };
      }),
    }),

    prisma.lesson.createMany({
      data: lessons.map((l, i) => ({
        id: `lesson_${incidentSuffix}_${i}`,
        tenantId,
        text: (l.text as string) ?? "",
        src: (l.src as string) || null,
        date: (l.date as string) || null,
      })),
    }),

    prisma.policy.createMany({
      data: policiesGen.map((templateId) => ({
        id: `${tenantId}:${templateId}`,
        tenantId,
        templateId,
      })),
    }),
  ]);
}

// ─── Auth provisioning (email / magiclink / password) ────────────
type AuthMethod = "email" | "magiclink" | "password";

interface InviteResult {
  ok: boolean;
  error?: string;
  authUserId?: string;
  emailSent?: boolean;          // true when Supabase delivered the invite email
  magicLink?: string;           // present when admin needs to manually share the link
  password?: string;            // present when admin chose the password method
}

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

/** Provisions an auth user via the chosen method. Side effects:
 *   - email     → Supabase sends an invite (new user) or magic-link (existing) email via configured SMTP
 *   - magiclink → returns a single-use link; admin shares it manually (no email sent)
 *   - password  → sets/resets a password; admin shares the credentials manually
 */
async function provisionAuth(email: string, fullName: string, method: AuthMethod, password?: string, isDemo = false): Promise<InviteResult> {
  const supabase = createServiceRoleClient();
  const redirectTo = `${appBaseUrl()}/auth/callback?next=/app`;

  // Look up existing user
  const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = existing?.users.find((u) => u.email === email);

  // ── method: email — Supabase auto-delivers via configured SMTP ──
  // Wrapped in retry to gracefully handle 429s from Supabase's rate limiter.
  if (method === "email") {
    if (found) {
      try {
        await retry(async () => {
          const { error } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: { redirectTo },
          });
          if (error) throw Object.assign(new Error(error.message), { status: error.status });
        });
        return { ok: true, authUserId: found.id, emailSent: true };
      } catch (err) {
        return { ok: false, error: `Failed to send magic-link email: ${(err as Error).message}` };
      }
    } else {
      try {
        const result = await retry(async () => {
          const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: { full_name: fullName, demo: isDemo },
            redirectTo,
          });
          if (error || !data.user) throw Object.assign(new Error(error?.message ?? "createUser failed"), { status: error?.status });
          return data.user.id;
        });
        return { ok: true, authUserId: result, emailSent: true };
      } catch (err) {
        return { ok: false, error: `Failed to send invite email: ${(err as Error).message}` };
      }
    }
  }

  // For magiclink + password methods, ensure the user exists first
  const tempPw = password || (Math.random().toString(36).slice(2, 10) + "Aa1!" + Math.random().toString(36).slice(2, 6));
  let authId: string;
  if (found) {
    authId = found.id;
    if (method === "password" && password) {
      await supabase.auth.admin.updateUserById(authId, { password });
    }
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: tempPw,
      email_confirm: true,
      user_metadata: { full_name: fullName, demo: isDemo },
    });
    if (error || !data.user) return { ok: false, error: error?.message ?? "createUser failed" };
    authId = data.user.id;
  }

  // ── method: magiclink — return link without sending ──
  if (method === "magiclink") {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    if (error || !data.properties?.action_link) return { ok: false, error: error?.message ?? "generateLink failed" };
    return { ok: true, authUserId: authId, magicLink: data.properties.action_link };
  }

  // ── method: password ──
  return { ok: true, authUserId: authId, password: password ?? tempPw };
}

/** Resends a magic-link email to an existing user AND records the new link
 *  in the provisioning credential store so admins can re-view it. */
export async function resendInviteEmail(userId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSuperAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "User not found" };
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
    options: { redirectTo: `${appBaseUrl()}/auth/callback?next=/app` },
  });
  if (error) return { ok: false, error: error.message };

  // Persist the new link so it's recoverable from the tenant detail page.
  if (data.properties?.action_link) {
    // Invalidate any earlier active credentials for this user first.
    await prisma.provisioningCredential.updateMany({
      where: { tenantId: user.tenantId, userId, invalidatedAt: null, expiresAt: { gt: new Date() } },
      data: { invalidatedAt: new Date() },
    });
    await storeProvisioningCredential({
      tenantId: user.tenantId, userId, userEmail: user.email,
      kind: "magiclink", value: data.properties.action_link, source: "manual_resend",
      createdByUserId: session.authId, createdByName: session.user!.fullName ?? session.email,
    });
  }
  await prisma.user.update({ where: { id: userId }, data: { invitedAt: new Date() } });
  revalidatePath(`/admin/tenants/${user.tenantId}`);
  revalidatePath("/admin/demo");
  return { ok: true };
}

// ─── Per-prospect isolated demo sessions ──────────────────────────
function randomSlug(prefix = "demo"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Creates a fresh isolated demo tenant for a single prospect, seeds it with
 *  the demo dataset, provisions the prospect, and returns their sign-in link/credentials. */
export async function createDemoSession(form: FormData): Promise<{
  ok: boolean;
  error?: string;
  tenantId?: string;
  email?: string;
  magicLink?: string;
  password?: string;
  emailSent?: boolean;
}> {
  await requireSuperAdmin();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const fullName = String(form.get("fullName") || "").trim();
  const company = String(form.get("company") || "").trim();
  const method = (String(form.get("method") || "email") as AuthMethod);
  const explicitPassword = String(form.get("password") || "");

  if (!email) return { ok: false, error: "Email required" };
  if (method === "password" && (!explicitPassword || explicitPassword.length < 8))
    return { ok: false, error: "Password must be at least 8 characters" };
  if (method !== "email" && method !== "magiclink" && method !== "password") return { ok: false, error: "Invalid auth method" };

  const slug = `${randomSlug()}-${Math.random().toString(36).slice(2, 5)}`;
  const tenantId = `tenant_demo_${slug.replace(/-/g, "_")}`;
  const sessionLabel = company ? `Demo · ${company}` : `Demo · ${fullName || email}`;

  // 1. Create isolated tenant + organization
  try {
    await prisma.$transaction([
      prisma.tenant.create({
        data: {
          id: tenantId,
          name: sessionLabel.slice(0, 80),
          slug: `demo-${slug}`,
          status: "active",
          plan: "demo",
          isDemoTenant: true,
          contactName: fullName || null,
          contactEmail: email,
          notes: company ? `Demo session for ${company}` : null,
        },
      }),
      prisma.organization.create({
        data: {
          name: company || "Acme Care Health (Demo)",
          industry: "Healthcare",
          size: "251-1000",
          tenantId,
          compliance: ["HIPAA", "HITRUST"],
        },
      }),
    ]);
    // 2. Apply the demo seed (state blob + Assessment rows)
    await applyDemoSeed(tenantId);
  } catch (e) {
    return { ok: false, error: `Failed to clone demo tenant: ${(e as Error).message.slice(0, 160)}` };
  }

  // 2. Provision the prospect (auth + User row)
  const auth = await provisionAuth(email, fullName, method, explicitPassword || undefined, true);
  if (!auth.ok) {
    // Roll back the tenant we just created
    await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
    return { ok: false, error: auth.error };
  }

  await prisma.user.upsert({
    where: { id: auth.authUserId! },
    create: {
      id: auth.authUserId!,
      email,
      fullName: fullName || null,
      role: "tenant_admin",
      tenantId,
      active: true,
      invitedAt: new Date(),
    },
    update: {
      tenantId,
      role: "tenant_admin",
      active: true,
      fullName: fullName || null,
      invitedAt: new Date(),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/demo");
  return {
    ok: true,
    tenantId,
    email,
    magicLink: auth.magicLink,
    password: auth.password,
    emailSent: auth.emailSent,
  };
}

/** Deletes an isolated demo session: removes the tenant (cascading all data),
 *  and removes the auth user if they had no other tenants. */
export async function deleteDemoSession(tenantId: string): Promise<{ ok: boolean; error?: string }> {
  await requireSuperAdmin();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { users: true },
  });
  if (!tenant) return { ok: false, error: "Tenant not found" };
  if (!tenant.isDemoTenant) return { ok: false, error: "Refusing to delete a non-demo tenant" };
  // Block deletion of the master template (slug "demo")
  if (tenant.slug === "demo") return { ok: false, error: "This is the master demo template; use Reset instead." };

  const supabase = createServiceRoleClient();

  // Delete auth users that exist ONLY in this tenant
  for (const u of tenant.users) {
    const others = await prisma.user.count({ where: { id: u.id, NOT: { tenantId } } });
    if (others === 0) {
      await supabase.auth.admin.deleteUser(u.id).catch(() => {});
    }
  }

  // Cascade delete: tenant → users, organization, tenantState, all data tables
  await prisma.tenant.delete({ where: { id: tenantId } });

  revalidatePath("/admin");
  revalidatePath("/admin/demo");
  return { ok: true };
}

/** Generic invite helper for the demo template (the shared tenant_demo).
 *  Kept narrow — most demos should use isolated sessions instead. */
export async function inviteToTemplate(form: FormData): Promise<InviteResult> {
  await requireSuperAdmin();
  const tenant = await prisma.tenant.findFirst({ where: { isDemoTenant: true, slug: "demo" } });
  if (!tenant) return { ok: false, error: "Master demo template not found" };

  const email = String(form.get("email") || "").trim().toLowerCase();
  const fullName = String(form.get("fullName") || "").trim();
  const method = (String(form.get("method") || "magiclink") as AuthMethod);
  const password = String(form.get("password") || "");
  if (!email) return { ok: false, error: "Email required" };

  const auth = await provisionAuth(email, fullName, method, password || undefined, true);
  if (!auth.ok) return auth;

  await prisma.user.upsert({
    where: { id: auth.authUserId! },
    create: { id: auth.authUserId!, email, fullName: fullName || null, role: "viewer", tenantId: tenant.id, active: true, invitedAt: new Date() },
    update: { tenantId: tenant.id, role: "viewer", active: true, fullName: fullName || null, invitedAt: new Date() },
  });
  revalidatePath("/admin/demo");
  return auth;
}
