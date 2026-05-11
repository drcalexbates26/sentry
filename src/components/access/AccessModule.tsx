"use client";

import { useEffect, useMemo, useState, useTransition, useCallback } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card, Input, Select, SectionHeader, useModal } from "@/components/ui";
import { ROLE_DEFS, PLATFORM_ROLES, getRoleDef, getRoleColor } from "@/data/rbac";
import { STAKEHOLDER_GROUPS, INTERNAL_GROUPS, EXTERNAL_GROUPS } from "@/data/stakeholder-groups";
import { recommendedRoleForGroup } from "@/data/role-recommendations";
import { ACCESS_ACTIONS, type AccessActionId } from "@/data/access-actions";
import {
  addTeamMemberAction, listTeamMembers, updateUserAccess, deleteUserAccess,
  listAccessActivity,
  type TeamMemberDTO, type AccessActivityDTO,
} from "@/app/app/_actions";
import type { StakeholderPerson } from "@/types/stakeholder";
import type { UserRole } from "@/store";

type SubTab = "team" | "roles" | "groups" | "activity";

const SUBNAV: { key: SubTab; label: string; desc: string }[] = [
  { key: "team",     label: "Team Members",      desc: "Users with platform access" },
  { key: "roles",    label: "Roles & Access",    desc: "RBAC tier definitions and members" },
  { key: "groups",   label: "Stakeholder Groups", desc: "Recommended access per group" },
  { key: "activity", label: "Activity Log",      desc: "Audit trail of access events" },
];

