# Sentry — Dark Rock Labs
## Cyber Resilience Platform

> **Org:** DarkRockSecurity
> **Repo:** github.com/DarkRockSecurity/sentry
> **Dev:** github.com/drcalexbates26/sentry
> **Version:** 3.1.0

---

## What This Is

Sentry is an enterprise cybersecurity resilience platform built by Dark Rock Labs. It gives security teams, MSPs, and vCISOs a single command center for assessments, incident response, playbooks, stakeholder management, policy generation, and tabletop exercises.

This document is the complete build spec. Hand it to Claude Code alongside sentry.jsx and it builds the production app.

---

## Tech Stack

- Next.js 15 (App Router), TypeScript, TailwindCSS
- PostgreSQL via Prisma ORM
- Zustand (client state), NextAuth.js (auth)
- Recharts, Lucide React, @dnd-kit
- Jest + Playwright (testing), Vercel (deploy)

---

## Claude Code Instructions

```
mkdir sentry && cd sentry
npx create-next-app@latest . --typescript --tailwind --app --src-dir --use-npm
npm install prisma @prisma/client zustand next-auth lucide-react recharts @dnd-kit/core @dnd-kit/sortable
npm install -D jest @testing-library/react playwright
npx prisma init
```

Then say: "Read CLAUDE.md and sentry.jsx. Build the production app. Start with the database schema, then design system, then each module in order. sentry.jsx is the source of truth."

---

## Brand

- Primary: #00B4A6 (Aurora Teal)
- Background: #0A0E14 (Deep Obsidian)
- Fonts: Figtree (display), Source Sans 3 (body), JetBrains Mono (mono)

## Commercial

- IR Retainer: $350/hr, 10hr minimum ($3,500)
- IR Contact: IncidentResponse@Darkrocklabs.com
- ATLAS: https://darkrocksec.com (LIVE)
- Main: https://www.darkrocksecurity.com
- Contact: alexander.bates@darkrocksecurity.com

---

## 16 Modules

1. Dashboard — OSHA status page, KPIs, incident chart, stakeholder coverage
2. Onboarding — 5-step wizard (org, tech stack, compliance)
3. Assessment — NIST CSF 2.0 + 800-53 dual framework, export engine
4. IR Planner — 8-phase NIST 800-61 lifecycle
5. Commander — Timer, SLA tickers, IOCs, timeline, escalation, workstreams, expenses, notifications, summaries, attorney-client privilege
6. Playbooks — 14 scenarios, checklists, incident assignment
7. Tabletop — ATLAS integration, exercise tracking, IR retainer contact
8. Tickets — Phase-based tracking, actions, export
9. Tasks — Kanban (Backlog/In Progress/In Review/Done)
10. Forensics — Encrypted evidence vault, chain-of-custody
11. Stakeholders — 15 groups + key systems
12. Policies — 8 Big 4 quality templates
13. Comms — OOB channels
14. Access — 7 RBAC tiers
15. Integrations — Pen test, SIEM, EDR, SOAR, APIs

---

## Deployment (when ready)

1. Transfer or create github.com/DarkRockSecurity/sentry
2. Connect Vercel
3. Provision PostgreSQL (Supabase or Neon)
4. Set env vars
5. Domain: sentry.darkrocklabs.com


---

## Repo Structure

