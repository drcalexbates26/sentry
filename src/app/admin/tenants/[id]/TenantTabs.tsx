"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import {
  provisionUser, deprovisionUser, reactivateUser, updateTenantStatus, resendInviteEmail,
  listProvisioningCredentials, revealProvisioningCredential, invalidateProvisioningCredential,
  regenerateUserCredential, changeTenantPlan,
  type ProvisioningCredentialDTO,
} from "@/app/admin/_actions";
import { ROLES } from "@/app/admin/_constants";
import { PLAN_TIERS, getPlan, formatPrice, type PlanId } from "@/data/plans";

const colors = {
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  teal: "#00B4A6",
  tealLight: "#33C4B8",
  panel: "#0F1623",
  panelLight: "#151C28",
  panelBorder: "#1E293B",
  red: "#EF4444",
  green: "#22C55E",
  orange: "#F97316",
  purple: "#8B5CF6",
};

type Tenant = {
  name: string;
  slug: string;
  plan: string;
  status: string;
  seatLimit: number | null;
  trialEndsAt: string | null;
  isDemoTenant: boolean;
  activeSeats: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  organization: { industry: string | null; size: string | null; website: string | null; compliance: string[] } | null;
  counts: Record<string, number>;
};

type User = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  active: boolean;
  createdAt: string;
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "plan", label: "Plan & Billing" },
  { key: "credentials", label: "Credentials" },
  { key: "settings", label: "Settings" },
];

