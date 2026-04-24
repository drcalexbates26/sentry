"use client";

import { useState } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card, Checkbox, SectionHeader, useModal } from "@/components/ui";
import { IR_PHASES, SEV_LEVELS } from "@/data/ir-phases";

export function IRPlanner() {
  const { irData, updateIRData, addTicket, addLesson, addTask, setPage } = useStore();
  const colors = useColors();
  const modal = useModal();
  const [tab, setTab] = useState("lifecycle");

  return (
    <div>
      <SectionHeader sub="Full 8-phase NIST 800-61 lifecycle with Dark Rock forensics">IR Planner</SectionHeader>
      <div style={{ display: "flex", gap: 3, marginBottom: 16, flexWrap: "wrap", borderBottom: `1px solid ${colors.panelBorder}`, paddingBottom: 6 }}>
        {["lifecycle", "severity", "contacts", "eoc", "emergency"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "5px 12px", borderRadius: "5px 5px 0 0", border: "none", cursor: "pointer", background: tab === t ? colors.teal + "22" : "transparent", color: tab === t ? colors.teal : colors.textMuted, fontSize: 11, fontWeight: 600, fontFamily: "inherit", textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>

      {tab === "lifecycle" && IR_PHASES.map((ph) => {
        const ckCnt = ph.steps.filter((_, i) => irData.checked[`${ph.id}_${i}`]).length;
        return (
          <Card key={ph.id} style={{ marginBottom: 12, borderLeft: `3px solid ${ckCnt === ph.steps.length ? colors.green : colors.teal}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{ph.ico}</span>
                <h3 style={{ color: colors.white, margin: 0, fontSize: 13 }}>{ph.n}</h3>
              </div>
              <Badge color={ckCnt === ph.steps.length ? colors.green : colors.textMuted}>{ckCnt}/{ph.steps.length}</Badge>
            </div>
            {ph.steps.map((s, i) => (
              <Checkbox key={i} label={s} checked={!!irData.checked[`${ph.id}_${i}`]}
                onChange={() => updateIRData((p) => ({ ...p, checked: { ...p.checked, [`${ph.id}_${i}`]: !p.checked[`${ph.id}_${i}`] } }))} />
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
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
          {SEV_LEVELS.map((l) => (
            <div key={l.lv} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
              <Badge color={l.c} className="min-w-[55px] text-center">{l.lv}</Badge>
              <div>
                <p style={{ color: colors.text, fontSize: 12, margin: "0 0 3px" }}>{l.desc}</p>
                <p style={{ color: colors.textDim, fontSize: 10, margin: 0, fontStyle: "italic" }}>{l.act}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "contacts" && (
        <div>
          <Card style={{ marginBottom: 12, borderColor: colors.teal + "33" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🛡️</span>
              <div>
                <div style={{ color: colors.teal, fontWeight: 700, fontSize: 12 }}>Dark Rock Cybersecurity - External IR</div>
                <div style={{ color: colors.textMuted, fontSize: 10 }}>IncidentResponse@Darkrocklabs.com</div>
              </div>
            </div>
          </Card>
          {(["core", "extended", "external"] as const).map((team) => (
            <Card key={team} style={{ marginBottom: 12 }}>
              <h4 style={{ color: colors.white, marginTop: 0, fontSize: 12 }}>
                {team === "core" ? "Core IRT" : team === "extended" ? "Extended IRT" : "External Partners"}
              </h4>
              {(irData.contacts[team] || []).map((c, i) => (
                <div key={i} style={{ fontSize: 11, padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}`, color: colors.text }}>
                  <strong>{c.name}</strong> - {c.role} ({c.email})
                  <Button variant="ghost" size="sm" onClick={() => updateIRData((p) => ({
                    ...p, contacts: { ...p.contacts, [team]: p.contacts[team].filter((_, idx) => idx !== i) }
                  }))}>✕</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" style={{ marginTop: 6 }} onClick={async () => {
                const r = await modal.showPrompt("Add Contact", [{ key: "name", label: "Name", required: true }, { key: "role", label: "Role" }, { key: "email", label: "Email" }]);
                if (r) updateIRData((p) => ({ ...p, contacts: { ...p.contacts, [team]: [...p.contacts[team], { name: r.name, role: r.role || "", email: r.email || "" }] } }));
              }}>+ Add</Button>
            </Card>
          ))}
        </div>
      )}

      {tab === "eoc" && (
        <Card>
          <h3 style={{ color: colors.white, marginTop: 0, fontSize: 13 }}>Battle Rhythm</h3>
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: colors.teal, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>First 72 Hours</div>
            {["8:30 AM - Morning Update", "12:00 PM - Midday Update", "4:30 PM - EOD Update"].map((t) => (
              <div key={t} style={{ padding: "3px 0", color: colors.text, fontSize: 11 }}>🕐 {t}</div>
            ))}
          </div>
          <div>
            <div style={{ color: colors.teal, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>After 72 Hours</div>
            <div style={{ color: colors.text, fontSize: 11 }}>🕐 4:30 PM Daily + ad hoc</div>
          </div>
          <p style={{ color: colors.textMuted, fontSize: 11, marginTop: 12, lineHeight: 1.5 }}>
            If admin accounts compromised, use out-of-band communications. Mark all correspondence &quot;Privileged and Confidential&quot; if directed by counsel.
          </p>
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
