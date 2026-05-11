import Link from "next/link";
import { getMyAccount } from "../_actions";
import { AccountForm } from "./AccountForm";

export const dynamic = "force-dynamic";

const colors = {
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  teal: "#00B4A6",
  tealLight: "#33C4B8",
  bg: "#0A0E14",
  panel: "#0F1623",
  panelBorder: "#1E293B",
  red: "#EF4444",
};

export default async function AccountPage() {
  const me = await getMyAccount();

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, padding: "32px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link href="/app" style={{ color: colors.tealLight, fontSize: 12, textDecoration: "none" }}>
          ← Back to Sentry
        </Link>

        <header style={{ marginTop: 14, marginBottom: 24 }}>
          <div style={{ color: colors.tealLight, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", fontFamily: "Figtree, sans-serif" }}>
            ACCOUNT
          </div>
          <h1 style={{ color: colors.text, fontSize: 30, fontWeight: 800, margin: "6px 0 0", letterSpacing: "-0.02em", fontFamily: "Figtree, sans-serif" }}>
            Your account
          </h1>
          <p style={{ color: colors.textMuted, fontSize: 13, margin: "8px 0 0", lineHeight: 1.6 }}>
            Update the profile fields shown across the platform, rotate your password, and review where your account lives.
          </p>
        </header>

        {/* Static identity strip — fields the user can't edit themselves. */}
        <section style={{ background: colors.panel, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: "18px 20px", marginBottom: 18 }}>
          <h2 style={{ color: colors.text, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "Figtree, sans-serif" }}>Identity</h2>
          <p style={{ color: colors.textMuted, fontSize: 11, margin: "4px 0 14px" }}>
            Read-only — contact your tenant admin to change email or role.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Email" value={me.email} />
            <Field label="Tenant" value={`${me.tenantName} · ${me.tenantSlug}`} mono />
            <Field label="Role" value={fmtRole(me.appRole)} />
            <Field label="Member since" value={me.invitedAt ? new Date(me.invitedAt).toLocaleDateString() : "—"} />
          </div>
        </section>

        {/* Profile + password editing — interactive */}
        <AccountForm
          initial={{
            fullName: me.fullName ?? "",
            company: me.company ?? "",
            jobTitle: me.jobTitle ?? "",
          }}
        />

        <form action="/auth/signout" method="post" style={{ margin: "20px 0 0" }}>
          <p style={{ color: colors.textDim, fontSize: 11, margin: 0, lineHeight: 1.6, display: "inline" }}>
            Need to leave the platform?{" "}
          </p>
          <button
            type="submit"
            style={{
              background: "none", border: "none", padding: 0,
              color: colors.red, textDecoration: "underline", cursor: "pointer",
              fontSize: 11, fontFamily: "inherit",
            }}
          >Sign out</button>
          <span style={{ color: colors.textDim, fontSize: 11 }}>
            {" "}— your session ends and you'll return to <code style={{ color: colors.text }}>/login</code>.
          </span>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ color: colors.text, fontSize: 13, fontFamily: mono ? "JetBrains Mono, monospace" : undefined }}>{value}</div>
    </div>
  );
}

function fmtRole(appRole: string): string {
  if (appRole === "admin") return "Administrator";
  if (appRole === "manager") return "Manager";
  if (appRole === "analyst") return "Analyst";
  if (appRole === "viewer") return "Viewer";
  return appRole;
}