export function TenantTabs({ tenantId, active, tenant, users }: { tenantId: string; active: string; tenant: Tenant; users: User[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function setTab(key: string) {
    const next = new URLSearchParams(sp?.toString() || "");
    if (key === "overview") next.delete("tab"); else next.set("tab", key);
    next.delete("welcome");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <>
      <nav style={{ display: "flex", gap: 4, borderBottom: `1px solid ${colors.panelBorder}`, marginBottom: 22 }}>
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "10px 18px",
                background: "transparent",
                border: 0,
                borderBottom: `2px solid ${isActive ? colors.teal : "transparent"}`,
                color: isActive ? colors.teal : colors.textMuted,
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "Figtree, sans-serif",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {active === "overview" && <Overview tenant={tenant} />}
      {active === "users" && <UsersTab tenantId={tenantId} tenant={tenant} users={users} />}
      {active === "plan" && <PlanTab tenantId={tenantId} tenant={tenant} />}
      {active === "credentials" && <CredentialsTab tenantId={tenantId} users={users} />}
      {active === "settings" && <SettingsTab tenantId={tenantId} tenant={tenant} />}
    </>
  );
}

function Overview({ tenant }: { tenant: Tenant }) {
  const counts = tenant.counts;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <Card title="Company">
        <KV label="Name" value={tenant.name} />
        <KV label="Slug" value={tenant.slug} mono />
        <KV label="Plan" value={tenant.plan} />
        <KV label="Status" value={tenant.status} />
        <KV label="Demo" value={tenant.isDemoTenant ? "Yes" : "No"} />
        <KV label="Created" value={new Date(tenant.createdAt).toLocaleString()} />
      </Card>

      <Card title="Primary contact">
        <KV label="Name" value={tenant.contactName || "—"} />
        <KV label="Email" value={tenant.contactEmail || "—"} />
        <KV label="Phone" value={tenant.contactPhone || "—"} />
      </Card>

      <Card title="Organization profile">
        <KV label="Industry" value={tenant.organization?.industry || "—"} />
        <KV label="Size" value={tenant.organization?.size || "—"} />
        <KV label="Website" value={tenant.organization?.website || "—"} />
        <KV label="Compliance" value={tenant.organization?.compliance?.join(", ") || "—"} />
      </Card>

      <Card title="Data footprint">
        <KV label="Users" value={String(counts.users)} />
        <KV label="Assessments" value={String(counts.assessments)} />
        <KV label="Incidents" value={String(counts.incidents)} />
        <KV label="Tickets" value={String(counts.tickets)} />
        <KV label="Stakeholders" value={String(counts.stakeholders)} />
        <KV label="Vendors" value={String(counts.vendors)} />
        <KV label="Policies" value={String(counts.policies)} />
      </Card>
    </div>
  );
}

function UsersTab({ tenantId, tenant, users }: { tenantId: string; tenant: Tenant; users: User[] }) {
  const seatRemaining = tenant.seatLimit === null ? null : Math.max(0, tenant.seatLimit - tenant.activeSeats);
  const atLimit = seatRemaining !== null && seatRemaining <= 0;
  return <UsersTabBody tenantId={tenantId} users={users} atLimit={atLimit} seatRemaining={seatRemaining} seatLimit={tenant.seatLimit} activeSeats={tenant.activeSeats} />;
}

function UsersTabBody({ tenantId, users, atLimit, seatRemaining, seatLimit, activeSeats }: { tenantId: string; users: User[]; atLimit: boolean; seatRemaining: number | null; seatLimit: number | null; activeSeats: number }) {
  const [showAdd, setShowAdd] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ emailSent?: boolean; magicLink?: string; password?: string; email?: string } | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("viewer");
  const [method, setMethod] = useState<"email" | "magiclink" | "password">("email");
  const [password, setPassword] = useState(() => {
    const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let p = "";
    for (let i = 0; i < 16; i++) p += c[Math.floor(Math.random() * c.length)];
    return p;
  });

  function add() {
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.set("email", email);
    fd.set("fullName", fullName);
    fd.set("role", role);
    fd.set("method", method);
    if (method === "password") fd.set("password", password);
    startTransition(async () => {
      const r = await provisionUser(tenantId, fd);
      if (!r.ok) setError(r.error || "Failed");
      else {
        setSuccess({ emailSent: r.emailSent, magicLink: r.magicLink, password: r.password, email });
        setEmail(""); setFullName("");
      }
    });
  }

  return (
    <Card title={`Users (${users.length} · ${activeSeats}/${seatLimit === null ? "∞" : seatLimit} active)`} action={
      <button onClick={() => { setShowAdd((v) => !v); setSuccess(null); setError(null); }} style={{ ...btnPrimary, opacity: atLimit ? 0.4 : 1, cursor: atLimit ? "not-allowed" : "pointer" }} disabled={atLimit} title={atLimit ? "Seat limit reached — upgrade plan in Plan & Billing tab" : ""}>
        {showAdd ? "Cancel" : atLimit ? "Seat limit reached" : "+ Provision user"}
      </button>
    }>
      {showAdd && (
        <div style={{ background: colors.panelLight, border: `1px solid ${colors.panelBorder}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Email *">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" style={input} />
            </Field>
            <Field label="Full name">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={input} />
            </Field>
            <Field label="Role">
              <select value={role} onChange={(e) => setRole(e.target.value)} style={input}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Auth method">
              <select value={method} onChange={(e) => setMethod(e.target.value as "email" | "magiclink" | "password")} style={input}>
                <option value="email">Email invite (Supabase sends)</option>
                <option value="magiclink">Magic link (copy / share)</option>
                <option value="password">Password (hand off creds)</option>
              </select>
            </Field>
          </div>
          {method === "password" && (
            <div style={{ marginTop: 12 }}>
              <Field label="Initial password *">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="text" style={{ ...input, fontFamily: "JetBrains Mono, monospace", fontSize: 12 }} />
              </Field>
            </div>
          )}
          {error && <div style={{ color: colors.red, fontSize: 12, marginTop: 10 }}>{error}</div>}
          {success && (
            <div style={{ marginTop: 12, padding: 12, background: colors.panel, border: `1px solid ${colors.green}55`, borderRadius: 8, color: colors.text, fontSize: 12, lineHeight: 1.55 }}>
              <div style={{ color: colors.green, fontWeight: 700, marginBottom: 6 }}>✓ Provisioned</div>
              {success.emailSent && <>Email sent to <strong>{success.email}</strong>.</>}
              {success.magicLink && <div style={{ wordBreak: "break-all", fontFamily: "JetBrains Mono, monospace", fontSize: 11, marginTop: 6, color: colors.tealLight }}>{success.magicLink}</div>}
              {success.password && <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, marginTop: 6 }}>password: {success.password}</div>}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={add} disabled={pending || !email || (method === "password" && password.length < 8)} style={btnPrimary}>
              {pending ? "Provisioning…" : method === "email" ? "Send invite email" : "Add user"}
            </button>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <div style={{ padding: 16, color: colors.textDim, fontSize: 13, textAlign: "center" }}>
          No users yet.
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {users.map((u) => (
            <UserRow key={u.id} user={u} tenantId={tenantId} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function UserRow({ user, tenantId }: { user: User; tenantId: string }) {
  const [pending, startTransition] = useTransition();
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  return (
    <li style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: `1px solid ${colors.panelBorder}`, gap: 10 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: colors.text, fontSize: 13, fontWeight: 700 }}>{user.fullName || user.email}</span>
          <Tag color={roleColor(user.role)}>{user.role}</Tag>
          {!user.active && <Tag color={colors.red}>DEPROVISIONED</Tag>}
        </div>
        <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{user.email}</div>
        {resendMsg && <div style={{ color: resendMsg.startsWith("✓") ? colors.green : colors.red, fontSize: 11, marginTop: 4 }}>{resendMsg}</div>}
      </div>
      {user.active ? (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => startTransition(async () => {
              const r = await resendInviteEmail(user.id);
              setResendMsg(r.ok ? "✓ Invite email re-sent" : `✕ ${r.error || "Failed"}`);
              setTimeout(() => setResendMsg(null), 4000);
            })}
            disabled={pending}
            style={btnSecondary}
          >
            ✉ Resend
          </button>
          <button
            onClick={() => startTransition(async () => { await deprovisionUser(user.id, tenantId); })}
            disabled={pending}
            style={btnDanger}
          >
            Deprovision
          </button>
        </div>
      ) : (
        <button
          onClick={() => startTransition(async () => { await reactivateUser(user.id, tenantId); })}
          disabled={pending}
          style={btnSecondary}
        >
          Reactivate
        </button>
      )}
    </li>
  );
}

function SettingsTab({ tenantId, tenant }: { tenantId: string; tenant: Tenant }) {
  const [pending, startTransition] = useTransition();

  return (
    <Card title="Settings">
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>STATUS</div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["active", "trial", "paused", "deprovisioned"] as const).map((s) => (
            <button
              key={s}
              onClick={() => startTransition(async () => { await updateTenantStatus(tenantId, s); })}
              disabled={pending || s === tenant.status}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: s === tenant.status ? colors.teal + "1A" : colors.panelLight,
                border: `1px solid ${s === tenant.status ? colors.teal + "55" : colors.panelBorder}`,
                color: s === tenant.status ? colors.teal : colors.text,
                fontSize: 12,
                fontWeight: 600,
                cursor: s === tenant.status ? "default" : "pointer",
                fontFamily: "Figtree, sans-serif",
                textTransform: "capitalize",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ color: colors.textDim, fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
          Pausing prevents the tenant from signing in but preserves all data. Deprovisioned tenants are read-only.
        </div>
      </div>
    </Card>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: colors.text, fontSize: 14, fontWeight: 700, fontFamily: "Figtree, sans-serif" }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
      <span style={{ color: colors.textMuted, fontSize: 12 }}>{label}</span>
      <span style={{ color: colors.text, fontSize: 12, fontFamily: mono ? "JetBrains Mono, monospace" : undefined, fontWeight: 600, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ color: colors.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 6, fontFamily: "Figtree, sans-serif" }}>{label}</div>
      {children}
    </label>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700, color, background: color + "1A", border: `1px solid ${color}33`, letterSpacing: "0.06em" }}>
      {children}
    </span>
  );
}

function roleColor(role: string) {
  if (role === "super_admin") return colors.red;
  if (role === "tenant_admin") return colors.purple;
  if (role === "analyst") return colors.teal;
  return colors.textDim;
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  background: "#0A0E14",
  border: `1px solid ${colors.panelBorder}`,
  color: colors.text,
  fontSize: 13,
  fontFamily: "Source Sans 3, sans-serif",
  outline: "none",
};
const btnPrimary: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  background: colors.teal,
  color: "#0A0E14",
  fontWeight: 700,
  fontSize: 12,
  border: 0,
  cursor: "pointer",
  fontFamily: "Figtree, sans-serif",
};
const btnSecondary: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  background: colors.panelLight,
  color: colors.text,
  fontWeight: 600,
  fontSize: 12,
  border: `1px solid ${colors.panelBorder}`,
  cursor: "pointer",
  fontFamily: "Figtree, sans-serif",
};
// ─── PlanTab ──────────────────────────────────────────────────────────

function PlanTab({ tenantId, tenant }: { tenantId: string; tenant: Tenant }) {
  const tier = getPlan(tenant.plan as PlanId);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(tenant.plan as PlanId);
  const [seatLimit, setSeatLimit] = useState<string>(tenant.seatLimit === null ? "" : String(tenant.seatLimit));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const seatUsage = tenant.seatLimit === null ? null : Math.round((tenant.activeSeats / tenant.seatLimit) * 100);

  function save() {
    setError(null); setSuccess(null);
    const seatLimitN = seatLimit.trim() === "" ? undefined : parseInt(seatLimit, 10);
    if (seatLimitN !== undefined && (!Number.isFinite(seatLimitN) || seatLimitN <= 0)) {
      setError("Seat limit must be a positive integer or blank for tier default.");
      return;
    }
    startTransition(async () => {
      const r = await changeTenantPlan({ tenantId, plan: selectedPlan, seatLimit: seatLimitN ?? null });
      if (!r.ok) setError(r.error ?? "Failed to change plan.");
      else setSuccess("Plan updated.");
    });
  }

  return (
    <>
      <Card title="Current plan">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <PlanKV label="Tier" value={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: tier.color, fontWeight: 800 }}>{tier.name}</span>
              <span style={{ color: colors.textMuted, fontSize: 11 }}>· {formatPrice(tier.id)}</span>
            </span>
          } />
          <PlanKV label="Seat usage" value={
            tenant.seatLimit === null
              ? <span>{tenant.activeSeats} <span style={{ color: colors.textDim }}>/ unlimited</span></span>
              : <span style={{ color: tenant.activeSeats > tenant.seatLimit ? colors.red : colors.text }}>
                  {tenant.activeSeats} <span style={{ color: colors.textDim }}>/ {tenant.seatLimit}</span>
                  {seatUsage !== null && <span style={{ color: seatUsage > 80 ? colors.orange : colors.textMuted, fontSize: 11, marginLeft: 6 }}>({seatUsage}%)</span>}
                </span>
          } />
          <PlanKV label="Status" value={tenant.status} />
          <PlanKV label="Trial ends" value={tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString() : "—"} />
        </div>
      </Card>

      <Card title="Change plan or seat limit">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 14 }}>
          {PLAN_TIERS.map((t) => {
            const active = selectedPlan === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedPlan(t.id);
                  setSeatLimit(t.defaultSeatLimit === null ? "" : String(t.defaultSeatLimit));
                }}
                style={{
                  textAlign: "left", padding: 12, borderRadius: 10, fontFamily: "inherit",
                  background: active ? t.color + "1F" : colors.panelLight,
                  border: `1px solid ${active ? t.color : colors.panelBorder}`,
                  color: colors.text, cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ color: active ? t.color : colors.text, fontSize: 13, fontWeight: 800 }}>{t.name}</span>
                  <span style={{ color: colors.textMuted, fontSize: 10, fontWeight: 700 }}>{formatPrice(t.id)}</span>
                </div>
                <div style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {t.seatRange[1] === null ? `${t.seatRange[0]}+ seats` : `${t.seatRange[0]}–${t.seatRange[1]} seats`}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>Seat limit (blank = tier default)</label>
            <input
              type="number"
              min={1}
              value={seatLimit}
              onChange={(e) => setSeatLimit(e.target.value)}
              placeholder={getPlan(selectedPlan).defaultSeatLimit === null ? "Unlimited" : String(getPlan(selectedPlan).defaultSeatLimit)}
              style={input}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={save} disabled={pending} style={btnPrimary}>
              {pending ? "Saving…" : "Update plan"}
            </button>
          </div>
        </div>

        {error && <div style={{ marginTop: 10, padding: "10px 12px", background: colors.red + "10", border: `1px solid ${colors.red}55`, borderRadius: 6, color: colors.red, fontSize: 12 }}>{error}</div>}
        {success && <div style={{ marginTop: 10, padding: "10px 12px", background: colors.green + "10", border: `1px solid ${colors.green}55`, borderRadius: 6, color: colors.green, fontSize: 12 }}>{success}</div>}
      </Card>

      <Card title={`Tier features — ${tier.name}`}>
        <ul style={{ margin: 0, paddingLeft: 18, color: colors.textMuted, fontSize: 12, lineHeight: 1.7 }}>
          {tier.features.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </Card>
    </>
  );
}

// ─── CredentialsTab ──────────────────────────────────────────────────

function CredentialsTab({ tenantId, users }: { tenantId: string; users: User[] }) {
  const [creds, setCreds] = useState<ProvisioningCredentialDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, { value: string; kind: string }>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [regenFor, setRegenFor] = useState<string | null>(null);

  useEffect(() => {
    listProvisioningCredentials(tenantId)
      .then((rows) => setCreds(rows))
      .finally(() => setLoading(false));
  }, [tenantId]);

  function refresh() {
    listProvisioningCredentials(tenantId).then(setCreds);
  }

  function reveal(id: string) {
    setError(null);
    startTransition(async () => {
      const r = await revealProvisioningCredential(id);
      if (!r.ok) { setError(r.error ?? "Failed to reveal."); return; }
      setRevealed((p) => ({ ...p, [id]: { value: r.value!, kind: r.kind! } }));
      refresh();
    });
  }

  function invalidate(id: string) {
    setError(null);
    startTransition(async () => {
      const r = await invalidateProvisioningCredential(id);
      if (!r.ok) { setError(r.error ?? "Failed."); return; }
      setRevealed((p) => { const next = { ...p }; delete next[id]; return next; });
      refresh();
    });
  }

  function regenerate(userId: string, method: "magiclink" | "password") {
    setError(null);
    setRegenFor(userId);
    startTransition(async () => {
      const r = await regenerateUserCredential({ tenantId, userId, method });
      setRegenFor(null);
      if (!r.ok) { setError(r.error ?? "Failed."); return; }
      refresh();
    });
  }

  const active = creds.filter((c) => !c.isExpired && !c.isInvalidated);
  const inactive = creds.filter((c) => c.isExpired || c.isInvalidated);

  return (
    <>
      <Card title={`Active credentials (${active.length})`}>
        <p style={{ color: colors.textMuted, fontSize: 11, margin: "0 0 12px", lineHeight: 1.5 }}>
          Magic links and temporary passwords generated for this tenant. Each is revealable until it expires (7 days) or is invalidated. Every reveal is audit-logged.
        </p>

        {error && <div style={{ padding: "10px 12px", background: colors.red + "10", border: `1px solid ${colors.red}55`, borderRadius: 6, color: colors.red, fontSize: 12, marginBottom: 10 }}>{error}</div>}

        {loading ? (
          <div style={{ color: colors.textDim, fontSize: 12 }}>Loading…</div>
        ) : active.length === 0 ? (
          <div style={{ color: colors.textDim, fontSize: 12, textAlign: "center", padding: "20px 0" }}>
            No active credentials. Use the table below to regenerate for any user.
          </div>
        ) : (
          active.map((c) => {
            const rev = revealed[c.id];
            return (
              <div key={c.id} style={{ padding: "12px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Tag color={c.kind === "magiclink" ? colors.teal : colors.orange}>
                        {c.kind === "magiclink" ? "MAGIC LINK" : "TEMP PASSWORD"}
                      </Tag>
                      <span style={{ color: colors.text, fontSize: 12, fontWeight: 600 }}>{c.userEmail}</span>
                      <span style={{ color: colors.textDim, fontSize: 10 }}>· {c.source.replace("_", " ")}</span>
                    </div>
                    <div style={{ color: colors.textDim, fontSize: 10, marginTop: 3 }}>
                      Created {new Date(c.createdAt).toLocaleString()} by {c.createdByName ?? "—"} · expires {new Date(c.expiresAt).toLocaleString()}
                      {c.viewedAt && <> · last viewed {new Date(c.viewedAt).toLocaleString()} by {c.viewedByName ?? "—"}</>}
                    </div>
                    {rev && (
                      <div style={{ marginTop: 8, padding: 10, background: colors.panelLight, border: `1px solid ${colors.panelBorder}`, borderRadius: 6, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: colors.tealLight, wordBreak: "break-all" }}>
                        {rev.value}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {!rev ? (
                      <button onClick={() => reveal(c.id)} disabled={pending} style={btnSecondary}>Reveal</button>
                    ) : (
                      <button onClick={() => { navigator.clipboard.writeText(rev.value); }} style={btnSecondary}>Copy</button>
                    )}
                    <button onClick={() => invalidate(c.id)} disabled={pending} style={btnDanger}>Invalidate</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>

      <Card title="Regenerate credentials for a user">
        <p style={{ color: colors.textMuted, fontSize: 11, margin: "0 0 10px", lineHeight: 1.5 }}>
          Generate a fresh magic link or temporary password for any user in this tenant. Prior active credentials for that user are invalidated.
        </p>
        {users.map((u) => (
          <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${colors.panelBorder}` }}>
            <div>
              <div style={{ color: colors.text, fontSize: 12, fontWeight: 600 }}>{u.fullName ?? u.email}</div>
              <div style={{ color: colors.textDim, fontSize: 10 }}>{u.email} · {u.role} · {u.active ? "active" : "disabled"}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => regenerate(u.id, "magiclink")} disabled={pending || regenFor === u.id} style={btnSecondary}>
                {regenFor === u.id ? "…" : "New magic link"}
              </button>
              <button onClick={() => regenerate(u.id, "password")} disabled={pending || regenFor === u.id} style={btnSecondary}>
                {regenFor === u.id ? "…" : "New password"}
              </button>
            </div>
          </div>
        ))}
      </Card>

      {inactive.length > 0 && (
        <Card title={`History (${inactive.length})`}>
          {inactive.slice(0, 20).map((c) => (
            <div key={c.id} style={{ padding: "8px 0", borderBottom: `1px solid ${colors.panelBorder}`, color: colors.textDim, fontSize: 11 }}>
              <span style={{ color: colors.textMuted }}>{c.kind === "magiclink" ? "Magic link" : "Password"}</span> for {c.userEmail} · {c.isInvalidated ? "invalidated" : "expired"} {new Date(c.expiresAt).toLocaleDateString()}
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

function PlanKV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ color: colors.textDim, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ color: colors.text, fontSize: 13 }}>{value}</div>
    </div>
  );
}

const btnDanger: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  background: "transparent",
  color: colors.red,
  fontWeight: 600,
  fontSize: 12,
  border: `1px solid ${colors.red}55`,
  cursor: "pointer",
  fontFamily: "Figtree, sans-serif",
};
