"use client";

import { useState, useEffect, useMemo } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card, useModal } from "@/components/ui";
import { sendNotificationEmail } from "@/app/app/_actions";
import { NOTIFICATION_TEMPLATES, templatesForDeadline, type NotificationTemplate } from "@/data/notification-templates";
import type { Incident } from "@/types/incident";
import type { StakeholderPerson } from "@/types/stakeholder";

/**
 * Pre-filled notification templates. Shown above the existing Battle Rhythm
 * panel in NotificationCenter — gives the IC a one-click path to declare,
 * update, file with regulators, brief stakeholders, or close out without
 * authoring copy by hand.
 *
 * Recipients are picked from the union of stakeholder contacts + free-text
 * additions. Send fires the same sendNotificationEmail server action the
 * rest of the platform uses.
 */
interface Props {
  incident: Incident;
}

export function NotificationTemplateBank({ incident }: Props) {
  const colors = useColors();
  const modal = useModal();
  const orgName = useStore((s) => s.org?.name ?? "Organization");
  const stakeholders = useStore((s) => s.stakeholders);

  const [openTemplate, setOpenTemplate] = useState<NotificationTemplate | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [extraEmails, setExtraEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<NotificationTemplate["category"] | "All">("All");

  // Hook for the deadline-click path: when a Reporting Deadline row in the
  // Overview panel sets this sessionStorage key, auto-open the matching template.
  useEffect(() => {
    try {
      const target = window.sessionStorage.getItem("sentry_notify_for_deadline");
      if (!target) return;
      window.sessionStorage.removeItem("sentry_notify_for_deadline");
      const candidates = templatesForDeadline(target);
      if (candidates[0]) setOpenTemplate(candidates[0]);
    } catch { /* private mode */ }
  }, []);

  // Build the recipient pool: every stakeholder person with an email,
  // grouped by stakeholder group for a clean picker.
  const recipientPool = useMemo(() => {
    const pool: { id: string; name: string; email: string; group: string }[] = [];
    for (const [groupKey, value] of Object.entries(stakeholders)) {
      if (!Array.isArray(value)) continue;
      for (const raw of value as Array<StakeholderPerson | unknown>) {
        if (typeof raw !== "object" || raw === null) continue;
        const p = raw as Partial<StakeholderPerson>;
        if (p.email && p.firstName) {
          pool.push({
            id: `${groupKey}:${p.id ?? p.email}`,
            name: `${p.firstName} ${p.lastName ?? ""}`.trim(),
            email: p.email,
            group: groupKey,
          });
        }
      }
    }
    return pool;
  }, [stakeholders]);

  const categories: Array<NotificationTemplate["category"] | "All"> = ["All", "Declaration", "Update", "Regulatory", "Stakeholder", "Closure"];
  const visible = filter === "All" ? NOTIFICATION_TEMPLATES : NOTIFICATION_TEMPLATES.filter((t) => t.category === filter);

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const collectRecipientEmails = (): string[] => {
    const fromPool = recipientPool.filter((r) => selectedRecipients.has(r.id)).map((r) => r.email);
    const fromInput = extraEmails.split(/[,\s]+/).map((s) => s.trim()).filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
    return Array.from(new Set([...fromPool, ...fromInput]));
  };

  const send = async () => {
    if (!openTemplate) return;
    const to = collectRecipientEmails();
    if (to.length === 0) {
      await modal.showAlert("Pick at least one recipient", "Select stakeholders from the list or paste comma-separated emails into the recipients box.");
      return;
    }
    const ctx = { incident, orgName, sentAt: new Date().toLocaleString() };
    setSending(true);
    const res = await sendNotificationEmail({
      to,
      subject: openTemplate.subject(ctx),
      body: openTemplate.body(ctx).replace(/\n/g, "<br/>"),
      classification: openTemplate.classification,
      privileged: openTemplate.privileged,
    });
    setSending(false);
    if (!res.ok) {
      await modal.showAlert("Email send failed", res.error ?? "Unknown error. Check the Resend setup.");
      return;
    }
    await modal.showAlert(
      "✓ Notification sent",
      `${openTemplate.label} delivered to ${res.recipientCount} recipient${res.recipientCount === 1 ? "" : "s"}.`,
    );
    setOpenTemplate(null);
    setSelectedRecipients(new Set());
    setExtraEmails("");
  };

  const catColor = (c: NotificationTemplate["category"]) =>
    c === "Declaration" ? colors.red
      : c === "Update" ? colors.orange
      : c === "Regulatory" ? colors.purple
      : c === "Stakeholder" ? colors.teal
      : c === "Closure" ? colors.green
      : colors.textMuted;

  return (
    <Card style={{ marginBottom: 14, borderColor: colors.teal + "33" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: colors.tealLight, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Notification Templates</div>
          <div style={{ color: colors.text, fontSize: 13, fontWeight: 700, marginTop: 2 }}>Pre-filled communications for every phase</div>
          <p style={{ color: colors.textMuted, fontSize: 11, margin: "4px 0 0", maxWidth: 640, lineHeight: 1.5 }}>
            Pick a template → choose recipients from your stakeholders → review → send. Variables (incident title, scope, IOCs, roster, timestamps) are auto-substituted from the current incident.
          </p>
        </div>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              style={{
                padding: "4px 10px", borderRadius: 999, fontFamily: "inherit",
                background: filter === c ? (c === "All" ? colors.teal + "1F" : catColor(c as NotificationTemplate["category"]) + "1F") : "transparent",
                color: filter === c ? (c === "All" ? colors.teal : catColor(c as NotificationTemplate["category"])) : colors.textMuted,
                border: `1px solid ${filter === c ? (c === "All" ? colors.teal + "55" : catColor(c as NotificationTemplate["category"]) + "55") : colors.panelBorder}`,
                fontSize: 10, fontWeight: 700, cursor: "pointer",
              }}
            >{c}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
        {visible.map((t) => {
          const color = catColor(t.category);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => { setOpenTemplate(t); setSelectedRecipients(new Set()); setExtraEmails(""); }}
              style={{
                textAlign: "left", padding: 12, borderRadius: 8,
                background: colors.obsidianM, border: `1px solid ${colors.panelBorder}`,
                borderLeft: `3px solid ${color}`,
                color: colors.text, cursor: "pointer", fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = color + "55"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = colors.panelBorder; (e.currentTarget as HTMLElement).style.borderLeftColor = color; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 6 }}>
                <span style={{ color: colors.white, fontSize: 11, fontWeight: 700 }}>{t.label}</span>
                <Badge color={color}>{t.category}</Badge>
              </div>
              <div style={{ color: colors.textMuted, fontSize: 10, lineHeight: 1.4, marginBottom: 6 }}>{t.description}</div>
              <div style={{ color: colors.textDim, fontSize: 9 }}>{t.suggestedAudience}</div>
            </button>
          );
        })}
      </div>

      {/* Picker / preview modal */}
      {openTemplate && (() => {
        const ctx = { incident, orgName, sentAt: new Date().toLocaleString() };
        const subject = openTemplate.subject(ctx);
        const body = openTemplate.body(ctx);
        const selectedCount = collectRecipientEmails().length;
        const grouped = recipientPool.reduce<Record<string, typeof recipientPool>>((acc, r) => {
          (acc[r.group] = acc[r.group] || []).push(r);
          return acc;
        }, {});

        return (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setOpenTemplate(null); }}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 20,
            }}
          >
            <div style={{
              background: colors.panel, border: `1px solid ${colors.panelBorder}`,
              borderRadius: 10, width: "100%", maxWidth: 880, maxHeight: "90vh",
              display: "flex", flexDirection: "column", overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${colors.panelBorder}`, background: colors.obsidianM }}>
                <div>
                  <div style={{ color: colors.text, fontSize: 14, fontWeight: 800 }}>{openTemplate.label}</div>
                  <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{openTemplate.description}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setOpenTemplate(null)}>Close</Button>
              </div>

              <div style={{ overflowY: "auto", padding: "16px 20px", display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}>
                {/* Recipients picker */}
                <div>
                  <div style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Recipients</div>
                  <div style={{ color: colors.textMuted, fontSize: 10, marginBottom: 10, lineHeight: 1.5 }}>
                    Suggested audience: <strong style={{ color: colors.text }}>{openTemplate.suggestedAudience}</strong>
                  </div>

                  {Object.keys(grouped).length === 0 ? (
                    <div style={{ color: colors.textDim, fontSize: 10, fontStyle: "italic", padding: "8px 0" }}>
                      No stakeholder contacts with emails yet. Add them in the Stakeholders module.
                    </div>
                  ) : (
                    Object.entries(grouped).map(([group, rows]) => (
                      <div key={group} style={{ marginBottom: 10 }}>
                        <div style={{ color: colors.tealLight, fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", marginBottom: 3 }}>{group}</div>
                        {rows.map((r) => (
                          <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", cursor: "pointer" }}>
                            <input type="checkbox" checked={selectedRecipients.has(r.id)} onChange={() => toggleRecipient(r.id)} style={{ accentColor: colors.teal }} />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ color: colors.text, fontSize: 11, fontWeight: 600 }}>{r.name}</div>
                              <div style={{ color: colors.textDim, fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    ))
                  )}

                  <div style={{ marginTop: 10 }}>
                    <label style={{ display: "block", color: colors.textDim, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Additional emails</label>
                    <textarea
                      value={extraEmails}
                      onChange={(e) => setExtraEmails(e.target.value)}
                      placeholder="counsel@firm.com, dpo@org.com"
                      rows={3}
                      style={{
                        width: "100%", padding: "8px 10px", boxSizing: "border-box",
                        background: colors.obsidianM, color: colors.text,
                        border: `1px solid ${colors.panelBorder}`, borderRadius: 6,
                        fontSize: 11, fontFamily: "inherit", outline: "none", resize: "vertical",
                      }}
                    />
                    <div style={{ color: colors.textDim, fontSize: 9, marginTop: 4 }}>Comma- or space-separated. Anything that doesn't look like an email is silently dropped.</div>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <div style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Subject</div>
                  <div style={{ padding: "8px 10px", background: colors.obsidianM, borderRadius: 6, color: colors.text, fontSize: 12, fontWeight: 600, border: `1px solid ${colors.panelBorder}`, marginBottom: 10 }}>{subject}</div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Body preview</div>
                    <Badge color={catColor(openTemplate.category)}>{openTemplate.classification}</Badge>
                  </div>
                  <pre style={{
                    background: colors.obsidianM, color: colors.text, padding: 12, borderRadius: 6,
                    border: `1px solid ${colors.panelBorder}`, fontSize: 11, lineHeight: 1.5,
                    fontFamily: "var(--font-mono, monospace)", whiteSpace: "pre-wrap",
                    maxHeight: 360, overflow: "auto", margin: 0,
                  }}>{body}</pre>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: `1px solid ${colors.panelBorder}`, background: colors.obsidianM }}>
                <div style={{ color: colors.textMuted, fontSize: 11 }}>
                  {selectedCount === 0 ? "Select recipients to enable Send." : `${selectedCount} recipient${selectedCount === 1 ? "" : "s"} selected`}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Button variant="secondary" onClick={() => setOpenTemplate(null)}>Cancel</Button>
                  <Button variant="outline" onClick={() => {
                    // Copy-to-clipboard alternative for OOB / approval-required cases.
                    const text = `TO: ${collectRecipientEmails().join(", ")}\nSUBJECT: ${subject}\nCLASSIFICATION: ${openTemplate.classification}\n\n${body}`;
                    navigator.clipboard?.writeText(text);
                    void modal.showAlert("Copied", "Subject + body copied to clipboard for manual sending.");
                  }}>Copy to clipboard</Button>
                  <Button onClick={send} disabled={sending || selectedCount === 0}>
                    {sending ? "Sending…" : `Send email${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </Card>
  );
}
