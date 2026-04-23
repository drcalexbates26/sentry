"use client";

import { colors } from "@/lib/tokens";
import { useStore } from "@/store";
import { Badge, Button, Card, SectionHeader } from "@/components/ui";
import { ROLES } from "@/data/tech-options";

export function AccessModule() {
  const { team, addTeamMember } = useStore();

  return (
    <div>
      <SectionHeader sub="Role-based access controls">Access Control</SectionHeader>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <h3 style={{ color: colors.white, margin: 0, fontSize: 13 }}>Team</h3>
          <Button size="sm" onClick={() => {
            const n = prompt("Name:");
            const e = prompt("Email:");
            const r = prompt("Role (" + ROLES.join(", ") + "):");
            if (n) addTeamMember({ name: n, email: e || "", role: r || "Core IRT", active: true });
          }}>+ Add</Button>
        </div>
        {team.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
            <span style={{ color: colors.white, fontSize: 11 }}>
              <strong>{m.name}</strong> <span style={{ color: colors.textDim }}>({m.email})</span>
            </span>
            <Badge color={m.role === "Administrator" ? colors.red : colors.teal}>{m.role}</Badge>
          </div>
        ))}
      </Card>

      <Card style={{ marginTop: 0 }}>
        <h3 style={{ color: colors.white, marginTop: 0, fontSize: 13 }}>RBAC Tiers</h3>
        {ROLES.map((role) => (
          <div key={role} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
            <span style={{ color: colors.text, fontSize: 11 }}>{role}</span>
            <Badge color={role === "Administrator" ? colors.red : role === "Auditor" ? colors.purple : colors.teal}>
              {role === "Administrator" ? "Full Access" : role === "Read Only" ? "View Only" : role === "Auditor" ? "Audit Access" : "Operational"}
            </Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
