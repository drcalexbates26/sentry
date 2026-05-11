"use client";

import { useState, useEffect } from "react";
import { useColors } from "@/lib/theme";
import { Button, Card, Input, Select } from "@/components/ui";
import type { Playbook } from "@/types/playbook";
import type { CustomPlaybookInput } from "@/app/app/_actions";

const CATEGORIES = [
  "Malware",
  "Social Engineering",
  "OWASP Top 10",
  "AI/ML Threats",
  "Identity & Access",
  "Cloud Security",
  "Advanced Threats",
  "Data Protection",
  "Supply Chain",
  "Insider Threat",
  "Availability",
  "Custom",
];

const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const ICONS = ["📋", "🛡️", "💀", "📧", "🎣", "💉", "🔓", "🤖", "🔑", "☁️", "💣", "📊", "🔗", "👤", "🚨", "🪪", "📲", "🗝️", "☸️", "🧠", "🌐", "⚙️"];

interface PlaybookEditorProps {
  /** When editing an existing custom — pre-populate from this. */
  initial?: Partial<Playbook> & { id?: string; sourcePlaybookId?: string | null };
  /** When duplicating a preset — pre-populate from the preset (no id). */
  forkFrom?: Playbook;
  onSave: (data: CustomPlaybookInput) => Promise<void> | void;
  onCancel: () => void;
  saving?: boolean;
}

export function PlaybookEditor({ initial, forkFrom, onSave, onCancel, saving }: PlaybookEditorProps) {
  const colors = useColors();
  const seed = initial ?? forkFrom;

  const [name, setName] = useState(seed?.name ? (forkFrom ? `${seed.name} (Copy)` : seed.name) : "");
  const [cat, setCat] = useState(seed?.cat ?? "Custom");
  const [sev, setSev] = useState<"Low" | "Medium" | "High" | "Critical">((seed?.sev as "Low" | "Medium" | "High" | "Critical") ?? "Medium");
  const [icon, setIcon] = useState(seed?.icon ?? "📋");
  const [desc, setDesc] = useState(seed?.desc ?? "");
  const [iocs, setIocs] = useState<string[]>(seed?.iocs ?? [""]);
  const [contain, setContain] = useState<string[]>(seed?.contain ?? [""]);
  const [erad, setErad] = useState<string[]>(seed?.erad ?? [""]);
  const [recover, setRecover] = useState<string[]>(seed?.recover ?? [""]);
  const [mitre, setMitre] = useState<string[]>(seed?.mitre ?? [""]);

  // Reset whenever seed changes (e.g. user opens editor for a different playbook)
  useEffect(() => {
    const s = initial ?? forkFrom;
    if (!s) return;
    setName(s.name ? (forkFrom ? `${s.name} (Copy)` : s.name) : "");
    setCat(s.cat ?? "Custom");
    setSev((s.sev as "Low" | "Medium" | "High" | "Critical") ?? "Medium");
    setIcon(s.icon ?? "📋");
    setDesc(s.desc ?? "");
    setIocs(s.iocs ?? [""]);
    setContain(s.contain ?? [""]);
    setErad(s.erad ?? [""]);
    setRecover(s.recover ?? [""]);
    setMitre(s.mitre ?? [""]);
  }, [initial, forkFrom]);

  const submit = () => {
    const payload: CustomPlaybookInput = {
      id: initial?.id,
      sourcePlaybookId: forkFrom?.id ?? initial?.sourcePlaybookId ?? null,
      name,
      cat,
      sev,
      icon,
      desc,
      iocs: iocs.filter((s) => s.trim()),
      contain: contain.filter((s) => s.trim()),
      erad: erad.filter((s) => s.trim()),
      recover: recover.filter((s) => s.trim()),
      mitre: mitre.filter((s) => s.trim()),
    };
    void onSave(payload);
  };

  const heading = forkFrom ? `Duplicate "${forkFrom.name}"` : initial?.id ? `Edit ${initial.name ?? "playbook"}` : "New Playbook";

  return (
    <Card style={{ marginBottom: 14, borderColor: colors.teal + "55" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ color: colors.white, margin: 0, fontSize: 14 }}>{heading}</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>Close</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px", marginBottom: 8 }}>
        <Input label="Name *" value={name} onChange={setName} placeholder="Custom Playbook Name" />
        <Select label="Category *" value={cat} onChange={setCat} options={CATEGORIES} />
        <Select label="Severity" value={sev} onChange={(v) => setSev(v as "Low" | "Medium" | "High" | "Critical")} options={SEVERITIES} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block", fontSize: 10, color: colors.textMuted, marginBottom: 4, fontWeight: 600, letterSpacing: "0.04em" }}>Icon</label>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {ICONS.map((ic) => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              type="button"
              style={{
                padding: "4px 8px",
                fontSize: 16,
                background: ic === icon ? colors.teal + "33" : colors.obsidianM,
                border: `1px solid ${ic === icon ? colors.teal : colors.panelBorder}`,
                borderRadius: 6,
                cursor: "pointer",
              }}
            >{ic}</button>
          ))}
        </div>
      </div>

      <Input label="Description *" value={desc} onChange={setDesc} textarea rows={2} placeholder="One-paragraph summary of when this playbook applies and the threat actor's typical objective." />

      <PhaseEditor label="Indicators of Compromise" hint="One IOC per line — the signals that this playbook applies." color={colors.red} value={iocs} onChange={setIocs} />
      <PhaseEditor label="Containment Actions" hint="Stop-the-bleed steps. Run these first." color={colors.orange} value={contain} onChange={setContain} />
      <PhaseEditor label="Eradication Steps" hint="Remove the adversary and remediate root cause." color={colors.yellow} value={erad} onChange={setErad} />
      <PhaseEditor label="Recovery Procedures" hint="Restore operations safely and validate integrity." color={colors.green} value={recover} onChange={setRecover} />
      <PhaseEditor label="MITRE ATT&CK Techniques" hint="e.g. T1486 Data Encrypted for Impact" color={colors.blue} value={mitre} onChange={setMitre} compact />

      <div style={{ display: "flex", gap: 6, marginTop: 12, justifyContent: "flex-end" }}>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={submit} disabled={saving || !name.trim() || !desc.trim()}>{saving ? "Saving…" : "Save Playbook"}</Button>
      </div>
    </Card>
  );
}

