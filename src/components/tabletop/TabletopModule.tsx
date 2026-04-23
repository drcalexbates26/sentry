"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { Badge, Button, Card, Input, Select, SectionHeader } from "@/components/ui";

interface Exercise {
  id: number; title: string; scenario: string; date: string; facilitator: string;
  participants: string; status: string; rating: number; notes: string;
}

export function TabletopModule() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [nf, setNf] = useState({ title: "", scenario: "", date: "", facilitator: "", participants: "", notes: "" });

  return (
    <div>
      <SectionHeader sub="ATLAS integration, exercise tracking, and IR retainer contact">Tabletop Exercises</SectionHeader>

      <Card style={{ marginBottom: 16, background: `linear-gradient(135deg,${colors.teal}08,${colors.panel})`, borderColor: colors.teal + "33" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: colors.teal + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎯</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: colors.teal, fontWeight: 700, fontSize: 13 }}>Dark Rock Labs ATLAS</div>
            <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>Automated tabletop exercise platform</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <Button size="sm" onClick={() => window.open("https://darkrocksec.com", "_blank")}>Launch ATLAS →</Button>
              <Badge color={colors.green}>LIVE</Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16, borderLeft: `3px solid ${colors.orange}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🛡️</span>
          <div>
            <div style={{ color: colors.orange, fontWeight: 700, fontSize: 12 }}>Dark Rock IR Retainer</div>
            <div style={{ color: colors.textMuted, fontSize: 10 }}>$350/hr · 10hr minimum ($3,500) · IncidentResponse@Darkrocklabs.com</div>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Button onClick={() => setShowNew(true)}>+ Schedule Exercise</Button>
      </div>

      {showNew && (
        <Card style={{ marginBottom: 12, borderColor: colors.teal + "44" }}>
          <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14 }}>Schedule Tabletop Exercise</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Input label="Exercise Title" value={nf.title} onChange={(v) => setNf((p) => ({ ...p, title: v }))} placeholder="Annual Ransomware TTX" />
            <Input label="Date" value={nf.date} onChange={(v) => setNf((p) => ({ ...p, date: v }))} type="date" />
            <Input label="Facilitator" value={nf.facilitator} onChange={(v) => setNf((p) => ({ ...p, facilitator: v }))} placeholder="Dark Rock Labs" />
            <Input label="Participants" value={nf.participants} onChange={(v) => setNf((p) => ({ ...p, participants: v }))} placeholder="Core IRT, Executive Team" />
          </div>
          <Input label="Scenario Description" value={nf.scenario} onChange={(v) => setNf((p) => ({ ...p, scenario: v }))} textarea rows={3} placeholder="Ransomware attack on critical infrastructure..." />
          <div style={{ display: "flex", gap: 6 }}>
            <Button onClick={() => {
              if (nf.title) {
                setExercises((p) => [{ id: Date.now(), ...nf, status: "Scheduled", rating: 0, notes: "" }, ...p]);
                setShowNew(false);
                setNf({ title: "", scenario: "", date: "", facilitator: "", participants: "", notes: "" });
              }
            }}>Schedule</Button>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {exercises.length === 0 ? (
        <Card style={{ textAlign: "center" }}>
          <p style={{ color: colors.textDim, fontSize: 12 }}>No exercises scheduled. Use ATLAS for automated exercises or schedule one manually.</p>
        </Card>
      ) : exercises.map((ex) => (
        <Card key={ex.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: colors.white, fontSize: 13, fontWeight: 600 }}>{ex.title}</div>
              <div style={{ color: colors.textDim, fontSize: 10, marginTop: 2 }}>{ex.date} · {ex.facilitator} · {ex.participants}</div>
            </div>
            <Badge color={ex.status === "Completed" ? colors.green : colors.teal}>{ex.status}</Badge>
          </div>
          {ex.scenario && <p style={{ color: colors.textMuted, fontSize: 11, margin: "8px 0 0", lineHeight: 1.4 }}>{ex.scenario}</p>}
        </Card>
      ))}
    </div>
  );
}
