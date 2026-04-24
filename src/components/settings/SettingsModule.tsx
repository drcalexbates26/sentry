"use client";

import { useColors } from "@/lib/theme";
import { useTheme } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { ROLE_DEFS } from "@/data/rbac";

export function SettingsModule() {
  const { currentUserRole, setCurrentUserRole, themeMode, setThemeMode, org, team } = useStore();
  const colors = useColors();
  const { mode } = useTheme();

  return (
    <div>
      <SectionHeader sub="Platform preferences, appearance, and access control">Settings</SectionHeader>

      {/* Appearance */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14, fontWeight: 700 }}>Appearance</h3>
        <p style={{ color: colors.textMuted, fontSize: 10, marginBottom: 14 }}>Choose your preferred color scheme. Changes apply immediately across the platform.</p>
        <div style={{ display: "flex", gap: 12 }}>
          {(["dark", "light"] as const).map((m) => {
            const isActive = themeMode === m;
            const previewBg = m === "dark" ? "#080C12" : "#F7F8FA";
            const previewPanel = m === "dark" ? "#0F1623" : "#FFFFFF";
            const previewText = m === "dark" ? "#EDF2F7" : "#1A202C";
            const previewAccent = m === "dark" ? "#00D4C8" : "#0D9488";
            return (
              <button
                key={m}
                onClick={() => setThemeMode(m)}
                style={{
                  flex: 1, padding: 0, borderRadius: 10, cursor: "pointer",
                  border: `2px solid ${isActive ? colors.teal : colors.panelBorder}`,
                  background: "transparent",
                  overflow: "hidden",
                  boxShadow: isActive ? `0 0 0 3px ${colors.teal}22` : "none",
                  transition: "all 0.15s",
                }}
              >
                {/* Mini preview */}
                <div style={{ background: previewBg, padding: "12px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  {/* Mini sidebar */}
                  <div style={{ width: 24, borderRadius: 4, background: previewPanel, padding: "6px 4px", display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ width: 16, height: 2, background: previewAccent, borderRadius: 1 }} />
                    <div style={{ width: 12, height: 2, background: previewText + "33", borderRadius: 1 }} />
                    <div style={{ width: 14, height: 2, background: previewText + "33", borderRadius: 1 }} />
                  </div>
                  {/* Mini content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ width: "60%", height: 3, background: previewText, borderRadius: 1, marginBottom: 4 }} />
                    <div style={{ width: "100%", height: 12, background: previewPanel, borderRadius: 3, border: `1px solid ${previewText}15` }} />
                  </div>
                </div>
                {/* Label */}
                <div style={{ padding: "8px 14px", background: isActive ? colors.teal + "10" : colors.panel, borderTop: `1px solid ${colors.panelBorder}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Radio */}
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      border: `2px solid ${isActive ? colors.teal : colors.panelBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isActive && <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors.teal }} />}
                    </div>
                    <span style={{ color: isActive ? colors.teal : colors.textMuted, fontSize: 12, fontWeight: 600 }}>
                      {m === "dark" ? "Dark" : "Light"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Access Level */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14, fontWeight: 700 }}>Access Level</h3>
        <p style={{ color: colors.textMuted, fontSize: 10, marginBottom: 14 }}>
          Your role determines what you can see and do. In production, roles are assigned by an administrator.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {ROLE_DEFS.map((def) => {
            const isActive = currentUserRole === def.role;
            return (
              <button
                key={def.role}
                onClick={() => setCurrentUserRole(def.role)}
                style={{
                  padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                  border: `2px solid ${isActive ? def.color : colors.panelBorder}`,
                  background: isActive ? def.color + "08" : colors.panel,
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {/* Radio */}
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: `2px solid ${isActive ? def.color : colors.panelBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {isActive && <div style={{ width: 8, height: 8, borderRadius: "50%", background: def.color }} />}
                  </div>
                  <span style={{ color: isActive ? def.color : colors.white, fontSize: 12, fontWeight: 700 }}>{def.label}</span>
                </div>
                <p style={{ color: colors.textMuted, fontSize: 9, margin: 0, lineHeight: 1.4 }}>{def.desc}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* RBAC Matrix */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14, fontWeight: 700 }}>RBAC Permission Matrix</h3>
        <p style={{ color: colors.textMuted, fontSize: 10, marginBottom: 14 }}>
          Four access tiers control what each role can do across the platform.
        </p>
        {ROLE_DEFS.map((def) => {
          const isActive = currentUserRole === def.role;
          return (
            <div key={def.role} style={{
              padding: "12px 14px", marginBottom: 6, borderRadius: 8,
              background: isActive ? def.color + "08" : colors.obsidianM,
              borderLeft: `3px solid ${def.color}`,
              transition: "all 0.15s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Badge color={def.color}>{def.label}</Badge>
                  {isActive && <Badge color={colors.green}>Active</Badge>}
                </div>
                <span style={{ color: colors.textDim, fontSize: 9 }}>
                  Tier {def.role === "admin" ? "1" : def.role === "manager" ? "2" : def.role === "analyst" ? "3" : "4"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {def.permissions.map((p) => (
                  <span key={p} style={{
                    display: "inline-block", padding: "2px 7px", borderRadius: 4,
                    background: colors.panelBorder + "44", color: colors.textMuted,
                    fontSize: 9, fontWeight: 500,
                  }}>{p}</span>
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Platform Info */}
      <Card>
        <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14, fontWeight: 700 }}>Platform</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
          {[
            { l: "Version", v: "Sentry v3.1.0" },
            { l: "Developer", v: "Dark Rock Labs" },
            { l: "Organization", v: org.name || "Not configured" },
            { l: "Industry", v: org.industry || "Not configured" },
            { l: "Theme", v: mode === "dark" ? "Dark" : "Light" },
            { l: "Role", v: ROLE_DEFS.find((r) => r.role === currentUserRole)?.label || "—" },
            { l: "Team Size", v: team.length.toString() },
          ].map((x) => (
            <div key={x.l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
              <span style={{ color: colors.textMuted, fontSize: 10, fontWeight: 600 }}>{x.l}</span>
              <span style={{ color: colors.text, fontSize: 10, fontWeight: 500 }}>{x.v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
