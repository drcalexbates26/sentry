"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card, Input, Select, SectionHeader, ScoreGauge } from "@/components/ui";
import { GLOBAL_FEEDS } from "@/lib/threat-intel/feed-config";
import {
  generateExecutiveSummary,
  generateRecommendations,
  generateStructuredRecommendations,
  generateDailyBriefing,
  type StructuredRecommendation,
} from "@/lib/threat-intel/summary-generator";
import { refreshThreatIntelAction } from "@/app/app/_actions";
import type { ThreatIntelItem } from "@/types/threat-intel";
import type { ThreatIntelStoreItem } from "@/store";

function useSevColors() {
  const c = useColors();
  return { Critical: c.red, High: c.orange, Medium: c.yellow, Low: c.green, Informational: c.textDim } as Record<string, string>;
}

/**
 * Render the structured remediation playbook with priority bins + why/verify.
 * Shared across the preview (pre-applicability) and applied (post-ticket-creation)
 * variants so both views surface the same playbook content.
 */
function StructuredRecsPanel({
  recs,
  colors,
  variant,
}: {
  recs: StructuredRecommendation[];
  colors: ReturnType<typeof useColors>;
  variant: "preview" | "applied";
}) {
  const priColor: Record<StructuredRecommendation["priority"], string> = {
    Now: colors.red,
    "24h": colors.orange,
    "This Week": colors.yellow,
    Ongoing: colors.blue,
  };
  const groups: StructuredRecommendation["priority"][] = ["Now", "24h", "This Week", "Ongoing"];
  return (
    <div>
      {groups.map((g) => {
        const bucket = recs.filter((r) => r.priority === g);
        if (bucket.length === 0) return null;
        return (
          <div key={g} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Badge color={priColor[g]}>
                {g === "Now" ? "DO NOW" : g === "24h" ? "NEXT 24 HOURS" : g === "This Week" ? "THIS WEEK" : "ONGOING"}
              </Badge>
              <span style={{ color: colors.textDim, fontSize: 9 }}>{bucket.length} action{bucket.length === 1 ? "" : "s"}</span>
            </div>
            {bucket.map((r, i) => (
              <div key={`${g}-${i}`} style={{ background: colors.obsidianM, borderRadius: 6, padding: 10, marginBottom: 6, borderLeft: `3px solid ${priColor[g]}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: priColor[g] + "22", color: priColor[g], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: colors.text, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{r.text}</div>
                    <div style={{ color: colors.textMuted, fontSize: 10, lineHeight: 1.5, marginBottom: 4 }}>
                      <strong style={{ color: colors.textDim }}>Why:</strong> {r.why}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: 10, lineHeight: 1.5 }}>
                      <strong style={{ color: colors.tealLight }}>Verify:</strong> {r.verify}
                    </div>
                  </div>
                  {variant === "applied" && <Badge color={colors.blue}>TKT</Badge>}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** Open the daily briefing text in a new window for print / save / share. */
function openDailyBriefingWindow(briefing: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  const html = `<!DOCTYPE html><html><head><title>Sentry — Daily Threat Briefing</title>
<style>
  @page { size: letter; margin: 0.75in; }
  body { font-family: "Courier New", ui-monospace, monospace; background: #FFFFFF; color: #1A1A1A; padding: 28px; max-width: 8.5in; margin: 0 auto; line-height: 1.55; font-size: 11pt; white-space: pre-wrap; }
  .toolbar { position: fixed; top: 14px; right: 14px; background: #00B4A6; color: white; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-family: -apple-system, sans-serif; font-weight: 600; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
  @media print { .toolbar { display: none; } }
</style></head><body><button class="toolbar" onclick="window.print()">Print / Save as PDF</button>${briefing.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "< 1 hour ago";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export function ThreatIntelModule() {
  const {
    threatIntelItems, threatIntelLoading, threatIntelLastFetch,
    setThreatIntelItems, setThreatIntelLoading, updateThreatIntelItem,
    onboardDone, org, addTask, addTicket, addChildTicket, updateTicket,
    setPage, setActiveIncident, addIncidentLogEntry, recordIncidentMetric,
    tickets,
  } = useStore();
  const colors = useColors();
  const SEV_COLORS = useSevColors();

  const markApplicable = useCallback((threatItem: ThreatIntelStoreItem & ThreatIntelItem, recommendations: string[]) => {
    const parentId = Math.floor(Math.random() * 1e12);
    const childIds: number[] = [];
    recommendations.forEach((r, i) => {
      const childId = parentId + i + 1;
      childIds.push(childId);
      addChildTicket(parentId, {
        id: childId, title: r, severity: i < 2 ? "Critical" : "High",
        status: "Open", phase: "Remediation", assignee: "",
        details: `Recommended action from Threat Intel: ${threatItem.cveId || threatItem.title}\n\nSource: ${threatItem.feedSource}\nRisk Score: ${threatItem.riskScore}/100`,
        actions: [{ text: "Child ticket created from threat intelligence", by: "System", time: new Date().toLocaleTimeString() }],
        created: new Date().toLocaleDateString(), parentId, ticketType: "child",
        threatIntelId: threatItem.id, threatIntelTitle: threatItem.cveId || threatItem.title,
      });
      addTask({
        id: childId + 1000000, title: `[TI] ${r.substring(0, 70)}`,
        priority: i < 2 ? "Critical" : "High", status: "Backlog", assignee: "",
        source: `Threat Intel: ${threatItem.cveId || threatItem.title.substring(0, 40)}`,
        updates: [], created: new Date().toLocaleDateString(), irPhase: "prep", ticketId: childId,
      });
    });
    addTicket({
      id: parentId,
      title: `[SECURITY EVENT] ${threatItem.cveId || threatItem.title.substring(0, 80)}`,
      severity: threatItem.severityRank, status: "Open", phase: "Triage", assignee: "",
      details: `Security Event from Threat Intelligence\n\nThreat: ${threatItem.title}\nSource: ${threatItem.feedSource}\nCVSS: ${threatItem.cvssScore || "N/A"}\nRisk Score: ${threatItem.riskScore}/100\n\n${threatItem.isZeroDay ? "⚠️ ZERO-DAY\n" : ""}${threatItem.isActivelyExploited ? "🔴 ACTIVELY EXPLOITED\n" : ""}\n${threatItem.description}`,
      actions: [{ text: `Security event — ${recommendations.length} child tickets generated`, by: "System", time: new Date().toLocaleTimeString() }],
      created: new Date().toLocaleDateString(), ticketType: "security-event",
      threatIntelId: threatItem.id, threatIntelTitle: threatItem.cveId || threatItem.title,
      applicability: "applicable", verifiedExploit: false, childIds,
    });
    updateThreatIntelItem(threatItem.id, { applicability: "applicable", securityEventTicketId: parentId });
  }, [addChildTicket, addTask, addTicket, updateThreatIntelItem]);

  const verifyExploit = useCallback((threatItem: ThreatIntelStoreItem & ThreatIntelItem) => {
    if (!threatItem.securityEventTicketId) return;
    updateTicket(threatItem.securityEventTicketId, { verifiedExploit: true, status: "Escalated" });
    const incTitle = `Verified Exploit: ${threatItem.cveId || threatItem.title.substring(0, 60)}`;
    const sev = threatItem.riskScore >= 80 ? "Critical" : "High";
    setActiveIncident({
      title: incTitle, severity: sev as "Critical" | "High", status: "Active",
      startTime: new Date().toISOString(), internalCostRate: 150,
      iocs: threatItem.cveId ? [threatItem.cveId] : [],
      affectedUsers: [], affectedAssets: [], affectedRegions: [],
      privacyConcern: false, attorneyPrivilege: false,
      privilegeEnforcedBy: "", privilegeEnforcedAt: "",
      phaseStatus: {}, findings: [{ text: `Verified exploit of ${threatItem.cveId || "threat"} confirmed`, time: new Date().toLocaleString() }],
      timeline: [{ time: new Date().toLocaleString(), event: "Incident auto-declared from verified threat intelligence exploit", elapsed: "00:00:00" }],
      workstreams: {}, escalation: [], expenses: [], summaries: [], notifications: [], members: [],
    });
    const masterId = Math.floor(Math.random() * 1e12);
    addTicket({
      id: masterId, title: `[INCIDENT] ${incTitle}`, severity: sev,
      status: "Open", phase: "Incident Declared", assignee: "",
      details: `Incident auto-declared from verified exploit.\n\nSource: ${threatItem.cveId || threatItem.title}\nRisk: ${threatItem.riskScore}/100`,
      actions: [{ text: "Incident auto-declared from verified exploit", by: "System", time: new Date().toLocaleTimeString() }],
      created: new Date().toLocaleDateString(), ticketType: "master",
      incidentId: `INC-${masterId}`, incidentTitle: incTitle, childIds: [],
    });
    addIncidentLogEntry({ incidentId: `INC-${masterId}`, title: incTitle, severity: sev, masterTicketId: masterId, declaredAt: new Date().toLocaleString(), status: "Active" });
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    recordIncidentMetric(monthNames[new Date().getMonth()]);
    setPage("commander");
  }, [updateTicket, setActiveIncident, addTicket, addIncidentLogEntry, recordIncidentMetric, setPage]);

  const [tab, setTab] = useState<"global" | "industry">("global");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sevFilter, setSevFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [search, setSearch] = useState("");

  const fetchFeeds = useCallback(async (forceRefresh = false) => {
    setThreatIntelLoading(true);
    try {
      if (forceRefresh) {
        // Manual refresh button → server action that actually re-runs the
        // RSS pull, scores, and writes to DB before returning fresh items.
        const r = await refreshThreatIntelAction();
        if (r.ok && Array.isArray(r.items)) {
          setThreatIntelItems(r.items as ThreatIntelStoreItem[]);
        }
      } else {
        const res = await fetch(`/api/threat-intel?category=${tab}${tab === "industry" && org.industry ? `&industry=${encodeURIComponent(org.industry)}` : ""}`);
        if (res.ok) {
          const data = await res.json();
          setThreatIntelItems(data.items || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch threat intel:", err);
    }
    setThreatIntelLoading(false);
  }, [tab, org.industry, setThreatIntelItems, setThreatIntelLoading]);

  // Auto-pull on first mount. If the store has no items (cold open) AND the
  // industry tab has just become available, kick a server-driven refresh so
  // the user lands on a populated page instead of an empty state.
  const autoPulledRef = useRef(false);
  useEffect(() => {
    if (autoPulledRef.current) return;
    if (threatIntelLoading) return;
    if (threatIntelItems.length === 0) {
      autoPulledRef.current = true;
      void fetchFeeds(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // When the user switches the industry tab and we have no industry-tagged
  // items yet, fire one more pull. This makes "have it pull when it generates"
  // work for tenants that just set their industry in Onboarding.
  const industryPulledFor = useRef<string | null>(null);
  useEffect(() => {
    if (tab !== "industry" || !org.industry) return;
    if (industryPulledFor.current === org.industry) return;
    const haveIndustryItems = threatIntelItems.some((i) => i.feedCategory === "industry" || i.industryTag === org.industry);
    if (!haveIndustryItems && !threatIntelLoading) {
      industryPulledFor.current = org.industry;
      void fetchFeeds(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, org.industry]);

  // Filtered items
  const items = useMemo(() => {
    let filtered = tab === "industry"
      ? threatIntelItems.filter((i) => i.feedCategory === "industry" || i.industryTag === org.industry)
      : threatIntelItems.filter((i) => i.feedCategory === "global" || !i.industryTag);

    if (sevFilter !== "All") filtered = filtered.filter((i) => i.severityRank === sevFilter);
    if (sourceFilter !== "All") filtered = filtered.filter((i) => i.feedSource === sourceFilter);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || (i.cveId || "").toLowerCase().includes(q));
    }
    return filtered.sort((a, b) => b.riskScore - a.riskScore);
  }, [threatIntelItems, tab, sevFilter, sourceFilter, search, org.industry]);

  const criticalItems = items.filter((i) => i.severityRank === "Critical" || i.isZeroDay);
  const exploitedItems = items.filter((i) => i.isActivelyExploited);
  const avgRisk = items.length > 0 ? Math.round(items.reduce((a, i) => a + i.riskScore, 0) / items.length) : 0;
  const sources = [...new Set(threatIntelItems.map((i) => i.feedSource))];

  // Severity distribution
  const sevDist = useMemo(() => {
    const d: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0, Informational: 0 };
    items.forEach((i) => { if (d[i.severityRank] !== undefined) d[i.severityRank]++; });
    return d;
  }, [items]);

  // Daily trend (past 7 days)
  const dailyTrend = useMemo(() => {
    const now = new Date();
    const days: { date: string; Critical: number; High: number; Medium: number; Low: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayItems = items.filter((item) => {
        const pub = new Date(item.publishedAt);
        return pub.toDateString() === d.toDateString();
      });
      days.push({
        date: dateStr,
        Critical: dayItems.filter((x) => x.severityRank === "Critical").length,
        High: dayItems.filter((x) => x.severityRank === "High").length,
        Medium: dayItems.filter((x) => x.severityRank === "Medium").length,
        Low: dayItems.filter((x) => x.severityRank === "Low" || x.severityRank === "Informational").length,
      });
    }
    return days;
  }, [items]);

  // ═══ DETAIL VIEW ══════════════════════════════════════════════════
  if (selectedId) {
    const item = threatIntelItems.find((i) => i.id === selectedId) as (ThreatIntelStoreItem & ThreatIntelItem) | undefined;
    if (!item) { setSelectedId(null); return null; }

    const summary = generateExecutiveSummary(item);
    const recs = generateRecommendations(item);
    const structuredRecs = generateStructuredRecommendations(item);
    const related = threatIntelItems
      .filter((i) => i.id !== item.id && (i.tags.some((t) => item.tags.includes(t)) || item.affectedVendors.some((v) => i.affectedVendors.includes(v))))
      .slice(0, 5);

    return (
      <div>
        <Button variant="ghost" onClick={() => setSelectedId(null)} style={{ marginBottom: 12 }}>← Back to Dashboard</Button>

        {/* Header */}
        <Card style={{ marginBottom: 14, borderLeft: `3px solid ${SEV_COLORS[item.severityRank]}` }}>
          <h2 style={{ color: colors.white, margin: "0 0 8px", fontSize: 16, lineHeight: 1.3 }}>{item.title}</h2>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            <Badge color={SEV_COLORS[item.severityRank]}>{item.severityRank}</Badge>
            <Badge color={colors.blue}>Risk: {item.riskScore}/100</Badge>
            {item.cvssScore && <Badge color={item.cvssScore >= 9 ? colors.red : item.cvssScore >= 7 ? colors.orange : colors.yellow}>CVSS {item.cvssScore}</Badge>}
            {item.isZeroDay && <Badge color={colors.red}>ZERO-DAY</Badge>}
            {item.isActivelyExploited && <Badge color={colors.red}>ACTIVELY EXPLOITED</Badge>}
            <Badge color={colors.textDim}>{item.feedSource}</Badge>
            <Badge color={colors.textDim}>{timeAgo(item.publishedAt)}</Badge>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {item.tags.map((t) => <Badge key={t} color={colors.cyan}>{t}</Badge>)}
          </div>
        </Card>

        {/* Risk Assessment */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          {[
            { label: "Impact", score: item.impactScore, max: 10, desc: item.impactScore >= 8 ? "Critical business impact" : item.impactScore >= 5 ? "Moderate impact" : "Limited impact" },
            { label: "Likelihood", score: item.likelihoodScore, max: 10, desc: item.likelihoodScore >= 8 ? "Active exploitation" : item.likelihoodScore >= 5 ? "Likely in days/weeks" : "Not yet observed" },
            { label: "Risk Score", score: item.riskScore, max: 100, desc: item.severityRank },
          ].map((x) => (
            <Card key={x.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{x.label}</div>
              <ScoreGauge score={Math.round((x.score / x.max) * 100)} size={70} />
              <div style={{ color: colors.white, fontSize: 14, fontWeight: 700, marginTop: 4 }}>{x.score}/{x.max}</div>
              <div style={{ color: colors.textDim, fontSize: 9 }}>{x.desc}</div>
            </Card>
          ))}
        </div>

        {/* Executive Summary */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Executive Summary</div>
            <Button variant="outline" size="sm" onClick={() => {
              const blob = new Blob([summary], { type: "text/plain" });
              const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url;
              a.download = `Sentry_Threat_${(item.cveId || item.title).replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40)}.txt`; a.click();
            }}>Export Summary</Button>
          </div>
          <pre style={{ background: colors.obsidianM, borderRadius: 6, padding: 14, color: colors.text, fontSize: 10, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", margin: 0, maxHeight: 400, overflow: "auto" }}>{summary}</pre>
        </Card>

        {/* Technical Details */}
        {item.cveId && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Technical Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
              {[
                { l: "CVE ID", v: item.cveId },
                { l: "CVSS Score", v: item.cvssScore?.toString() || "—" },
                { l: "CVSS Vector", v: item.cvssVector || "—" },
                { l: "CWE", v: item.cweId || "—" },
                { l: "Vendors", v: item.affectedVendors.join(", ") || "—" },
                { l: "Products", v: item.affectedProducts.join(", ") || "—" },
              ].map((x) => (
                <div key={x.l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <span style={{ color: colors.textMuted, fontSize: 10, fontWeight: 600 }}>{x.l}</span>
                  <span style={{ color: colors.text, fontSize: 10, fontFamily: "var(--font-mono)", textAlign: "right", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis" }}>{x.v}</span>
                </div>
              ))}
            </div>
            {item.mitreAttackIds.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ color: colors.textMuted, fontSize: 9, fontWeight: 600 }}>MITRE ATT&CK: </span>
                {item.mitreAttackIds.map((id) => <Badge key={id} color={colors.blue} className="mr-1">{id}</Badge>)}
              </div>
            )}
          </Card>
        )}

        {/* Applicability Decision */}
        <Card style={{ marginBottom: 14, borderColor: item.applicability === "applicable" ? colors.red + "44" : item.applicability === "not-applicable" ? colors.green + "44" : colors.orange + "44" }}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Applicability Assessment</div>
          {!item.applicability || item.applicability === "pending" ? (
            <div>
              <p style={{ color: colors.text, fontSize: 11, margin: "0 0 12px", lineHeight: 1.5 }}>
                Does this threat apply to your environment? Marking as applicable will create a Security Event ticket with child tickets for each recommended action.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="danger" onClick={() => markApplicable(item, recs)}>Applicable — Create Security Event</Button>
                <Button variant="secondary" onClick={() => {
                  updateThreatIntelItem(item.id, { applicability: "not-applicable" });
                }}>Not Applicable</Button>
              </div>
            </div>
          ) : item.applicability === "applicable" ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Badge color={colors.red}>APPLICABLE</Badge>
                <span style={{ color: colors.text, fontSize: 11 }}>Security Event ticket created</span>
                {item.securityEventTicketId && <Badge color={colors.blue}>TKT-{item.securityEventTicketId}</Badge>}
              </div>

              {/* Verified Exploit check */}
              {(() => {
                const parentTicket = tickets.find((t) => t.id === item.securityEventTicketId);
                const isVerified = parentTicket?.verifiedExploit;
                return (
                  <div style={{ background: colors.obsidianM, borderRadius: 6, padding: 12, borderLeft: `3px solid ${isVerified ? colors.red : colors.orange}` }}>
                    <div style={{ fontSize: 10, color: colors.orange, fontWeight: 700, marginBottom: 6 }}>Verified Exploit in Client Environment?</div>
                    {!isVerified ? (
                      <div>
                        <p style={{ color: colors.textMuted, fontSize: 10, margin: "0 0 8px", lineHeight: 1.4 }}>
                          If this vulnerability has been confirmed as exploited in your environment, this will immediately launch an incident in Commander.
                        </p>
                        <Button variant="danger" size="sm" onClick={() => verifyExploit(item)}>Confirmed — Launch Incident</Button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Badge color={colors.red}>EXPLOIT VERIFIED</Badge>
                        <span style={{ color: colors.text, fontSize: 10 }}>Incident has been declared in Commander.</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Structured recommendation playbook — priority + why + verify */}
              <div style={{ marginTop: 12, fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Remediation Playbook ({structuredRecs.length} steps · {recs.length} tickets created)</div>
              <StructuredRecsPanel recs={structuredRecs} colors={colors} variant="applied" />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Badge color={colors.green}>NOT APPLICABLE</Badge>
              <span style={{ color: colors.textMuted, fontSize: 11 }}>This threat has been assessed as not applicable to your environment.</span>
              <Button variant="ghost" size="sm" onClick={() => updateThreatIntelItem(item.id, { applicability: "pending" })}>Re-assess</Button>
            </div>
          )}
        </Card>

        {/* Pre-decision Remediation Playbook — visible even before applicability */}
        {(!item.applicability || item.applicability === "pending") && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Remediation Playbook</div>
            <div style={{ color: colors.textMuted, fontSize: 10, fontStyle: "italic", marginBottom: 10, lineHeight: 1.5 }}>
              Concrete actions binned by urgency. Mark this threat <strong>Applicable</strong> above to spin these into tickets in the global Tasks board.
            </div>
            <StructuredRecsPanel recs={structuredRecs} colors={colors} variant="preview" />
          </Card>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <Button variant="outline" size="sm" onClick={() => window.open(item.link, "_blank")}>View Original Source</Button>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <Card>
            <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Related Intelligence</div>
            {related.map((r) => (
              <div key={r.id} onClick={() => setSelectedId(r.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${colors.panelBorder}`, cursor: "pointer" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: colors.text, fontSize: 10 }}>{r.title.substring(0, 80)}{r.title.length > 80 ? "..." : ""}</span>
                </div>
                <Badge color={SEV_COLORS[r.severityRank]}>{r.severityRank}</Badge>
              </div>
            ))}
          </Card>
        )}
      </div>
    );
  }

  // ═══ INDUSTRY GATE ════════════════════════════════════════════════
  if (tab === "industry" && !onboardDone) {
    const currentTab: string = tab;
    return (
      <div>
        <SectionHeader sub="Real-time threat intelligence from global and industry-specific sources">Threat Intelligence</SectionHeader>
        <div style={{ display: "flex", gap: 3, marginBottom: 16, borderBottom: `1px solid ${colors.panelBorder}`, paddingBottom: 6 }}>
          <button onClick={() => setTab("global")} style={{ padding: "5px 12px", borderRadius: "5px 5px 0 0", border: "none", cursor: "pointer", background: currentTab === "global" ? colors.teal + "22" : "transparent", color: currentTab === "global" ? colors.teal : colors.textMuted, fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>Global</button>
          <button onClick={() => setTab("industry")} style={{ padding: "5px 12px", borderRadius: "5px 5px 0 0", border: "none", cursor: "pointer", background: currentTab === "industry" ? colors.teal + "22" : "transparent", color: currentTab === "industry" ? colors.teal : colors.textMuted, fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>Industry</button>
        </div>
        <Card style={{ textAlign: "center", padding: "40px 18px" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏭</div>
          <h3 style={{ color: colors.white, marginTop: 0 }}>Complete Onboarding Required</h3>
          <p style={{ color: colors.textMuted, fontSize: 12, maxWidth: 400, margin: "0 auto 16px", lineHeight: 1.5 }}>
            Complete onboarding to enable industry-specific threat intelligence filtered to your sector.
          </p>
          <Button onClick={() => setPage("onboard")}>Complete Onboarding →</Button>
        </Card>
      </div>
    );
  }

  // ═══ MAIN DASHBOARD ═══════════════════════════════════════════════

  return (
    <div>
      <SectionHeader sub="Real-time threat intelligence from global and industry-specific sources">Threat Intelligence</SectionHeader>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 3, borderBottom: `1px solid ${colors.panelBorder}`, paddingBottom: 6 }}>
          <button onClick={() => setTab("global")} style={{ padding: "5px 12px", borderRadius: "5px 5px 0 0", border: "none", cursor: "pointer", background: tab === "global" ? colors.teal + "22" : "transparent", color: tab === "global" ? colors.teal : colors.textMuted, fontSize: 11, fontWeight: 600, fontFamily: "inherit", borderBottom: tab === "global" ? `2px solid ${colors.teal}` : "2px solid transparent" }}>Global</button>
          <button onClick={() => setTab("industry")} style={{ padding: "5px 12px", borderRadius: "5px 5px 0 0", border: "none", cursor: "pointer", background: tab === "industry" ? colors.teal + "22" : "transparent", color: tab === "industry" ? colors.teal : colors.textMuted, fontSize: 11, fontWeight: 600, fontFamily: "inherit", borderBottom: tab === "industry" ? `2px solid ${colors.teal}` : "2px solid transparent" }}>
            Industry{org.industry ? `: ${org.industry}` : ""}
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {threatIntelLastFetch && <span style={{ color: colors.textDim, fontSize: 8 }}>Last: {threatIntelLastFetch}</span>}
          <Button variant="outline" size="sm" onClick={() => fetchFeeds(true)} disabled={threatIntelLoading}>
            {threatIntelLoading ? "Fetching..." : "Refresh Feeds"}
          </Button>
        </div>
      </div>

      {/* ── DAILY BRIEFING ─────────────────────────────────────────────
          Today's posture in one card. Designed to be the daily-stop landing
          surface — what changed, what to prioritize, what to communicate. */}
      {items.length > 0 && (() => {
        // Store items use a looser `feedCategory: string` shape; cast to the
        // narrowed ThreatIntelItem union at the boundary (values are always
        // "global" or "industry" in practice).
        const itemsForGen = items as unknown as ThreatIntelItem[];
        const briefing = generateDailyBriefing({ items: itemsForGen, orgName: org.name, orgIndustry: org.industry });
        const now = Date.now();
        const last24h = items.filter((i) => now - new Date(i.publishedAt).getTime() <= 86400000);
        const newCritical = last24h.filter((i) => i.severityRank === "Critical" || i.isZeroDay);
        const top3 = items.slice().sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);
        const posture = newCritical.length === 0 && exploitedItems.length === 0
          ? { tone: colors.green, label: "STEADY", line: `Stable posture today. ${last24h.length} new item${last24h.length === 1 ? "" : "s"} in 24h, no new critical or actively-exploited threats. Use this window to clear remediation tasks and run a tabletop.` }
          : newCritical.length > 0 && exploitedItems.length > 0
          ? { tone: colors.red, label: "ELEVATED", line: `Elevated posture. ${newCritical.length} new critical / zero-day item${newCritical.length === 1 ? "" : "s"} arrived in 24h and ${exploitedItems.length} item${exploitedItems.length === 1 ? " is" : "s are"} actively exploited. Patch decisions made before noon will pay dividends.` }
          : newCritical.length > 0
          ? { tone: colors.orange, label: "SHARPENED", line: `Sharpened posture. ${newCritical.length} new critical / zero-day item${newCritical.length === 1 ? "" : "s"} arrived in 24h. Verify your inventory against the affected products before standing up new mitigations.` }
          : { tone: colors.orange, label: "ACTIVE", line: `Active posture. ${exploitedItems.length} item${exploitedItems.length === 1 ? " is" : "s are"} confirmed under active exploitation. If any are in your environment, treat patching as an emergency change.` };
        return (
          <Card style={{ marginBottom: 16, borderLeft: `4px solid ${posture.tone}`, background: posture.tone + "08" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 22 }}>📰</span>
                  <h3 style={{ color: colors.white, margin: 0, fontSize: 16, fontWeight: 700 }}>Daily Threat Briefing</h3>
                  <Badge color={posture.tone}>{posture.label}</Badge>
                </div>
                <div style={{ color: colors.textMuted, fontSize: 10, letterSpacing: "0.06em" }}>
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {last24h.length} new in 24h · {newCritical.length} new critical · {exploitedItems.length} exploited
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => openDailyBriefingWindow(briefing)}>View Full Briefing</Button>
            </div>

            <p style={{ color: colors.text, fontSize: 12, margin: "0 0 12px", lineHeight: 1.55 }}>{posture.line}</p>

            {top3.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Today&apos;s Top Three Priorities</div>
                {top3.map((item, idx) => {
                  const topRecs = generateStructuredRecommendations(item as unknown as ThreatIntelItem).filter((r) => r.priority === "Now" || r.priority === "24h").slice(0, 2);
                  return (
                    <div key={item.id} onClick={() => setSelectedId(item.id)} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${colors.panelBorder}`, cursor: "pointer" }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: SEV_COLORS[item.severityRank] + "22", color: SEV_COLORS[item.severityRank], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: colors.white, fontSize: 11, fontWeight: 600 }}>
                          {item.cveId && <span style={{ color: SEV_COLORS[item.severityRank], marginRight: 5, fontFamily: "var(--font-mono)" }}>{item.cveId}</span>}
                          {item.title.substring(0, 90)}{item.title.length > 90 ? "…" : ""}
                        </div>
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 3 }}>
                          <Badge color={SEV_COLORS[item.severityRank]}>{item.severityRank} · {item.riskScore}</Badge>
                          {item.isZeroDay && <Badge color={colors.red}>0-day</Badge>}
                          {item.isActivelyExploited && <Badge color={colors.red}>exploited</Badge>}
                          <Badge color={colors.textDim}>{item.feedSource}</Badge>
                        </div>
                        {topRecs.length > 0 && (
                          <div style={{ marginTop: 5 }}>
                            {topRecs.map((r, ri) => (
                              <div key={ri} style={{ color: colors.textMuted, fontSize: 10, lineHeight: 1.5, display: "flex", gap: 6 }}>
                                <span style={{ color: r.priority === "Now" ? colors.red : colors.orange, fontWeight: 700, flexShrink: 0 }}>→ [{r.priority}]</span>
                                <span>{r.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })()}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        <Card style={{ textAlign: "center", padding: "14px 10px" }}>
          <div style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Threats (7d)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.blue }}>{items.length}</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "14px 10px", background: criticalItems.length > 0 ? colors.red + "10" : colors.panel }}>
          <div style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Critical / Zero-Day</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: criticalItems.length > 0 ? colors.red : colors.green }}>{criticalItems.length}</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "14px 10px", background: exploitedItems.length > 0 ? colors.orange + "10" : colors.panel }}>
          <div style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Actively Exploited</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: exploitedItems.length > 0 ? colors.orange : colors.green }}>{exploitedItems.length}</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "14px 10px" }}>
          <div style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Avg Risk Score</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: avgRisk >= 50 ? colors.orange : colors.teal }}>{avgRisk}</div>
          <div style={{ fontSize: 7, color: colors.textDim }}>/100</div>
        </Card>
      </div>

      {/* Severity Distribution */}
      {items.length > 0 && (
        <Card style={{ marginBottom: 14, padding: "12px 18px" }}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Severity Distribution</div>
          <div style={{ display: "flex", height: 16, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
            {(["Critical", "High", "Medium", "Low", "Informational"] as const).map((sev) => {
              const count = sevDist[sev];
              const pct = items.length > 0 ? (count / items.length) * 100 : 0;
              if (pct === 0) return null;
              return <div key={sev} style={{ width: `${pct}%`, background: SEV_COLORS[sev], minWidth: count > 0 ? 4 : 0 }} title={`${sev}: ${count}`} />;
            })}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {(["Critical", "High", "Medium", "Low", "Informational"] as const).map((sev) => (
              <span key={sev} style={{ fontSize: 8, color: colors.textMuted }}>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, background: SEV_COLORS[sev], marginRight: 3 }} />
                {sev}: {sevDist[sev]}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Critical / Zero-Day Alerts */}
      {criticalItems.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: colors.red, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Critical & Zero-Day Alerts</div>
          {criticalItems.slice(0, 5).map((item) => (
            <Card key={item.id} onClick={() => setSelectedId(item.id)} style={{ marginBottom: 6, cursor: "pointer", borderLeft: `3px solid ${colors.red}`, background: colors.red + "06" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: colors.white, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    {item.cveId && <span style={{ color: colors.red, marginRight: 6 }}>{item.cveId}</span>}
                    {item.title.substring(0, 100)}
                  </div>
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    <Badge color={colors.red}>{item.severityRank}</Badge>
                    {item.cvssScore && <Badge color={colors.orange}>CVSS {item.cvssScore}</Badge>}
                    {item.isZeroDay && <Badge color={colors.red}>ZERO-DAY</Badge>}
                    {item.isActivelyExploited && <Badge color={colors.red}>EXPLOITED</Badge>}
                    <Badge color={colors.textDim}>{item.feedSource}</Badge>
                    <Badge color={colors.textDim}>{timeAgo(item.publishedAt)}</Badge>
                  </div>
                </div>
                <div style={{ color: colors.red, fontSize: 16, fontWeight: 800, marginLeft: 10 }}>{item.riskScore}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ width: 140 }}>
          <Select label="Severity" value={sevFilter} onChange={setSevFilter} options={["All", "Critical", "High", "Medium", "Low", "Informational"]} />
        </div>
        <div style={{ width: 160 }}>
          <Select label="Source" value={sourceFilter} onChange={setSourceFilter} options={["All", ...sources]} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Input label="Search" value={search} onChange={setSearch} placeholder="Search threats, CVEs, keywords..." style={{ marginBottom: 12 }} />
        </div>
      </div>

      {/* Daily Trend */}
      {items.length > 0 && (
        <Card style={{ marginBottom: 14, padding: "12px 18px" }}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>7-Day Threat Trend</div>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
            {dailyTrend.map((day) => {
              const total = day.Critical + day.High + day.Medium + day.Low;
              const maxTotal = Math.max(...dailyTrend.map((d) => d.Critical + d.High + d.Medium + d.Low), 1);
              const barH = (total / maxTotal) * 70;
              return (
                <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "100%", height: barH, display: "flex", flexDirection: "column", borderRadius: "3px 3px 0 0", overflow: "hidden" }}>
                    {day.Critical > 0 && <div style={{ height: `${(day.Critical / total) * 100}%`, background: colors.red }} />}
                    {day.High > 0 && <div style={{ height: `${(day.High / total) * 100}%`, background: colors.orange }} />}
                    {day.Medium > 0 && <div style={{ height: `${(day.Medium / total) * 100}%`, background: colors.yellow }} />}
                    {day.Low > 0 && <div style={{ height: `${(day.Low / total) * 100}%`, background: colors.green }} />}
                  </div>
                  <div style={{ fontSize: 7, color: colors.textDim, marginTop: 3 }}>{day.date}</div>
                  <div style={{ fontSize: 8, color: colors.textMuted, fontWeight: 600 }}>{total}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Threat Table */}
      {items.length > 0 ? (
        <Card>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Threat Feed ({items.length} items)
          </div>
          {items.slice(0, 50).map((item) => (
            <div key={item.id} onClick={() => setSelectedId(item.id)} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: `1px solid ${colors.panelBorder}`, cursor: "pointer", alignItems: "flex-start" }}>
              <Badge color={SEV_COLORS[item.severityRank]} className="shrink-0">{item.riskScore}</Badge>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: colors.white, fontSize: 11, fontWeight: 500, lineHeight: 1.3 }}>
                  {item.cveId && <span style={{ color: SEV_COLORS[item.severityRank], marginRight: 4, fontSize: 10, fontFamily: "var(--font-mono)" }}>{item.cveId}</span>}
                  {item.title.substring(0, 100)}{item.title.length > 100 ? "..." : ""}
                </div>
                <div style={{ display: "flex", gap: 3, marginTop: 3, flexWrap: "wrap" }}>
                  {item.cvssScore && <Badge color={colors.textDim}>CVSS {item.cvssScore}</Badge>}
                  {item.isZeroDay && <Badge color={colors.red}>0-day</Badge>}
                  {item.isActivelyExploited && <Badge color={colors.red}>exploited</Badge>}
                  {item.tags.slice(0, 3).map((t) => <Badge key={t} color={colors.cyan}>{t}</Badge>)}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: colors.textDim, fontSize: 8 }}>{item.feedSource}</div>
                <div style={{ color: colors.textDim, fontSize: 8 }}>{timeAgo(item.publishedAt)}</div>
              </div>
            </div>
          ))}
          {items.length > 50 && <div style={{ textAlign: "center", padding: "10px 0", color: colors.textDim, fontSize: 10 }}>Showing 50 of {items.length} — use filters to narrow results</div>}
        </Card>
      ) : (
        <Card style={{ textAlign: "center", padding: "40px 18px" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🛡️</div>
          <div style={{ color: colors.white, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>No Threat Data Loaded</div>
          <div style={{ color: colors.textDim, fontSize: 11, maxWidth: 400, margin: "0 auto 16px", lineHeight: 1.5 }}>
            Click &quot;Refresh Feeds&quot; to fetch live threat intelligence from {GLOBAL_FEEDS.length}+ security sources including NVD, CISA, and industry feeds.
          </div>
          <Button onClick={() => fetchFeeds(true)} disabled={threatIntelLoading}>{threatIntelLoading ? "Fetching feeds..." : "Refresh Feeds"}</Button>
        </Card>
      )}
    </div>
  );
}
