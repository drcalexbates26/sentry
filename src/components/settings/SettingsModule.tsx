"use client";

import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import type { UserRole } from "@/store";
import { Badge, Card, Select, SectionHeader } from "@/components/ui";

const ROLE_DEFS: { role: UserRole; label: string; desc: string; permissions: string[] }[] = [
  {
    role: "admin", label: "Administrator", desc: "Full platform access. Can manage users, settings, RBAC assignments, and all operational modules.",
    permissions: ["All modules", "User management", "RBAC assignments", "Settings", "Integrations config", "Data export", "Incident declaration", "Policy generation"],
  },
  {
    role: "manager", label: "Manager", desc: "Full operational access. Can declare incidents, manage tickets/tasks, access all IR modules. Cannot manage users or RBAC.",
    permissions: ["All operational modules", "Incident declaration", "Ticket/task management", "Playbook activation", "Report generation", "Stakeholder management", "Evidence vault"],
  },
  {
    role: "analyst", label: "Analyst", desc: "Can create and edit own work items. Can view all modules but cannot declare incidents or manage RBAC.",
    permissions: ["View all modules", "Create/edit own tickets", "Create/edit own tasks", "Assessment completion", "View reports", "Add evidence", "View stakeholders"],
  },
  {
    role: "viewer", label: "Viewer", desc: "Read-only access across the platform. Can view dashboards, reports, and tickets but cannot create or modify anything.",
    permissions: ["View Dashboard", "View Threat Intel", "View assessments", "View tickets (read-only)", "View tasks (read-only)", "View reports", "View incident log"],
  },
];

export function SettingsModule() {
  const { currentUserRole, setCurrentUserRole, themeMode, setThemeMode, org, team } = useStore();
  const colors = useColors();

  return (
    <div>
      <SectionHeader sub="Platform preferences, theme, and role-based access control">Settings</SectionHeader>

      {/* Theme */}
      <Card style={{ marginBottom: 14 }}>
        <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14 }}>Appearance</h3>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {(["dark", "light"] as const).map((mode) => (
            <button key={mode} onClick={() => setThemeMode(mode)} style={{
              padding: "10px 20px", borderRadius: 8, cursor: "pointer",
              border: `2px solid ${themeMode === mode ? colors.teal : colors.panelBorder}`,
              background: themeMode === mode ? colors.teal + "15" : colors.panel,
              color: themeMode === mode ? colors.teal : colors.textMuted,
              fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{mode === "dark" ? "🌙" : "☀️"}</div>
              {mode === "dark" ? "Dark Mode" : "Light Mode"}
            </button>
          ))}
        </div>
      </Card>

      {/* Current Role */}
      <Card style={{ marginBottom: 14 }}>
        <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14 }}>Your Access Level</h3>
        <p style={{ color: colors.textMuted, fontSize: 10, marginBottom: 12 }}>
          This controls what you can see and do in the platform. In production, this would be assigned by an administrator.
        </p>
        <Select label="Current Role" value={currentUserRole} onChange={(v) => setCurrentUserRole(v as UserRole)}
          options={ROLE_DEFS.map((r) => ({ value: r.role, label: `${r.label} — ${r.desc.substring(0, 60)}...` }))} />
        <div style={{ marginTop: 8 }}>
          <Badge color={currentUserRole === "admin" ? colors.red : currentUserRole === "manager" ? colors.orange : currentUserRole === "analyst" ? colors.teal : colors.textDim}>
            {ROLE_DEFS.find((r) => r.role === currentUserRole)?.label}
          </Badge>
        </div>
      </Card>

      {/* RBAC Matrix */}
      <Card style={{ marginBottom: 14 }}>
        <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14 }}>Role-Based Access Control (RBAC)</h3>
        <p style={{ color: colors.textMuted, fontSize: 10, marginBottom: 14 }}>
          Four access tiers from read-only to full administrative control.
        </p>
        {ROLE_DEFS.map((def) => {
          const roleColor = def.role === "admin" ? colors.red : def.role === "manager" ? colors.orange : def.role === "analyst" ? colors.teal : colors.textDim;
          const isActive = currentUserRole === def.role;
          return (
            <div key={def.role} style={{
              padding: "12px 14px", marginBottom: 8, borderRadius: 8,
              background: isActive ? roleColor + "10" : colors.obsidianM,
              border: `1px solid ${isActive ? roleColor + "44" : colors.panelBorder}`,
              borderLeft: `3px solid ${roleColor}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Badge color={roleColor}>{def.label}</Badge>
                  {isActive && <Badge color={colors.green}>Active</Badge>}
                </div>
                <span style={{ color: colors.textDim, fontSize: 9 }}>
                  {team.filter((m) => m.role === def.label || (def.role === "admin" && m.role === "Administrator")).length} user{team.filter((m) => m.role === def.label).length !== 1 ? "s" : ""}
                </span>
              </div>
              <p style={{ color: colors.textMuted, fontSize: 10, margin: "0 0 8px", lineHeight: 1.4 }}>{def.desc}</p>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {def.permissions.map((p) => <Badge key={p} color={colors.panelBorder}>{p}</Badge>)}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Platform Info */}
      <Card>
        <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14 }}>Platform Information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
          {[
            { l: "Platform", v: "Sentry v3.1.0" },
            { l: "Developer", v: "Dark Rock Labs" },
            { l: "Organization", v: org.name || "Not configured" },
            { l: "Industry", v: org.industry || "Not configured" },
            { l: "Theme", v: themeMode === "dark" ? "Dark Mode" : "Light Mode" },
            { l: "Access Level", v: ROLE_DEFS.find((r) => r.role === currentUserRole)?.label || "—" },
            { l: "Team Members", v: team.length.toString() },
          ].map((x) => (
            <div key={x.l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
              <span style={{ color: colors.textMuted, fontSize: 10, fontWeight: 600 }}>{x.l}</span>
              <span style={{ color: colors.text, fontSize: 10 }}>{x.v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
