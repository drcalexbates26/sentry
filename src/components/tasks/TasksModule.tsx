"use client";

import { useState } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card, Input, Select, SectionHeader, useModal } from "@/components/ui";
import { IR_PHASES } from "@/data/ir-phases";
import type { TaskStatus } from "@/types/task";

const COLS: TaskStatus[] = ["Backlog", "In Progress", "In Review", "Done"];
const IR_PHASE_OPTIONS = [{ value: "", label: "None" }, ...IR_PHASES.map((p) => ({ value: p.id, label: `${p.ico} ${p.n}` }))];

export function TasksModule() {
  const { tasks, addTask, updateTask, activeIncident, addTaskWithTicket } = useStore();
  const colors = useColors();
  const priColors: Record<string, string> = { Critical: colors.red, High: colors.orange, Medium: colors.yellow, Low: colors.green };
  const modal = useModal();
  const [showNew, setShowNew] = useState(false);
  const [nf, setNf] = useState({ title: "", priority: "Medium", assignee: "", irPhase: "" });
  const [editId, setEditId] = useState<number | null>(null);

  return (
    <div>
      <SectionHeader sub="Kanban board for remediation tracking from lessons learned and assessments">Tasks</SectionHeader>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12, gap: 6 }}>
        <Button onClick={() => setShowNew(true)}>+ New Task</Button>
      </div>

      {showNew && (
        <Card style={{ marginBottom: 12, borderColor: colors.teal + "44" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Input label="Title" value={nf.title} onChange={(v) => setNf((p) => ({ ...p, title: v }))} />
            <Select label="Priority" value={nf.priority} onChange={(v) => setNf((p) => ({ ...p, priority: v }))} options={["Low", "Medium", "High", "Critical"]} />
            <Select label="IR Phase" value={nf.irPhase} onChange={(v) => setNf((p) => ({ ...p, irPhase: v }))} options={IR_PHASE_OPTIONS} />
            <Input label="Assignee" value={nf.assignee} onChange={(v) => setNf((p) => ({ ...p, assignee: v }))} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Button onClick={() => {
              if (!nf.title) return;
              const task = {
                id: Date.now(),
                title: nf.title,
                priority: nf.priority as "Low" | "Medium" | "High" | "Critical",
                status: "Backlog" as const,
                assignee: nf.assignee,
                updates: [],
                created: new Date().toLocaleDateString(),
                source: "Manual",
                irPhase: nf.irPhase || undefined,
                incidentId: activeIncident ? `INC-active` : undefined,
              };
              if (activeIncident) {
                addTaskWithTicket(task, activeIncident.title);
              } else {
                addTask(task);
              }
              setShowNew(false);
              setNf({ title: "", priority: "Medium", assignee: "", irPhase: "" });
            }}>Create{activeIncident ? " + Ticket" : ""}</Button>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
          {activeIncident && (
            <div style={{ color: colors.teal, fontSize: 9, marginTop: 6 }}>
              Linked to active incident: {activeIncident.title} — a child ticket will be auto-created
            </div>
          )}
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS.length},1fr)`, gap: 12, minHeight: 300 }}>
        {COLS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col);
          return (
            <div key={col} style={{ background: colors.obsidianL, borderRadius: 8, padding: 10, border: `1px solid ${colors.panelBorder}`, minHeight: 200 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h4 style={{ color: colors.textMuted, margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{col}</h4>
                <Badge color={col === "Done" ? colors.green : colors.textMuted}>{colTasks.length}</Badge>
              </div>
              {colTasks.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", color: colors.textDim, fontSize: 9 }}>
                  No tasks
                </div>
              )}
              {colTasks.map((task) => (
                <div key={task.id} style={{ background: colors.panel, borderRadius: 7, padding: 10, marginBottom: 8, borderLeft: `3px solid ${priColors[task.priority] || colors.teal}`, cursor: "pointer" }}
                  onClick={() => setEditId(editId === task.id ? null : task.id)}>
                  <div style={{ color: colors.white, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{task.title}</div>
                  <div style={{ display: "flex", gap: 3, marginBottom: 4, flexWrap: "wrap" }}>
                    <Badge color={priColors[task.priority]}>{task.priority}</Badge>
                    {task.irPhase && <Badge color={colors.cyan}>{IR_PHASES.find((p) => p.id === task.irPhase)?.n || task.irPhase}</Badge>}
                    {task.assignee && <Badge color={colors.blue}>{task.assignee}</Badge>}
                    {task.ticketId && <Badge color={colors.textDim}>TKT-{task.ticketId}</Badge>}
                  </div>
                  <div style={{ color: colors.textDim, fontSize: 9 }}>{task.source || "Manual"} · {task.created}</div>
                  {editId === task.id && (
                    <div style={{ marginTop: 8, borderTop: `1px solid ${colors.panelBorder}`, paddingTop: 8 }} onClick={(e) => e.stopPropagation()}>
                      {(task.updates || []).map((up, i) => (
                        <div key={i} style={{ fontSize: 9, color: colors.textMuted, padding: "2px 0" }}>[{up.date}] {up.text}</div>
                      ))}
                      <Button variant="ghost" size="sm" style={{ marginTop: 4 }} onClick={async () => {
                        const r = await modal.showPrompt("Add Task Update", [{ key: "update", label: "Update", required: true, type: "textarea" }]);
                        const t = r?.update;
                        if (t) updateTask(task.id, { updates: [...(task.updates || []), { text: t, date: new Date().toLocaleDateString() }] });
                      }}>+ Update</Button>
                      <div style={{ display: "flex", gap: 3, marginTop: 6, flexWrap: "wrap" }}>
                        {COLS.filter((c) => c !== col).map((c) => (
                          <Button key={c} variant="secondary" size="sm" onClick={() => updateTask(task.id, { status: c })}>→ {c}</Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
