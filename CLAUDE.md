# CLAUDE.md — Sentry by Dark Rock Labs

## Project Overview
Sentry is an enterprise cybersecurity resilience platform built by Dark Rock Labs.
Repository: `DarkRockSecurity/sentry` (prod) | `DRCalexbates26/sentry` (dev)
Stack: Next.js 15 App Router, TypeScript, TailwindCSS, PostgreSQL via Prisma, Zustand, NextAuth.js

## Brand
- Primary: #00B4A6 (Aurora Teal)
- Background: #0A0E14 (Deep Obsidian)
- Fonts: Figtree (display), Source Sans 3 (body), JetBrains Mono (mono)

## Architecture
- Client-side SPA with Next.js App Router
- Zustand for all client state management (src/store/index.ts)
- 18 modules: Dashboard, Onboarding, Assessment, IR Planner, Commander, Incident Log, Playbooks, Tabletop, Pen Testing, Tickets, Tasks, Forensics, Stakeholders, Policies, Comms, Access, Integrations
- UI component library in src/components/ui/
- Static data files in src/data/ (CSF controls, playbooks, IR phases, tech options, etc.)
- Report generators in src/lib/ (assessment, incident, policy reports)
- Notification service in src/lib/notifications.ts

## Key Features
- NIST CSF 2.0 Assessment with professional report export
- Incident Commander with real-time timer, SLA tickers, auto-ticket creation
- Incident Log with auto-discovery, phase tracking, parent/child tickets
- 14 IR Playbooks with incident assignment and IR phase mapping
- Tabletop AAR Dashboard (threat profile, objectives scorecard, findings table)
- Pen Testing scoping module (6 test types, mailto submission to Dark Rock)
- Evidence Vault with SHA-256 hashing, chain of custody, access control
- Notification service with CONFIDENTIAL/PRIVILEGED headers
- 8 policy templates with tech stack integration
- Real incident metrics (no fake demo data)

## Commands
```bash
npm install          # Install deps
npm run dev          # Start dev server
npm run build        # Production build
npx prisma generate  # Generate Prisma client
```

## Key Files
- src/app/page.tsx — Main app entry, client-side module router
- src/store/index.ts — Zustand store with all app state
- src/data/csf2-controls.ts — Full NIST CSF 2.0 control set
- src/data/playbooks.ts — 14 incident response playbooks
- src/lib/notifications.ts — Notification event service
- src/lib/assessment-report-generator.ts — Professional assessment report
- src/lib/incident-report-generator.ts — Incident response report
- src/lib/policy-generator.ts — Policy document generation
- sentry.jsx — Original prototype (source of truth for behavior)

## Commit Format
Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
