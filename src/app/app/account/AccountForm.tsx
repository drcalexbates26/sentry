"use client";

import { useState, useTransition } from "react";
import { updateMyProfile, changeMyPassword } from "../_actions";

const colors = {
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  teal: "#00B4A6",
  tealLight: "#33C4B8",
  bg: "#0A0E14",
  panel: "#0F1623",
  panelLight: "#151C28",
  panelBorder: "#1E293B",
  red: "#EF4444",
  green: "#22C55E",
};

interface Props {
  initial: { fullName: string; company: string; jobTitle: string };
}

export function AccountForm({ initial }: Props) {
  // Profile state
  const [fullName, setFullName] = useState(initial.fullName);
  const [company, setCompany] = useState(initial.company);
  const [jobTitle, setJobTitle] = useState(initial.jobTitle);
  const [profilePending, startProfile] = useTransition();
  const [profileMsg, setProfileMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Password state
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwPending, startPw] = useTransition();
  const [pwMsg, setPwMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Track whether profile fields have changed so the Save button can disable itself.
  const profileDirty =
    fullName !== initial.fullName ||
    company !== initial.company ||
    jobTitle !== initial.jobTitle;

  const submitProfile = () => {
    setProfileMsg(null);
    startProfile(async () => {
      const r = await updateMyProfile({ fullName, company, jobTitle });
      if (!r.ok) setProfileMsg({ kind: "err", text: r.error ?? "Could not save." });
      else setProfileMsg({ kind: "ok", text: "Profile saved." });
    });
  };

  const submitPassword = () => {
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ kind: "err", text: "The two password fields don't match." });
      return;
    }
    startPw(async () => {
      const r = await changeMyPassword({ newPassword: newPw });
      if (!r.ok) setPwMsg({ kind: "err", text: r.error ?? "Could not change password." });
      else {
        setPwMsg({ kind: "ok", text: "Password updated. Use the new password the next time you sign in." });
        setNewPw(""); setConfirmPw("");
      }
    });
  };

  return (
    <>
      {/* Profile card */}
      <section style={{ background: colors.panel, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: "18px 20px", marginBottom: 18 }}>
        <h2 style={{ color: colors.text, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "Figtree, sans-serif" }}>Profile</h2>
        <p style={{ color: colors.textMuted, fontSize: 11, margin: "4px 0 14px" }}>
          Shown across Sentry — in the Topbar, in stakeholder records, on signoffs and notifications.
        </p>

        <Row>
          <Field label="Full name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              style={input}
            />
          </Field>
          <Field label="Job title" hint="e.g. CISO, Director of Security">
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="VP of Security"
              style={input}
            />
          </Field>
        </Row>

        <Field label="Company / Organization" hint="Optional — useful for MSP and vCISO users who serve multiple tenants.">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Corp"
            style={input}
          />
        </Field>

        {profileMsg && <Banner kind={profileMsg.kind} text={profileMsg.text} />}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button
            onClick={submitProfile}
            disabled={!profileDirty || profilePending}
            style={btn(!profileDirty || profilePending)}
          >
            {profilePending ? "Saving…" : profileDirty ? "Save changes" : "No changes"}
          </button>
        </div>
      </section>

      {/* Password card */}
      <section style={{ background: colors.panel, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: "18px 20px", marginBottom: 18 }}>
        <h2 style={{ color: colors.text, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "Figtree, sans-serif" }}>Change password</h2>
        <p style={{ color: colors.textMuted, fontSize: 11, margin: "4px 0 14px" }}>
          Minimum 12 characters, must include upper-case, lower-case, and a digit. Any existing magic links for your account are invalidated when you save a new password.
        </p>

        <Row>
          <Field label="New password">
            <input
              type={showPw ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              style={input}
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type={showPw ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              style={input}
            />
          </Field>
        </Row>

        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, color: colors.textMuted, fontSize: 11, cursor: "pointer", marginTop: 4 }}>
          <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} style={{ accentColor: colors.teal }} />
          Show passwords while I type
        </label>

        {pwMsg && <Banner kind={pwMsg.kind} text={pwMsg.text} />}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button
            onClick={submitPassword}
            disabled={!newPw || !confirmPw || pwPending}
            style={btn(!newPw || !confirmPw || pwPending)}
          >
            {pwPending ? "Updating…" : "Update password"}
          </button>
        </div>
      </section>
    </>
  );
}

// ─── primitives ──────────────────────────────────────────────────────

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>{children}</div>;
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", color: colors.textMuted, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{label}</label>
      {children}
      {hint && <div style={{ color: colors.textDim, fontSize: 10, marginTop: 4, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}
function Banner({ kind, text }: { kind: "ok" | "err"; text: string }) {
  const color = kind === "ok" ? colors.green : colors.red;
  return (
    <div style={{ marginTop: 12, padding: "10px 12px", background: color + "14", border: `1px solid ${color}55`, borderRadius: 6, color, fontSize: 12 }}>
      {text}
    </div>
  );
}
function btn(disabled: boolean): React.CSSProperties {
  return {
    padding: "9px 18px", borderRadius: 8, border: "none",
    background: disabled ? colors.panelBorder : `linear-gradient(135deg, ${colors.teal}, #009A8E)`,
    color: disabled ? colors.textDim : "#0A0E14",
    fontWeight: 700, fontSize: 13, fontFamily: "Figtree, sans-serif",
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  background: colors.panelLight,
  border: `1px solid ${colors.panelBorder}`,
  color: colors.text,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};
