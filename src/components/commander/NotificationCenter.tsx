"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import type { IncidentNotificationRecord, NotificationType, RegulatoryFiling, CommHoldEntry, DeltaItem } from "@/types/notification";
import type { StakeholderPerson } from "@/types/stakeholder";
import type { Incident } from "@/types/incident";
import { Badge, Button, Card, Select, ProgressBar, useModal } from "@/components/ui";
import { buildGroupClocks, CADENCE_THRESHOLDS, GROUP_LABELS } from "@/lib/notifications/cadence";
import { captureIncidentSnapshot } from "@/lib/notifications/snapshot";
import { calculateDelta } from "@/lib/notifications/delta-engine";
import { buildNotificationContent } from "@/lib/notifications/content-builder";
import { resetGroupClock, type GroupClockState } from "@/lib/notifications/sla-reset";
import { requiresApproval, isTier4 } from "@/lib/notifications/approval";
import { detectOOBCondition } from "@/lib/notifications/oob-detection";
import { initializeFilings, getFilingTimeRemaining } from "@/lib/notifications/regulatory";
import { finalizeDraft, buildAuditSummary, exportCommunicationLog } from "@/lib/notifications/accountability";

const TIER_ICONS: Record<string, string> = {
  incidentCommander: "★", securityEngineers: "⚙️", ciso: "🛡️", riskContact: "📊",
  privacyContact: "🔏", executivePOC: "👔", cyberInsuranceInternal: "📋",
  cyberInsuranceExternal: "🏢", legalContact: "⚖️", externalLegal: "🏛️",
  forensicsContact: "🔬", hrContacts: "👥", prContact: "📣", lawEnforcement: "🚔",
};

const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: "kick_off", label: "Incident Kick-Off" },
  { value: "status_update", label: "Current Status Update" },
  { value: "phase_progression", label: "Phase Progression" },
  { value: "escalation", label: "Escalation" },
  { value: "closure", label: "Incident Closure" },
];

interface Props {
  incident: Incident;
}

