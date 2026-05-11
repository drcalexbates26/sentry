/**
 * Plan tier catalog. Single source of truth for what each TenantPlan enum
 * value MEANS — seat range, billable-ness, feature highlights, default
 * trial duration.
 *
 * The Prisma enum is `demo | trial | starter_ir | smb | enterprise`. Keep
 * this catalog aligned with the enum.
 */

export type PlanId = "demo" | "trial" | "starter_ir" | "smb" | "enterprise";

export interface PlanTier {
  id: PlanId;
  name: string;
  tagline: string;
  /** Seat range as [min, max]. `max = null` means unlimited. */
  seatRange: [number, number | null];
  /** Default seatLimit value applied when picking this plan; null = unlimited. */
  defaultSeatLimit: number | null;
  /** Indicative monthly price per seat (USD). Used to populate sample quotes — not used for billing yet. */
  pricePerSeatMonthly: number | null;
  /** Whether the plan is offered in commercial pipelines (filters select inputs). */
  isBillable: boolean;
  /** Number of days a trial lasts when this plan is selected (set on trialEndsAt). */
  trialDurationDays: number | null;
  /** Highlight bullets shown in the wizard tier cards. */
  features: string[];
  /** UI accent (HEX or design-token name). */
  color: string;
}

export const PLAN_TIERS: PlanTier[] = [
  {
    id: "demo",
    name: "Demo",
    tagline: "Isolated, seeded sandbox for prospect walk-throughs",
    seatRange: [1, 5],
    defaultSeatLimit: 5,
    pricePerSeatMonthly: null,
    isBillable: false,
    trialDurationDays: 14,
    features: [
      "Full feature set, isolated per prospect",
      "Pre-populated demo data (incidents, assessments, playbooks)",
      "Reset / wipe in one click",
      "Auto-expires after 14 days",
    ],
    color: "#F97316",
  },
  {
    id: "trial",
    name: "Trial",
    tagline: "14-day evaluation against real-world data",
    seatRange: [1, 10],
    defaultSeatLimit: 10,
    pricePerSeatMonthly: null,
    isBillable: false,
    trialDurationDays: 14,
    features: [
      "Full feature parity with paid tiers",
      "10 seats included",
      "Threat-intel + assessment + playbooks",
      "Converts to chosen paid tier on close",
    ],
    color: "#06B6D4",
  },
  {
    id: "starter_ir",
    name: "Starter IR",
    tagline: "Core incident-response stack for small teams",
    seatRange: [1, 50],
    defaultSeatLimit: 50,
    pricePerSeatMonthly: 14,
    isBillable: true,
    trialDurationDays: null,
    features: [
      "Up to 50 seats",
      "Incident Commander · Tickets · Tasks · Playbooks",
      "Forensic Evidence Vault",
      "Stakeholder + IR vendor directory",
      "Tabletop walk-throughs",
      "Email support (next business day)",
    ],
    color: "#0EA5E9",
  },
  {
    id: "smb",
    name: "SMB",
    tagline: "Full platform for growing security programs",
    seatRange: [50, 500],
    defaultSeatLimit: 500,
    pricePerSeatMonthly: 24,
    isBillable: true,
    trialDurationDays: null,
    features: [
      "Up to 500 seats",
      "Everything in Starter IR",
      "NIST CSF 2.0 assessment + Resilience Hitlist",
      "Versioned policy library with audit-grade export",
      "Threat-intel auto-refresh + industry feeds",
      "Workforce policy acknowledgments",
      "Quarterly check-in with Dark Rock vCISO",
    ],
    color: "#00B4A6",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Unlimited seats, priority support, BAA-ready",
    seatRange: [500, null],
    defaultSeatLimit: null,
    pricePerSeatMonthly: 39,
    isBillable: true,
    trialDurationDays: null,
    features: [
      "Unlimited seats",
      "Everything in SMB",
      "Multi-tenant + tenant-segregation guarantees",
      "Custom playbooks + custom policy templates",
      "Single sign-on (SAML / SCIM)",
      "Signed BAA available (HIPAA-covered entities)",
      "Named CSM + 24×7 incident assistance retainer",
      "Tabletop exercises facilitated by Dark Rock IR",
    ],
    color: "#8B5CF6",
  },
];

export function getPlan(id: PlanId): PlanTier {
  return PLAN_TIERS.find((p) => p.id === id) ?? PLAN_TIERS[1]; // trial fallback
}

/**
 * Recommend a plan tier for an expected headcount. Used by the wizard to
 * pre-select the right card when the admin enters expected seats.
 */
export function recommendPlanForSeats(expectedSeats: number): PlanId {
  if (expectedSeats <= 0) return "trial";
  if (expectedSeats <= 50) return "starter_ir";
  if (expectedSeats <= 500) return "smb";
  return "enterprise";
}

/**
 * Check whether a given seat count fits inside the plan's range.
 * Returns null when the plan accommodates the count; otherwise an explanation.
 */
export function seatFitError(planId: PlanId, seatCount: number): string | null {
  const tier = getPlan(planId);
  const [min, max] = tier.seatRange;
  if (seatCount < min) return `${tier.name} starts at ${min} seat${min === 1 ? "" : "s"}.`;
  if (max !== null && seatCount > max) {
    return `${tier.name} tops out at ${max} seats. Upgrade to ${recommendPlanForSeats(seatCount) === "smb" ? "SMB" : "Enterprise"}.`;
  }
  return null;
}

export function formatSeatRange(planId: PlanId): string {
  const [min, max] = getPlan(planId).seatRange;
  if (max === null) return `${min}+ seats`;
  return `${min}–${max} seats`;
}

export function formatPrice(planId: PlanId): string {
  const tier = getPlan(planId);
  if (!tier.pricePerSeatMonthly) return "Included";
  return `$${tier.pricePerSeatMonthly}/seat / mo`;
}

export const BILLABLE_PLANS: PlanTier[] = PLAN_TIERS.filter((p) => p.isBillable);
export const ALL_PLAN_IDS: PlanId[] = PLAN_TIERS.map((p) => p.id);