```
sentry/
├── CLAUDE.md
├── README.md
├── sentry.jsx                          # Reference prototype (source of truth)
├── package.json / tsconfig.json / next.config.js / tailwind.config.ts
├── .env.example / .gitignore
│
├── prisma/
│   └── schema.prisma
│
├── src/
│   ├── app/                            # Next.js App Router pages
│   │   ├── layout.tsx / page.tsx / globals.css
│   │   ├── onboarding/page.tsx
│   │   ├── assessment/page.tsx + [id]/page.tsx
│   │   ├── ir-planner/page.tsx
│   │   ├── commander/page.tsx + [id]/page.tsx
│   │   ├── playbooks/page.tsx + [id]/page.tsx
│   │   ├── tabletop/page.tsx + [id]/page.tsx
│   │   ├── tickets/page.tsx + [id]/page.tsx
│   │   ├── tasks/page.tsx
│   │   ├── forensics / stakeholders / policies / comms / access / integrations
│   │
│   ├── components/
│   │   ├── ui/         (Button, Card, Badge, Input, Select, Checkbox, ProgressBar, ScoreGauge, MiniChart, StatusLight)
│   │   ├── layout/     (Sidebar, Header, Shell)
│   │   ├── dashboard/  (StatusPage, KPIGrid, QuickActions)
│   │   ├── assessment/ (FrameworkToggle, ControlQuestion, ScoreReport, RecommendationList)
│   │   ├── commander/  (IncidentHeader, ElapsedTimer, DeadlineTickers, TimelineView, EscalationTree, WorkstreamCard, ExpenseTracker, NotificationGenerator, TacticalSummary)
│   │   ├── playbooks/  (PlaybookCard, PlaybookChecklist, IncidentAssignment)
│   │   ├── tasks/      (KanbanBoard, TaskCard)
│   │   ├── stakeholders/ (ContactGroup, ContactForm)
│   │   └── policies/   (PolicyCard, PolicyViewer)
│   │
│   ├── lib/            (db.ts, auth.ts, utils.ts, export.ts)
│   ├── data/           (csf2-controls.ts, n53-controls.ts, playbooks.ts, ir-phases.ts, tech-options.ts, policy-templates.ts)
│   ├── hooks/          (useTimer.ts, useDeadlines.ts, useAssessmentScore.ts)
│   ├── store/          (index.ts, orgSlice.ts, assessmentSlice.ts, incidentSlice.ts, taskSlice.ts, stakeholderSlice.ts)
│   ├── types/          (organization.ts, assessment.ts, incident.ts, playbook.ts, ticket.ts, task.ts, stakeholder.ts, policy.ts)
│   └── api/            (Route handlers for all CRUD + export)
│
└── tests/              (scoring.test.ts, validation.test.ts, e2e/)
```

---

## Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id          String   @id @default(cuid())
  name        String
  industry    String?
  size        String?
  website     String?
  contactName String?
  contactEmail String?
  contactPhone String?
  techStack   Json?    // { identity, endpoint, siem, firewall, ... }
  compliance  String[] // ["NIST 800-53", "HIPAA", ...]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  assessments   Assessment[]
  incidents     Incident[]
  tickets       Ticket[]
  tasks         Task[]
  stakeholders  Stakeholder[]
  policies      Policy[]
  tabletops     Tabletop[]
  teamMembers   TeamMember[]
  forensicLogs  ForensicLog[]
}

model TeamMember {
  id       String @id @default(cuid())
  name     String
  email    String
  role     String // Administrator, Incident Owner, Core IRT, etc.
  active   Boolean @default(true)
  orgId    String
  org      Organization @relation(fields: [orgId], references: [id])
}

model Assessment {
  id          String   @id @default(cuid())
  framework   String   // "NIST CSF 2.0" or "NIST 800-53 Rev 5"
  score       Int
  answers     Json     // { "GV.OC-01": 3, "PR.AA-01": 2, ... }
  grpScores   Json     // [{ name: "Govern", score: 75 }, ...]
  catScores   Json?    // CSF only
  warnings    Json     // Validation warnings
  recs        Json     // Priority recommendations
  orgId       String
  org         Organization @relation(fields: [orgId], references: [id])
  createdAt   DateTime @default(now())
}

