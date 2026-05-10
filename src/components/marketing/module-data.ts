import {
  LayoutDashboard,
  Radar,
  GraduationCap,
  ClipboardCheck,
  Map,
  Siren,
  ListTree,
  BookOpen,
  Sword,
  Bug,
  Ticket,
  CheckSquare,
  FileSearch,
  Users,
  FileText,
  Radio,
  Lock,
  Plug,
} from "lucide-react";

export type Callout = { x: number; y: number };

export type ModuleEntry = {
  id: string;
  label: string;
  note: string;
  icon: typeof LayoutDashboard;
  file: string;
  hero: string;
  tagline: string;
  description: string;
  highlights: string[];
  callouts?: Callout[];
};

export const DEFAULT_CALLOUTS: Callout[] = [
  { x: 22, y: 24 },
  { x: 76, y: 26 },
  { x: 30, y: 60 },
  { x: 72, y: 78 },
];

export const MODULES: ModuleEntry[] = [
  {
    id: "dashboard", label: "Dashboard", note: "Live posture & metrics", icon: LayoutDashboard, file: "dashboard.png",
    hero: "Your cyber resilience cockpit",
    tagline: "Three categories. One glance. Every answer.",
    description: "Active operations, performance & exposure, and readiness — surfaced in three color-coded categories so the SOC, the CISO, and the board each find what they need without scrolling. Every tile is clickable; nothing is buried two screens deep.",
    highlights: [
      "MTTD and MTTR computed live from your incident log — 60s tolerance built in",
      "Zero-day alerts surface critical CVEs the moment your industry feed picks them up",
      "Industry threat pulse alongside the global feed, scoped to your sector",
      "Active-incident banner with one-click Commander — never lose the ball mid-event",
    ],
    callouts: [
      { x: 26, y: 50 },
      { x: 26, y: 28 },
      { x: 80, y: 70 },
      { x: 50, y: 18 },
    ],
  },
  {
    id: "threatintel", label: "Threat Intel", note: "CVE & OSINT feeds", icon: Radar, file: "threatintel.png",
    hero: "Threat intelligence, sized for you",
    tagline: "Global feeds + your industry's critical advisories — pre-scored and prioritized.",
    description: "Rather than dumping every CVE on your desk, Sentry blends CVSS, exploitation status, and your tech stack to surface the threats that are actually you. MITRE ATT&CK mapping is on every advisory, and one click promotes it into the response workflow.",
    highlights: [
      "Industry-scoped feed cuts noise by 80% on day one",
      "Risk scoring blends CVSS, active exploitation, and zero-day flags",
      "MITRE ATT&CK technique mapping out of the box",
      "Verified exploit auto-declares the incident in Commander",
    ],
  },
  {
    id: "onboard", label: "Onboarding", note: "Org & tech profile", icon: GraduationCap, file: "onboard.png",
    hero: "From zero to operational, fast",
    tagline: "A guided setup that already knows what your assessment will need next.",
    description: "Capture the org profile, tech stack, and applicable frameworks in one pass. Every downstream module — assessment, playbooks, policy generation, threat-intel filtering — uses this profile so you don't repeat yourself.",
    highlights: [
      "10-field tech stack inventory feeds smart questions in the assessment",
      "Compliance flags drive automatic regulatory deadline tracking",
      "Re-runnable: tech stack changes propagate through all modules instantly",
      "Less than five minutes to a fully personalized platform",
    ],
  },
  {
    id: "assessment", label: "Assessment", note: "NIST CSF 2.0 maturity", icon: ClipboardCheck, file: "assessment.png",
    hero: "Maturity, measured against NIST CSF 2.0",
    tagline: "The only resilience assessment that hands you a 90-day plan, not slideware.",
    description: "Six CSF functions, every category, every subcategory — assessed with smart-question prompts that read your tech stack. Every saved assessment generates a Resilience Hitlist with short-term, achievable, and aspirational moves, flagged for what your current tooling can automate.",
    highlights: [
      "Resilience Hitlist: short-term wins, achievable bets, aspirational moves",
      "Automation flags surface what's a config flip vs a quarter-long project",
      "Saved-assessment history with delta scoring shows real maturity progression",
      "Board-ready PDF export plus one-click email delivery to leadership",
    ],
    callouts: [
      { x: 40, y: 35 },
      { x: 30, y: 60 },
      { x: 75, y: 22 },
      { x: 75, y: 78 },
    ],
  },
  {
    id: "irplan", label: "IR Planner", note: "Plans & contacts", icon: Map, file: "irplan.png",
    hero: "An IR plan you'll actually run",
    tagline: "Phase-by-phase readiness with named owners and live checklists.",
    description: "Sentry replaces the 40-page IR runbook PDF with a working checklist that lives next to the incident. Phase progression is tracked, owners are pinned, and your readiness percentage feeds the dashboard automatically.",
    highlights: [
      "Pre-built nine-phase IR lifecycle aligned to NIST 800-61",
      "Stakeholder contacts pinned to each phase — no scrambling for numbers",
      "Per-step notes and checklists captured during exercises and real events",
      "Readiness % surfaces on the dashboard so it's never out of sight",
    ],
  },
  {
    id: "commander", label: "Commander", note: "Live incident command", icon: Siren, file: "commander.png",
    hero: "When it's an incident, command it",
    tagline: "One screen for the full incident lifecycle. Privileged-by-default.",
    description: "Sentry's Commander turns the moment of declaration into a live operational picture: real-time timer, SLA tickers per stakeholder tier, IOC tracking, affected users/assets/regions, attorney-client privilege one-click engagement, and battle rhythm cadence built in.",
    highlights: [
      "Real-time SLA tickers across every notification group, tier-aware",
      "IOCs, affected users, assets, and regions captured in one structured view",
      "Attorney-Client privilege engaged with one toggle, propagated everywhere",
      "Auto-creates child tickets and tasks as the incident unfolds",
    ],
    callouts: [
      { x: 50, y: 22 },
      { x: 50, y: 50 },
      { x: 60, y: 70 },
      { x: 35, y: 86 },
    ],
  },
  {
    id: "incidentlog", label: "Incident Log", note: "All incidents, all phases", icon: ListTree, file: "incidentlog.png",
    hero: "Every incident, fully reconstructed",
    tagline: "Auto-curated history with phases, ticket trees, and timeline reconstruction.",
    description: "When the auditor asks how the Q1 phishing campaign was handled, the answer is one click. Every incident's master ticket, child workstreams, full timeline, IOCs, and findings are preserved with chain-of-custody intact.",
    highlights: [
      "Master + child ticket relationships preserved across years",
      "Full timeline of every event, action, and decision",
      "Status filters and search — find the 2024 ransomware incident in seconds",
      "MTTD and MTTR computed automatically per incident and rolled up",
    ],
  },
  {
    id: "playbooks", label: "Playbooks", note: "14 IR playbooks", icon: BookOpen, file: "playbooks.png",
    hero: "Fourteen playbooks. One click to run.",
    tagline: "Pre-mapped to IR phases. Assign to an incident and the queue populates.",
    description: "Don't write playbooks during an incident. Sentry ships fourteen scenario-tested playbooks — ransomware, BEC, insider threat, supply chain, cloud account compromise, and more — each mapped to the IR lifecycle and ready to attach to a live case.",
    highlights: [
      "14 playbooks across phishing, ransomware, insider, cloud, supply chain, more",
      "One-click attachment auto-creates phase-tagged tasks",
      "Each step is reusable and editable — build your own variant from any base",
      "Ties directly into the Tabletop module for low-friction exercise generation",
    ],
  },
  {
    id: "tabletop", label: "Tabletop", note: "AAR & Light TTX", icon: Sword, file: "tabletop.png",
    hero: "Stress-test before the breach does",
    tagline: "AAR Dashboard, threat profiles, and the Light TTX exporter.",
    description: "Run tabletop exercises in less than an hour, capture findings as you go, and convert lessons learned into real tasks. Every exercise produces a Light TTX export your auditors and insurers will recognize.",
    highlights: [
      "Threat profile generator pulls from your industry's actual TTPs",
      "Objectives scorecard turns 'we discussed it' into 'we measured it'",
      "Findings convert directly into tasks — no transcription gap",
      "Light TTX export format aligns with HITRUST, HIPAA, and SOC 2 expectations",
    ],
  },
  {
    id: "pentesting", label: "Pen Testing", note: "Scoping & engagement", icon: Bug, file: "pentesting.png",
    hero: "Pen testing, scoped and tracked",
    tagline: "Six test types, scoping form to engagement to findings — all one thread.",
    description: "Submit a pen test request from inside Sentry and it hits the Dark Rock IR desk by email automatically. Scoping, pricing, approval, active testing, and finding remediation all live in one tracked workspace until every issue is closed.",
    highlights: [
      "Six test types: external, internal, web app, wireless, social, red team",
      "Scoping form pre-loads from your tech stack — fewer back-and-forth emails",
      "Findings track from Open through Remediated with severity + CVSS scoring",
      "Pricing, approval, and reports all preserved in the engagement timeline",
    ],
  },
  {
    id: "tickets", label: "Tickets", note: "Parent / child tickets", icon: Ticket, file: "tickets.png",
    hero: "Parent. Child. Done.",
    tagline: "Hierarchical tickets that scale from a single event to a full incident workstream.",
    description: "Sentry's ticket model is built for IR specifically: a master ticket per incident, child tickets per workstream, security-event tickets from threat-intel feeds, and parent–child relationships preserved through the entire lifecycle.",
    highlights: [
      "Master / child / security-event ticket types built for IR triage",
      "Auto-creates child tickets from playbook steps and threat-intel hits",
      "Phase-aware status flow ties each ticket to its IR lifecycle stage",
      "Bulk operations and queue filters keep the SOC moving fast",
    ],
  },
  {
    id: "tasks", label: "Tasks", note: "Assignments & SLAs", icon: CheckSquare, file: "tasks.png",
    hero: "Kanban for what matters under fire",
    tagline: "Four columns, IR-phase tagged, auto-linked to tickets.",
    description: "When an incident generates twenty parallel actions, you don't need a project tool — you need a triage board. Sentry's task module is purpose-built for IR throughput: drag, assign, set priority, see what's blocking.",
    highlights: [
      "Backlog · In Progress · In Review · Done — purpose-built for IR cadence",
      "Auto-creates from playbooks, hitlist items, and tabletop findings",
      "IR-phase tagging keeps tasks aligned to the lifecycle",
      "Critical/High counts roll up to the dashboard automatically",
    ],
  },
  {
    id: "forensics", label: "Forensics", note: "Evidence vault", icon: FileSearch, file: "forensics.png",
    hero: "Evidence with chain of custody by default",
    tagline: "SHA-256 hashed. Access-controlled. Exportable when the regulators ask.",
    description: "The forensics module is what insurance and counsel actually want during a breach: cryptographically hashed evidence, named chain of custody, role-based access lists, and an audit trail every action writes to automatically.",
    highlights: [
      "SHA-256 hashing on every file, verified on read and export",
      "Per-evidence access list with role-based gating",
      "Chain of custody auto-captured — every view, edit, and export logged",
      "Privilege & Confidentiality classification surfaces in every export",
    ],
  },
  {
    id: "stakeholders", label: "Stakeholders", note: "Core / Extended / External", icon: Users, file: "stakeholders.png",
    hero: "Everyone who matters, organized",
    tagline: "Internal + external + 22 IR-vendor categories with onboarding readiness scoring.",
    description: "Sentry's stakeholders module is the directory you actually update. Tabbed sub-navigation separates Internal, External, Vendors (22 IR-relevant categories with descriptions), and an Onboarding readiness scorecard so you know exactly which roles still need a name.",
    highlights: [
      "22 IR vendor categories — EDR, SIEM, Identity, M365, DFIR retainer, more",
      "Pre-populated Dark Rock IR partner card for instant retainer access",
      "Onboarding scorecard quantifies stakeholder coverage as a percentage",
      "Per-category descriptions explain why each role matters during IR",
    ],
    callouts: [
      { x: 25, y: 40 },
      { x: 36, y: 16 },
      { x: 70, y: 30 },
      { x: 90, y: 18 },
    ],
  },
  {
    id: "policies", label: "Policies", note: "8 policy templates", icon: FileText, file: "policies.png",
    hero: "Policies that don't just live in a binder",
    tagline: "Eight templates rendered to your stack and brand. Exportable. Auditable.",
    description: "Sentry generates policy documents that reference your actual tech stack, your stakeholders, and your regulatory commitments — not generic boilerplate. Every generation is logged, versioned, and exportable in a format your auditors will read.",
    highlights: [
      "8 policy templates including Incident Response, Acceptable Use, Vendor Risk",
      "Auto-fills tech stack, stakeholder names, and compliance requirements",
      "Versioned exports — show auditors the v1.2 you used in March",
      "Brand-aligned typography and logos baked in for board distribution",
    ],
  },
  {
    id: "comms", label: "Communications", note: "Notifications & headers", icon: Radio, file: "comms.png",
    hero: "Privileged. Confidential. Logged.",
    tagline: "Out-of-band channel inventory with privilege-by-default classification.",
    description: "When the email infrastructure might be the compromise, you need an out-of-band plan. Sentry inventories Signal, satellite, in-person EOC, and the rest — alongside privileged communications routing that classifies every message correctly.",
    highlights: [
      "Out-of-band channel inventory ready before the incident",
      "Privilege & Confidentiality banners auto-attach to every notification",
      "One-click Send Email path through verified SMTP delivery",
      "Communication log preserved with full timestamp + recipient audit",
    ],
  },
  {
    id: "access", label: "Access Control", note: "RBAC & groups", icon: Lock, file: "access.png",
    hero: "Least privilege, by default",
    tagline: "Four roles. Stakeholder-group permissions. Tenant-scoped from the schema up.",
    description: "Sentry's access model is built for IR responsibilities, not generic permissions. Super-admin, tenant-admin, analyst, and viewer roles map cleanly to the actual workflows, with stakeholder-group assignments giving fine control without policy sprawl.",
    highlights: [
      "Four IR-aligned roles — super-admin, tenant-admin, analyst, viewer",
      "Stakeholder-group assignments grant module-level access without complexity",
      "Tenant isolation enforced at the database (row-level security) layer",
      "Provisioning + deprovisioning flow built into the admin console",
    ],
  },
  {
    id: "integrations", label: "Integrations", note: "Stack connectors", icon: Plug, file: "integrations.png",
    hero: "Plug into your stack",
    tagline: "EDR, SIEM, IdP, M365, cloud, ticketing — registered, contactable, ready.",
    description: "Sentry doesn't replace your security stack — it makes it actionable during an incident. Every vendor's portal, support tier, SLA, and 24×7 hotline is one click away when you need it most.",
    highlights: [
      "22 vendor categories cover the full IR-relevant stack",
      "Support portals, account IDs, and SLAs surfaced inline during incidents",
      "Pre-approved IR retainer (Dark Rock) wired to the active incident",
      "Per-vendor primary flag identifies your default for each category",
    ],
  },
];

export function getModule(id: string): ModuleEntry | undefined {
  return MODULES.find((m) => m.id === id);
}

export function getRelatedModules(id: string, count = 3): ModuleEntry[] {
  const idx = MODULES.findIndex((m) => m.id === id);
  if (idx === -1) return MODULES.slice(0, count);
  // Pick the next `count` modules cyclically — gives a varied "related" feel
  const out: ModuleEntry[] = [];
  for (let i = 1; i <= count; i++) {
    out.push(MODULES[(idx + i) % MODULES.length]);
  }
  return out;
}
