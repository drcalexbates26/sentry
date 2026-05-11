"use client";

import { useEffect, useState, useTransition, useCallback, useMemo } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card, SectionHeader, useModal } from "@/components/ui";
import { POLICY_TEMPLATES, FRAMEWORK_OPTIONS, type ComplianceFramework } from "@/data/policy-templates";
import { PolicyEditor } from "./PolicyEditor";
import { exportPolicy, type ExportFormat } from "@/lib/policy-export";
import { diffLines, diffStats } from "@/lib/diff";
import {
  listPolicies, listPolicyApprovers,
  generatePolicyDraft, savePolicyDraft,
  submitPolicyForReview, signOffPolicy, publishPolicy,
  startNewPolicyVersion, discardPolicyDraft, recallPolicyForRevision,
  acknowledgePolicy, listPolicyAcknowledgments,
  type PolicyDTO, type PolicyVersionDTO, type ApproverCandidate, type PolicyAckSummary,
} from "@/app/app/_actions";

type Tab = "templates" | "drafts" | "live" | "coverage";

export function PoliciesModule() {
  const colors = useColors();
  const modal = useModal();
  const tenantName = useStore((s) => s.org?.name ?? "Organization");
  const [policies, setPolicies] = useState<PolicyDTO[]>([]);
  const [approvers, setApprovers] = useState<ApproverCandidate[]>([]);
  const [acks, setAcks] = useState<PolicyAckSummary[]>([]);
  const [tab, setTab] = useState<Tab>("templates");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState<string | null>(null);
  const [diffOpen, setDiffOpen] = useState<{ templateId: string; from: PolicyVersionDTO; to: PolicyVersionDTO } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startAction] = useTransition();

  const refresh = useCallback(async () => {
    const [freshPolicies, freshApprovers, freshAcks] = await Promise.all([
      listPolicies(), listPolicyApprovers(), listPolicyAcknowledgments(),
    ]);
    setPolicies(freshPolicies);
    setApprovers(freshApprovers);
    setAcks(freshAcks);
  }, []);

  useEffect(() => { refresh().catch(() => {}); }, [refresh]);

  /** Opens a modal that lists every other active platform user, asks the
   *  submitter to pick one, and submits the policy for review. */
  const submitForReview = useCallback(async (templateId: string) => {
    const candidates = approvers.filter((a) => !a.isSelf);
    if (candidates.length === 0) {
      await modal.showAlert(
        "No approvers available",
        "There are no other active platform users in this tenant who can approve. Invite a colleague from the Access Control module, then try again.",
      );
      return;
    }
    const labelForCandidate = (a: ApproverCandidate) => `${a.name} · ${a.email}`;
    const r = await modal.showPrompt(
      "Submit for Approval",
      [{
        key: "approver",
        label: "Named Approver (required)",
        type: "select",
        required: true,
        options: candidates.map(labelForCandidate),
      }],
      "Choose one platform user to approve this policy version. You cannot name yourself. The named approver is the only person who can sign off — and once they do, the version is publishable.",
    );
    if (!r) return;
    const picked = candidates.find((a) => labelForCandidate(a) === r.approver);
    if (!picked) {
      await modal.showAlert("Approver missing", "Pick an approver from the list to submit.");
      return;
    }
    handle(
      `review:${templateId}`,
      { title: "Submitted for approval", body: `Awaiting signoff from ${picked.name}. They will see the policy in their Drafts in Flight queue.` },
      () => submitPolicyForReview({ templateId, approverUserId: picked.userId }),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvers]);

  // Helpers --------------------------------------------------------------
  const findByTemplate = (templateId: string) => policies.find((p) => p.templateId === templateId);
  const draftCount = policies.filter((p) => p.draftVersion || p.inReviewVersion).length;
  const liveCount = policies.filter((p) => p.publishedVersion).length;

  const handle = useCallback(<T,>(
    key: string,
    successToast: { title: string; body: string } | null,
    fn: () => Promise<{ ok: boolean; error?: string } & T>,
  ) => {
    setBusyId(key);
    startAction(async () => {
      const res = await fn();
      setBusyId(null);
      if (!res.ok) {
        await modal.showAlert("Action failed", res.error ?? "Unknown error");
        return;
      }
      await refresh();
      if (successToast) await modal.showAlert(successToast.title, successToast.body);
    });
  }, [modal, refresh]);

  // ────────────────────────────────────────────────────────────────────
  // DETAIL VIEW (editor) — shown when a policy is selected
  // ────────────────────────────────────────────────────────────────────
  if (selectedTemplateId) {
    const tpl = POLICY_TEMPLATES.find((t) => t.id === selectedTemplateId);
    const policy = findByTemplate(selectedTemplateId);
    if (!tpl) { setSelectedTemplateId(null); return null; }

    const draft = policy?.draftVersion ?? null;
    const inReview = policy?.inReviewVersion ?? null;
    const published = policy?.publishedVersion ?? null;
    const activeVersion: PolicyVersionDTO | null = inReview ?? draft ?? published;

    return (
      <div>
        <Button variant="ghost" onClick={() => setSelectedTemplateId(null)} style={{ marginBottom: 12 }}>← Back to Policies</Button>

        {/* Header */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 26 }}>{tpl.i}</span>
                <h2 style={{ color: colors.white, margin: 0, fontSize: 18 }}>{tpl.n}</h2>
                {published && <Badge color={colors.green}>Live · v{published.versionNumber}</Badge>}
                {draft && <Badge color={colors.teal}>Draft · v{draft.versionNumber}</Badge>}
                {inReview && <Badge color={colors.orange}>In Review · v{inReview.versionNumber}</Badge>}
              </div>
              <p style={{ color: colors.textMuted, fontSize: 11, margin: 0, lineHeight: 1.5, maxWidth: 700 }}>{tpl.d}</p>
            </div>
          </div>
        </Card>

        {/* Workflow card */}
        {!activeVersion ? (
          <Card style={{ marginBottom: 14, textAlign: "center", padding: "30px 20px", borderColor: colors.teal + "55" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ color: colors.white, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>No version yet</div>
            <p style={{ color: colors.textMuted, fontSize: 11, marginBottom: 16, maxWidth: 480, margin: "0 auto 16px" }}>
              Generate the first draft from the {tpl.n} template. Your organization name, industry, technology stack, and compliance frameworks are merged into the document automatically.
            </p>
            <Button onClick={() => handle(
              `gen:${tpl.id}`,
              { title: "Draft generated", body: "Edit and save as needed, then submit for review when ready." },
              () => generatePolicyDraft(tpl.id),
            )} disabled={busyId === `gen:${tpl.id}`}>
              {busyId === `gen:${tpl.id}` ? "Generating…" : "Generate Draft"}
            </Button>
          </Card>
        ) : (
          <PolicyEditor
            key={activeVersion.id}
            initialContent={activeVersion.content}
            changesSummary={activeVersion.changesSummary}
            readOnly={activeVersion.status !== "draft"}
            saving={busyId === `save:${tpl.id}`}
            headerLeft={
              <>
                <Badge color={statusColor(activeVersion.status, colors)}>{statusLabel(activeVersion.status)}</Badge>
                <span style={{ color: colors.textMuted, fontSize: 10 }}>Version {activeVersion.versionNumber}</span>
                {activeVersion.createdBy?.name && (
                  <span style={{ color: colors.textDim, fontSize: 10 }}>· by {activeVersion.createdBy.name}</span>
                )}
              </>
            }
            actions={
              <>
                <ExportMenu
                  colors={colors}
                  onExport={(format) => exportPolicy(format, activeVersion.content, {
                    tenantName,
                    policyTitle: tpl.n,
                    versionLabel: `v${activeVersion.versionNumber} · ${statusLabel(activeVersion.status)}`,
                    classification: "Confidential",
                    effectiveDate: activeVersion.publishedAt?.split("T")[0],
                    publisher: activeVersion.publishedBy?.name,
                    approver: activeVersion.approver?.name,
                    submitter: activeVersion.submittedBy?.name,
                    templateId: tpl.id,
                  })}
                />
                <PolicyActions
                  policy={policy!}
                  version={activeVersion}
                  busyId={busyId}
                  approvers={approvers}
                  onSubmit={() => submitForReview(tpl.id)}
                  onSignOff={() => handle(`sign:${tpl.id}`, { title: "Approval recorded", body: "You may now publish, or another admin can." }, () => signOffPolicy(tpl.id))}
                  onPublish={() => handle(`pub:${tpl.id}`, { title: "Policy published", body: "The version is now live across the tenant." }, () => publishPolicy(tpl.id))}
                  onRecall={async () => {
                    const ok = await modal.showConfirm(
                      "Recall this policy from review?",
                      "The version returns to Draft state and becomes editable again. The submitter and approver assignments are cleared — when you resubmit you'll pick an approver fresh.",
                    );
                    if (ok) handle(`recall:${tpl.id}`, { title: "Recalled to draft", body: "The policy is editable again and the named approver was unassigned." }, () => recallPolicyForRevision(tpl.id));
                  }}
                  onDiscard={async () => {
                    const inReviewWarning = activeVersion.status === "in_review"
                      ? "This version is currently in review. Discarding deletes it entirely — the named approver will no longer see it. "
                      : "";
                    const ok = await modal.showConfirm(
                      "Discard this version?",
                      `${inReviewWarning}The working draft is permanently removed. The published version (if any) remains live.`,
                      "danger",
                    );
                    if (ok) handle(`disc:${tpl.id}`, { title: "Version discarded", body: "The draft has been removed." }, () => discardPolicyDraft(tpl.id));
                  }}
                  onStartNewVersion={() => handle(`new:${tpl.id}`, { title: "New version started", body: "A fresh draft has been forked from the published version." }, () => startNewPolicyVersion(tpl.id))}
                />
              </>
            }
            onSave={async (content, changesSummary) => {
              await new Promise<void>((resolve) => {
                setBusyId(`save:${tpl.id}`);
                startAction(async () => {
                  const res = await savePolicyDraft({ templateId: tpl.id, content, changesSummary });
                  setBusyId(null);
                  if (!res.ok) await modal.showAlert("Save failed", res.error ?? "Unknown error");
                  await refresh();
                  resolve();
                });
              });
            }}
          />
        )}

        {/* Approval record (when in review) */}
        {inReview && (
          <Card style={{ marginTop: 14, borderLeft: `3px solid ${colors.orange}` }}>
            <h3 style={{ color: colors.white, margin: 0, fontSize: 13 }}>Approval record</h3>
            <p style={{ color: colors.textMuted, fontSize: 11, margin: "4px 0 10px", lineHeight: 1.5 }}>
              Submission counts as the submitter's signoff. The named approver — chosen at submission — is the only person who can record the approval. Once they sign, the policy is publishable.
            </p>
            <SignoffRowKV
              label="Submitted by"
              value={inReview.submittedBy ? `${inReview.submittedBy.name} · ${new Date(inReview.submittedBy.at).toLocaleString()}` : "—"}
              colors={colors}
              good={!!inReview.submittedBy}
            />
            <SignoffRowKV
              label="Named approver"
              value={inReview.approver?.name ?? "—"}
              colors={colors}
              good={!!inReview.approver}
            />
            <SignoffRowKV
              label="Approver signoff"
              value={inReview.approverSignedAt
                ? `✓ ${inReview.approver?.name ?? "Approver"} · ${new Date(inReview.approverSignedAt).toLocaleString()}`
                : `Awaiting ${inReview.approver?.name ?? "approver"}`}
              colors={colors}
              good={!!inReview.approverSignedAt}
            />
          </Card>
        )}

        {/* Acknowledgment widget — only on policies with a published version */}
        {policy && published && (
          <AckWidget
            ack={acks.find((a) => a.templateId === tpl.id) ?? null}
            colors={colors}
            onAck={() => handle(`ack:${tpl.id}`, { title: "Acknowledgment recorded", body: "Thanks — your signature is on file for this version." }, () => acknowledgePolicy(tpl.id))}
            busy={busyId === `ack:${tpl.id}`}
          />
        )}

        {/* Version history */}
        {policy && policy.versions.length > 0 && (
          <Card style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ color: colors.white, margin: 0, fontSize: 13 }}>Version history</h3>
              <span style={{ color: colors.textDim, fontSize: 10 }}>{policy.versions.length} version{policy.versions.length === 1 ? "" : "s"}</span>
            </div>
            {policy.versions.map((v, idx) => {
              // "Compare to previous" available when there's a chronologically prior version.
              const prev = policy.versions[idx + 1];
              return (
                <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: `1px solid ${colors.panelBorder}` }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: colors.white, fontSize: 11, fontWeight: 700 }}>v{v.versionNumber}</span>
                      <Badge color={statusColor(v.status, colors)}>{statusLabel(v.status)}</Badge>
                      {v.publishedAt && <span style={{ color: colors.green, fontSize: 10 }}>· went live {new Date(v.publishedAt).toLocaleString()}</span>}
                    </div>
                    {v.changesSummary && <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{v.changesSummary}</div>}
                    <div style={{ color: colors.textDim, fontSize: 9, marginTop: 2 }}>
                      by {v.createdBy?.name ?? "Unknown"} · {new Date(v.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {prev && (
                    <Button variant="ghost" size="sm" onClick={() => setDiffOpen({ templateId: tpl.id, from: prev, to: v })}>
                      Diff vs v{prev.versionNumber}
                    </Button>
                  )}
                </div>
              );
            })}
          </Card>
        )}

        {diffOpen && diffOpen.templateId === tpl.id && (
          <DiffView from={diffOpen.from} to={diffOpen.to} onClose={() => setDiffOpen(null)} colors={colors} />
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // LIST VIEW — three sections
  // ────────────────────────────────────────────────────────────────────
  return (
    <div>
      <SectionHeader sub="Generate, version, sign off, and publish enterprise security policies. Every policy is templated against your organization profile and tracked with full audit history.">
        Policies
      </SectionHeader>

      {/* Summary strip — each tile drills into its tab */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        <StatTile
          label="Templates available"
          value={POLICY_TEMPLATES.length}
          color={colors.textMuted}
          sub="Click to browse the catalog"
          onClick={() => setTab("templates")}
          active={tab === "templates"}
        />
        <StatTile
          label="Drafts in flight"
          value={draftCount}
          color={colors.teal}
          sub={draftCount > 0 ? "Click to continue editing or sign off" : "None — your library is current"}
          onClick={() => setTab("drafts")}
          active={tab === "drafts"}
        />
        <StatTile
          label="Live policies"
          value={liveCount}
          color={colors.green}
          sub={liveCount > 0 ? "Click to review and export" : "Nothing published yet"}
          onClick={() => setTab("live")}
          active={tab === "live"}
        />
        <StatTile
          label="Framework coverage"
          value={countCoveredFrameworks(policies)}
          valueSuffix={`/${FRAMEWORK_OPTIONS.length}`}
          color={colors.purple}
          sub="Click for the coverage matrix"
          onClick={() => setTab("coverage")}
          active={tab === "coverage"}
        />
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 3, borderBottom: `1px solid ${colors.panelBorder}`, paddingBottom: 4, marginBottom: 14 }}>
        {([
          ["templates", `Templates (${POLICY_TEMPLATES.length})`],
          ["drafts", `Drafts in Flight${draftCount > 0 ? ` (${draftCount})` : ""}`],
          ["live", `Live Policies${liveCount > 0 ? ` (${liveCount})` : ""}`],
          ["coverage", "Compliance Coverage"],
        ] as const).map(([id, label]) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "6px 14px", borderRadius: "6px 6px 0 0", border: "none", cursor: "pointer",
              background: active ? colors.teal + "22" : "transparent",
              color: active ? colors.teal : colors.textMuted,
              fontSize: 12, fontWeight: 700, fontFamily: "inherit",
              borderBottom: active ? `2px solid ${colors.teal}` : "2px solid transparent",
            }}>{label}</button>
          );
        })}
      </div>

      {/* Templates tab — table view */}
      {tab === "templates" && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <colgroup>
                <col style={{ width: "30%" }} />
                <col style={{ width: "32%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr style={{ background: colors.obsidianM, borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <th style={tableHeadStyle(colors)}>Policy</th>
                  <th style={tableHeadStyle(colors)}>Description</th>
                  <th style={tableHeadStyle(colors)}>Frameworks</th>
                  <th style={tableHeadStyle(colors)}>Status</th>
                  <th style={{ ...tableHeadStyle(colors), textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {POLICY_TEMPLATES.map((t) => {
                  const policy = findByTemplate(t.id);
                  const live = policy?.publishedVersion;
                  const draft = policy?.draftVersion;
                  const review = policy?.inReviewVersion;
                  const generating = busyId === `gen:${t.id}`;

                  // Status: pick the most-actionable badge.
                  let statusBadge: React.ReactNode;
                  let statusMeta: React.ReactNode = null;
                  if (live) {
                    statusBadge = <Badge color={colors.green}>Live · v{live.versionNumber}</Badge>;
                    statusMeta = <div style={{ color: colors.textDim, fontSize: 9, marginTop: 3 }}>Went live {new Date(live.publishedAt!).toLocaleDateString()}</div>;
                  } else if (review) {
                    statusBadge = <Badge color={colors.orange}>In Review · v{review.versionNumber}</Badge>;
                    statusMeta = review.approver?.name ? <div style={{ color: colors.textDim, fontSize: 9, marginTop: 3 }}>Awaiting {review.approver.name}</div> : null;
                  } else if (draft) {
                    statusBadge = <Badge color={colors.teal}>Draft · v{draft.versionNumber}</Badge>;
                    statusMeta = <div style={{ color: colors.textDim, fontSize: 9, marginTop: 3 }}>Edited {new Date(draft.updatedAt).toLocaleDateString()}</div>;
                  } else {
                    statusBadge = <Badge color={colors.textDim}>Not generated</Badge>;
                  }

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      style={{
                        borderBottom: `1px solid ${colors.panelBorder}`,
                        cursor: "pointer",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = colors.teal + "0A"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <td style={tableCellStyle()}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{t.i}</span>
                          <span style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{t.n}</span>
                        </div>
                      </td>
                      <td style={tableCellStyle()}>
                        <span style={{ color: colors.textMuted, fontSize: 10, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {t.d}
                        </span>
                      </td>
                      <td style={tableCellStyle()}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {t.frameworks.map((fw) => (
                            <span key={fw} style={{
                              display: "inline-block", padding: "2px 6px", borderRadius: 4,
                              background: colors.obsidianM, color: colors.textMuted,
                              fontSize: 9, fontWeight: 600,
                            }}>{fw}</span>
                          ))}
                        </div>
                      </td>
                      <td style={tableCellStyle()}>
                        <div>{statusBadge}</div>
                        {statusMeta}
                      </td>
                      <td style={{ ...tableCellStyle(), textAlign: "right" }}>
                        {/* Wrapper stops the row click from racing the row navigation —
                            otherwise both fire and the user lands in the detail view
                            before the server action returns. */}
                        <div onClick={(e) => e.stopPropagation()} style={{ display: "inline-block" }}>
                          {!policy ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={generating}
                              onClick={() => {
                                setBusyId(`gen:${t.id}`);
                                startAction(async () => {
                                  const res = await generatePolicyDraft(t.id);
                                  setBusyId(null);
                                  if (!res.ok) {
                                    await modal.showAlert("Generate failed", res.error ?? "Unknown error");
                                    return;
                                  }
                                  await refresh();
                                  setSelectedTemplateId(t.id);
                                });
                              }}
                            >
                              {generating ? "Generating…" : "Generate"}
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setSelectedTemplateId(t.id)}>
                              Open →
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Drafts tab */}
      {tab === "drafts" && (
        <>
          {draftCount === 0 ? (
            <Card style={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div style={{ color: colors.white, fontSize: 13, fontWeight: 700 }}>No drafts in flight</div>
              <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>Generate a new policy or start a new version from the Live tab.</div>
            </Card>
          ) : (
            policies
              .filter((p) => p.draftVersion || p.inReviewVersion)
              .map((p) => {
                const tpl = POLICY_TEMPLATES.find((t) => t.id === p.templateId)!;
                const v = p.inReviewVersion ?? p.draftVersion!;
                return (
                  <Card key={p.id} onClick={() => setSelectedTemplateId(p.templateId)} style={{ cursor: "pointer", marginBottom: 10, borderLeft: `3px solid ${v.status === "in_review" ? colors.orange : colors.teal}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{tpl.i}</span>
                          <span style={{ color: colors.white, fontSize: 13, fontWeight: 700 }}>{tpl.n}</span>
                          <Badge color={statusColor(v.status, colors)}>{statusLabel(v.status)} · v{v.versionNumber}</Badge>
                        </div>
                        <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>
                          {v.changesSummary || "No change summary yet."}
                        </div>
                        {v.status === "in_review" && (
                          <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
                            <span style={{ color: v.submittedBy ? colors.green : colors.textDim, fontSize: 10 }}>
                              {v.submittedBy ? `✓ Submitted by ${v.submittedBy.name}` : "Awaiting submission"}
                            </span>
                            <span style={{ color: v.approverSignedAt ? colors.green : colors.textDim, fontSize: 10 }}>
                              {v.approverSignedAt
                                ? `✓ Approved by ${v.approver?.name ?? "approver"}`
                                : `Awaiting approval from ${v.approver?.name ?? "named approver"}`}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="outline">Open →</Button>
                    </div>
                  </Card>
                );
              })
          )}
        </>
      )}

      {/* Live tab */}
      {tab === "live" && (
        <>
          {liveCount === 0 ? (
            <Card style={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div style={{ color: colors.white, fontSize: 13, fontWeight: 700 }}>No live policies yet</div>
              <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>Generate, sign off, and publish a draft to see it here.</div>
            </Card>
          ) : (
            policies
              .filter((p) => p.publishedVersion)
              .map((p) => {
                const tpl = POLICY_TEMPLATES.find((t) => t.id === p.templateId)!;
                const v = p.publishedVersion!;
                return (
                  <Card key={p.id} style={{ marginBottom: 10, borderLeft: `3px solid ${colors.green}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 20 }}>{tpl.i}</span>
                          <span style={{ color: colors.white, fontSize: 14, fontWeight: 700 }}>{tpl.n}</span>
                          <Badge color={colors.green}>Live · v{v.versionNumber}</Badge>
                          {(() => {
                            const a = acks.find((x) => x.templateId === p.templateId);
                            if (!a || a.totalEligible === 0) return null;
                            const pct = Math.round((a.acknowledged / a.totalEligible) * 100);
                            return (
                              <Badge color={pct === 100 ? colors.green : pct >= 50 ? colors.orange : colors.red}>
                                {a.acknowledged}/{a.totalEligible} acknowledged · {pct}%
                              </Badge>
                            );
                          })()}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 14, rowGap: 3, fontSize: 10, color: colors.textMuted, maxWidth: 720 }}>
                          <span style={{ color: colors.textDim }}>Went live</span><span>{new Date(v.publishedAt!).toLocaleString()}</span>
                          <span style={{ color: colors.textDim }}>Published by</span><span>{v.publishedBy?.name ?? "—"}</span>
                          {v.submittedBy && <><span style={{ color: colors.textDim }}>Submitted by</span><span>{v.submittedBy.name} · {new Date(v.submittedBy.at).toLocaleString()}</span></>}
                          {v.approver && v.approverSignedAt && <><span style={{ color: colors.textDim }}>Approved by</span><span>{v.approver.name} · {new Date(v.approverSignedAt).toLocaleString()}</span></>}
                          <span style={{ color: colors.textDim }}>Frameworks</span><span>{tpl.frameworks.join(" · ")}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <Button size="sm" onClick={() => setSelectedTemplateId(p.templateId)}>View</Button>
                        <ExportMenu
                          colors={colors}
                          compact
                          onExport={(format) => exportPolicy(format, v.content, {
                            tenantName,
                            policyTitle: tpl.n,
                            versionLabel: `v${v.versionNumber} · Live`,
                            classification: "Confidential",
                            effectiveDate: v.publishedAt?.split("T")[0],
                            publisher: v.publishedBy?.name,
                            approver: v.approver?.name,
                            submitter: v.submittedBy?.name,
                            templateId: p.templateId,
                          })}
                        />
                        <Button size="sm" variant="outline" onClick={() => handle(`new:${p.templateId}`, { title: "New version started", body: "A fresh draft has been forked." }, () => startNewPolicyVersion(p.templateId))} disabled={!!p.draftVersion || busyId === `new:${p.templateId}`}>
                          {p.draftVersion ? "Draft in flight" : "New Version"}
                        </Button>
                      </div>
                    </div>
                    {historyOpen === p.id && (
                      <div style={{ marginTop: 12, paddingTop: 8, borderTop: `1px solid ${colors.panelBorder}` }}>
                        {p.versions.filter((x) => x.publishedAt).map((pv) => (
                          <div key={pv.id} style={{ color: colors.textMuted, fontSize: 10, padding: "3px 0" }}>
                            v{pv.versionNumber} · went live {new Date(pv.publishedAt!).toLocaleString()} · published by {pv.publishedBy?.name ?? "—"}
                          </div>
                        ))}
                      </div>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setHistoryOpen(historyOpen === p.id ? null : p.id)} style={{ marginTop: 4 }}>
                      {historyOpen === p.id ? "Hide history" : `Publication history (${p.versions.filter((x) => x.publishedAt).length})`}
                    </Button>
                  </Card>
                );
              })
          )}
        </>
      )}

      {/* Coverage tab */}
      {tab === "coverage" && (
        <CoverageMatrix policies={policies} colors={colors} />
      )}
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────

function statusColor(status: string, colors: ReturnType<typeof useColors>): string {
  if (status === "published") return colors.green;
  if (status === "in_review") return colors.orange;
  if (status === "draft") return colors.teal;
  return colors.textDim; // archived
}
function statusLabel(status: string): string {
  if (status === "published") return "Published";
  if (status === "in_review") return "In Review";
  if (status === "draft") return "Draft";
  if (status === "archived") return "Archived";
  return status;
}

function tableHeadStyle(colors: ReturnType<typeof useColors>): React.CSSProperties {
  return {
    textAlign: "left", padding: "10px 14px",
    color: colors.textDim, fontSize: 9, fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase",
  };
}
function tableCellStyle(): React.CSSProperties {
  return { padding: "12px 14px", verticalAlign: "middle" };
}

function StatTile({
  label, value, color, sub, valueSuffix, onClick, active,
}: {
  label: string;
  value: number;
  color: string;
  sub?: string;
  valueSuffix?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const colors = useColors();
  return (
    <Card
      onClick={onClick}
      style={{
        padding: "12px 14px",
        cursor: onClick ? "pointer" : "default",
        borderColor: active ? color + "55" : undefined,
        background: active ? color + "0F" : undefined,
      }}
    >
      <div style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ color, fontSize: 26, fontWeight: 800, lineHeight: 1.1, marginTop: 4 }}>
        {value}
        {valueSuffix && <span style={{ color: colors.textDim, fontSize: 14, fontWeight: 600 }}>{valueSuffix}</span>}
      </div>
      {sub && <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

/** Counts how many compliance frameworks are covered by at least one published policy. */
function countCoveredFrameworks(policies: PolicyDTO[]): number {
  const covered = new Set<ComplianceFramework>();
  for (const p of policies) {
    if (!p.publishedVersion) continue;
    const tpl = POLICY_TEMPLATES.find((t) => t.id === p.templateId);
    tpl?.frameworks.forEach((f) => covered.add(f));
  }
  return covered.size;
}

/** Export dropdown — PDF / Word / TXT / Markdown. Closes on outside click. */
function ExportMenu({ colors, onExport, compact }: { colors: ReturnType<typeof useColors>; onExport: (format: ExportFormat) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    setTimeout(() => window.addEventListener("click", close, { once: true }), 0);
    return () => window.removeEventListener("click", close);
  }, [open]);

  const formats: { id: ExportFormat; label: string; hint: string }[] = [
    { id: "pdf",  label: "PDF",      hint: "Print-styled, saves via browser" },
    { id: "docx", label: "Word",     hint: ".doc — opens in Word / Google Docs" },
    { id: "txt",  label: "Text",     hint: "Plain text, markdown stripped" },
    { id: "md",   label: "Markdown", hint: "Raw .md source" },
  ];
  return (
    <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
      <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
        {compact ? "Export ▾" : "Export ▾"}
      </Button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, marginTop: 4, zIndex: 60,
          background: colors.panel, border: `1px solid ${colors.panelBorder}`,
          borderRadius: 7, boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
          minWidth: 220, padding: 4,
        }}>
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => { setOpen(false); onExport(f.id); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 10px", borderRadius: 5, border: "none",
                background: "transparent", color: colors.text, cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = colors.teal + "1A"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{ fontWeight: 700, fontSize: 12 }}>{f.label}</div>
              <div style={{ color: colors.textDim, fontSize: 10, marginTop: 1 }}>{f.hint}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Acknowledgment widget shown on every published policy. Lets the current
 *  user acknowledge; shows org-wide coverage summary. */
function AckWidget({
  ack, colors, onAck, busy,
}: {
  ack: PolicyAckSummary | null;
  colors: ReturnType<typeof useColors>;
  onAck: () => void;
  busy: boolean;
}) {
  if (!ack) return null;
  const pct = ack.totalEligible === 0 ? 0 : Math.round((ack.acknowledged / ack.totalEligible) * 100);
  const tone = pct === 100 ? colors.green : pct >= 50 ? colors.orange : colors.red;

  return (
    <Card style={{ marginTop: 14, borderLeft: `3px solid ${tone}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: colors.white, margin: 0, fontSize: 13 }}>Workforce acknowledgment</h3>
          <p style={{ color: colors.textMuted, fontSize: 11, margin: "4px 0 8px", lineHeight: 1.5 }}>
            Every active platform user is expected to acknowledge they've read the live version of this policy. Coverage resets when a new version publishes.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ color: tone, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
              {ack.acknowledged}<span style={{ color: colors.textDim, fontSize: 14 }}> / {ack.totalEligible}</span>
            </div>
            <div style={{ flex: 1, height: 6, background: colors.obsidianL, borderRadius: 3, overflow: "hidden", maxWidth: 320 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: tone }} />
            </div>
            <span style={{ color: tone, fontSize: 12, fontWeight: 700 }}>{pct}%</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "stretch" }}>
          {ack.meAcknowledged ? (
            <Badge color={colors.green}>✓ You've acknowledged</Badge>
          ) : (
            <Button size="sm" onClick={onAck} disabled={busy}>
              {busy ? "Recording…" : "I have read this policy"}
            </Button>
          )}
        </div>
      </div>

      {ack.users.length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ color: colors.textMuted, fontSize: 11, cursor: "pointer" }}>Per-user coverage</summary>
          <div style={{ marginTop: 8 }}>
            {ack.users.map((u) => (
              <div key={u.userId} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: `1px solid ${colors.panelBorder}` }}>
                <span style={{ color: colors.text, fontSize: 11 }}>
                  {u.name} <span style={{ color: colors.textDim, fontSize: 10 }}>· {u.email}</span>
                </span>
                <span style={{ color: u.acknowledgedAt ? colors.green : colors.textDim, fontSize: 11 }}>
                  {u.acknowledgedAt ? `✓ ${new Date(u.acknowledgedAt).toLocaleString()}` : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </Card>
  );
}

/** Diff modal — line-level comparison between two versions of a policy. */
function DiffView({ from, to, onClose, colors }: { from: PolicyVersionDTO; to: PolicyVersionDTO; onClose: () => void; colors: ReturnType<typeof useColors> }) {
  const lines = useMemo(() => diffLines(from.content, to.content), [from.content, to.content]);
  const stats = useMemo(() => diffStats(lines), [lines]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        padding: 20,
      }}
    >
      <div style={{
        background: colors.panel, border: `1px solid ${colors.panelBorder}`,
        borderRadius: 10, width: "100%", maxWidth: 980, maxHeight: "90vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${colors.panelBorder}`, background: colors.obsidianM }}>
          <div>
            <h3 style={{ color: colors.white, margin: 0, fontSize: 14 }}>
              v{from.versionNumber} → v{to.versionNumber}
            </h3>
            <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 11 }}>
              <span style={{ color: colors.green }}>+ {stats.added} added</span>
              <span style={{ color: colors.red }}>− {stats.removed} removed</span>
              <span style={{ color: colors.textMuted }}>= {lines.length - stats.added - stats.removed} unchanged</span>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div style={{ overflowY: "auto", padding: "12px 0", fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 11, lineHeight: 1.55 }}>
          {lines.map((l, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "44px 44px 18px 1fr",
              gap: 4,
              padding: "1px 14px",
              background: l.op === "add" ? colors.green + "12" : l.op === "remove" ? colors.red + "12" : "transparent",
              color: l.op === "equal" ? colors.textMuted : colors.text,
            }}>
              <span style={{ color: colors.textDim, textAlign: "right" }}>{l.oldLine ?? ""}</span>
              <span style={{ color: colors.textDim, textAlign: "right" }}>{l.newLine ?? ""}</span>
              <span style={{ color: l.op === "add" ? colors.green : l.op === "remove" ? colors.red : colors.textDim, textAlign: "center", fontWeight: 700 }}>
                {l.op === "add" ? "+" : l.op === "remove" ? "−" : " "}
              </span>
              <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{l.text || " "}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Compliance Coverage matrix — frameworks × templates with live/draft/none status. */
function CoverageMatrix({ policies, colors }: { policies: PolicyDTO[]; colors: ReturnType<typeof useColors> }) {
  const statusByTemplate = useMemo(() => {
    const m: Record<string, "live" | "draft" | "none"> = {};
    for (const tpl of POLICY_TEMPLATES) {
      const p = policies.find((x) => x.templateId === tpl.id);
      m[tpl.id] = p?.publishedVersion ? "live" : p?.draftVersion || p?.inReviewVersion ? "draft" : "none";
    }
    return m;
  }, [policies]);

  return (
    <Card>
      <h3 style={{ color: colors.white, margin: 0, fontSize: 14, fontWeight: 700 }}>Compliance Framework Coverage</h3>
      <p style={{ color: colors.textMuted, fontSize: 11, margin: "3px 0 14px", maxWidth: 740, lineHeight: 1.5 }}>
        Cross-reference each policy template against the frameworks it provides evidence for. A framework is <strong>covered</strong> when at least one mapped policy has a published version.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 18 }}>
        {FRAMEWORK_OPTIONS.map((fw) => {
          const mapped = POLICY_TEMPLATES.filter((t) => t.frameworks.includes(fw));
          const live = mapped.filter((t) => statusByTemplate[t.id] === "live").length;
          const draft = mapped.filter((t) => statusByTemplate[t.id] === "draft").length;
          const tone = live > 0 ? colors.green : draft > 0 ? colors.orange : colors.red;
          return (
            <div key={fw} style={{ background: colors.obsidianM, borderRadius: 8, padding: 12, borderLeft: `3px solid ${tone}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{fw}</span>
                <Badge color={tone}>{live > 0 ? "Covered" : draft > 0 ? "In Progress" : "Gap"}</Badge>
              </div>
              <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>
                {live} live · {draft} in flight · {mapped.length - live - draft} not started
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed matrix */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: `1px solid ${colors.panelBorder}`, color: colors.textDim, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>POLICY</th>
              <th style={{ textAlign: "center", padding: "8px 6px", borderBottom: `1px solid ${colors.panelBorder}`, color: colors.textDim, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>STATUS</th>
              {FRAMEWORK_OPTIONS.map((fw) => (
                <th key={fw} style={{ textAlign: "center", padding: "8px 6px", borderBottom: `1px solid ${colors.panelBorder}`, color: colors.textDim, fontSize: 9, fontWeight: 700, letterSpacing: "0.04em" }}>
                  {fw}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {POLICY_TEMPLATES.map((tpl) => {
              const status = statusByTemplate[tpl.id];
              return (
                <tr key={tpl.id} style={{ borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <td style={{ padding: "8px 6px", color: colors.text }}>
                    <span style={{ marginRight: 6 }}>{tpl.i}</span>{tpl.n}
                  </td>
                  <td style={{ padding: "8px 6px", textAlign: "center" }}>
                    <Badge color={status === "live" ? colors.green : status === "draft" ? colors.orange : colors.textDim}>
                      {status === "live" ? "Live" : status === "draft" ? "In Flight" : "—"}
                    </Badge>
                  </td>
                  {FRAMEWORK_OPTIONS.map((fw) => {
                    const applies = tpl.frameworks.includes(fw);
                    return (
                      <td key={fw} style={{ padding: "8px 6px", textAlign: "center", color: applies ? (status === "live" ? colors.green : colors.textMuted) : colors.panelBorder, fontSize: 14 }}>
                        {applies ? (status === "live" ? "●" : "○") : "·"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14, color: colors.textDim, fontSize: 10, lineHeight: 1.6 }}>
        Legend: <span style={{ color: colors.green }}>● live</span> · <span style={{ color: colors.textMuted }}>○ mapped but not published</span> · <span style={{ color: colors.panelBorder }}>· not applicable</span>
      </div>
    </Card>
  );
}

function SignoffRowKV({ label, value, colors, good }: { label: string; value: string; colors: ReturnType<typeof useColors>; good?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: `1px solid ${colors.panelBorder}` }}>
      <span style={{ color: colors.textMuted, fontSize: 11 }}>{label}</span>
      <span style={{ color: good ? colors.green : colors.textDim, fontSize: 11 }}>{value}</span>
    </div>
  );
}

function PolicyActions({
  policy, version, busyId, approvers, onSubmit, onSignOff, onPublish, onDiscard, onRecall, onStartNewVersion,
}: {
  policy: PolicyDTO;
  version: PolicyVersionDTO;
  busyId: string | null;
  approvers: ApproverCandidate[];
  onSubmit: () => void;
  onSignOff: () => void;
  onPublish: () => void;
  onDiscard: () => void;
  onRecall: () => void;
  onStartNewVersion: () => void;
}) {
  const tplId = policy.templateId;
  const me = approvers.find((a) => a.isSelf);
  const isNamedApprover = !!(version.approver && me && version.approver.userId === me.userId);
  const approved = !!version.approverSignedAt;

  if (version.status === "draft") {
    return (
      <>
        <Button size="sm" variant="ghost" onClick={onDiscard} disabled={busyId === `disc:${tplId}`}>Discard</Button>
        <Button size="sm" onClick={onSubmit} disabled={busyId === `review:${tplId}`}>
          {busyId === `review:${tplId}` ? "Submitting…" : "Submit for Approval"}
        </Button>
      </>
    );
  }
  if (version.status === "in_review") {
    return (
      <>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDiscard}
          disabled={busyId === `disc:${tplId}`}
        >
          Discard
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRecall}
          disabled={busyId === `recall:${tplId}`}
        >
          {busyId === `recall:${tplId}` ? "Recalling…" : "Recall to Draft"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onSignOff}
          disabled={!isNamedApprover || approved || busyId === `sign:${tplId}`}
        >
          {approved
            ? `✓ Approved`
            : !isNamedApprover
              ? `Approval pending (${version.approver?.name ?? "approver"})`
              : busyId === `sign:${tplId}` ? "Signing…" : "Sign Off as Approver"}
        </Button>
        <Button size="sm" onClick={onPublish} disabled={!approved || busyId === `pub:${tplId}`}>
          {busyId === `pub:${tplId}` ? "Publishing…" : "Publish"}
        </Button>
      </>
    );
  }
  if (version.status === "published") {
    return (
      <Button size="sm" variant="outline" onClick={onStartNewVersion} disabled={!!policy.draftVersion || busyId === `new:${tplId}`}>
        {policy.draftVersion ? "Draft in flight" : busyId === `new:${tplId}` ? "Forking…" : "Start New Version"}
      </Button>
    );
  }
  return null;
}
