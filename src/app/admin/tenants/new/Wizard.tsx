"use client";

import { useActionState, useState, useMemo } from "react";
import Link from "next/link";
import { createTenant, type CreateTenantState } from "@/app/admin/_actions";
import { PLAN_TIERS, getPlan, recommendPlanForSeats, formatPrice, type PlanId } from "@/data/plans";

const colors = {
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  teal: "#00B4A6",
  tealLight: "#33C4B8",
  panel: "#0F1623",
  panelLight: "#151C28",
  panelBorder: "#1E293B",
  red: "#EF4444",
  green: "#22C55E",
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

function generatePassword() {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 16; i++) pw += charset[Math.floor(Math.random() * charset.length)];
  return pw;
}

export function OnboardingWizard({ industries, sizes, plans }: { industries: string[]; sizes: string[]; plans: string[] }) {
  const [state, formAction, pending] = useActionState<CreateTenantState | null, FormData>(createTenant, null);

  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [website, setWebsite] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [plan, setPlan] = useState<PlanId>("trial");
  const [expectedSeats, setExpectedSeats] = useState<string>("10");
  const [seatLimit, setSeatLimit] = useState<string>(""); // empty = use tier default
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState(generatePassword);
  const [authMethod, setAuthMethod] = useState<"email" | "magiclink" | "password">("email");
  const [isDemo, setIsDemo] = useState(false);
  const [showPw, setShowPw] = useState(true);

  const computedSlug = useMemo(() => slug || (companyName ? slugify(companyName) : ""), [slug, companyName]);

  // When the admin types an expected-headcount the form auto-recommends a tier
  // (unless the admin has already picked one manually that fits the range).
  const recommended = useMemo(() => {
    const n = parseInt(expectedSeats, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return recommendPlanForSeats(n);
  }, [expectedSeats]);
  const planTier = getPlan(plan);

  const canSubmit = companyName.length > 0 && adminEmail.length > 3 && (authMethod !== "password" || adminPassword.length >= 8) && plan;

  if (state?.ok) {
    return <SuccessPanel state={state} />;
  }

  return (
    <>
      <header style={{ marginBottom: 28 }}>
        <Link href="/admin/tenants" style={{ color: colors.tealLight, fontSize: 12, textDecoration: "none" }}>← Tenants</Link>
        <h1 style={{ color: colors.text, fontSize: 28, fontWeight: 800, margin: "10px 0 0", fontFamily: "Figtree, sans-serif", letterSpacing: "-0.01em" }}>
          Onboard a new client
        </h1>
        <p style={{ color: colors.textMuted, fontSize: 14, margin: "6px 0 0", lineHeight: 1.5, maxWidth: 640 }}>
          Three sections, one submit. Atomic provisioning &mdash; tenant, org profile, and admin user are all created together. The
          admin can sign in immediately with the credentials you set below.
        </p>
      </header>

      <form action={formAction} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 24, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Section
            number="01"
            title="Company"
            sub="Who you're onboarding."
          >
            <Row>
              <Field label="Company name *">
                <input
                  name="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Health Systems"
                  style={input}
                  required
                />
              </Field>
              <Field label="Slug" hint="Auto-generated. Used in URLs.">
                <input
                  name="slug"
                  value={computedSlug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="acme-health"
                  style={{ ...input, fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}
                />
              </Field>
            </Row>
            <Row>
              <Field label="Industry">
                <select name="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} style={input}>
                  <option value="">— select —</option>
                  {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Size">
                <select name="size" value={size} onChange={(e) => setSize(e.target.value)} style={input}>
                  <option value="">— select —</option>
                  {sizes.map((s) => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="Website">
                <input name="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://acme.example" style={input} />
              </Field>
              <Field label="Primary contact name">
                <input name="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Jane Doe" style={input} />
              </Field>
            </Row>
            <Row>
              <Field label="Primary contact email">
                <input name="contactEmail" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" placeholder="ops@acme.example" style={input} />
              </Field>
              <Field label="Primary contact phone">
                <input name="contactPhone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(555) 123-4567" style={input} />
              </Field>
            </Row>
          </Section>

          <Section number="02" title="Plan & seats" sub="Pick the tier this engagement bills against.">
            <Row>
              <Field label="Expected headcount" hint="Used to pre-select the right tier. You can override below.">
                <input
                  type="number"
                  min={1}
                  value={expectedSeats}
                  onChange={(e) => {
                    setExpectedSeats(e.target.value);
                    const n = parseInt(e.target.value, 10);
                    if (Number.isFinite(n) && n > 0) setPlan(recommendPlanForSeats(n));
                  }}
                  placeholder="e.g. 25"
                  style={input}
                />
              </Field>
              <Field label="Seat limit override" hint="Leave blank to use tier default. Use a cap below the tier max for contractually-limited deals.">
                <input
                  name="seatLimit"
                  type="number"
                  min={1}
                  value={seatLimit}
                  onChange={(e) => setSeatLimit(e.target.value)}
                  placeholder={planTier.defaultSeatLimit === null ? "Unlimited (Enterprise)" : `${planTier.defaultSeatLimit}`}
                  style={input}
                />
              </Field>
            </Row>

            {/* Tier picker */}
            <input type="hidden" name="plan" value={plan} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginTop: 6 }}>
              {PLAN_TIERS.map((t) => {
                const active = plan === t.id;
                const isRecommended = recommended === t.id && !active;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPlan(t.id)}
                    style={{
                      textAlign: "left", padding: 14, borderRadius: 10,
                      background: active ? t.color + "1F" : colors.panelLight,
                      border: `1px solid ${active ? t.color : colors.panelBorder}`,
                      color: colors.text, cursor: "pointer", fontFamily: "inherit",
                      position: "relative",
                    }}
                  >
                    {isRecommended && (
                      <span style={{
                        position: "absolute", top: -8, right: 10,
                        padding: "2px 8px", borderRadius: 999,
                        background: colors.tealLight, color: "#0A0E14",
                        fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
                      }}>RECOMMENDED</span>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                      <span style={{ color: active ? t.color : colors.text, fontSize: 13, fontWeight: 800 }}>{t.name}</span>
                      <span style={{ color: colors.textMuted, fontSize: 10, fontWeight: 700 }}>{formatPrice(t.id)}</span>
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: 10, marginBottom: 8, lineHeight: 1.4, minHeight: 28 }}>{t.tagline}</div>
                    <div style={{ color: colors.textDim, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                      {t.seatRange[1] === null ? `${t.seatRange[0]}+ seats` : `${t.seatRange[0]}–${t.seatRange[1]} seats`}
                      {!t.isBillable && " · non-billable"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tier details */}
            <div style={{ marginTop: 10, padding: "12px 14px", background: colors.panelLight, borderRadius: 8, borderLeft: `3px solid ${planTier.color}` }}>
              <div style={{ color: colors.text, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                {planTier.name} includes
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, color: colors.textMuted, fontSize: 11, lineHeight: 1.6 }}>
                {planTier.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>

            <Field label="Demo tenant?" hint="Marks this for resettable demo data. Only meaningful on Demo plan.">
              <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", color: colors.text, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" name="isDemo" checked={isDemo} onChange={(e) => setIsDemo(e.target.checked)} style={{ accentColor: colors.teal }} />
                Treat as demo tenant
              </label>
            </Field>
          </Section>

          <Section number="03" title="Initial admin user" sub="How they receive their first sign-in.">
            <Row>
              <Field label="Admin name">
                <input name="adminName" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Jane Doe" style={input} />
              </Field>
              <Field label="Admin email *">
                <input name="adminEmail" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} type="email" placeholder="admin@acme.example" style={input} required />
              </Field>
            </Row>
            <input type="hidden" name="authMethod" value={authMethod} />
            <Field label="Auth method *">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <MethodBtn label="Email invite" sub="Supabase emails them" active={authMethod === "email"} onClick={() => setAuthMethod("email")} />
                <MethodBtn label="Magic link" sub="Copy/share manually" active={authMethod === "magiclink"} onClick={() => setAuthMethod("magiclink")} />
                <MethodBtn label="Password" sub="Hand off creds" active={authMethod === "password"} onClick={() => setAuthMethod("password")} />
              </div>
            </Field>
            {authMethod === "password" && (
              <Field label="Admin password *" hint="At least 8 characters. Auto-filled with a strong random one — change if you want.">
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    name="adminPassword"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    type={showPw ? "text" : "password"}
                    minLength={8}
                    style={{ ...input, flex: 1, fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}
                    required
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} style={miniBtn}>
                    {showPw ? "Hide" : "Show"}
                  </button>
                  <button type="button" onClick={() => setAdminPassword(generatePassword())} style={miniBtn}>
                    Regenerate
                  </button>
                </div>
              </Field>
            )}
            {authMethod === "email" && (
              <div style={{ padding: 12, background: colors.panelLight, borderRadius: 8, color: colors.textMuted, fontSize: 11, lineHeight: 1.5 }}>
                Supabase will email the admin a sign-in link automatically. Configure custom SMTP in your Supabase project for branded emails and higher rate limits.
              </div>
            )}
          </Section>

          {state && !state.ok && (
            <div role="alert" style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: `1px solid ${colors.red}55`, color: colors.red, fontSize: 13 }}>
              {state.error}
            </div>
          )}
        </div>

        <aside style={{ position: "sticky", top: 32, background: colors.panel, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: 18 }}>
          <div style={{ color: colors.tealLight, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", marginBottom: 8 }}>READY TO PROVISION</div>
          <Summary label="Company" value={companyName || "—"} />
          <Summary label="Slug" value={computedSlug || "—"} mono />
          <Summary label="Plan" value={planTier.name} />
          <Summary label="Seats" value={
            seatLimit
              ? `${seatLimit} (override)`
              : planTier.defaultSeatLimit === null
                ? "Unlimited"
                : `${planTier.defaultSeatLimit}`
          } />
          {planTier.trialDurationDays && <Summary label="Trial" value={`${planTier.trialDurationDays} days`} />}
          <Summary label="Demo" value={isDemo ? "Yes" : "No"} />
          <Summary label="Admin" value={adminEmail || "—"} />

          <button
            type="submit"
            disabled={!canSubmit || pending}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              background: pending || !canSubmit ? "rgba(0,180,166,0.45)" : `linear-gradient(135deg, ${colors.teal}, #009A8E)`,
              color: "#0A0E14",
              fontWeight: 700,
              fontSize: 14,
              border: 0,
              cursor: pending || !canSubmit ? "wait" : "pointer",
              fontFamily: "Figtree, sans-serif",
            }}
          >
            {pending ? "Provisioning…" : "Create tenant →"}
          </button>
          <div style={{ color: colors.textDim, fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
            Creates the Tenant + Organization + admin User in one transaction. Auth account is provisioned in Supabase.
          </div>
        </aside>
      </form>
    </>
  );
}

function MethodBtn({ label, sub, active, onClick }: { label: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: "left",
        padding: "10px 12px",
        borderRadius: 8,
        background: active ? colors.teal + "1A" : "#0A0E14",
        border: `1px solid ${active ? colors.teal + "55" : colors.panelBorder}`,
        color: active ? colors.teal : colors.text,
        fontFamily: "Figtree, sans-serif",
        cursor: "pointer",
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{sub}</div>
    </button>
  );
}

function SuccessPanel({ state }: { state: Extract<CreateTenantState, { ok: true }> }) {
  const [copied, setCopied] = useState(false);
  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", paddingTop: 24 }}>
      <div style={{ padding: 18, background: colors.green + "10", border: `1px solid ${colors.green}55`, borderRadius: 12, marginBottom: 14 }}>
        <div style={{ color: colors.green, fontSize: 16, fontWeight: 800, marginBottom: 6, fontFamily: "Figtree, sans-serif" }}>✓ Tenant provisioned</div>
        <div style={{ color: colors.text, fontSize: 13, lineHeight: 1.55 }}>
          {state.emailSent ? (
            <>Sign-in email sent to <strong>{state.userEmail}</strong>. They click the link and land in their tenant.</>
          ) : state.magicLink ? (
            <>Tenant ready. Share the magic link below with <strong>{state.userEmail}</strong>.</>
          ) : (
            <>Tenant ready. Hand the credentials below to <strong>{state.userEmail}</strong>.</>
          )}
        </div>
      </div>
      {(state.magicLink || state.password) && (
        <div style={{ background: "#080C12", border: `1px solid ${colors.panelBorder}`, borderRadius: 10, padding: 14, fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
          <KV label="email" value={state.userEmail} onCopy={copy} />
          {state.magicLink && <KV label="magic link" value={state.magicLink} onCopy={copy} mono />}
          {state.password && <KV label="password" value={state.password} onCopy={copy} />}
        </div>
      )}
      {copied && <div style={{ color: colors.green, fontSize: 11, marginTop: 8 }}>✓ Copied</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <Link href={`/admin/tenants/${state.tenantId}`} style={{ flex: 1, textAlign: "center", padding: "11px 14px", borderRadius: 10, background: `linear-gradient(135deg, ${colors.teal}, #009A8E)`, color: "#0A0E14", fontWeight: 700, fontSize: 13, textDecoration: "none", fontFamily: "Figtree, sans-serif" }}>
          Open tenant detail →
        </Link>
        <Link href="/admin/tenants/new" style={{ padding: "11px 14px", borderRadius: 10, background: colors.panelLight, color: colors.text, fontWeight: 600, fontSize: 13, textDecoration: "none", border: `1px solid ${colors.panelBorder}`, fontFamily: "Figtree, sans-serif" }}>
          Onboard another
        </Link>
      </div>
    </div>
  );
}

function KV({ label, value, onCopy, mono }: { label: string; value: string; onCopy?: (s: string) => void; mono?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "5px 0" }}>
      <span style={{ color: colors.textMuted, minWidth: 90, flexShrink: 0 }}>{label}</span>
      <span style={{ color: colors.text, flex: 1, wordBreak: "break-all", fontSize: mono ? 10 : 12 }}>{value}</span>
      {onCopy && <button onClick={() => onCopy(value)} style={{ padding: "0 10px", borderRadius: 6, background: colors.panelLight, border: `1px solid ${colors.panelBorder}`, color: colors.textMuted, fontSize: 10, cursor: "pointer" }}>copy</button>}
    </div>
  );
}

function Section({ number, title, sub, children }: { number: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${colors.panelBorder}` }}>
        <span style={{ color: colors.tealLight, fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>{number}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: colors.text, fontSize: 15, fontWeight: 700, fontFamily: "Figtree, sans-serif" }}>{title}</div>
          <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{sub}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ color: colors.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 6, fontFamily: "Figtree, sans-serif" }}>{label}</div>
      {children}
      {hint && <div style={{ color: colors.textDim, fontSize: 10, marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

function Summary({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${colors.panelBorder}` }}>
      <span style={{ color: colors.textMuted, fontSize: 11 }}>{label}</span>
      <span style={{ color: colors.text, fontSize: 12, fontFamily: mono ? "JetBrains Mono, monospace" : undefined, fontWeight: 600, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  background: "#0A0E14",
  border: `1px solid ${colors.panelBorder}`,
  color: colors.text,
  fontSize: 13,
  fontFamily: "Source Sans 3, sans-serif",
  outline: "none",
};

const miniBtn: React.CSSProperties = {
  padding: "0 12px",
  borderRadius: 8,
  background: colors.panelLight,
  border: `1px solid ${colors.panelBorder}`,
  color: colors.textMuted,
  fontSize: 11,
  cursor: "pointer",
  fontFamily: "Figtree, sans-serif",
};
