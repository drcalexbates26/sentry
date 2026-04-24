"use client";

import { useState } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card, SectionHeader, useModal } from "@/components/ui";
import { ROLE_DEFS, PLATFORM_ROLES, getRoleColor } from "@/data/rbac";
import { STAKEHOLDER_GROUPS } from "@/data/stakeholder-groups";
import type { StakeholderPerson } from "@/types/stakeholder";

export function AccessModule() {
  const { team, addTeamMember, stakeholders, currentUserRole } = useStore();
  const colors = useColors();
  const modal = useModal();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [assignStakeholder, setAssignStakeholder] = useState<string | null>(null);

  const canManage = currentUserRole === "admin";

  return (
    <div>
      <SectionHeader sub="Manage team members, role assignments, and stakeholder group membership">Access Control</SectionHeader>

      {/* Team Members */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ color: colors.white, margin: 0, fontSize: 14, fontWeight: 700 }}>Team Members</h3>
          {canManage && (
            <Button size="sm" onClick={async () => {
              const r = await modal.showPrompt("Add Team Member", [
                { key: "name", label: "Full Name", required: true },
                { key: "email", label: "Email Address", required: true, placeholder: "user@organization.com" },
                { key: "role", label: "Platform Role", type: "select", options: PLATFORM_ROLES.map((p) => p.label), defaultValue: "Analyst" },
              ], "Add a new member to the platform. Their role determines what they can access.");
              if (r) addTeamMember({ name: r.name, email: r.email, role: r.role || "Analyst", active: true });
            }}>+ Add Member</Button>
          )}
        </div>

        {/* Header row */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: 8, padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
          <span style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Name</span>
          <span style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</span>
          <span style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Role</span>
          <span style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</span>
        </div>

        {team.map((m, i) => {
          const roleColor = getRoleColor(m.role);
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: 8, padding: "8px 0", borderBottom: `1px solid ${colors.panelBorder}`, alignItems: "center" }}>
              <div>
                <span style={{ color: colors.white, fontSize: 11, fontWeight: 600 }}>{m.name}</span>
              </div>
              <span style={{ color: colors.textMuted, fontSize: 10 }}>{m.email}</span>
              <Badge color={roleColor}>{m.role}</Badge>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.active ? colors.green : colors.red }} />
                <span style={{ color: m.active ? colors.green : colors.red, fontSize: 9 }}>{m.active ? "Active" : "Inactive"}</span>
              </div>
            </div>
          );
        })}
      </Card>

      {/* RBAC Tiers */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14, fontWeight: 700 }}>Role-Based Access Control</h3>
        <p style={{ color: colors.textMuted, fontSize: 10, marginBottom: 14 }}>Four tiers control platform access. Each role inherits all permissions of lower tiers.</p>

        {ROLE_DEFS.map((def) => {
          const isExpanded = selectedRole === def.role;
          const memberCount = team.filter((m) =>
            m.role === def.label || m.role === "Administrator" && def.role === "admin"
          ).length;

          return (
            <div key={def.role} style={{ marginBottom: 6 }}>
              <div
                onClick={() => setSelectedRole(isExpanded ? null : def.role)}
                style={{
                  padding: "12px 14px", borderRadius: isExpanded ? "8px 8px 0 0" : 8,
                  background: colors.obsidianM,
                  borderLeft: `3px solid ${def.color}`,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Radio indicator */}
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: `2px solid ${def.color}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: def.color }} />
                    </div>
                    <span style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{def.label}</span>
                    <Badge color={def.color}>{memberCount} member{memberCount !== 1 ? "s" : ""}</Badge>
                  </div>
                  <span style={{ color: colors.textDim, fontSize: 9 }}>{isExpanded ? "▾" : "▸"}</span>
                </div>
                <p style={{ color: colors.textMuted, fontSize: 10, margin: "6px 0 0 22px", lineHeight: 1.4 }}>{def.desc}</p>
              </div>

              {isExpanded && (
                <div style={{
                  padding: "12px 14px", borderRadius: "0 0 8px 8px",
                  background: colors.panel, borderLeft: `3px solid ${def.color}`,
                  borderTop: `1px solid ${colors.panelBorder}`,
                }}>
                  {/* Permissions */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, color: colors.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Permissions</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {def.permissions.map((p) => (
                        <span key={p} style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          padding: "3px 8px", borderRadius: 5,
                          background: colors.obsidianM, color: colors.textMuted,
                          fontSize: 9, fontWeight: 500,
                        }}>
                          <span style={{ color: colors.green, fontSize: 8 }}>✓</span> {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stakeholder Group Access */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, color: colors.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Stakeholder Group Access</div>
                    {def.stakeholderAccess.length > 0 ? (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {def.stakeholderAccess.map((groupKey) => {
                          const group = STAKEHOLDER_GROUPS.find((g) => g.key === groupKey);
                          const contactCount = ((stakeholders[groupKey] as StakeholderPerson[]) || []).length;
                          return (
                            <span key={groupKey} style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "3px 8px", borderRadius: 5,
                              background: group?.color ? group.color + "12" : colors.obsidianM,
                              color: group?.color || colors.textMuted,
                              fontSize: 9, fontWeight: 600,
                            }}>
                              {group?.icon} {group?.label || groupKey}
                              <span style={{ color: colors.textDim, fontWeight: 400 }}>({contactCount})</span>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ color: colors.textDim, fontSize: 9, fontStyle: "italic" }}>No stakeholder group access at this tier</span>
                    )}
                  </div>

                  {/* Members with this role */}
                  <div>
                    <div style={{ fontSize: 9, color: colors.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Members</div>
                    {team.filter((m) => m.role === def.label || (m.role === "Administrator" && def.role === "admin")).length > 0 ? (
                      team.filter((m) => m.role === def.label || (m.role === "Administrator" && def.role === "admin")).map((m, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.active ? colors.green : colors.red }} />
                          <span style={{ color: colors.text, fontSize: 10, fontWeight: 500 }}>{m.name}</span>
                          <span style={{ color: colors.textDim, fontSize: 9 }}>{m.email}</span>
                        </div>
                      ))
                    ) : (
                      <span style={{ color: colors.textDim, fontSize: 9, fontStyle: "italic" }}>No members assigned to this role</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {/* Stakeholder Group Assignments */}
      <Card>
        <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14, fontWeight: 700 }}>Stakeholder Group Assignments</h3>
        <p style={{ color: colors.textMuted, fontSize: 10, marginBottom: 14 }}>
          Each stakeholder group is accessible based on RBAC tier. Contacts are managed in the Stakeholders module.
        </p>

        {STAKEHOLDER_GROUPS.map((group) => {
          const contacts = (stakeholders[group.key] as StakeholderPerson[]) || [];
          const isExpanded = assignStakeholder === group.key;
          const accessibleBy = ROLE_DEFS.filter((r) => r.stakeholderAccess.includes(group.key));

          return (
            <div key={group.key} style={{ marginBottom: 4 }}>
              <div
                onClick={() => setAssignStakeholder(isExpanded ? null : group.key)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px", borderRadius: isExpanded ? "7px 7px 0 0" : 7,
                  background: colors.obsidianM,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12 }}>{group.icon}</span>
                  <span style={{ color: colors.text, fontSize: 11, fontWeight: 600 }}>{group.label}</span>
                  <Badge color={contacts.length > 0 ? colors.green : colors.textDim}>{contacts.length}</Badge>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {accessibleBy.map((r) => (
                    <div key={r.role} style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} title={r.label} />
                  ))}
                </div>
              </div>

              {isExpanded && (
                <div style={{
                  padding: "8px 12px", borderRadius: "0 0 7px 7px",
                  background: colors.panel, borderTop: `1px solid ${colors.panelBorder}`,
                }}>
                  <div style={{ fontSize: 9, color: colors.textDim, marginBottom: 6 }}>
                    Accessible by: {accessibleBy.map((r) => r.label).join(", ") || "No roles assigned"}
                  </div>
                  {contacts.length > 0 ? contacts.map((c) => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                      <div>
                        <span style={{ color: colors.text, fontSize: 10, fontWeight: 600 }}>{c.firstName} {c.lastName}</span>
                        {c.title && <span style={{ color: colors.textDim, fontSize: 9, marginLeft: 6 }}>— {c.title}</span>}
                      </div>
                      <span style={{ color: colors.textMuted, fontSize: 9 }}>{c.email}</span>
                    </div>
                  )) : (
                    <span style={{ color: colors.textDim, fontSize: 9, fontStyle: "italic" }}>No contacts configured</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