export function NotificationCenter({ incident }: Props) {
  const { stakeholders, tasks, tickets } = useStore();
  const colors = useColors();
  const modal = useModal();

  // State
  const [clockStates, setClockStates] = useState<Record<string, GroupClockState>>({});
  const [commLog, setCommLog] = useState<IncidentNotificationRecord[]>([]);
  const [filings, setFilings] = useState<RegulatoryFiling[]>(() => initializeFilings(incident.startTime));
  const [commHold, setCommHold] = useState(false);
  const [commHoldBy, setCommHoldBy] = useState("");
  const [, setCommHoldHistory] = useState<CommHoldEntry[]>([]);
  const [oobMode, setOobMode] = useState(false);
  const [previewGroup, setPreviewGroup] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<NotificationType>("status_update");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  // Third party contacts — future implementation
  const [tick, setTick] = useState(0);

  // Real-time SLA tick
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(iv);
  }, []);

  // OOB detection
  const oobCondition = useMemo(() => detectOOBCondition(incident), [incident]);

  // Build group clocks with real-time status
  const groupClocks = useMemo(() => {
    void tick; // dependency trigger
    return buildGroupClocks(stakeholders, clockStates, incident.startTime);
  }, [stakeholders, clockStates, incident.startTime, tick]);

  // Current snapshot
  const currentSnapshot = useMemo(() => captureIncidentSnapshot(incident, tasks, tickets), [incident, tasks, tickets]);

  const CURRENT_USER = "Admin"; // Would come from auth

  // Get last notification for a group
  const getLastNotification = useCallback((groupKey: string) => {
    return commLog.filter((n) => n.groupKey === groupKey && !n.retracted).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0] || null;
  }, [commLog]);

  // Send notification
  const sendNotification = useCallback(async (groupKey: string, type: NotificationType, sendMethod: "clipboard" | "email_client" | "marked_sent") => {
    if (commHold) {
      await modal.showAlert("Communication Hold Active", `Communications are held by ${commHoldBy}. No notifications can be sent until the hold is released.`);
      return;
    }

    const config = CADENCE_THRESHOLDS[groupKey];
    if (!config) return;
    const people = (stakeholders[groupKey] as StakeholderPerson[]) || [];
    if (people.length === 0) {
      await modal.showAlert("No Contacts", `No contacts configured for ${GROUP_LABELS[groupKey]}. Add contacts in the Stakeholders module.`);
      return;
    }

    // Check approval for Tier 4
    if (isTier4(groupKey) && requiresApproval(groupKey)) {
      const approved = await modal.showConfirm(
        "External Notification — Legal Approval Required",
        `This notification to ${GROUP_LABELS[groupKey]} requires Legal approval before sending. Has Legal approved this communication?`,
      );
      if (!approved) return;
    }

    const last = getLastNotification(groupKey);
    const version = (clockStates[groupKey]?.version || 0) + 1;
    let deltas: DeltaItem[] | null = null;
    if (last && type !== "kick_off") {
      deltas = calculateDelta(last.incidentSnapshot, currentSnapshot);
    }

    const { subject, body, classification } = buildNotificationContent(
      incident, currentSnapshot, groupKey, config.tier, type, version, deltas, CURRENT_USER,
    );

    const recipients = people.map((p) => ({ name: `${p.firstName} ${p.lastName}`, email: p.email || "", cell: p.cell, title: p.title, included: true }));

    const record = finalizeDraft(
      {
        incidentId: incident.title,
        type, tier: config.tier, groupKey, groupLabel: GROUP_LABELS[groupKey],
        recipients, subject, body, classification,
        channel: oobMode ? "signal" : "email",
        version, incidentSnapshot: currentSnapshot,
        deltas, deltaFromId: last?.id,
        generatedBy: CURRENT_USER, approvalRequired: isTier4(groupKey),
      },
      sendMethod, CURRENT_USER, undefined, isTier4(groupKey) ? CURRENT_USER : undefined,
    );

    // Log
    setCommLog((prev) => [record, ...prev]);
    setClockStates((prev) => ({ ...prev, [groupKey]: resetGroupClock(groupKey, CURRENT_USER, version - 1) }));

    // Send action
    if (sendMethod === "clipboard") {
      navigator.clipboard?.writeText(`TO: ${recipients.map((r) => r.email).join(", ")}\nSUBJECT: ${subject}\n\n${body}`);
      await modal.showAlert("Copied to Clipboard", `Notification to ${GROUP_LABELS[groupKey]} (v${version}) has been copied. Paste into your email client.`);
    } else if (sendMethod === "email_client") {
      const mailto = `mailto:${recipients.map((r) => r.email).filter(Boolean).join(",")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailto, "_blank");
    }
  }, [commHold, commHoldBy, stakeholders, clockStates, currentSnapshot, incident, getLastNotification, modal, oobMode, CURRENT_USER]);

  // ═══ RENDER ═══════════════════════════════════════════════════════
  const slaStatusColor = (s: string) => s === "overdue" ? colors.red : s === "due_soon" ? colors.orange : s === "standing_by" ? colors.textDim : colors.green;

  return (
    <div>
      {/* OOB Warning */}
      {oobCondition.detected && !oobMode && (
        <Card style={{ marginBottom: 12, borderLeft: `3px solid ${colors.orange}`, background: colors.orange + "08" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: colors.orange, fontSize: 11, fontWeight: 700 }}>EMAIL INFRASTRUCTURE MAY BE COMPROMISED</div>
              <div style={{ color: colors.textMuted, fontSize: 9, marginTop: 2 }}>{oobCondition.reasons[0]}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Button variant="outline" size="sm" style={{ borderColor: colors.orange, color: colors.orange }} onClick={() => setOobMode(true)}>Switch to OOB Mode</Button>
              <Button variant="ghost" size="sm" onClick={() => {}}>Dismiss</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Communication Hold Banner */}
      {commHold && (
        <Card style={{ marginBottom: 12, background: colors.red + "10", borderColor: colors.red + "44", borderLeft: `3px solid ${colors.red}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: colors.red, fontSize: 12, fontWeight: 800 }}>COMMUNICATIONS HELD</div>
              <div style={{ color: colors.textMuted, fontSize: 9, marginTop: 2 }}>Invoked by {commHoldBy}. No notifications may be sent until hold is released.</div>
            </div>
            <Button variant="outline" size="sm" style={{ borderColor: colors.green, color: colors.green }} onClick={async () => {
              const confirmed = await modal.showConfirm("Release Communication Hold", "Are you sure you want to release the communication hold? Multiple groups may be overdue for updates.");
              if (confirmed) {
                setCommHold(false);
                setCommHoldHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], releasedBy: CURRENT_USER, releasedAt: new Date().toISOString() }]);
              }
            }}>Release Hold</Button>
          </div>
        </Card>
      )}

      {/* Hold toggle */}
      {!commHold && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <Button variant="ghost" size="sm" style={{ color: colors.red }} onClick={async () => {
            const confirmed = await modal.showConfirm("Hold All Communications", "This will block all outbound notifications. SLA clocks will continue running. Only Legal or IC can release.", "danger");
            if (confirmed) {
              setCommHold(true);
              setCommHoldBy(CURRENT_USER);
              setCommHoldHistory((prev) => [...prev, { invokedBy: CURRENT_USER, invokedAt: new Date().toISOString() }]);
            }
          }}>Hold All Communications</Button>
        </div>
      )}

      {/* Bulk Kick-Off (if no notifications sent yet) */}
      {commLog.length === 0 && (
        <Card style={{ marginBottom: 14, borderColor: colors.red + "44", background: colors.red + "06" }}>
          <div style={{ fontSize: 12, color: colors.red, fontWeight: 800, marginBottom: 6 }}>INCIDENT DECLARED — SEND KICK-OFF NOTIFICATIONS</div>
          <p style={{ color: colors.textMuted, fontSize: 10, marginBottom: 12 }}>No stakeholder groups have been notified. Select groups for initial notification:</p>
          {Object.entries(CADENCE_THRESHOLDS).slice(0, 6).map(([key]) => {
            const count = ((stakeholders[key] as StakeholderPerson[]) || []).length;
            const defaultChecked = ["securityEngineers", "incidentCommander", "ciso"].includes(key);
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
                <span style={{ fontSize: 10 }}>{TIER_ICONS[key] || "●"}</span>
                <span style={{ color: count > 0 ? colors.text : colors.textDim, fontSize: 11, flex: 1 }}>{GROUP_LABELS[key]}</span>
                <Badge color={count > 0 ? colors.teal : colors.red}>{count} contacts</Badge>
                {count > 0 && <Button size="sm" variant={defaultChecked ? "primary" : "outline"} disabled={commHold}
                  onClick={() => sendNotification(key, "kick_off", "clipboard")}>Send Kick-Off</Button>}
              </div>
            );
          })}
        </Card>
      )}

      {/* Battle Rhythm Cards */}
      <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Battle Rhythm — SLA Status</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginBottom: 16 }}>
        {groupClocks.map((clock) => {
          const statusColor = slaStatusColor(clock.status);
          const statusLabel = clock.status === "overdue" ? "OVERDUE" : clock.status === "due_soon" ? "DUE SOON" : clock.status === "standing_by" ? "STANDING BY" : "ON TRACK";
          const elapsed = clock.elapsedMs > 0 ? `${Math.floor(clock.elapsedMs / 60000)}min ago` : "";

          return (
            <Card key={clock.groupKey} style={{ padding: "12px 14px", borderLeft: `3px solid ${statusColor}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 12 }}>{TIER_ICONS[clock.groupKey] || "●"}</span>
                  <span style={{ color: colors.white, fontSize: 10, fontWeight: 700 }}>{clock.groupLabel}</span>
                </div>
                <Badge color={statusColor}>{statusLabel}</Badge>
              </div>

              {clock.lastNotifiedAt ? (
                <div style={{ color: colors.textMuted, fontSize: 8, marginBottom: 4 }}>
                  Last: {elapsed} (v{clock.version}) by {clock.lastNotifiedBy}
                </div>
              ) : (
                <div style={{ color: colors.red, fontSize: 8, marginBottom: 4 }}>Not yet notified</div>
              )}

              {clock.cadenceHours && (
                <ProgressBar value={Math.min(clock.percentElapsed, 100)} color={statusColor} height={3} />
              )}

              {clock.contactCount > 0 ? (
                <Button size="sm" variant="outline" style={{ marginTop: 6, width: "100%" }} disabled={commHold}
                  onClick={() => { setPreviewGroup(clock.groupKey); setPreviewType(clock.version === 0 ? "kick_off" : "status_update"); }}>
                  {clock.version === 0 ? "Send Kick-Off" : "Send Update"}
                </Button>
              ) : (
                <div style={{ color: colors.textDim, fontSize: 8, marginTop: 6, fontStyle: "italic" }}>No contacts — Add in Stakeholders</div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewGroup && (() => {
        const config = CADENCE_THRESHOLDS[previewGroup];
        if (!config) return null;
        const people = (stakeholders[previewGroup] as StakeholderPerson[]) || [];
        const last = getLastNotification(previewGroup);
        const version = (clockStates[previewGroup]?.version || 0) + 1;
        const deltas = last && previewType !== "kick_off" ? calculateDelta(last.incidentSnapshot, currentSnapshot) : null;
        const { subject, body, classification } = buildNotificationContent(incident, currentSnapshot, previewGroup, config.tier, previewType, version, deltas, CURRENT_USER);

        return (
          <Card style={{ marginBottom: 14, borderColor: colors.teal + "44" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div><div style={{ fontSize: 9, color: colors.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Notification Preview — {GROUP_LABELS[previewGroup]}</div>
              <div style={{ fontSize: 8, color: colors.textDim, marginTop: 2 }}>{subject}</div></div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewGroup(null)}>✕ Close</Button>
            </div>

            {/* Type selector */}
            <Select label="Notification Type" value={previewType} onChange={(v) => setPreviewType(v as NotificationType)}
              options={NOTIFICATION_TYPES.map((t) => ({ value: t.value, label: t.label }))} />

            {/* Recipients */}
            <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, marginBottom: 4 }}>RECIPIENTS ({people.length})</div>
            {people.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", borderBottom: `1px solid ${colors.panelBorder}`, fontSize: 10 }}>
                <span style={{ color: colors.text }}>{p.firstName} {p.lastName}</span>
                {p.title && <span style={{ color: colors.textDim }}>— {p.title}</span>}
                <span style={{ color: colors.textMuted, marginLeft: "auto" }}>{oobMode ? (p.cell || "No cell") : (p.email || "No email")}</span>
              </div>
            ))}

            {/* Classification */}
            <div style={{ marginTop: 10, padding: "6px 10px", background: classification.includes("PRIVILEGED") ? colors.red + "10" : colors.obsidianM, borderRadius: 4, borderLeft: `3px solid ${classification.includes("PRIVILEGED") ? colors.red : colors.teal}` }}>
              <div style={{ fontSize: 8, color: classification.includes("PRIVILEGED") ? colors.red : colors.teal, fontWeight: 700 }}>{classification}</div>
            </div>

            {/* Delta */}
            {deltas && deltas.length > 0 && (
              <div style={{ marginTop: 8, padding: "8px 10px", background: colors.teal + "08", borderRadius: 4, borderLeft: `2px solid ${colors.teal}` }}>
                <div style={{ fontSize: 8, color: colors.teal, fontWeight: 700, marginBottom: 4 }}>CHANGES SINCE LAST NOTIFICATION</div>
                {deltas.map((d, i) => (
                  <div key={i} style={{ fontSize: 9, color: colors.text, padding: "1px 0" }}>
                    <strong>{d.field}:</strong> {d.from && d.to ? `${d.from} → ${d.to}` : d.detail}
                  </div>
                ))}
              </div>
            )}

            {/* Message preview */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, marginBottom: 4 }}>MESSAGE PREVIEW</div>
              <pre style={{ background: colors.obsidianM, borderRadius: 6, padding: 12, color: colors.text, fontSize: 9, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", maxHeight: 300, overflow: "auto", margin: 0 }}>{body}</pre>
            </div>

            {/* Approval notice for Tier 4 */}
            {isTier4(previewGroup) && (
              <div style={{ marginTop: 8, padding: "6px 10px", background: colors.purple + "10", borderRadius: 4, borderLeft: `2px solid ${colors.purple}` }}>
                <div style={{ fontSize: 9, color: colors.purple, fontWeight: 700 }}>LEGAL APPROVAL REQUIRED — External notification</div>
              </div>
            )}

            {/* Send actions */}
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              <Button onClick={() => { sendNotification(previewGroup, previewType, "clipboard"); setPreviewGroup(null); }} disabled={commHold}>Copy to Clipboard</Button>
              <Button variant="secondary" onClick={() => { sendNotification(previewGroup, previewType, "email_client"); setPreviewGroup(null); }} disabled={commHold}>Open in Email</Button>
              <Button variant="ghost" onClick={() => { sendNotification(previewGroup, previewType, "marked_sent"); setPreviewGroup(null); }} disabled={commHold}>Mark as Sent</Button>
              <Button variant="ghost" onClick={() => setPreviewGroup(null)}>Cancel</Button>
            </div>

            {/* Attribution */}
            <div style={{ marginTop: 8, color: colors.textDim, fontSize: 8 }}>
              Generated by: {CURRENT_USER} at {new Date().toLocaleString()}
            </div>
          </Card>
        );
      })()}

      {/* Communication Log */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Communication Log ({commLog.length})</div>
        {commLog.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => {
            const doc = exportCommunicationLog(commLog, incident.title);
            const blob = new Blob([doc], { type: "text/plain" }); const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `Sentry_CommLog_${incident.title.replace(/\s/g, "_")}.txt`; a.click();
          }}>Export</Button>
        )}
      </div>

      {commLog.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "20px 18px", marginBottom: 14 }}>
          <div style={{ color: colors.textDim, fontSize: 10 }}>No notifications sent yet. Use the battle rhythm cards above to send kick-off notifications.</div>
        </Card>
      ) : (
        <div style={{ marginBottom: 14 }}>
          {commLog.map((record) => {
            const isExpanded = expandedLog === record.id;
            return (
              <Card key={record.id} style={{ marginBottom: 4, padding: "10px 14px", opacity: record.retracted ? 0.5 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpandedLog(isExpanded ? null : record.id)}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: colors.teal, fontSize: 9, fontWeight: 600 }}>{new Date(record.sentAt).toLocaleTimeString()}</span>
                      <span style={{ color: colors.text, fontSize: 10, fontWeight: 600 }}>{record.type.replace(/_/g, " ")} → {record.groupLabel}</span>
                      <Badge color={colors.blue}>v{record.version}</Badge>
                      {record.retracted && <Badge color={colors.red}>RETRACTED</Badge>}
                    </div>
                    <div style={{ color: colors.textDim, fontSize: 8, marginTop: 2 }}>
                      {buildAuditSummary(record).split("\n").filter(Boolean).join(" | ")}
                    </div>
                    {record.deltaSummary && <div style={{ color: colors.textMuted, fontSize: 8, marginTop: 1 }}>Delta: {record.deltaSummary.substring(0, 80)}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {!record.acknowledged && (
                      <Button variant="ghost" size="sm" onClick={() => { setCommLog((prev) => prev.map((r) => r.id === record.id ? { ...r, acknowledged: true, acknowledgedBy: CURRENT_USER, acknowledgedAt: new Date().toISOString() } : r)); }}>Acknowledge</Button>
                    )}
                    {record.acknowledged && <Badge color={colors.green}>Ack</Badge>}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 8, borderTop: `1px solid ${colors.panelBorder}`, paddingTop: 8 }}>
                    <pre style={{ background: colors.obsidianM, borderRadius: 4, padding: 10, color: colors.text, fontSize: 8, lineHeight: 1.5, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", maxHeight: 250, overflow: "auto", margin: 0 }}>{record.body}</pre>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Regulatory Filings */}
      <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Regulatory Filings</div>
      {filings.map((filing) => {
        const timeInfo = getFilingTimeRemaining(filing.deadline);
        const statusColor = filing.status === "Filed" || filing.status === "Acknowledged" ? colors.green : filing.status === "Not Applicable" ? colors.textDim : timeInfo.overdue ? colors.red : colors.orange;
        return (
          <Card key={filing.id} style={{ marginBottom: 6, padding: "10px 14px", borderLeft: `3px solid ${statusColor}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: colors.white, fontSize: 11, fontWeight: 600 }}>{filing.regulation}</div>
                <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                  <Badge color={statusColor}>{filing.status}</Badge>
                  {filing.status !== "Not Applicable" && filing.status !== "Filed" && (
                    <Badge color={timeInfo.overdue ? colors.red : colors.textDim}>{timeInfo.text}</Badge>
                  )}
                  {filing.confirmationNumber && <Badge color={colors.green}>#{filing.confirmationNumber}</Badge>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {filing.status === "Not Applicable" && (
                  <Button variant="ghost" size="sm" onClick={() => setFilings((prev) => prev.map((f) => f.id === filing.id ? { ...f, status: "Not Filed", statusHistory: [...f.statusHistory, { status: "Not Filed", changedBy: CURRENT_USER, changedAt: new Date().toISOString() }] } : f))}>Mark Applicable</Button>
                )}
                {(filing.status === "Not Filed" || filing.status === "In Preparation") && (
                  <Button variant="outline" size="sm" onClick={async () => {
                    const r = await modal.showPrompt("Mark as Filed", [
                      { key: "method", label: "Filing Method", required: true, placeholder: "e.g., DIBNet Portal" },
                      { key: "confirmation", label: "Confirmation Number", placeholder: "Optional" },
                    ], `Record the filing for ${filing.regulation}`);
                    if (r) {
                      setFilings((prev) => prev.map((f) => f.id === filing.id ? {
                        ...f, status: "Filed", filedBy: CURRENT_USER, filedAt: new Date().toISOString(),
                        filingMethod: r.method, confirmationNumber: r.confirmation || undefined,
                        statusHistory: [...f.statusHistory, { status: "Filed", changedBy: CURRENT_USER, changedAt: new Date().toISOString(), notes: `Method: ${r.method}${r.confirmation ? `, Ref: ${r.confirmation}` : ""}` }],
                      } : f));
                    }
                  }}>Mark as Filed</Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