model Incident {
  id                String   @id @default(cuid())
  title             String
  severity          String   // Low, Medium, High, Critical
  status            String   @default("Active") // Active, Closed
  startTime         DateTime
  endTime           DateTime?
  internalCostRate  Float    @default(150)
  iocs              String[]
  affectedUsers     String[]
  affectedAssets    String[]
  affectedRegions   String[]
  privacyConcern    Boolean  @default(false)
  attorneyPrivilege Boolean  @default(false)
  privilegeBy       String?
  privilegeAt       DateTime?
  phaseStatus       Json     // { prep: 100, ident: 75, ... }
  findings          Json     // [{ text, time }]
  timeline          Json     // [{ time, event, elapsed }]
  workstreams       Json     // { Security: { tasks, docs, ... } }
  escalation        Json     // [{ role, owner, status, priority }]
  expenses          Json     // [{ vendor, amount, description, date }]
  summaries         Json     // [{ id, timestamp, text }]
  notifications     Json     // [{ type, time }]
  members           Json     // [{ name, role, hours }]

  orgId       String
  org         Organization @relation(fields: [orgId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Ticket {
  id        String   @id @default(cuid())
  title     String
  severity  String
  status    String   @default("Open")
  phase     String?
  assignee  String?
  details   String?  @db.Text
  actions   Json     // [{ text, by, time }]
  orgId     String
  org       Organization @relation(fields: [orgId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Task {
  id        String   @id @default(cuid())
  title     String
  priority  String   // Low, Medium, High, Critical
  status    String   @default("Backlog") // Backlog, In Progress, In Review, Done
  assignee  String?
  source    String?  // "Assessment", "Playbook: Ransomware", etc.
  updates   Json     // [{ text, date }]
  orgId     String
  org       Organization @relation(fields: [orgId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Stakeholder {
  id              String  @id @default(cuid())
  groupKey        String  // incidentCommander, ciso, securityEngineers, etc.
  firstName       String
  lastName        String
  title           String?
  responsibilities String? @db.Text
  email           String?
  cell            String?
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])
  createdAt       DateTime @default(now())
}

model KeySystem {
  id          String  @id @default(cuid())
  systemName  String
  category    String
  criticality String
  owner       String?
  ownerEmail  String?
  ownerCell   String?
  notes       String? @db.Text
  orgId       String
  createdAt   DateTime @default(now())
}

model Policy {
  id        String   @id @default(cuid())
  templateId String  // irp, isp, bcp, etc.
  title     String
  version   String   @default("1.0")
  content   String   @db.Text
  orgId     String
  org       Organization @relation(fields: [orgId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Tabletop {
  id            String   @id @default(cuid())
  title         String
  scenario      String
  date          DateTime
  facilitator   String?
  participants  String[]
  status        String   @default("Scheduled")
  rating        Int?
  notes         String?  @db.Text
  findings      Json     // [{ text, time }]
  lessonsLearned Json    // [{ text, recommendation }]
  actionItems   Json     // [{ text, owner, priority, status }]
  feedback      Json     // [{ from, text }]
  orgId         String
  org           Organization @relation(fields: [orgId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ForensicLog {
  id             String   @id @default(cuid())
  title          String
  classification String
  caseRef        String?
  description    String?  @db.Text
  encrypted      Boolean  @default(false)
  orgId          String
  createdAt      DateTime @default(now())
}

model Lesson {
  id     String   @id @default(cuid())
  text   String
  source String?
  orgId  String
  createdAt DateTime @default(now())
}
```


---

## Design Tokens

```typescript
// src/lib/tokens.ts
export const colors = {
  teal:       "#00B4A6",
  tealDark:   "#009A8E",
  tealLight:  "#33C4B8",
  obsidian:   "#0A0E14",
  obsidianL:  "#0F1520",
  obsidianM:  "#151C28",
  panel:      "#111827",
  panelLight: "#1A2332",
  panelBorder:"#1E293B",
  text:       "#E2E8F0",
  textMuted:  "#94A3B8",
  textDim:    "#64748B",
  white:      "#FFFFFF",
  red:        "#EF4444",
  orange:     "#F97316",
  yellow:     "#EAB308",
  green:      "#22C55E",
  blue:       "#3B82F6",
  purple:     "#8B5CF6",
  cyan:       "#06B6D4",
} as const;

export const typography = {
  display: "'Figtree', sans-serif",
  body:    "'Source Sans 3', sans-serif",
  mono:    "'JetBrains Mono', monospace",
} as const;
```


---

## .env.example

```
DATABASE_URL="postgresql://user:password@localhost:5432/sentry"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret"
```

---

*Dark Rock Labs — Sentry v3.1.0*
*darkrocksecurity.com*
