"use client";

import { useState } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card, Input, Select, SectionHeader, useModal } from "@/components/ui";
import { IR_PHASES } from "@/data/ir-phases";
import type { TaskStatus } from "@/types/task";

const COLS: TaskStatus[] = ["Backlog", "In Progress", "In Review", "Done"];
const IR_PHASE_OPTIONS = [{ value: "", label: "None" }, ...IR_PHASES.map((p) => ({ value: p.id, label: `${p.ico} ${p.n}` }))];
// Keep in sync with the workstream list in Commander's Workstreams tab.
const WORKSTREAM_OPTIONS = [
  { value: "", label: "None" },
  { value: "Security", label: "Security Engineering" },
  { value: "Legal", label: "Legal Counsel" },
  { value: "Executive", label: "Executive Leadership" },
  { value: "Insurance", label: "Cyber Insurance" },
  { value: "Forensics", label: "Forensics" },
  { value: "HR", label: "Human Resources" },
  { value: "PR", label: "Public Relations" },
  { value: "Privacy", label: "Privacy Officer" },
];

export function TasksModule() {
  const { tasks, addTask, updateTask, deleteTask, activeIncident, addTaskWithTicket } = useStore();
  const colors = useColors();
  const priColors: Record<string, string> = { Critical: colors.red, High: colors.orange, Medium: colors.yellow, Low: colors.green };
  const modal = useModal();
  const [showNew, setShowNew] = useState(false);
  const [nf, setNf] = useState({ title: "", priority: "Medium", assignee: "", irPhase: "", workstream: "" });
  const [editId, setEditId] = useState<number | null>(null);

  /** IDs of tasks currently checked for bulk operations. */
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggleSelect = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearSelection = () => setSelected(new Set());
  const selectAllInCol = (col: TaskStatus) => {
    setSelected((prev) => {
      const next = new Set(prev);
      tasks.filter((t) => t.status === col).forEach((t) => next.add(t.id));
      return next;
    });
  };

  const handleDelete = async (id: number, title: string) => {
    const ok = await modal.showConfirm(
      "Delete this task?",
      `"${title}" will be permanently removed from the board. This cannot be undone.`,
      "danger",
    );
    if (ok) {
      deleteTask(id);
      setEditId((prev) => (prev === id ? null : prev));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    const count = selected.size;
    if (count === 0) return;
    const ok = await modal.showConfirm(
      `Delete ${count} task${count === 1 ? "" : "s"}?`,
      `${count} task${count === 1 ? " will be" : "s will be"} permanently removed from the board. This cannot be undone.`,
      "danger",
    );
    if (!ok) return;
    selected.forEach((id) => deleteTask(id));
    clearSelection();
  };

  const handleBulkMarkDone = () => {
    selected.forEach((id) => updateTask(id, { status: "Done" }));
    clearSelection();
  };

  return (
    <div>
      <SectionHeader sub="Kanban board for remediation tracking from lessons learned and assessments">Tasks</SectionHeader>

      {/* Bulk-action toolbar — appears only when one or more tasks are checked */}
      {selected.size > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, marginBottom: 12, padding: "10px 14px",
          background: colors.teal + "12",
          border: `1px solid ${colors.teal}55`,
          borderRadius: 8,
          flexWrap: "wrap",
        }}>
          <span style={{ color: colors.teal, fontSize: 12, fontWeight: 700 }}>
            {selected.size} task{selected.size === 1 ? "" : "s"} selected
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Button size="sm" variant="outline" onClick={handleBulkMarkDone}>✓ Mark Done</Button>
            <Button size="sm" variant="danger" onClick={handleBulkDelete}>Delete Selected</Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12, gap: 6 }}>
        <Button onClick={() => setShowNew(true)}>+ New Task</Button>
      </div>

      {showNew && (
        <Card style={{ marginBottom: 12, borderColor: colors.teal + "44" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Input label="Title" value={nf.title} onChange={(v) => setNf((p) => ({ ...p, title: v }))} />
            <Select label="Priority" value={nf.priority} onChange={(v) => setNf((p) => ({ ...p, priority: v }))} options={["Low", "Medium", "High", "Critical"]} />
            <Select label="IR Phase" value={nf.irPhase} onChange={(v) => setNf((p) => ({ ...p, irPhase: v }))} options={IR_PHASE_OPTIONS} />
            <Select label="Workstream" value={nf.workstream} onChange={(v) => setNf((p) => ({ ...p, workstream: v }))} options={WORKSTREAM_OPTIONS} />
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
                // Use the active incident's real id, not a placeholder, so
                // Commander filters (IR Phase progression, Workstreams tab) match.
                incidentId: activeIncident?.id,
                workstream: nf.workstream || undefined,
              };
              if (activeIncident) {
                addTaskWithTicket(task, activeIncident.title);
              } else {
                addTask(task);
              }
              setShowNew(false);
              setNf({ title: "", priority: "Medium", assignee: "", irPhase: "", workstream: "" });
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
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {colTasks.length > 0 && (
                    <button
                      onClick={() => selectAllInCol(col)}
                      title={`Select all ${colTasks.length} task${colTasks.length === 1 ? "" : "s"} in ${col}`}
                      style={{
                        background: "transparent", border: "none", cursor: "pointer",
                        color: colors.textDim, fontSize: 9, fontFamily: "inherit",
                        padding: "2px 4px", borderRadius: 3,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = colors.teal; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = colors.textDim; }}
                    >☑</button>
                  )}
                  <Badge color={col === "Done" ? colors.green : colors.textMuted}>{colTasks.length}</Badge>
                </div>
              </div>
              {colTasks.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", color: colors.textDim, fontSize: 9 }}>
                  No tasks
                </div>
              )}
              {colTasks.map((task) => {
                const isSelected = selected.has(task.id);
                return (
                <div key={task.id} style={{
                  background: isSelected ? colors.teal + "12" : colors.panel,
                  borderRadius: 7, padding: 10, marginBottom: 8,
                  borderLeft: `3px solid ${priColors[task.priority] || colors.teal}`,
                  border: isSelected ? `1px solid ${colors.teal}55` : `1px solid transparent`,
                  cursor: "pointer", position: "relative",
                }}
                  onClick={() => setEditId(editId === task.id ? null : task.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(task.id)}
                        onClick={(e) => e.stopPropagation()}
                        title="Select for bulk action"
                        style={{
                          marginTop: 2, accentColor: colors.teal, cursor: "pointer", flexShrink: 0,
                        }}
                      />
                      <div style={{ color: colors.white, fontSize: 11, fontWeight: 600, flex: 1, minWidth: 0 }}>{task.title}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); void handleDelete(task.id, task.title); }}
                      title="Delete task"
                      style={{
                        background: "transparent", border: "none", cursor: "pointer",
                        color: colors.textDim, fontSize: 12, padding: 0, lineHeight: 1, flexShrink: 0,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = colors.red; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = colors.textDim; }}
                    >✕</button>
                  </div>
                  <div style={{ display: "flex", gap: 3, marginBottom: 4, flexWrap: "wrap" }}>
                    <Badge color={priColors[task.priority]}>{task.priority}</Badge>
                    {task.irPhase && <Badge color={colors.cyan}>{IR_PHASES.find((p) => p.id === task.irPhase)?.n || task.irPhase}</Badge>}
                    {task.workstream && <Badge color={colors.teal}>WS · {task.workstream}</Badge>}
                    {task.assignee && <Badge color={colors.blue}>{task.assignee}</Badge>}
                    {task.ticketId && <Badge color={colors.textDim}>TKT-{task.ticketId}</Badge>}
                  </div>
                  <div style={{ color: colors.textDim, fontSize: 9 }}>{task.source || "Manual"} · {task.created}</div>
                  {editId === task.id && (
                    <div style={{ marginTop: 8, borderTop: `1px solid ${colors.panelBorder}`, paddingTop: 8 }} onClick={(e) => e.stopPropagation()}>
                      {(task.updates || []).map((up, i) => (
                        <div key={i} style={{ fontSize: 9, color: colors.textMuted, padding: "2px 0" }}>
                          <span style={{ color: colors.textDim }}>[{up.date}]</span>{" "}
                          {up.by && <span style={{ color: colors.teal, fontWeight: 600 }}>{up.by}: </span>}
                          {up.text}
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" style={{ marginTop: 4 }} onClick={async () => {
                        // Remember the recorder's name across updates so they don't retype each time.
                        const remembered = typeof window !== "undefined"
                          ? window.localStorage.getItem("sentry_task_update_author") ?? ""
                          : "";
                        const r = await modal.showPrompt(
                          "Add Task Update",
                          [
                            { key: "by", label: "Your name", required: true, placeholder: "e.g. Alex Bates", defaultValue: remembered },
                            { key: "update", label: "Update", required: true, type: "textarea" },
                          ],
                          "Both fields are captured in the task's update history with a timestamp.",
                        );
                        if (r?.update && r?.by) {
                          if (typeof window !== "undefined") {
                            window.localStorage.setItem("sentry_task_update_author", r.by);
                          }
                          updateTask(task.id, {
                            updates: [
                              ...(task.updates || []),
                              { text: r.update, date: new Date().toLocaleString(), by: r.by },
                            ],
                          });
                        }
                      }}>+ Update</Button>
                      <div style={{ display: "flex", gap: 3, marginTop: 6, flexWrap: "wrap" }}>
                        {COLS.filter((c) => c !== col).map((c) => (
                          <Button key={c} variant="secondary" size="sm" onClick={() => updateTask(task.id, { status: c })}>→ {c}</Button>
                        ))}
                        {col !== "Done" && (
                          <Button size="sm" onClick={() => updateTask(task.id, { status: "Done" })}>✓ Mark Done</Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => void handleDelete(task.id, task.title)} style={{ color: colors.red }}>Delete</Button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
