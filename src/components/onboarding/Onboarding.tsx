"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useStore } from "@/store";
import { Button, Card, Input, Select, Checkbox, SectionHeader } from "@/components/ui";
import { TECH_OPTIONS, COMPLIANCE_OPTIONS, INDUSTRIES, ORG_SIZES } from "@/data/tech-options";

export function Onboarding() {
  const { onboardDone, org, tech, comp, setOrg, setTech, setComp, setOnboardDone, setPage } = useStore();
  const [step, setStep] = useState(onboardDone ? 4 : 0);
  const [localOrg, setLocalOrg] = useState(org);
  const [localTech, setLocalTech] = useState(tech);
  const [localComp, setLocalComp] = useState(comp);

  const save = () => {
    setOrg(localOrg);
    setTech(localTech);
    setComp(localComp);
    setOnboardDone(true);
    setStep(4);
  };

  const stps = ["Welcome", "Organization", "Technology", "Compliance", "Complete"];

  return (
    <div>
      <SectionHeader sub="Configure your organization for personalized assessments and policies">Sentry Onboarding</SectionHeader>

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
        {stps.map((s, i) => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: i <= step ? colors.teal : colors.obsidianM,
                color: i <= step ? colors.obsidian : colors.textDim,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, marginBottom: 4,
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              <div style={{ fontSize: 9, color: i <= step ? colors.teal : colors.textDim, fontWeight: 600 }}>{s}</div>
            </div>
            {i < stps.length - 1 && <div style={{ height: 2, flex: 1, background: i < step ? colors.teal : colors.obsidianM, marginBottom: 16 }} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card style={{ textAlign: "center", borderColor: colors.teal + "44" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🛡️</div>
          <h2 style={{ color: colors.white, margin: "0 0 8px", fontSize: 20 }}>Welcome to Sentry</h2>
          <p style={{ color: colors.textMuted, fontSize: 12, maxWidth: 480, margin: "0 auto 20px", lineHeight: 1.6 }}>
            Sentry by Dark Rock Labs is your cyber resilience command center. We&apos;ll walk you through setting up your organization profile,
            mapping your technology stack, and identifying your compliance requirements. This data powers personalized assessments,
            smart playbooks, and professional policy generation.
          </p>
          <Button size="lg" onClick={() => setStep(1)}>Get Started →</Button>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14 }}>Organization Profile</h3>
          <p style={{ color: colors.textMuted, fontSize: 11, marginBottom: 14 }}>Tell us about your organization so we can tailor assessments and recommendations.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <Input label="Organization Name *" value={localOrg.name} onChange={(v) => setLocalOrg((p) => ({ ...p, name: v }))} placeholder="Acme Corp" />
            <Select label="Industry *" value={localOrg.industry} onChange={(v) => setLocalOrg((p) => ({ ...p, industry: v }))} options={INDUSTRIES} />
            <Select label="Organization Size *" value={localOrg.size} onChange={(v) => setLocalOrg((p) => ({ ...p, size: v }))} options={ORG_SIZES} />
            <Input label="Website" value={localOrg.website} onChange={(v) => setLocalOrg((p) => ({ ...p, website: v }))} placeholder="https://" />
            <Input label="Primary Security Contact *" value={localOrg.contactName} onChange={(v) => setLocalOrg((p) => ({ ...p, contactName: v }))} placeholder="Jane Doe, CISO" />
            <Input label="Contact Email *" value={localOrg.contactEmail} onChange={(v) => setLocalOrg((p) => ({ ...p, contactEmail: v }))} placeholder="ciso@acme.com" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
            <Button onClick={() => setStep(2)} disabled={!localOrg.name || !localOrg.industry || !localOrg.contactName}>Next: Technology →</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14 }}>Technology Stack</h3>
          <p style={{ color: colors.textMuted, fontSize: 11, marginBottom: 14 }}>Map your current security stack. This enables smart assessment questions tailored to your tools.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            {Object.entries(TECH_OPTIONS).map(([k, opts]) => (
              <Select
                key={k}
                label={k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                value={localTech[k] || ""}
                onChange={(v) => setLocalTech((p) => ({ ...p, [k]: v }))}
                options={opts}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
            <Button onClick={() => setStep(3)}>Next: Compliance →</Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <h3 style={{ color: colors.white, marginTop: 0, fontSize: 14 }}>Compliance Requirements</h3>
          <p style={{ color: colors.textMuted, fontSize: 11, marginBottom: 14 }}>Select all frameworks applicable to your organization. This drives assessment focus areas and policy alignment.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            {COMPLIANCE_OPTIONS.map((f) => (
              <Checkbox
                key={f}
                label={f}
                checked={localComp.includes(f)}
                onChange={(v) => setLocalComp((p) => v ? [...p, f] : p.filter((x) => x !== f))}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
            <Button onClick={save}>Complete Setup ✓</Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card style={{ textAlign: "center", borderColor: colors.green + "44" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
          <h3 style={{ color: colors.green, marginTop: 0 }}>Onboarding Complete</h3>
          <p style={{ color: colors.textMuted, fontSize: 12 }}>Your profile powers personalized assessments, policies, and recommendations.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
            <Button onClick={() => setPage("assess")}>Start Assessment →</Button>
            <Button variant="secondary" onClick={() => { setStep(0); setOnboardDone(false); }}>Edit Profile</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
