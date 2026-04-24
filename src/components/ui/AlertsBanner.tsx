"use client";

import { useState, useMemo } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { AlertTriangle, ShieldAlert, Clock, X } from "lucide-react";

interface Alert {
  id: string;
  icon: React.ReactNode;
  message: string;
  severity: "critical" | "warning" | "info";
  action?: { label: string; page: string };
}

export function AlertsBanner() {
  const {
    activeIncident, threatIntelItems, tickets, tasks, currentUserRole, setPage,
  } = useStore();
  const colors = useColors();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const alerts = useMemo(() => {
    const a: Alert[] = [];

    // Active incident
    if (activeIncident) {
      a.push({
        id: "active_incident",
        icon: <AlertTriangle size={14} />,
        message: `Active incident: ${activeIncident.title} (${activeIncident.severity})`,
        severity: "critical",
        action: { label: "Open Commander", page: "commander" },
      });
    }

    // Zero-day threats
    const zeroDays = threatIntelItems.filter((i) => i.isZeroDay);
    if (zeroDays.length > 0) {
      a.push({
        id: "zero_day",
        icon: <ShieldAlert size={14} />,
        message: `${zeroDays.length} active zero-day vulnerabilit${zeroDays.length !== 1 ? "ies" : "y"} detected`,
        severity: "critical",
        action: { label: "Review", page: "threatintel" },
      });
    }

    // Security event tickets needing attention
    const secEvents = tickets.filter((t) => t.ticketType === "security-event" && t.status !== "Closed" && !t.verifiedExploit);
    if (secEvents.length > 0 && (currentUserRole === "admin" || currentUserRole === "manager")) {
      a.push({
        id: "sec_events",
        icon: <ShieldAlert size={14} />,
        message: `${secEvents.length} security event${secEvents.length !== 1 ? "s" : ""} pending triage`,
        severity: "warning",
        action: { label: "View Tickets", page: "tickets" },
      });
    }

    // Overdue tasks
    const overdueTasks = tasks.filter((t) => t.priority === "Critical" && t.status === "Backlog");
    if (overdueTasks.length >= 3 && (currentUserRole === "admin" || currentUserRole === "manager")) {
      a.push({
        id: "overdue_tasks",
        icon: <Clock size={14} />,
        message: `${overdueTasks.length} critical tasks in backlog need assignment`,
        severity: "warning",
        action: { label: "Open Tasks", page: "tasks" },
      });
    }

    return a.filter((al) => !dismissed.has(al.id));
  }, [activeIncident, threatIntelItems, tickets, tasks, currentUserRole, dismissed]);

  if (alerts.length === 0) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      {alerts.map((alert) => {
        const bgColor = alert.severity === "critical" ? colors.red : alert.severity === "warning" ? colors.orange : colors.blue;
        return (
          <div
            key={alert.id}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px", marginBottom: 4,
              borderRadius: 8,
              background: bgColor + "10",
              border: `1px solid ${bgColor}28`,
              borderLeft: `3px solid ${bgColor}`,
            }}
          >
            <span style={{ color: bgColor, flexShrink: 0 }}>{alert.icon}</span>
            <span style={{ color: colors.text, fontSize: 11, fontWeight: 500, flex: 1 }}>{alert.message}</span>
            {alert.action && (
              <button
                onClick={() => setPage(alert.action!.page)}
                style={{
                  padding: "3px 10px", borderRadius: 5, border: `1px solid ${bgColor}44`,
                  background: "transparent", color: bgColor,
                  fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                {alert.action.label} →
              </button>
            )}
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
              style={{
                padding: 2, borderRadius: 4, border: "none",
                background: "transparent", color: colors.textDim,
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
