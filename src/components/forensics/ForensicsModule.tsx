"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { colors } from "@/lib/tokens";
import { useStore } from "@/store";
import type { ForensicLogEntry, EvidenceFile } from "@/store";
import { Badge, Button, Card, Input, Select, SectionHeader } from "@/components/ui";

const CLASSIFICATIONS = ["Internal", "Confidential", "Restricted", "Privileged & Confidential"] as const;
const CURRENT_USER = "Admin"; // Would come from auth in production

async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1073741824).toFixed(2) + " GB";
}

export function ForensicsModule() {
  const { forensicLogs, addForensicLog, updateForensicLog, activeIncident, cases, team } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [selId, setSelId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<EvidenceFile[]>([]);
  const [showAccessModal, setShowAccessModal] = useState<number | null>(null);
  const [newAccessPerson, setNewAccessPerson] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nf, setNf] = useState({
    title: "",
    classification: "Confidential" as typeof CLASSIFICATIONS[number],
    incidentId: "",
    description: "",
    chainOfCustody: "",
  });

  // Build incident options from real incidents + cases
  const incidentOptions = useMemo(() => [
    ...(activeIncident ? [{ id: `active_${activeIncident.title}`, title: `[ACTIVE] ${activeIncident.title}` }] : []),
    ...cases.map((c) => ({ id: `case_${c.title}_${c.date}`, title: `${c.title} (${c.date})` })),
  ], [activeIncident, cases]);

  const hasIncidents = incidentOptions.length > 0;

  const handleFiles = useCallback(async (fileList: FileList) => {
    setUploading(true);
    const newFiles: EvidenceFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const sha256 = await computeSHA256(file);
      newFiles.push({
        id: Date.now() + i,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        sha256,
        uploadedAt: new Date().toLocaleString(),
      });
    }
    setPendingFiles((prev) => [...prev, ...newFiles]);
    setUploading(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const submitEvidence = useCallback(() => {
    if (!nf.title || !nf.incidentId) return;
    const selectedIncident = incidentOptions.find((i) => i.id === nf.incidentId);
    const entry: ForensicLogEntry = {
      id: Date.now(),
      title: nf.title,
      classification: nf.classification,
      incidentId: nf.incidentId,
      incidentTitle: selectedIncident?.title || "",
      description: nf.description,
      chainOfCustody: nf.chainOfCustody,
      createdBy: CURRENT_USER,
      createdAt: new Date().toLocaleString(),
      accessList: [CURRENT_USER],
      files: pendingFiles,
      locked: true,
    };
    addForensicLog(entry);
    setShowNew(false);
    setPendingFiles([]);
    setNf({ title: "", classification: "Confidential", incidentId: "", description: "", chainOfCustody: "" });
  }, [nf, pendingFiles, incidentOptions, addForensicLog]);

  const removeFile = useCallback((fileId: number) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const addFileToExisting = useCallback(async (evidenceId: number, fileList: FileList) => {
    const entry = forensicLogs.find((l) => l.id === evidenceId);
    if (!entry || entry.createdBy !== CURRENT_USER) return;

    const newFiles: EvidenceFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const sha256 = await computeSHA256(file);
      newFiles.push({
        id: Date.now() + i,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        sha256,
        uploadedAt: new Date().toLocaleString(),
      });
    }
    updateForensicLog(evidenceId, { files: [...entry.files, ...newFiles] });
  }, [forensicLogs, updateForensicLog]);

  const grantAccess = useCallback((evidenceId: number, person: string) => {
    const entry = forensicLogs.find((l) => l.id === evidenceId);
    if (!entry || entry.createdBy !== CURRENT_USER) return;
    if (entry.accessList.includes(person)) return;
    updateForensicLog(evidenceId, { accessList: [...entry.accessList, person] });
  }, [forensicLogs, updateForensicLog]);

  const revokeAccess = useCallback((evidenceId: number, person: string) => {
    const entry = forensicLogs.find((l) => l.id === evidenceId);
    if (!entry || entry.createdBy !== CURRENT_USER) return;
    if (person === entry.createdBy) return; // Can't revoke creator
    updateForensicLog(evidenceId, { accessList: entry.accessList.filter((p) => p !== person) });
  }, [forensicLogs, updateForensicLog]);

  // ─── DETAIL VIEW ──────────────────────────────────────────────────
  if (selId !== null) {
    const entry = forensicLogs.find((l) => l.id === selId);
    if (!entry) { setSelId(null); return null; }
    const isCreator = entry.createdBy === CURRENT_USER;
    const hasAccess = entry.accessList.includes(CURRENT_USER);

    if (!hasAccess) {
      return (
        <div>
          <Button variant="ghost" onClick={() => setSelId(null)} style={{ marginBottom: 12 }}>← Back to Evidence Vault</Button>
          <Card style={{ textAlign: "center", padding: "40px 18px", borderColor: colors.red + "44" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
            <h3 style={{ color: colors.red, marginTop: 0 }}>Access Denied</h3>
            <p style={{ color: colors.textMuted, fontSize: 12 }}>You do not have permission to view this evidence. Contact the creator ({entry.createdBy}) to request access.</p>
          </Card>
        </div>
      );
    }

    return (
      <div>
        <Button variant="ghost" onClick={() => setSelId(null)} style={{ marginBottom: 12 }}>← Back to Evidence Vault</Button>

        {/* Evidence Header */}
        <Card style={{ marginBottom: 14, borderLeft: `3px solid ${colors.cyan}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>🔒</span>
                <h2 style={{ color: colors.white, margin: 0, fontSize: 16 }}>{entry.title}</h2>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                <Badge color={colors.cyan}>{entry.classification}</Badge>
                <Badge color={colors.orange}>{entry.incidentTitle}</Badge>
                <Badge color={colors.textDim}>Created: {entry.createdAt}</Badge>
              </div>
              <div style={{ color: colors.textMuted, fontSize: 10 }}>
                Created by: <strong style={{ color: colors.white }}>{entry.createdBy}</strong>
              </div>
            </div>
            {isCreator && (
              <div style={{ display: "flex", gap: 6 }}>
                <Button variant="outline" size="sm" onClick={() => setShowAccessModal(entry.id)}>
                  Manage Access ({entry.accessList.length})
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Access Management Modal */}
        {showAccessModal === entry.id && isCreator && (
          <Card style={{ marginBottom: 14, borderColor: colors.purple + "44", background: `linear-gradient(135deg,${colors.purple}06,${colors.panel})` }}>
            <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14 }}>Access Control</h3>
            <p style={{ color: colors.textMuted, fontSize: 10, marginBottom: 12 }}>Only you (the creator) can manage who has access to this evidence.</p>

            {/* Current access list */}
            {entry.accessList.map((person) => (
              <div key={person} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: colors.white, fontSize: 11, fontWeight: 600 }}>{person}</span>
                  {person === entry.createdBy && <Badge color={colors.teal}>Creator</Badge>}
                </div>
                {person !== entry.createdBy && (
                  <Button variant="ghost" size="sm" style={{ color: colors.red }} onClick={() => revokeAccess(entry.id, person)}>Revoke</Button>
                )}
              </div>
            ))}

            {/* Grant access */}
            <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Select
                  label="Grant Access To"
                  value={newAccessPerson}
                  onChange={setNewAccessPerson}
                  options={team.filter((m) => !entry.accessList.includes(m.name)).map((m) => m.name)}
                />
              </div>
              <Button size="sm" style={{ marginBottom: 12 }} onClick={() => {
                if (newAccessPerson) {
                  grantAccess(entry.id, newAccessPerson);
                  setNewAccessPerson("");
                }
              }}>Grant</Button>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowAccessModal(null)}>Close</Button>
          </Card>
        )}

        {/* Description / Chain of Custody */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Card>
            <h4 style={{ color: colors.white, marginTop: 0, fontSize: 12 }}>Description</h4>
            <p style={{ color: colors.textMuted, fontSize: 11, margin: 0, lineHeight: 1.5 }}>{entry.description || "No description provided."}</p>
          </Card>
          <Card>
            <h4 style={{ color: colors.white, marginTop: 0, fontSize: 12 }}>Chain of Custody</h4>
            <p style={{ color: colors.textMuted, fontSize: 11, margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{entry.chainOfCustody || "No chain of custody notes."}</p>
          </Card>
        </div>

        {/* Files */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h4 style={{ color: colors.white, margin: 0, fontSize: 12 }}>Evidence Files ({entry.files.length})</h4>
            {isCreator && (
              <Button variant="outline" size="sm" onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files) addFileToExisting(entry.id, files);
                };
                input.click();
              }}>+ Upload Files</Button>
            )}
          </div>

          {entry.files.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: colors.textDim, fontSize: 11 }}>No files uploaded yet.</div>
          ) : (
            entry.files.map((file) => (
              <div key={file.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: colors.obsidianM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    {file.type.startsWith("image/") ? "🖼️" : file.type.includes("pdf") ? "📄" : file.type.includes("zip") || file.type.includes("compressed") ? "📦" : "📎"}
                  </div>
                  <div>
                    <div style={{ color: colors.white, fontSize: 11, fontWeight: 600 }}>{file.name}</div>
                    <div style={{ color: colors.textDim, fontSize: 9 }}>
                      {formatFileSize(file.size)} · {file.type} · {file.uploadedAt}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 8, color: colors.textDim, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
                    SHA256: {file.sha256.substring(0, 16)}...
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>

        {/* Export */}
        <Button variant="outline" size="sm" onClick={() => {
          const txt = `DARK ROCK LABS SENTRY\nFORENSIC EVIDENCE RECORD\n${"═".repeat(60)}\n\nTitle: ${entry.title}\nClassification: ${entry.classification}\nIncident: ${entry.incidentTitle}\nCreated By: ${entry.createdBy}\nCreated: ${entry.createdAt}\nAccess List: ${entry.accessList.join(", ")}\n\nDescription:\n${entry.description}\n\nChain of Custody:\n${entry.chainOfCustody}\n\nFiles (${entry.files.length}):\n${entry.files.map((f, i) => `  ${i + 1}. ${f.name} (${formatFileSize(f.size)})\n     Type: ${f.type}\n     SHA256: ${f.sha256}\n     Uploaded: ${f.uploadedAt}`).join("\n")}\n\n${"═".repeat(60)}\nConfidential - Dark Rock Labs Sentry v3.1.0\n`;
          const blob = new Blob([txt], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Sentry_Evidence_${entry.title.replace(/\s/g, "_")}.txt`;
          a.click();
        }}>Export Evidence Record</Button>
      </div>
    );
  }

  // ─── MAIN LIST VIEW ───────────────────────────────────────────────
  return (
    <div>
      <SectionHeader sub="Encrypted evidence vault with chain-of-custody and access control">Evidence Vault</SectionHeader>

      {/* No incidents warning */}
      {!hasIncidents && (
        <Card style={{ marginBottom: 16, borderLeft: `3px solid ${colors.orange}`, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <div>
              <div style={{ color: colors.orange, fontWeight: 700, fontSize: 12 }}>No Incidents Available</div>
              <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>
                Evidence must be linked to an incident. Declare an incident in Commander or activate a playbook first.
              </div>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Button onClick={() => setShowNew(true)} disabled={!hasIncidents}>+ New Evidence</Button>
      </div>

      {/* ─── NEW EVIDENCE FORM ─────────────────────────────────────── */}
      {showNew && (
        <Card style={{ marginBottom: 16, borderColor: colors.cyan + "44" }}>
          <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14 }}>Upload Evidence</h3>
          <p style={{ color: colors.textMuted, fontSize: 10, marginBottom: 14 }}>
            Evidence will be locked to your account. Only you can grant access to other team members.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <Input label="Evidence Title *" value={nf.title} onChange={(v) => setNf((p) => ({ ...p, title: v }))} placeholder="Memory dump - SRV-DB01" />
            <Select
              label="Classification *"
              value={nf.classification}
              onChange={(v) => setNf((p) => ({ ...p, classification: v as typeof CLASSIFICATIONS[number] }))}
              options={[...CLASSIFICATIONS]}
            />
            <div style={{ gridColumn: "1 / -1" }}>
              <Select
                label="Linked Incident *"
                value={nf.incidentId}
                onChange={(v) => setNf((p) => ({ ...p, incidentId: v }))}
                options={incidentOptions.map((i) => ({ value: i.id, label: i.title }))}
              />
            </div>
          </div>

          <Input label="Description" value={nf.description} onChange={(v) => setNf((p) => ({ ...p, description: v }))} textarea rows={2} placeholder="What this evidence contains and why it was collected..." />
          <Input label="Chain of Custody Notes *" value={nf.chainOfCustody} onChange={(v) => setNf((p) => ({ ...p, chainOfCustody: v }))} textarea rows={3} placeholder="Collected by [Name] from [System] at [Time].&#10;Transferred to forensic workstation via [Method].&#10;SHA256 verified at time of collection." />

          {/* File Upload Area */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 10, color: colors.textMuted, marginBottom: 4, fontWeight: 600, letterSpacing: "0.04em" }}>
              Evidence Files
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? colors.teal : colors.panelBorder}`,
                borderRadius: 8,
                padding: "24px 16px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? colors.teal + "08" : colors.obsidianM,
                transition: "all 0.15s",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
              />
              <div style={{ fontSize: 28, marginBottom: 6 }}>{uploading ? "⏳" : "📁"}</div>
              <div style={{ color: colors.white, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                {uploading ? "Computing hashes..." : "Drag & drop files here"}
              </div>
              <div style={{ color: colors.textDim, fontSize: 10 }}>
                or click to browse. SHA-256 hash is computed automatically for each file.
              </div>
            </div>
          </div>

          {/* Pending Files List */}
          {pendingFiles.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, marginBottom: 6 }}>
                {pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""} ready
              </div>
              {pendingFiles.map((file) => (
                <div key={file.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12 }}>📎</span>
                    <div>
                      <div style={{ color: colors.white, fontSize: 11, fontWeight: 600 }}>{file.name}</div>
                      <div style={{ color: colors.textDim, fontSize: 8 }}>
                        {formatFileSize(file.size)} · SHA256: {file.sha256.substring(0, 24)}...
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" style={{ color: colors.red }} onClick={() => removeFile(file.id)}>✕</Button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 6 }}>
            <Button onClick={submitEvidence} disabled={!nf.title || !nf.incidentId || !nf.chainOfCustody}>
              Save Evidence ({pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""})
            </Button>
            <Button variant="secondary" onClick={() => { setShowNew(false); setPendingFiles([]); }}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* ─── EVIDENCE LIST ────────────────────────────────────────── */}
      {forensicLogs.length === 0 && !showNew && (
        <Card style={{ textAlign: "center", padding: "40px 18px" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
          <div style={{ color: colors.white, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Evidence Vault</div>
          <div style={{ color: colors.textDim, fontSize: 11, maxWidth: 400, margin: "0 auto", lineHeight: 1.5 }}>
            Upload forensic evidence with chain-of-custody documentation. Files are hashed with SHA-256 and access is controlled by the evidence creator.
          </div>
        </Card>
      )}

      {forensicLogs.map((entry) => {
        const hasAccess = entry.accessList.includes(CURRENT_USER);
        const isCreator = entry.createdBy === CURRENT_USER;
        return (
          <Card
            key={entry.id}
            onClick={() => setSelId(entry.id)}
            style={{
              marginBottom: 10,
              cursor: "pointer",
              borderLeft: `3px solid ${entry.classification === "Restricted" || entry.classification === "Privileged & Confidential" ? colors.red : colors.cyan}`,
              opacity: hasAccess ? 1 : 0.6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>🔒</span>
                  <span style={{ color: colors.white, fontSize: 13, fontWeight: 700 }}>{entry.title}</span>
                  {!hasAccess && <Badge color={colors.red}>No Access</Badge>}
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                  <Badge color={colors.cyan}>{entry.classification}</Badge>
                  <Badge color={colors.orange}>{entry.incidentTitle}</Badge>
                  <Badge color={colors.blue}>{entry.files.length} file{entry.files.length !== 1 ? "s" : ""}</Badge>
                </div>
                <div style={{ color: colors.textDim, fontSize: 9 }}>
                  Created by {entry.createdBy} · {entry.createdAt} · {entry.accessList.length} user{entry.accessList.length !== 1 ? "s" : ""} with access
                </div>
              </div>
              {isCreator && (
                <Badge color={colors.teal}>Owner</Badge>
              )}
            </div>
            {entry.description && (
              <p style={{ color: colors.textMuted, fontSize: 10, margin: "8px 0 0", lineHeight: 1.4 }}>
                {entry.description.substring(0, 120)}{entry.description.length > 120 ? "..." : ""}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
