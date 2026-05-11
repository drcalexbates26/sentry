"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { useColors } from "@/lib/theme";
import { useStore } from "@/store";
import { Badge, Button, Card, Input, Select, SectionHeader, useModal } from "@/components/ui";
import {
  INTERNAL_GROUPS,
  EXTERNAL_GROUPS,
  STAKEHOLDER_GROUPS,
  SYSTEM_CATEGORIES,
  VENDOR_CATEGORIES,
  type VendorCategory,
} from "@/data/stakeholder-groups";
import { ROLE_DEFS } from "@/data/rbac";
import { recommendedRoleForGroup } from "@/data/role-recommendations";
import { inviteStakeholder } from "@/app/app/_actions";
import type { StakeholderPerson, KeySystem, Vendor } from "@/types/stakeholder";
import type { UserRole } from "@/store";

type TabKey = "internal" | "external" | "vendors" | "onboarding";

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: "internal", label: "Internal", desc: "Employee stakeholders & key systems" },
  { key: "external", label: "External", desc: "Outside counsel, PR, forensics, insurance" },
  { key: "vendors", label: "Vendors", desc: "Topic-based IR vendor directory" },
  { key: "onboarding", label: "Onboarding", desc: "Readiness checklist & quick-add" },
];

const READINESS_VENDORS = ["edr", "siem", "identity", "microsoft365", "backup", "dfir", "firewall", "email"];

