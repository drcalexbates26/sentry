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
- 15 modules: Dashboard, Onboarding, Assessment, IR Planner, Commander, Playbooks, Tabletop, Tickets, Tasks, Forensics, Stakeholders, Policies, Comms, Access, Integrations
- UI component library in src/components/ui/
- Static data files in src/data/ (CSF controls, playbooks, IR phases, tech options, etc.)

## Commands
```bash
npm install          # Install deps
npm run dev          # Start dev server
npm run build        # Production build
npx prisma generate  # Generate Prisma client
npx prisma studio    # Visual DB browser
```

## File Naming
- PascalCase: React components, TypeScript types/interfaces
- camelCase: variables, functions, hooks
- kebab-case: file names for routes
- Design tokens: src/lib/tokens.ts

## Key Files
- src/app/page.tsx — Main app entry, client-side module router
- src/store/index.ts — Zustand store with all app state
- src/data/csf2-controls.ts — Full NIST CSF 2.0 control set
- src/data/playbooks.ts — 14 incident response playbooks
- src/lib/policy-generator.ts — Policy document generation engine

## Commit Format
Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
