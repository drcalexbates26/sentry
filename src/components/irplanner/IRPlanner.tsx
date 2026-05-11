"use client";

import { useState } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card, Checkbox, SectionHeader, useModal } from "@/components/ui";
import { IR_PHASES, SEV_LEVELS } from "@/data/ir-phases";
import { STAKEHOLDER_GROUPS } from "@/data/stakeholder-groups";
import type { StakeholderPerson } from "@/types/stakeholder";

// Tab keys are kept stable; user-facing labels live in the UI map.
const TABS: { key: string; label: string }[] = [
  { key: "lifecycle", label: "Lifecycle" },
  { key: "severity", label: "Severity" },
  { key: "contacts", label: "Contacts" },
  { key: "comms", label: "Communications SLA" },
  { key: "emergency", label: "Emergency" },
];

const DEFAULT_COMMS_SLA = {
  first72: [
    { time: "08:30", label: "Morning Update" },
    { time: "12:00", label: "Midday Update" },
    { time: "16:30", label: "EOD Update" },
  ],
  after72: [
    { time: "16:30", label: "Daily Update + ad hoc" },
  ],
  notes: "If admin accounts compromised, use out-of-band communications. Mark all correspondence \"Privileged and Confidential\" if directed by counsel.",
};

export function IRPlanner() {
  const { irData, updateIRData, stakeholders, addTicket, addLesson, addTask, setPage } = useStore();
  const colors = useColors();
  const modal = useModal();
  const [tab, setTab] = useState("lifecycle");

  // Effective lifecycle steps per phase: merge user overrides on top of defaults.
  const stepsFor = (phaseId: string) => irData.phaseSteps?.[phaseId] ?? IR_PHASES.find((p) => p.id === phaseId)?.steps ?? [];
  // Effective severity description / action — overrides win.
  const sevDef = (lv: string) => {
    const base = SEV_LEVELS.find((s) => s.lv === lv);
    const override = irData.severityDefs?.[lv];
    return {
      desc: override?.desc ?? base?.desc ?? "",
      act: override?.act ?? base?.act ?? "",
      c: base?.c ?? colors.textMuted,
    };
  };
  // Effective comms SLA — fall back to defaults when the override is missing/partial.
  const sla = {
    first72: irData.commsSLA?.first72 ?? DEFAULT_COMMS_SLA.first72,
    after72: irData.commsSLA?.after72 ?? DEFAULT_COMMS_SLA.after72,
    notes: irData.commsSLA?.notes ?? DEFAULT_COMMS_SLA.notes,
  };

  // Helpers for the lifecycle step CRUD. Each writes into irData.phaseSteps,
  // initializing the override array from defaults the first time a phase is touched.
  const editStep = async (phaseId: string, idx: number) => {
    const current = stepsFor(phaseId)[idx] || "";
    const r = await modal.showPrompt(
      "Edit Lifecycle Step",
      [{ key: "text", label: "Step", required: true, type: "textarea", defaultValue: current }],
      "Customize this checklist step for your environment."
    );
    if (!r) return;
    updateIRData((p) => {
      const base = p.phaseSteps?.[phaseId] ?? IR_PHASES.find((x) => x.id === phaseId)?.steps ?? [];
      const next = base.slice();
      next[idx] = r.text.trim();
      return { ...p, phaseSteps: { ...(p.phaseSteps || {}), [phaseId]: next } };
    });
  };
  const deleteStep = async (phaseId: string, idx: number) => {
    const current = stepsFor(phaseId)[idx] || "";
    const ok = await modal.showConfirm("Delete Step", `Remove "${current}" from this phase?`, "danger");
    if (!ok) return;
    updateIRData((p) => {
      const base = p.phaseSteps?.[phaseId] ?? IR_PHASES.find((x) => x.id === phaseId)?.steps ?? [];
      const next = base.filter((_, i) => i !== idx);
      const checked = { ...p.checked };
      delete checked[`${phaseId}_${idx}`];
      return { ...p, phaseSteps: { ...(p.phaseSteps || {}), [phaseId]: next }, checked };
    });
  };
  const addStep = async (phaseId: string) => {
    const r = await modal.showPrompt(
      "Add Lifecycle Step",
      [{ key: "text", label: "Step", required: true, type: "textarea", placeholder: "e.g. Notify IT operations" }],
      "Step is added to the end of this phase. Customizations are tenant-scoped."
    );
    if (!r) return;
    updateIRData((p) => {
      const base = p.phaseSteps?.[phaseId] ?? IR_PHASES.find((x) => x.id === phaseId)?.steps ?? [];
      return { ...p, phaseSteps: { ...(p.phaseSteps || {}), [phaseId]: [...base, r.text.trim()] } };
    });
  };
  const resetPhase = async (phaseId: string) => {
    if (!irData.phaseSteps?.[phaseId]) return;
    const ok = await modal.showConfirm(
      "Reset Phase to Default",
      "Discard your customizations for this phase and restore the NIST 800-61 default steps?",
      "danger"
    );
    if (!ok) return;
    updateIRData((p) => {
      const next = { ...(p.phaseSteps || {}) };
      delete next[phaseId];
      return { ...p, phaseSteps: next };
    });
  };

  // Stakeholder import (Contacts tab). Pulls people from the Stakeholders
  // module into the IR team rosters without retyping. Existing IRContact
  // entries are merged by email so re-importing is idempotent.
  const importFromStakeholders = async (team: "core" | "extended" | "external") => {
    // Map stakeholder group keys → roster bucket. Anything not listed is skippable.
    const groupsForTeam: Record<typeof team, string[]> = {
      core: ["incidentCommander", "ciso", "securityEngineers", "legalContact"],
      extended: ["executivePOC", "riskContact", "hrContacts", "privacyContact", "cyberInsuranceInternal"],
      external: ["externalLegal", "forensicsContact", "prContact", "cyberInsuranceExternal", "lawEnforcement"],
    };
    type Pick = { name: string; role: string; email: string; key: string };
    const candidates: Pick[] = [];
    groupsForTeam[team].forEach((groupKey) => {
      const groupDef = STAKEHOLDER_GROUPS.find((g) => g.key === groupKey);
      const people = (stakeholders[groupKey] as StakeholderPerson[]) || [];
      people.forEach((person) => {
        const name = `${person.firstName || ""} ${person.lastName || ""}`.trim() || "(unnamed)";
        candidates.push({
          name,
          role: person.title || groupDef?.label || groupKey,
          email: person.email || "",
          key: `${groupKey}-${person.id}`,
        });
      });
    });
    if (candidates.length === 0) {
      await modal.showAlert(
        "No Stakeholders Available",
        "Add people to the Stakeholders module first (Incident Commander, CISO, Legal, etc.) and they'll appear here for import."
      );
      return;
    }
    // Use a select with "all" sentinel since the modal API doesn't support
    // multi-select. We import all candidates and dedupe by email below.
    const r = await modal.showPrompt(
      `Import to ${team === "core" ? "Core IRT" : team === "extended" ? "Extended IRT" : "External Partners"}`,
      [
        {
          key: "mode",
          label: "What to import",
          type: "select",
          required: true,
          options: ["All available contacts", ...candidates.map((c) => `${c.name} — ${c.role}`)],
          defaultValue: "All available contacts",
        },
      ],
      `${candidates.length} stakeholder${candidates.length === 1 ? "" : "s"} available for this team. Duplicates (by email) are skipped.`
    );
    if (!r) return;
    const picks = r.mode === "All available contacts"
      ? candidates
      : candidates.filter((c) => `${c.name} — ${c.role}` === r.mode);
    updateIRData((p) => {
      const existing = p.contacts[team];
      const existingEmails = new Set(existing.map((c) => c.email.toLowerCase()).filter(Boolean));
      const additions = picks
        .filter((c) => !c.email || !existingEmails.has(c.email.toLowerCase()))
        .map((c) => ({ name: c.name, role: c.role, email: c.email }));
      return { ...p, contacts: { ...p.contacts, [team]: [...existing, ...additions] } };
    });
  };

  return (
    <div>
      <SectionHeader sub="Full 8-phase NIST 800-61 lifecycle — fully customizable">IR Planner</SectionHeader>
      <div style={{ display: "flex", gap: 3, marginBottom: 16, flexWrap: "wrap", borderBottom: `1px solid ${colors.panelBorder}`, paddingBottom: 6 }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "5px 12px", borderRadius: "5px 5px 0 0", border: "none", cursor: "pointer", background: tab === t.key ? colors.teal + "22" : "transparent", color: tab === t.key ? colors.teal : colors.textMuted, fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>{t.label}</button>
        ))}
      </div>

      {tab === "lifecycle" && IR_PHASES.map((ph) => {
        const steps = stepsFor(ph.id);
        const ckCnt = steps.filter((_, i) => irData.checked[`${ph.id}_${i}`]).length;
        const customized = !!irData.phaseSteps?.[ph.id];
        return (
          <Card key={ph.id} style={{ marginBottom: 12, borderLeft: `3px solid ${steps.length > 0 && ckCnt === steps.length ? colors.green : colors.teal}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{ph.ico}</span>
                <h3 style={{ color: colors.white, margin: 0, fontSize: 13 }}>{ph.n}</h3>
                {customized && <Badge color={colors.cyan}>Customized</Badge>}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Badge color={steps.length > 0 && ckCnt === steps.length ? colors.green : colors.textMuted}>{ckCnt}/{steps.length}</Badge>
                {customized && <Button variant="ghost" size="sm" onClick={() => resetPhase(ph.id)}>Reset</Button>}
              </div>
            </div>
            {steps.length === 0 && (
              <div style={{ color: colors.textDim, fontSize: 10, fontStyle: "italic", padding: "6px 0" }}>
                No steps yet. Add one below.
              </div>
            )}
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 4, borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ flex: 1 }}>
                  <Checkbox
                    label={s}
                    checked={!!irData.checked[`${ph.id}_${i}`]}
                    onChange={() => updateIRData((p) => ({ ...p, checked: { ...p.checked, [`${ph.id}_${i}`]: !p.checked[`${ph.id}_${i}`] } }))}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => editStep(ph.id, i)}>✎</Button>
                <Button variant="ghost" size="sm" onClick={() => deleteStep(ph.id, i)}>✕</Button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <Button variant="outline" size="sm" onClick={() => addStep(ph.id)}>+ Step</Button>
              <Button variant="outline" size="sm" onClick={() => addTicket({ id: Date.now(), title: `${ph.n} Phase Ticket`, status: "Open", severity: "Medium", phase: ph.n, assignee: "", created: new Date().toLocaleDateString(), details: "", actions: [] })}>Generate Ticket</Button>
              <Button variant="ghost" size="sm" onClick={async () => {
                const r = await modal.showPrompt("Lesson Learned → Task", [{ key: "lesson", label: "Lesson Learned", required: true, type: "textarea" }], `Capture a lesson from the ${ph.n} phase. This will also create a remediation task.`);
                if (r) {
                  addLesson({ text: r.lesson, date: new Date().toLocaleDateString(), src: ph.n });
                  addTask({ id: Date.now(), title: r.lesson.substring(0, 80), priority: "Medium", status: "Backlog", assignee: "", updates: [], created: new Date().toLocaleDateString(), source: `Lesson: ${ph.n}` });
                }
              }}>+ Lesson → Task</Button>
            </div>
          </Card>
        );
      })}

      {tab === "severity" && (
        <div>
          <div style={{ color: colors.textDim, fontSize: 10, fontStyle: "italic", marginBottom: 8 }}>
            Severity thresholds drive triage decisions and SLA timers. Customize the description and action guidance to match your program.
          </div>
          {SEV_LEVELS.map((base) => {
            const eff = sevDef(base.lv);
            const overridden = !!irData.severityDefs?.[base.lv];
            return (
              <Card key={base.lv} style={{ marginBottom: 10, borderLeft: `3px solid ${base.c}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ display: "flex", gap: 12, flex: 1 }}>
                    <Badge color={base.c} className="min-w-[55px] text-center">{base.lv}</Badge>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: colors.text, fontSize: 12, margin: "0 0 4px", lineHeight: 1.5 }}>{eff.desc}</p>
                      <p style={{ color: colors.textDim, fontSize: 10, margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>{eff.act}</p>
                      {overridden && <Badge color={colors.cyan}>Customized</Badge>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <Button variant="ghost" size="sm" onClick={async () => {
                      const r = await modal.showPrompt(
                        `Edit ${base.lv} Severity`,
                        [
                          { key: "desc", label: "Description", type: "textarea", required: true, defaultValue: eff.desc },
                          { key: "act", label: "Required Action", type: "textarea", required: true, defaultValue: eff.act },
                        ],
                        "Customize this severity definition for your program. Defaults come from NIST 800-61."
                      );
                      if (!r) return;
                      updateIRData((p) => ({
                        ...p,
                        severityDefs: {
                          ...(p.severityDefs || {}),
                          [base.lv]: { desc: r.desc.trim(), act: r.act.trim() },
                        },
                      }));
                    }}>Edit</Button>
                    {overridden && (
                      <Button variant="ghost" size="sm" onClick={async () => {
                        const ok = await modal.showConfirm("Reset to Default", `Discard your customizations for ${base.lv} and restore NIST 800-61 default?`, "danger");
                        if (!ok) return;
                        updateIRData((p) => {
                          const next = { ...(p.severityDefs || {}) };
                          delete next[base.lv];
                          return { ...p, severityDefs: next };
                        });
                      }}>Reset</Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "contacts" && (
        <div>
          <Card style={{ marginBottom: 12, borderColor: colors.teal + "33" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🛡️</span>
              <div>
                <div style={{ color: colors.teal, fontWeight: 700, fontSize: 12 }}>Dark Rock Cybersecurity — External IR</div>
                <div style={{ color: colors.textMuted, fontSize: 10 }}>IncidentResponse@Darkrocklabs.com</div>
              </div>
            </div>
          </Card>
          {(["core", "extended", "external"] as const).map((team) => (
            <Card key={team} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <h4 style={{ color: colors.white, margin: 0, fontSize: 12 }}>
                  {team === "core" ? "Core IRT" : team === "extended" ? "Extended IRT" : "External Partners"}
                </h4>
                <Button variant="ghost" size="sm" onClick={() => importFromStakeholders(team)}>↩ Import from Stakeholders</Button>
              </div>
              {(irData.contacts[team] || []).map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}`, fontSize: 11, color: colors.text }}>
                  <div style={{ flex: 1 }}>
                    <strong>{c.name}</strong> — {c.role} {c.email && <span style={{ color: colors.textDim }}>({c.email})</span>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={async () => {
                    const r = await modal.showPrompt("Edit Contact", [
                      { key: "name", label: "Name", required: true, defaultValue: c.name },
                      { key: "role", label: "Role", defaultValue: c.role },
                      { key: "email", label: "Email", defaultValue: c.email },
                    ]);
                    if (!r) return;
                    updateIRData((p) => ({
                      ...p,
                      contacts: {
                        ...p.contacts,
                        [team]: p.contacts[team].map((x, idx) => idx === i ? { name: r.name.trim(), role: r.role || "", email: r.email || "" } : x),
                      },
                    }));
                  }}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => updateIRData((p) => ({
                    ...p, contacts: { ...p.contacts, [team]: p.contacts[team].filter((_, idx) => idx !== i) }
                  }))}>✕</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" style={{ marginTop: 6 }} onClick={async () => {
                const r = await modal.showPrompt("Add Contact", [{ key: "name", label: "Name", required: true }, { key: "role", label: "Role" }, { key: "email", label: "Email" }]);
                if (r) updateIRData((p) => ({ ...p, contacts: { ...p.contacts, [team]: [...p.contacts[team], { name: r.name, role: r.role || "", email: r.email || "" }] } }));
              }}>+ Add Manually</Button>
            </Card>
          ))}
        </div>
      )}

      {tab === "comms" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <h3 style={{ color: colors.white, margin: 0, fontSize: 13 }}>Communications SLA</h3>
            {irData.commsSLA && (
              <Button variant="ghost" size="sm" onClick={async () => {
                const ok = await modal.showConfirm("Reset Schedule", "Restore the default communications SLA?", "danger");
                if (!ok) return;
                updateIRData((p) => ({ ...p, commsSLA: undefined }));
              }}>Reset to Default</Button>
            )}
          </div>
          <div style={{ color: colors.textDim, fontSize: 10, fontStyle: "italic", marginBottom: 12 }}>
            Cadence for stakeholder communications during an active incident. Adjust the times and labels to match your operating rhythm.
          </div>

          {(["first72", "after72"] as const).map((group) => (
            <div key={group} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ color: colors.teal, fontSize: 11, fontWeight: 700 }}>
                  {group === "first72" ? "First 72 Hours" : "After 72 Hours"}
                </div>
                <Button variant="ghost" size="sm" onClick={async () => {
                  const r = await modal.showPrompt(
                    "Add Communication Slot",
                    [
                      { key: "time", label: "Time", required: true, placeholder: "e.g. 08:30 or 4:30 PM" },
                      { key: "label", label: "Description", required: true, placeholder: "e.g. Morning Update" },
                    ],
                    `Adds a slot to ${group === "first72" ? "the first 72 hours" : "the steady-state cadence"}.`
                  );
                  if (!r) return;
                  updateIRData((p) => {
                    const next = {
                      first72: p.commsSLA?.first72 ?? DEFAULT_COMMS_SLA.first72,
                      after72: p.commsSLA?.after72 ?? DEFAULT_COMMS_SLA.after72,
                      notes: p.commsSLA?.notes ?? DEFAULT_COMMS_SLA.notes,
                    };
                    next[group] = [...next[group], { time: r.time.trim(), label: r.label.trim() }];
                    return { ...p, commsSLA: next };
                  });
                }}>+ Slot</Button>
              </div>
              {sla[group].length === 0 && (
                <div style={{ color: colors.textDim, fontSize: 10, fontStyle: "italic", padding: "4px 0" }}>No slots — add one above.</div>
              )}
              {sla[group].map((entry, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <span style={{ fontSize: 11 }}>🕐</span>
                  <span style={{ color: colors.text, fontSize: 11, width: 80, fontWeight: 600 }}>{entry.time}</span>
                  <span style={{ color: colors.text, fontSize: 11, flex: 1 }}>{entry.label}</span>
                  <Button variant="ghost" size="sm" onClick={async () => {
                    const r = await modal.showPrompt(
                      "Edit Communication Slot",
                      [
                        { key: "time", label: "Time", required: true, defaultValue: entry.time },
                        { key: "label", label: "Description", required: true, defaultValue: entry.label },
                      ]
                    );
                    if (!r) return;
                    updateIRData((p) => {
                      const next = {
                        first72: p.commsSLA?.first72 ?? DEFAULT_COMMS_SLA.first72,
                        after72: p.commsSLA?.after72 ?? DEFAULT_COMMS_SLA.after72,
                        notes: p.commsSLA?.notes ?? DEFAULT_COMMS_SLA.notes,
                      };
                      next[group] = next[group].map((x, idx) => idx === i ? { time: r.time.trim(), label: r.label.trim() } : x);
                      return { ...p, commsSLA: next };
                    });
                  }}>✎</Button>
                  <Button variant="ghost" size="sm" onClick={() => updateIRData((p) => {
                    const next = {
                      first72: p.commsSLA?.first72 ?? DEFAULT_COMMS_SLA.first72,
                      after72: p.commsSLA?.after72 ?? DEFAULT_COMMS_SLA.after72,
                      notes: p.commsSLA?.notes ?? DEFAULT_COMMS_SLA.notes,
                    };
                    next[group] = next[group].filter((_, idx) => idx !== i);
                    return { ...p, commsSLA: next };
                  })}>✕</Button>
                </div>
              ))}
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${colors.panelBorder}`, paddingTop: 10, marginTop: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ color: colors.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Notes</div>
              <Button variant="ghost" size="sm" onClick={async () => {
                const r = await modal.showPrompt(
                  "Edit Notes",
                  [{ key: "notes", label: "Notes", required: true, type: "textarea", defaultValue: sla.notes }],
                  "Shown beneath the communications SLA — typically a reminder about out-of-band comms and privilege markings."
                );
                if (!r) return;
                updateIRData((p) => ({
                  ...p,
                  commsSLA: {
                    first72: p.commsSLA?.first72 ?? DEFAULT_COMMS_SLA.first72,
                    after72: p.commsSLA?.after72 ?? DEFAULT_COMMS_SLA.after72,
                    notes: r.notes.trim(),
                  },
                }));
              }}>Edit</Button>
            </div>
            <p style={{ color: colors.textMuted, fontSize: 11, margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{sla.notes}</p>
          </div>
        </Card>
      )}

      {tab === "emergency" && (
        <Card style={{ background: "linear-gradient(135deg,#7f1d1d,#450a0a)", border: `1px solid ${colors.red}33`, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🚨</div>
          <h2 style={{ color: "#fca5a5", margin: "0 0 8px", fontSize: 16 }}>Active Incident</h2>
          <p style={{ color: "#fecaca", fontSize: 11, maxWidth: 400, margin: "0 auto 14px" }}>Contact Dark Rock immediately.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <Button variant="danger" onClick={() => window.open("mailto:IncidentResponse@Darkrocklabs.com?subject=ACTIVE+INCIDENT", "_blank")}>Email IR Team</Button>
            <Button variant="outline" style={{ borderColor: "#fca5a5", color: "#fca5a5" }} onClick={() => setPage("commander")}>Launch Commander</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