export function AccessModule() {
  const { stakeholders, currentUserRole } = useStore();
  const colors = useColors();
  const modal = useModal();
  const [tab, setTab] = useState<SubTab>("team");
  const [team, setTeam] = useState<TeamMemberDTO[]>([]);
  const [activity, setActivity] = useState<AccessActivityDTO[]>([]);
  const [activityFilter, setActivityFilter] = useState<AccessActionId | "all">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [, startAction] = useTransition();

  const canManage = currentUserRole === "admin";

  const refreshTeam = useCallback(async () => {
    setTeam(await listTeamMembers());
  }, []);
  const refreshActivity = useCallback(async () => {
    // Hide tenant impersonation events from customer audit views — those are
    // internal SaaS operations and shouldn't show up in the tenant feed.
    // Legacy events may still exist in the database; this drops them at the
    // render layer in case any tenant carried over old entries.
    const events = await listAccessActivity({ limit: 200 });
    setActivity(events.filter((e) => e.action !== "tenant_impersonation_started" && e.action !== "tenant_impersonation_ended"));
  }, []);

  useEffect(() => {
    refreshTeam().catch(() => {});
    refreshActivity().catch(() => {});
  }, [refreshTeam, refreshActivity]);

  const handle = useCallback(<T,>(
    key: string,
    successMsg: { title: string; body: string } | null,
    fn: () => Promise<{ ok: boolean; error?: string } & T>,
  ) => {
    setBusy(key);
    startAction(async () => {
      const res = await fn();
      setBusy(null);
      if (!res.ok) {
        await modal.showAlert("Action failed", res.error ?? "Unknown error");
        return;
      }
      await Promise.all([refreshTeam(), refreshActivity()]);
      if (successMsg) await modal.showAlert(successMsg.title, successMsg.body);
    });
  }, [modal, refreshTeam, refreshActivity]);

  return (
    <div>
      <SectionHeader sub="Manage who has access to the platform, what they can do, and what they've done.">
        Access Control
      </SectionHeader>

      <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 18 }}>
        {/* Side nav */}
        <aside>
          <div style={{
            background: colors.panel,
            border: `1px solid ${colors.panelBorder}`,
            borderRadius: 10, padding: 6,
            position: "sticky", top: 12,
          }}>
            {SUBNAV.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    width: "100%", display: "block", textAlign: "left",
                    padding: "10px 12px", borderRadius: 7, marginBottom: 2,
                    background: active ? colors.teal + "1A" : "transparent",
                    border: "1px solid " + (active ? colors.teal + "55" : "transparent"),
                    color: active ? colors.teal : colors.text,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: colors.textDim, marginTop: 2 }}>{t.desc}</div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main>
          {tab === "team" && (
            <TeamMembersTab
              team={team} canManage={canManage} colors={colors} modal={modal}
              busy={busy} handle={handle}
              onAdd={() => {
                openAddMemberDialog(modal, async (data) => {
                  await new Promise<void>((resolve) => {
                    handle(
                      "addMember",
                      { title: data.alreadyExisted ? "Magic-link resent" : "Invite sent", body: `${data.email} will receive a sign-in email shortly.` },
                      async () => {
                        const res = await addTeamMemberAction({ email: data.email, fullName: data.fullName, role: data.role });
                        // Capture alreadyExisted into the closure
                        if (res.ok) Object.assign(data, { alreadyExisted: res.alreadyExisted });
                        resolve();
                        return res;
                      },
                    );
                  });
                });
              }}
            />
          )}

          {tab === "roles" && <RolesTab team={team} stakeholders={stakeholders} colors={colors} />}

          {tab === "groups" && <StakeholderGroupsTab stakeholders={stakeholders} colors={colors} />}

          {tab === "activity" && (
            <ActivityLogTab
              activity={activity} filter={activityFilter} setFilter={setActivityFilter}
              colors={colors} onRefresh={refreshActivity}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Team Members ────────────────────────────────────────────────────

function TeamMembersTab({
  team, canManage, colors, modal, busy, handle, onAdd,
}: {
  team: TeamMemberDTO[];
  canManage: boolean;
  colors: ReturnType<typeof useColors>;
  modal: ReturnType<typeof useModal>;
  busy: string | null;
  handle: <T>(key: string, msg: { title: string; body: string } | null, fn: () => Promise<{ ok: boolean; error?: string } & T>) => void;
  onAdd: () => void;
}) {
  const [editing, setEditing] = useState<TeamMemberDTO | null>(null);
  const labelFor = (appRole: string) => ROLE_DEFS.find((r) => r.role === appRole)?.label ?? appRole;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h3 style={{ color: colors.white, margin: 0, fontSize: 14, fontWeight: 700 }}>Team Members</h3>
          <p style={{ color: colors.textMuted, fontSize: 10, margin: "3px 0 0" }}>
            {team.length} user{team.length === 1 ? "" : "s"} in this tenant
          </p>
        </div>
        {canManage && <Button size="sm" onClick={onAdd}>+ Add Member</Button>}
      </div>

      {/* Header row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1.4fr 1.2fr 0.8fr 0.7fr 0.6fr",
        gap: 8, padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}`,
      }}>
        {["Name", "Email", "Company", "Role", "Last seen", "Status"].map((h) => (
          <span key={h} style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
        ))}
      </div>

      {team.map((m) => {
        const roleColor = getRoleColor(m.appRole);
        return (
          <div key={m.userId} style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1.4fr 1.2fr 0.8fr 0.7fr 0.6fr",
            gap: 8, padding: "10px 0", borderBottom: `1px solid ${colors.panelBorder}`, alignItems: "center",
          }}>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.fullName ?? m.email}>
              <span style={{ color: colors.white, fontSize: 12, fontWeight: 600 }}>{m.fullName ?? m.email}</span>
              {m.isSelf && <span style={{ color: colors.teal, fontSize: 9, marginLeft: 6, fontWeight: 600 }}>YOU</span>}
              {m.jobTitle && <div style={{ color: colors.textDim, fontSize: 9 }}>{m.jobTitle}</div>}
            </div>
            <span style={{ color: colors.textMuted, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.email}>{m.email}</span>
            <span style={{ color: colors.text, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.company ?? ""}>
              {m.company ?? <span style={{ color: colors.textDim, fontStyle: "italic" }}>—</span>}
            </span>
            <Badge color={roleColor}>{labelFor(m.appRole)}</Badge>
            <span style={{ color: colors.textMuted, fontSize: 9 }}>
              {m.lastSeenAt ? new Date(m.lastSeenAt).toLocaleDateString() : "Never"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.active ? colors.green : colors.red }} />
                <span style={{ color: m.active ? colors.green : colors.red, fontSize: 9 }}>{m.active ? "Active" : "Disabled"}</span>
              </div>
              {canManage && !m.isSelf && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(m)}>Edit</Button>
              )}
            </div>
          </div>
        );
      })}

      {editing && (
        <EditUserDialog
          user={editing}
          colors={colors}
          modal={modal}
          busy={busy}
          handle={handle}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  );
}

function EditUserDialog({
  user, colors, modal, busy, handle, onClose,
}: {
  user: TeamMemberDTO;
  colors: ReturnType<typeof useColors>;
  modal: ReturnType<typeof useModal>;
  busy: string | null;
  handle: <T>(key: string, msg: { title: string; body: string } | null, fn: () => Promise<{ ok: boolean; error?: string } & T>) => void;
  onClose: () => void;
}) {
  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [company, setCompany] = useState(user.company ?? "");
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? "");
  const [appRole, setAppRole] = useState(user.appRole);
  const [active, setActive] = useState(user.active);

  const save = () => {
    handle(`edit:${user.userId}`, { title: "User updated", body: `Changes saved for ${user.email}.` }, () =>
      updateUserAccess({
        userId: user.userId,
        fullName: fullName.trim() || null,
        company: company.trim() || null,
        jobTitle: jobTitle.trim() || null,
        appRole: appRole as "admin" | "manager" | "analyst" | "viewer",
        active,
      }),
    );
    onClose();
  };

  const remove = async () => {
    const ok = await modal.showConfirm(
      `Permanently remove ${user.fullName ?? user.email}?`,
      "Their Supabase auth account will be deleted and they will no longer be able to sign in. The audit log entry for their actions remains.",
      "danger",
    );
    if (!ok) return;
    handle(`del:${user.userId}`, { title: "User removed", body: `${user.email} can no longer sign in.` }, () => deleteUserAccess(user.userId));
    onClose();
  };

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: colors.panel, border: `1px solid ${colors.panelBorder}`,
        borderRadius: 10, padding: "20px 24px", width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <h3 style={{ color: colors.white, margin: "0 0 6px", fontSize: 14, fontWeight: 700 }}>Edit Member</h3>
        <p style={{ color: colors.textMuted, fontSize: 11, margin: "0 0 14px" }}>{user.email} · invited {user.invitedAt ? new Date(user.invitedAt).toLocaleDateString() : "—"}</p>

        <Input label="Full Name" value={fullName} onChange={setFullName} />
        <Input label="Company / Organization" value={company} onChange={setCompany} placeholder="e.g. Acme Corp, Dark Rock Labs (MSP)" />
        <Input label="Job Title" value={jobTitle} onChange={setJobTitle} placeholder="e.g. Director of Security" />
        <Select
          label="Platform Role"
          value={appRole}
          onChange={setAppRole}
          options={PLATFORM_ROLES.map((p) => ({ value: p.value, label: p.label }))}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, color: colors.textMuted, fontSize: 11, margin: "10px 0", cursor: "pointer" }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} style={{ accentColor: colors.teal }} />
          Active — user can sign in
        </label>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <Button variant="ghost" size="sm" onClick={remove} disabled={busy?.startsWith("del:")} style={{ color: colors.red }}>
            Remove from tenant
          </Button>
          <div style={{ display: "flex", gap: 6 }}>
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={busy?.startsWith("edit:")}>Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function openAddMemberDialog(
  modal: ReturnType<typeof useModal>,
  onSubmit: (data: { email: string; fullName: string; role: UserRole; alreadyExisted?: boolean }) => Promise<void>,
) {
  const r = await modal.showPrompt(
    "Add Team Member",
    [
      { key: "name", label: "Full Name", required: true },
      { key: "email", label: "Email Address", required: true, placeholder: "user@organization.com" },
      { key: "company", label: "Company / Organization", placeholder: "Optional" },
      { key: "role", label: "Platform Role", type: "select", options: ROLE_DEFS.map((r) => r.label), defaultValue: "Analyst" },
    ],
    "The new member will receive a magic-link email to set up their account in this tenant. Company is optional.",
  );
  if (!r) return;
  const role = (ROLE_DEFS.find((d) => d.label === r.role)?.role ?? "analyst") as UserRole;
  await onSubmit({ email: r.email, fullName: r.name, role });
  // company is captured but not yet wired into addTeamMemberAction; the user
  // can fill it in via Edit after invitation lands.
}

// ─── Roles & Access ──────────────────────────────────────────────────

function RolesTab({ team, stakeholders, colors }: { team: TeamMemberDTO[]; stakeholders: ReturnType<typeof useStore.getState>["stakeholders"]; colors: ReturnType<typeof useColors> }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Card>
      <h3 style={{ color: colors.white, margin: 0, fontSize: 14, fontWeight: 700 }}>Role-Based Access Control</h3>
      <p style={{ color: colors.textMuted, fontSize: 10, margin: "3px 0 14px" }}>
        Four tiers control platform access. Higher tiers inherit the permissions of every lower tier.
      </p>

      {ROLE_DEFS.map((def) => {
        const isOpen = open === def.role;
        const members = team.filter((t) => t.appRole === def.role);
        return (
          <div key={def.role} style={{ marginBottom: 8 }}>
            <div
              onClick={() => setOpen(isOpen ? null : def.role)}
              style={{
                padding: "12px 14px", borderRadius: isOpen ? "8px 8px 0 0" : 8,
                background: colors.obsidianM, borderLeft: `3px solid ${def.color}`, cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{def.label}</span>
                  <Badge color={def.color}>{members.length} member{members.length === 1 ? "" : "s"}</Badge>
                </div>
                <span style={{ color: colors.textDim, fontSize: 9 }}>{isOpen ? "▾" : "▸"}</span>
              </div>
              <p style={{ color: colors.textMuted, fontSize: 10, margin: "6px 0 0", lineHeight: 1.4 }}>{def.desc}</p>
            </div>
            {isOpen && (
              <div style={{ padding: "12px 14px", borderRadius: "0 0 8px 8px", background: colors.panel, borderLeft: `3px solid ${def.color}`, borderTop: `1px solid ${colors.panelBorder}` }}>
                <Subsection label="Permissions" colors={colors}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {def.permissions.map((p) => (
                      <span key={p} style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        padding: "3px 8px", borderRadius: 5,
                        background: colors.obsidianM, color: colors.textMuted, fontSize: 9, fontWeight: 500,
                      }}>
                        <span style={{ color: colors.green, fontSize: 8 }}>✓</span> {p}
                      </span>
                    ))}
                  </div>
                </Subsection>

                <Subsection label="Stakeholder group access" colors={colors}>
                  {def.stakeholderAccess.length > 0 ? (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {def.stakeholderAccess.map((groupKey) => {
                        const group = STAKEHOLDER_GROUPS.find((g) => g.key === groupKey);
                        const count = ((stakeholders[groupKey] as StakeholderPerson[]) || []).length;
                        return (
                          <span key={groupKey} style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "3px 8px", borderRadius: 5,
                            background: group?.color ? group.color + "12" : colors.obsidianM,
                            color: group?.color || colors.textMuted,
                            fontSize: 9, fontWeight: 600,
                          }}>
                            {group?.icon} {group?.label || groupKey}
                            <span style={{ color: colors.textDim, fontWeight: 400 }}>({count})</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span style={{ color: colors.textDim, fontSize: 10, fontStyle: "italic" }}>No stakeholder group access at this tier.</span>
                  )}
                </Subsection>

                <Subsection label="Members" colors={colors}>
                  {members.length > 0 ? (
                    members.map((m) => (
                      <div key={m.userId} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                        <span style={{ color: colors.text, fontSize: 11 }}>
                          {m.fullName ?? m.email}
                          {m.company && <span style={{ color: colors.textDim, marginLeft: 6 }}>· {m.company}</span>}
                        </span>
                        <span style={{ color: colors.textMuted, fontSize: 10 }}>{m.email}</span>
                      </div>
                    ))
                  ) : (
                    <span style={{ color: colors.textDim, fontSize: 10, fontStyle: "italic" }}>No members assigned to this role.</span>
                  )}
                </Subsection>
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}

function Subsection({ label, colors, children }: { label: string; colors: ReturnType<typeof useColors>; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 9, color: colors.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

// ─── Stakeholder Groups (recommended access) ──────────────────────────

function StakeholderGroupsTab({ stakeholders, colors }: { stakeholders: ReturnType<typeof useStore.getState>["stakeholders"]; colors: ReturnType<typeof useColors> }) {
  const ordered = useMemo(() => [...INTERNAL_GROUPS, ...EXTERNAL_GROUPS], []);

  return (
    <Card>
      <h3 style={{ color: colors.white, margin: 0, fontSize: 14, fontWeight: 700 }}>Stakeholder Group Assignments</h3>
      <p style={{ color: colors.textMuted, fontSize: 10, margin: "3px 0 14px", maxWidth: 720, lineHeight: 1.5 }}>
        Every stakeholder group has a <strong>recommended access tier</strong> — the lowest-privilege RBAC role whose permissions cover that group's responsibilities. Invitations from the Stakeholders module pre-select this role; admins can override per-invite.
      </p>

      {ordered.map((group) => {
        const rec = recommendedRoleForGroup(group.key);
        const recRoleDef = getRoleDef(rec.role);
        const contacts = (stakeholders[group.key] as StakeholderPerson[]) || [];
        const accessibleBy = ROLE_DEFS.filter((r) => r.stakeholderAccess.includes(group.key));
        const isInternal = INTERNAL_GROUPS.some((g) => g.key === group.key);

        return (
          <div key={group.key} style={{ padding: "12px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14 }}>{group.icon}</span>
                  <span style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{group.label}</span>
                  <Badge color={isInternal ? colors.teal : colors.purple}>{isInternal ? "Internal" : "External"}</Badge>
                  <Badge color={contacts.length > 0 ? colors.green : colors.textDim}>{contacts.length} contact{contacts.length === 1 ? "" : "s"}</Badge>
                </div>
                <p style={{ color: colors.textMuted, fontSize: 10, margin: "0 0 8px", lineHeight: 1.4, maxWidth: 640 }}>{group.desc}</p>

                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 12, rowGap: 4, fontSize: 11, maxWidth: 720 }}>
                  <span style={{ color: colors.textDim, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recommended access</span>
                  <span>
                    <Badge color={recRoleDef.color}>{recRoleDef.label}</Badge>
                    <span style={{ color: colors.textMuted, fontSize: 10, marginLeft: 6 }}>{rec.rationale}</span>
                  </span>

                  <span style={{ color: colors.textDim, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Also accessible by</span>
                  <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {accessibleBy.length === 0 ? (
                      <span style={{ color: colors.textDim, fontSize: 10, fontStyle: "italic" }}>No RBAC tier currently includes this group.</span>
                    ) : (
                      accessibleBy.map((r) => <Badge key={r.role} color={r.color}>{r.label}</Badge>)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

// ─── Activity Log ────────────────────────────────────────────────────

function ActivityLogTab({
  activity, filter, setFilter, colors, onRefresh,
}: {
  activity: AccessActivityDTO[];
  filter: AccessActionId | "all";
  setFilter: (f: AccessActionId | "all") => void;
  colors: ReturnType<typeof useColors>;
  onRefresh: () => void | Promise<void>;
}) {
  const filtered = filter === "all" ? activity : activity.filter((a) => a.action === filter);
  const tone = (t: "info" | "good" | "warn" | "bad") =>
    t === "good" ? colors.green : t === "warn" ? colors.orange : t === "bad" ? colors.red : colors.blue;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ color: colors.white, margin: 0, fontSize: 14, fontWeight: 700 }}>Activity Log</h3>
          <p style={{ color: colors.textMuted, fontSize: 10, margin: "3px 0 0" }}>
            {filtered.length} of {activity.length} events · last {Math.min(200, activity.length)} retained
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as AccessActionId | "all")}
            style={{
              padding: "6px 10px", borderRadius: 6, fontSize: 11,
              background: colors.obsidianM, color: colors.text,
              border: `1px solid ${colors.panelBorder}`, outline: "none", fontFamily: "inherit",
            }}
          >
            <option value="all">All events</option>
            {Object.values(ACCESS_ACTIONS)
              .filter((a) => a.id !== "tenant_impersonation_started" && a.id !== "tenant_impersonation_ended")
              .map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => void onRefresh()}>Refresh</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 12px", color: colors.textDim, fontSize: 11 }}>
          No events match the current filter.
        </div>
      ) : (
        filtered.map((e) => {
          const meta = ACCESS_ACTIONS[e.action] ?? { label: e.action, icon: "•", tone: "info" as const, description: "" };
          const iconColor = tone(meta.tone);
          return (
            <div key={e.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: iconColor + "1F", color: iconColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>{meta.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{meta.label}</span>
                  {e.actor && (
                    <span style={{ color: colors.textMuted, fontSize: 11 }}>
                      by <span style={{ color: colors.text }}>{e.actor.name}</span>
                    </span>
                  )}
                  {e.target && e.actor?.userId !== e.target.userId && (
                    <span style={{ color: colors.textMuted, fontSize: 11 }}>
                      → <span style={{ color: colors.text }}>{e.target.name}</span> <span style={{ color: colors.textDim }}>({e.target.email})</span>
                    </span>
                  )}
                </div>
                {e.metadata && Object.keys(e.metadata).length > 0 && (
                  <div style={{ color: colors.textDim, fontSize: 10, marginTop: 3, fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
                    {renderMetadata(e.metadata)}
                  </div>
                )}
                <div style={{ color: colors.textDim, fontSize: 9, marginTop: 4 }}>
                  {new Date(e.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })
      )}
    </Card>
  );
}

function renderMetadata(meta: Record<string, unknown>): string {
  // Compact one-line summary of the most useful metadata fields.
  const parts: string[] = [];
  for (const [k, v] of Object.entries(meta)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "object" && v && "from" in v && "to" in v) {
      parts.push(`${k}: ${(v as {from: unknown}).from ?? "—"} → ${(v as {to: unknown}).to ?? "—"}`);
    } else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      parts.push(`${k}: ${v}`);
    }
  }
  return parts.join(" · ");
}