export function StakeholdersModule() {
  const { stakeholders, updateStakeholders, org, currentUserRole } = useStore();
  const colors = useColors();
  const modal = useModal();
  const [tab, setTab] = useState<TabKey>("internal");
  const [inviting, startInvite] = useTransition();
  const canInvite = currentUserRole === "admin";

  const totals = useMemo(() => {
    const internal = INTERNAL_GROUPS.reduce(
      (s, g) => s + ((stakeholders[g.key] as StakeholderPerson[]) || []).length,
      0
    );
    const external = EXTERNAL_GROUPS.reduce(
      (s, g) => s + ((stakeholders[g.key] as StakeholderPerson[]) || []).length,
      0
    );
    const vendors = (stakeholders.vendors || []).length;
    const systems = (stakeholders.keySystems || []).length;
    return { internal, external, vendors, systems, contacts: internal + external };
  }, [stakeholders]);

  const handleInvite = async (p: StakeholderPerson, groupKey: string) => {
    const rec = recommendedRoleForGroup(groupKey);
    const roleLabel = (r: UserRole) => ROLE_DEFS.find((d) => d.role === r)?.label ?? r;
    const result = await modal.showPrompt(
      `Invite ${p.firstName} ${p.lastName} to Sentry`,
      [
        { key: "email", label: "Email address", required: true, defaultValue: p.email || "" },
        {
          key: "role",
          label: "Platform role",
          type: "select",
          options: ROLE_DEFS.map((r) => r.label),
          defaultValue: roleLabel(rec.role),
        },
      ],
      `${rec.rationale}\n\nThe invitee will receive a magic-link email and land in your tenant after signing in.`,
    );
    if (!result) return;

    const selectedLabel = result.role || roleLabel(rec.role);
    const role = (ROLE_DEFS.find((r) => r.label === selectedLabel)?.role ?? rec.role) as UserRole;
    startInvite(async () => {
      const res = await inviteStakeholder({ stakeholderId: p.id, role });
      if (!res.ok) {
        await modal.showAlert("Invite failed", res.error);
        return;
      }
      // Reflect the invite locally so the badge shows immediately (server-side
      // load on next fetch will confirm).
      updateStakeholders((prev) => ({
        ...prev,
        [groupKey]: (prev[groupKey] as StakeholderPerson[]).map((x) =>
          x.id === p.id
            ? { ...x, userId: res.userId, invitedAt: new Date().toISOString(), inviteStatus: "invited", appRole: role }
            : x,
        ),
      }));
      await modal.showAlert(
        res.alreadyExisted ? "Magic-link resent" : "Invite sent",
        `${res.email} should receive a sign-in email shortly.`,
      );
    });
  };

  const exportDirectory = () => {
    let txt = `DARK ROCK LABS SENTRY\nSTAKEHOLDER DIRECTORY\n${"═".repeat(60)}\nOrganization: ${org?.name || "[Organization]"}\nGenerated: ${new Date().toLocaleString()}\n\n`;
    [...INTERNAL_GROUPS, ...EXTERNAL_GROUPS].forEach((g) => {
      const people = (stakeholders[g.key] as StakeholderPerson[]) || [];
      if (people.length > 0) {
        txt += `\n${g.label.toUpperCase()}\n${"─".repeat(40)}\n`;
        people.forEach((p, i) => {
          txt += `  ${i + 1}. ${p.firstName} ${p.lastName} | ${p.title || "N/A"} | ${p.email || "N/A"} | ${p.cell || "N/A"}\n`;
        });
      }
    });
    if ((stakeholders.vendors || []).length) {
      txt += `\nIR VENDORS\n${"─".repeat(40)}\n`;
      stakeholders.vendors.forEach((v, i) => {
        const cat = VENDOR_CATEGORIES.find((c) => c.key === v.category);
        txt += `  ${i + 1}. [${cat?.short || v.category}] ${v.vendorName} ${v.productName ? `— ${v.productName}` : ""} | ${v.contactEmail || "N/A"} | SLA ${v.slaResponse || "N/A"}${v.isPrimary ? " | PRIMARY" : ""}\n`;
      });
    }
    if ((stakeholders.keySystems || []).length) {
      txt += `\nKEY SYSTEMS\n${"─".repeat(40)}\n`;
      stakeholders.keySystems.forEach((s, i) => {
        txt += `  ${i + 1}. ${s.systemName} [${s.category}] (${s.criticality}) — ${s.owner || "N/A"} | ${s.ownerEmail || "N/A"}\n`;
      });
    }
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sentry_Stakeholder_Directory.txt`;
    a.click();
  };

  return (
    <div>
      <SectionHeader sub="Internal team, external partners, and IR vendor directory">
        Stakeholders
      </SectionHeader>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge color={colors.teal}>{totals.internal} Internal</Badge>
          <Badge color={colors.blue}>{totals.external} External</Badge>
          <Badge color={colors.purple}>{totals.vendors} Vendors</Badge>
          <Badge color={colors.cyan}>{totals.systems} Key Systems</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={exportDirectory}>Export Directory</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 18 }}>
        {/* Left sub-nav */}
        <aside>
          <div style={{
            background: colors.panel,
            border: `1px solid ${colors.panelBorder}`,
            borderRadius: 10,
            padding: 6,
            position: "sticky",
            top: 12,
          }}>
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    width: "100%",
                    display: "block",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 7,
                    background: active ? colors.teal + "1A" : "transparent",
                    border: "1px solid " + (active ? colors.teal + "55" : "transparent"),
                    color: active ? colors.teal : colors.text,
                    cursor: "pointer",
                    marginBottom: 2,
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: colors.textDim, marginTop: 2 }}>{t.desc}</div>
                </button>
              );
            })}
          </div>
        </aside>

        <main>
          {tab === "internal" && <InternalTab />}
          {tab === "external" && <ExternalTab />}
          {tab === "vendors" && <VendorsTab />}
          {tab === "onboarding" && <OnboardingTab onJump={setTab} />}
        </main>
      </div>
    </div>
  );

  // sub-component closures use the outer hooks; declared as inner functions
  // so they share theme + store without prop-drilling.

  function InternalTab() {
    return (
      <>
        <h3 style={{ color: colors.white, fontSize: 13, margin: "0 0 10px" }}>Internal Stakeholders</h3>
        <p style={{ color: colors.textMuted, fontSize: 11, margin: "0 0 14px", lineHeight: 1.5 }}>
          Employees and internal teams responsible for incident response, escalation, and operations.
        </p>
        {INTERNAL_GROUPS.map((g) => (
          <PersonGroupCard key={g.key} group={g} />
        ))}

        {/* Key Systems sub-section */}
        <div style={{ marginTop: 28 }}>
          <h3 style={{ color: colors.white, fontSize: 13, margin: "0 0 6px" }}>Key Systems</h3>
          <p style={{ color: colors.textMuted, fontSize: 11, margin: "0 0 10px", lineHeight: 1.5 }}>
            Critical internal systems with named owners for rapid coordination.
          </p>
          <KeySystemsSection />
        </div>
      </>
    );
  }

  function ExternalTab() {
    return (
      <>
        <h3 style={{ color: colors.white, fontSize: 13, margin: "0 0 10px" }}>External Partners</h3>
        <p style={{ color: colors.textMuted, fontSize: 11, margin: "0 0 14px", lineHeight: 1.5 }}>
          Outside counsel, forensics retainers, PR, insurance carriers, and law enforcement contacts.
        </p>

        <Card style={{ marginBottom: 14, background: `linear-gradient(135deg,${colors.teal}10,${colors.panel})`, borderColor: colors.teal + "44" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 9, background: colors.teal + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛡️</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: colors.teal, fontWeight: 800, fontSize: 13 }}>Dark Rock Cybersecurity — Pre-Approved IR Partner</div>
              <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                IncidentResponse@Darkrocklabs.com · darkrocksecurity.com
              </div>
              <div style={{ color: colors.textDim, fontSize: 10, marginTop: 4 }}>
                Pre-negotiated retainer for surge IR capacity, forensics, and ransomware negotiation.
              </div>
            </div>
            <Badge color={colors.teal}>PRIMARY</Badge>
          </div>
        </Card>

        {EXTERNAL_GROUPS.map((g) => (
          <PersonGroupCard key={g.key} group={g} />
        ))}
      </>
    );
  }

  function PersonGroupCard({ group }: { group: typeof INTERNAL_GROUPS[number] }) {
    const [editing, setEditing] = useState(false);
    const [nf, setNf] = useState({ firstName: "", lastName: "", title: "", responsibilities: "", email: "", cell: "" });
    const people = (stakeholders[group.key] as StakeholderPerson[]) || [];

    const add = useCallback(() => {
      if (!nf.firstName || !nf.lastName) return;
      const person = { ...nf, id: Date.now() } as StakeholderPerson;
      updateStakeholders((p) => ({ ...p, [group.key]: [...((p[group.key] as StakeholderPerson[]) || []), person] }));
      setNf({ firstName: "", lastName: "", title: "", responsibilities: "", email: "", cell: "" });
    }, [nf, group.key]);

    return (
      <Card style={{ marginBottom: 10, borderLeft: `3px solid ${group.color}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: people.length > 0 || editing ? 10 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{group.icon}</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h3 style={{ color: colors.white, margin: 0, fontSize: 13 }}>{group.label}</h3>
                <Badge color={people.length > 0 ? colors.green : colors.textDim}>{people.length}</Badge>
              </div>
              <p style={{ color: colors.textMuted, fontSize: 10, margin: "3px 0 0", lineHeight: 1.4, maxWidth: 600 }}>
                {group.desc}
              </p>
            </div>
          </div>
          <Button variant={editing ? "secondary" : "outline"} size="sm" onClick={() => setEditing(!editing)}>
            {editing ? "Close" : "+ Add"}
          </Button>
        </div>
        {people.map((p) => {
          const invited = p.inviteStatus === "invited" || p.inviteStatus === "accepted";
          return (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderTop: `1px solid ${colors.panelBorder}` }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{p.firstName} {p.lastName}</span>
                  {p.title && <Badge color={group.color}>{p.title}</Badge>}
                  {invited && (
                    <Badge color={colors.teal}>
                      {p.inviteStatus === "accepted" ? "✓ Joined" : "✉ Invited"}
                      {p.appRole ? ` · ${p.appRole}` : ""}
                    </Badge>
                  )}
                </div>
                {p.responsibilities && <div style={{ color: colors.textMuted, fontSize: 10, marginBottom: 4 }}>{p.responsibilities}</div>}
                <div style={{ display: "flex", gap: 14 }}>
                  {p.email && <span style={{ color: colors.text, fontSize: 10 }}>{p.email}</span>}
                  {p.cell && <span style={{ color: colors.text, fontSize: 10 }}>{p.cell}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {p.email && canInvite && (
                  <Button
                    variant={invited ? "ghost" : "outline"}
                    size="sm"
                    disabled={inviting}
                    onClick={() => handleInvite(p, group.key)}
                  >
                    {invited ? "Resend" : "Invite to Sentry"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateStakeholders((prev) => ({
                    ...prev,
                    [group.key]: (prev[group.key] as StakeholderPerson[]).filter((x) => x.id !== p.id),
                  }))}
                  style={{ color: colors.red }}
                >✕</Button>
              </div>
            </div>
          );
        })}
        {editing && (
          <div style={{ background: colors.obsidianM, borderRadius: 7, padding: 14, marginTop: 8, borderTop: `1px solid ${colors.panelBorder}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
              <Input label="First Name *" value={nf.firstName} onChange={(v) => setNf((p) => ({ ...p, firstName: v }))} placeholder="Jane" />
              <Input label="Last Name *" value={nf.lastName} onChange={(v) => setNf((p) => ({ ...p, lastName: v }))} placeholder="Doe" />
              <Input label="Title" value={nf.title} onChange={(v) => setNf((p) => ({ ...p, title: v }))} placeholder="VP of Security" />
              <Input label="Email" value={nf.email} onChange={(v) => setNf((p) => ({ ...p, email: v }))} placeholder="jane@org.com" />
              <Input label="Cell Phone" value={nf.cell} onChange={(v) => setNf((p) => ({ ...p, cell: v }))} placeholder="(555) 123-4567" />
            </div>
            <Input label="Responsibilities" value={nf.responsibilities} onChange={(v) => setNf((p) => ({ ...p, responsibilities: v }))} textarea rows={2} />
            <div style={{ display: "flex", gap: 6 }}>
              <Button onClick={add} disabled={!nf.firstName || !nf.lastName}>Add Contact</Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>
    );
  }

  function VendorsTab() {
    const vendors = stakeholders.vendors || [];
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12 }}>
          <div>
            <h3 style={{ color: colors.white, fontSize: 13, margin: "0 0 4px" }}>IR Vendor Directory</h3>
            <p style={{ color: colors.textMuted, fontSize: 11, margin: 0, lineHeight: 1.5, maxWidth: 700 }}>
              Topic-based registry of every vendor that participates in your incident response &mdash;
              endpoint, network, identity, cloud, productivity, recovery, and external services.
              Each category includes a description of its IR role and example providers to help you
              fill in the right contacts up front.
            </p>
          </div>
          <Badge color={colors.purple}>{vendors.length} Total</Badge>
        </div>

        {VENDOR_CATEGORIES.map((cat) => (
          <VendorCategoryCard key={cat.key} cat={cat} />
        ))}
      </>
    );
  }

  function VendorCategoryCard({ cat }: { cat: VendorCategory }) {
    const [editing, setEditing] = useState(false);
    const [nf, setNf] = useState<Omit<Vendor, "id" | "category">>({
      vendorName: "", productName: "", accountId: "",
      contactName: "", contactEmail: "", contactPhone: "",
      supportPortal: "", supportTier: "", slaResponse: "",
      isPrimary: false, notes: "",
    });
    const list = (stakeholders.vendors || []).filter((v) => v.category === cat.key);

    const add = useCallback(() => {
      if (!nf.vendorName) return;
      const v: Vendor = { ...nf, id: Date.now(), category: cat.key };
      updateStakeholders((p) => ({ ...p, vendors: [...(p.vendors || []), v] }));
      setNf({
        vendorName: "", productName: "", accountId: "",
        contactName: "", contactEmail: "", contactPhone: "",
        supportPortal: "", supportTier: "", slaResponse: "",
        isPrimary: false, notes: "",
      });
      setEditing(false);
    }, [nf, cat.key]);

    return (
      <Card style={{ marginBottom: 10, borderLeft: `3px solid ${cat.color}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>{cat.icon}</span>
              <h3 style={{ color: colors.white, margin: 0, fontSize: 13 }}>{cat.label}</h3>
              <Badge color={list.length > 0 ? colors.green : colors.textDim}>{list.length}</Badge>
            </div>
            <p style={{ color: colors.textMuted, fontSize: 11, margin: "0 0 4px", lineHeight: 1.5 }}>
              {cat.desc}
            </p>
            <p style={{ color: colors.text, fontSize: 11, margin: "0 0 4px", lineHeight: 1.5 }}>
              <span style={{ color: cat.color, fontWeight: 700, marginRight: 6, fontSize: 9, letterSpacing: "0.08em" }}>IR ROLE</span>
              {cat.irRole}
            </p>
            <p style={{ color: colors.textDim, fontSize: 10, margin: 0, lineHeight: 1.5 }}>
              <span style={{ color: colors.textMuted, fontWeight: 700, marginRight: 6, fontSize: 9, letterSpacing: "0.08em" }}>EXAMPLES</span>
              {cat.examples}
            </p>
          </div>
          <Button variant={editing ? "secondary" : "outline"} size="sm" onClick={() => setEditing(!editing)}>
            {editing ? "Close" : "+ Add Vendor"}
          </Button>
        </div>

        {list.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {list.map((v) => (
              <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderTop: `1px solid ${colors.panelBorder}` }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{v.vendorName}</span>
                    {v.productName && <Badge color={cat.color}>{v.productName}</Badge>}
                    {v.isPrimary && <Badge color={colors.teal}>PRIMARY</Badge>}
                    {v.supportTier && <Badge color={colors.blue}>{v.supportTier}</Badge>}
                  </div>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: colors.text, fontSize: 10 }}>
                    {v.contactName && <span>{v.contactName}</span>}
                    {v.contactEmail && <span>{v.contactEmail}</span>}
                    {v.contactPhone && <span>{v.contactPhone}</span>}
                    {v.slaResponse && <span style={{ color: colors.textMuted }}>SLA: {v.slaResponse}</span>}
                    {v.accountId && <span style={{ color: colors.textMuted }}>Acct: {v.accountId}</span>}
                  </div>
                  {v.supportPortal && (
                    <a href={v.supportPortal} target="_blank" rel="noreferrer" style={{ color: colors.teal, fontSize: 10, textDecoration: "none" }}>
                      {v.supportPortal} ↗
                    </a>
                  )}
                  {v.notes && <div style={{ color: colors.textDim, fontSize: 10, marginTop: 4 }}>{v.notes}</div>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateStakeholders((p) => ({ ...p, vendors: (p.vendors || []).filter((x) => x.id !== v.id) }))
                  }
                  style={{ color: colors.red }}
                >✕</Button>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div style={{ background: colors.obsidianM, borderRadius: 7, padding: 14, marginTop: 10, borderTop: `1px solid ${colors.panelBorder}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
              <Input label="Vendor Name *" value={nf.vendorName} onChange={(v) => setNf((p) => ({ ...p, vendorName: v }))} placeholder={cat.examples.split(",")[0]?.trim()} />
              <Input label="Product / Edition" value={nf.productName} onChange={(v) => setNf((p) => ({ ...p, productName: v }))} placeholder="e.g. Falcon Insight XDR" />
              <Input label="Account / Tenant ID" value={nf.accountId} onChange={(v) => setNf((p) => ({ ...p, accountId: v }))} />
              <Input label="Support Tier" value={nf.supportTier} onChange={(v) => setNf((p) => ({ ...p, supportTier: v }))} placeholder="e.g. Premium 24×7" />
              <Input label="Contact Name" value={nf.contactName} onChange={(v) => setNf((p) => ({ ...p, contactName: v }))} placeholder="Account exec / TAM" />
              <Input label="Contact Email" value={nf.contactEmail} onChange={(v) => setNf((p) => ({ ...p, contactEmail: v }))} />
              <Input label="Contact Phone" value={nf.contactPhone} onChange={(v) => setNf((p) => ({ ...p, contactPhone: v }))} placeholder="24×7 hotline if available" />
              <Input label="SLA / Response Time" value={nf.slaResponse} onChange={(v) => setNf((p) => ({ ...p, slaResponse: v }))} placeholder="e.g. 1 hour P1" />
              <Input label="Support Portal URL" value={nf.supportPortal} onChange={(v) => setNf((p) => ({ ...p, supportPortal: v }))} placeholder="https://" />
            </div>
            <Input label="Notes" value={nf.notes} onChange={(v) => setNf((p) => ({ ...p, notes: v }))} textarea rows={2} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: colors.textMuted, fontSize: 11, marginBottom: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={nf.isPrimary}
                onChange={(e) => setNf((p) => ({ ...p, isPrimary: e.target.checked }))}
                style={{ accentColor: colors.teal }}
              />
              Primary vendor for this category
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              <Button onClick={add} disabled={!nf.vendorName}>Add Vendor</Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>
    );
  }

  function KeySystemsSection() {
    const [editSys, setEditSys] = useState(false);
    const [nsf, setNsf] = useState({ systemName: "", category: "", owner: "", ownerEmail: "", ownerCell: "", criticality: "High", notes: "" });

    const addSystem = useCallback(() => {
      if (!nsf.systemName) return;
      const sys = { ...nsf, id: Date.now() } as KeySystem;
      updateStakeholders((p) => ({ ...p, keySystems: [...p.keySystems, sys] }));
      setNsf({ systemName: "", category: "", owner: "", ownerEmail: "", ownerCell: "", criticality: "High", notes: "" });
      setEditSys(false);
    }, [nsf]);

    return (
      <>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <Button onClick={() => setEditSys(!editSys)}>{editSys ? "Cancel" : "+ Add System"}</Button>
        </div>
        {editSys && (
          <Card style={{ marginBottom: 12, borderColor: colors.blue + "44" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
              <Input label="System Name *" value={nsf.systemName} onChange={(v) => setNsf((p) => ({ ...p, systemName: v }))} placeholder="SAP ERP, Workday, AWS Production" />
              <Select label="Category *" value={nsf.category} onChange={(v) => setNsf((p) => ({ ...p, category: v }))} options={SYSTEM_CATEGORIES} />
              <Select label="Criticality" value={nsf.criticality} onChange={(v) => setNsf((p) => ({ ...p, criticality: v }))} options={["Critical", "High", "Medium", "Low"]} />
              <Input label="System Owner" value={nsf.owner} onChange={(v) => setNsf((p) => ({ ...p, owner: v }))} placeholder="John Smith" />
              <Input label="Owner Email" value={nsf.ownerEmail} onChange={(v) => setNsf((p) => ({ ...p, ownerEmail: v }))} />
              <Input label="Owner Cell" value={nsf.ownerCell} onChange={(v) => setNsf((p) => ({ ...p, ownerCell: v }))} />
            </div>
            <Input label="Notes" value={nsf.notes} onChange={(v) => setNsf((p) => ({ ...p, notes: v }))} textarea rows={2} />
            <Button onClick={addSystem} disabled={!nsf.systemName || !nsf.category}>Add System</Button>
          </Card>
        )}
        {(stakeholders.keySystems || []).length === 0 ? (
          <Card style={{ textAlign: "center" }}>
            <p style={{ color: colors.textDim, fontSize: 11 }}>No key systems mapped yet.</p>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
            {stakeholders.keySystems.map((sys) => {
              const critColor = sys.criticality === "Critical" ? colors.red : sys.criticality === "High" ? colors.orange : colors.yellow;
              return (
                <Card key={sys.id} style={{ borderLeft: `3px solid ${critColor}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ color: colors.white, fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{sys.systemName}</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Badge color={colors.blue}>{sys.category}</Badge>
                        <Badge color={critColor}>{sys.criticality}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => updateStakeholders((p) => ({ ...p, keySystems: p.keySystems.filter((x) => x.id !== sys.id) }))} style={{ color: colors.red }}>✕</Button>
                  </div>
                  {sys.owner && (
                    <div style={{ marginTop: 8, borderTop: `1px solid ${colors.panelBorder}`, paddingTop: 6 }}>
                      <div style={{ color: colors.text, fontSize: 11, fontWeight: 600 }}>{sys.owner}</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 3 }}>
                        {sys.ownerEmail && <span style={{ color: colors.textMuted, fontSize: 10 }}>{sys.ownerEmail}</span>}
                        {sys.ownerCell && <span style={{ color: colors.textMuted, fontSize: 10 }}>{sys.ownerCell}</span>}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </>
    );
  }

  function OnboardingTab({ onJump }: { onJump: (k: TabKey) => void }) {
    const internalCovered = INTERNAL_GROUPS.filter(
      (g) => ((stakeholders[g.key] as StakeholderPerson[]) || []).length > 0
    ).length;
    const externalCovered = EXTERNAL_GROUPS.filter(
      (g) => ((stakeholders[g.key] as StakeholderPerson[]) || []).length > 0
    ).length;
    const vendorCovered = READINESS_VENDORS.filter(
      (k) => (stakeholders.vendors || []).some((v) => v.category === k)
    ).length;

    const internalPct = Math.round((internalCovered / INTERNAL_GROUPS.length) * 100);
    const externalPct = Math.round((externalCovered / EXTERNAL_GROUPS.length) * 100);
    const vendorPct = Math.round((vendorCovered / READINESS_VENDORS.length) * 100);
    const overall = Math.round((internalPct + externalPct + vendorPct) / 3);

    const missingInternal = INTERNAL_GROUPS.filter((g) => ((stakeholders[g.key] as StakeholderPerson[]) || []).length === 0);
    const missingExternal = EXTERNAL_GROUPS.filter((g) => ((stakeholders[g.key] as StakeholderPerson[]) || []).length === 0);
    const missingVendors = READINESS_VENDORS.filter(
      (k) => !(stakeholders.vendors || []).some((v) => v.category === k)
    ).map((k) => VENDOR_CATEGORIES.find((c) => c.key === k)!).filter(Boolean);

    return (
      <>
        <h3 style={{ color: colors.white, fontSize: 13, margin: "0 0 4px" }}>Stakeholder Readiness</h3>
        <p style={{ color: colors.textMuted, fontSize: 11, margin: "0 0 18px", lineHeight: 1.5, maxWidth: 700 }}>
          Track how complete your stakeholder directory is across internal teams, external partners,
          and the IR vendor categories that matter most during a real incident.
        </p>

        <Card style={{ marginBottom: 12, background: `linear-gradient(135deg,${colors.teal}10,${colors.panel})`, borderColor: colors.teal + "33" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <div style={{ color: colors.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>OVERALL READINESS</div>
              <div style={{ color: colors.white, fontSize: 28, fontWeight: 800, lineHeight: 1, marginTop: 4 }}>{overall}<span style={{ color: colors.textMuted, fontSize: 14 }}>%</span></div>
              <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>Across all stakeholder dimensions</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, flex: 1, maxWidth: 540 }}>
              <ReadinessTile label="Internal" pct={internalPct} covered={internalCovered} total={INTERNAL_GROUPS.length} color={colors.teal} onJump={() => onJump("internal")} />
              <ReadinessTile label="External" pct={externalPct} covered={externalCovered} total={EXTERNAL_GROUPS.length} color={colors.blue} onJump={() => onJump("external")} />
              <ReadinessTile label="Vendors" pct={vendorPct} covered={vendorCovered} total={READINESS_VENDORS.length} color={colors.purple} onJump={() => onJump("vendors")} />
            </div>
          </div>
        </Card>

        <ChecklistSection
          title="Internal roles to fill"
          color={colors.teal}
          tab="internal"
          onJump={onJump}
          items={missingInternal.map((g) => ({ icon: g.icon, label: g.label, desc: g.desc }))}
          emptyText="All internal roles covered."
        />
        <ChecklistSection
          title="External partners to register"
          color={colors.blue}
          tab="external"
          onJump={onJump}
          items={missingExternal.map((g) => ({ icon: g.icon, label: g.label, desc: g.desc }))}
          emptyText="All external partner roles covered."
        />
        <ChecklistSection
          title="Critical IR vendors to add"
          color={colors.purple}
          tab="vendors"
          onJump={onJump}
          items={missingVendors.map((c) => ({ icon: c.icon, label: c.label, desc: c.irRole }))}
          emptyText="All critical IR vendor categories filled."
        />
      </>
    );
  }

  function ReadinessTile({ label, pct, covered, total, color, onJump }: { label: string; pct: number; covered: number; total: number; color: string; onJump: () => void }) {
    return (
      <div onClick={onJump} style={{ background: colors.obsidianM, borderRadius: 8, padding: 12, border: `1px solid ${colors.panelBorder}`, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ color: colors.text, fontSize: 11, fontWeight: 700 }}>{label}</div>
          <div style={{ color, fontSize: 18, fontWeight: 800 }}>{pct}%</div>
        </div>
        <div style={{ marginTop: 6, height: 4, background: colors.obsidianL, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: color }} />
        </div>
        <div style={{ color: colors.textDim, fontSize: 9, marginTop: 6 }}>{covered}/{total} covered</div>
      </div>
    );
  }

  function ChecklistSection({
    title, color, tab: targetTab, onJump, items, emptyText,
  }: {
    title: string;
    color: string;
    tab: TabKey;
    onJump: (k: TabKey) => void;
    items: { icon: string; label: string; desc: string }[];
    emptyText: string;
  }) {
    if (items.length === 0) {
      return (
        <Card style={{ marginBottom: 10, borderLeft: `3px solid ${colors.green}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: colors.green, fontSize: 14 }}>✓</span>
            <div>
              <div style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{title}</div>
              <div style={{ color: colors.textMuted, fontSize: 11 }}>{emptyText}</div>
            </div>
          </div>
        </Card>
      );
    }
    return (
      <Card style={{ marginBottom: 10, borderLeft: `3px solid ${color}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ color: colors.white, fontSize: 12, fontWeight: 700 }}>{title}</div>
          <Button variant="outline" size="sm" onClick={() => onJump(targetTab)}>Open {targetTab} →</Button>
        </div>
        {items.map((it) => (
          <div key={it.label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderTop: `1px solid ${colors.panelBorder}` }}>
            <span style={{ fontSize: 14 }}>{it.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: colors.text, fontSize: 11, fontWeight: 600 }}>{it.label}</div>
              <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 2, lineHeight: 1.4 }}>{it.desc}</div>
            </div>
          </div>
        ))}
      </Card>
    );
  }
}

// Re-export STAKEHOLDER_GROUPS so other modules importing from
// stakeholder-groups continue to work.
export { STAKEHOLDER_GROUPS };