function PhaseEditor({
  label, hint, color, value, onChange, compact,
}: {
  label: string;
  hint: string;
  color: string;
  value: string[];
  onChange: (v: string[]) => void;
  compact?: boolean;
}) {
  const colors = useColors();
  const update = (i: number, v: string) => {
    const next = [...value];
    next[i] = v;
    onChange(next);
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, ""]);

  return (
    <div style={{ marginTop: 10, padding: "8px 10px", background: colors.obsidianM, borderLeft: `3px solid ${color}`, borderRadius: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div>
          <div style={{ color: colors.white, fontSize: 11, fontWeight: 700 }}>{label}</div>
          <div style={{ color: colors.textDim, fontSize: 9, marginTop: 1 }}>{hint}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={add}>+ Add</Button>
      </div>
      {value.map((v, i) => (
        <div key={i} style={{ display: "flex", gap: 4, alignItems: "flex-start", marginBottom: 4 }}>
          <span style={{ color: color, fontSize: 10, fontWeight: 700, minWidth: 14, paddingTop: 6 }}>{i + 1}.</span>
          {compact ? (
            <Input value={v} onChange={(s) => update(i, s)} placeholder="Tnnnn Technique Name" />
          ) : (
            <Input value={v} onChange={(s) => update(i, s)} textarea rows={1} placeholder="Action step…" />
          )}
          <Button variant="ghost" size="sm" onClick={() => remove(i)} style={{ color: colors.red, minWidth: 24 }}>✕</Button>
        </div>
      ))}
    </div>
  );
}
