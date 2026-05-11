"use client";

import { useMemo, useState } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card } from "@/components/ui";
import { generateHitlist, type HitlistItem, type HitlistBucket } from "@/lib/assessment-hitlist";
import type { Assessment } from "@/types/assessment";

const BUCKETS: { key: HitlistBucket; label: string; sub: string; tone: "teal" | "blue" | "purple" }[] = [
  { key: "shortTerm", label: "Short-term wins", sub: "0–30 days · automatable or low-effort", tone: "teal" },
  { key: "achievable", label: "Achievable", sub: "1–3 months · moderate investment", tone: "blue" },
  { key: "aspirational", label: "Aspirational", sub: "3–12 months · transformational", tone: "purple" },
];

export function HitlistSection({ assessment }: { assessment: Assessment }) {
  const colors = useColors();
  const tech = useStore((s) => s.tech);
  const addTask = useStore((s) => s.addTask);

  const hitlist = useMemo(() => generateHitlist(assessment, tech), [assessment, tech]);

  const tone = (t: "teal" | "blue" | "purple") =>
    t === "teal" ? colors.teal : t === "blue" ? colors.blue : colors.purple;

  return (
    <Card style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ color: colors.white, margin: 0, fontSize: 14 }}>Resilience Hitlist</h3>
          <p style={{ color: colors.textMuted, fontSize: 11, margin: "4px 0 0", lineHeight: 1.5, maxWidth: 720 }}>
            Recommendations bucketed by effort and impact. Each item maps back to a CSF 2.0 control,
            tells you the &ldquo;why,&rdquo; and flags whether your current tech stack can automate it.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Stat label="Items" value={hitlist.totals.items} color={colors.text} />
          <Stat label="Automatable" value={hitlist.totals.automatable} color={colors.teal} />
          <Stat label="Est. Lift" value={`+${hitlist.totals.estimatedTotalLift}`} suffix=" pts" color={colors.green} />
        </div>
      </div>

      {hitlist.totals.items === 0 ? (
        <div style={{ padding: "20px 0", color: colors.textDim, fontSize: 12, textAlign: "center" }}>
          No gaps detected at the current scoring threshold. Strong work.
        </div>
      ) : (
        BUCKETS.map(({ key, label, sub, tone: t }) => {
          const items = hitlist[key];
          if (items.length === 0) return null;
          return (
            <div key={key} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: tone(t) + "0F", border: `1px solid ${tone(t)}33`, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: tone(t), boxShadow: `0 0 8px ${tone(t)}88` }} />
                <span style={{ color: tone(t), fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {label}
                </span>
                <span style={{ color: colors.textMuted, fontSize: 11 }}>{sub}</span>
                <span style={{ marginLeft: "auto", color: colors.text, fontSize: 11, fontWeight: 700 }}>{items.length} item{items.length === 1 ? "" : "s"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((item) => (
                  <HitlistRow key={item.questionId} item={item} accent={tone(t)} onCreateTask={() => {
                    addTask({
                      id: Date.now() + Math.floor(Math.random() * 1000),
                      title: `[Hitlist:${item.bucket}] ${item.title}`,
                      priority: item.bucket === "shortTerm" ? "High" : item.bucket === "achievable" ? "Medium" : "Low",
                      status: "Backlog",
                      assignee: "",
                      updates: [],
                      created: new Date().toLocaleDateString(),
                      source: `Assessment Hitlist · ${item.questionId}`,
                    });
                  }} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </Card>
  );
}

function HitlistRow({ item, accent, onCreateTask }: { item: HitlistItem; accent: string; onCreateTask: () => void }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        background: colors.obsidianM,
        border: `1px solid ${colors.panelBorder}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "12px 14px",
          background: "transparent",
          border: 0,
          cursor: "pointer",
          textAlign: "left",
          color: "inherit",
          fontFamily: "inherit",
          gap: 10,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
            <Badge>{item.questionId}</Badge>
            <Badge color={colors.textDim}>{item.csfFunction}</Badge>
            {item.automatable && <Badge color={colors.teal}>AUTOMATABLE</Badge>}
            <Badge color={colors.orange}>+{item.scoreLift} pts</Badge>
            <Badge color={colors.textDim}>{item.effortDays}d</Badge>
          </div>
          <div style={{ color: colors.white, fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{item.title}</div>
          <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>
            {item.csfCategory} · scored {item.currentScore}/4 · weight {item.weight}
          </div>
        </div>
        <span style={{ color: accent, fontSize: 12, paddingTop: 4 }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px 14px", borderTop: `1px solid ${colors.panelBorder}` }}>
          <Section label="WHY IT MATTERS" color={colors.textMuted}>{item.why}</Section>
          <Section label="ADVICE" color={colors.textMuted}>{item.advice}</Section>
          <div style={{ color: colors.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginTop: 12, marginBottom: 6 }}>
            CONCRETE STEPS
          </div>
          <ol style={{ margin: 0, paddingLeft: 22, color: colors.text, fontSize: 12, lineHeight: 1.65 }}>
            {item.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>

          <div style={{ marginTop: 14, padding: "10px 12px", background: item.automatable ? colors.teal + "0F" : colors.obsidian, border: `1px solid ${item.automatable ? colors.teal + "44" : colors.panelBorder}`, borderRadius: 7, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ color: colors.text, fontSize: 11, lineHeight: 1.5 }}>
              {item.automatable ? (
                <>
                  <strong style={{ color: colors.teal }}>Your {item.automationDriver ?? "tooling"} can automate this.</strong>{" "}
                  Most steps run as policies you configure once and forget.
                </>
              ) : (
                <>
                  <strong style={{ color: colors.textMuted }}>Manual / process change.</strong>{" "}
                  No tool in your stack drives this automatically — it&rsquo;s policy and follow-through.
                </>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onCreateTask}>Create Task →</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ color, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
      <div style={{ color: colors.text, fontSize: 12.5, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function Stat({ label, value, suffix, color }: { label: string; value: number | string; suffix?: string; color: string }) {
  const colors = useColors();
  const tileBg = `${colors.text}08`;
  const tileBorder = `${colors.text}14`;
  return (
    <div style={{ minWidth: 70, padding: "8px 12px", borderRadius: 8, background: tileBg, border: `1px solid ${tileBorder}`, textAlign: "center" }}>
      <div style={{ color, fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{value}{suffix ?? ""}</div>
      <div style={{ color: colors.textMuted, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>{label}</div>
    </div>
  );
}
