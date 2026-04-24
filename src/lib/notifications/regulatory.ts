import type { RegulatoryFiling } from "@/types/notification";

export interface RegulatoryTemplate {
  id: string;
  regulation: string;
  deadlineHours: number | null;
  deadlineDays: number | null;
  defaultApplicable: boolean;
  condition?: string;
  filingMethod: string;
  filingUrl?: string;
}

export const REGULATORY_TEMPLATES: RegulatoryTemplate[] = [
  {
    id: "dfars",
    regulation: "DFARS 252.204-7012 (DIBNet)",
    deadlineHours: 72,
    deadlineDays: null,
    defaultApplicable: false,
    condition: "CUI/CDI potentially affected",
    filingMethod: "DIBNet Portal",
    filingUrl: "https://dibnet.dod.mil",
  },
  {
    id: "hipaa_individual",
    regulation: "HIPAA Individual Notification",
    deadlineHours: null,
    deadlineDays: 60,
    defaultApplicable: false,
    condition: "PHI confirmed compromised",
    filingMethod: "Direct notification to affected individuals",
  },
  {
    id: "hipaa_hhs",
    regulation: "HIPAA HHS Breach Report",
    deadlineHours: null,
    deadlineDays: 60,
    defaultApplicable: false,
    condition: "PHI breach affecting 500+ individuals",
    filingMethod: "HHS Breach Portal",
    filingUrl: "https://ocrportal.hhs.gov/ocr/breach/wizard_breach.jsf",
  },
  {
    id: "state_ca",
    regulation: "California (CA Civil Code 1798.82)",
    deadlineHours: null,
    deadlineDays: 45,
    defaultApplicable: false,
    condition: "CA residents' PII compromised",
    filingMethod: "CA Attorney General notification",
  },
  {
    id: "state_ny",
    regulation: "New York (SHIELD Act)",
    deadlineHours: null,
    deadlineDays: 30,
    defaultApplicable: false,
    condition: "NY residents' private information compromised",
    filingMethod: "NY AG, DFS, and Division of State Police",
  },
];

export function initializeFilings(incidentStartTime: string): RegulatoryFiling[] {
  return REGULATORY_TEMPLATES.map((t) => {
    const start = new Date(incidentStartTime);
    let deadline: string;
    if (t.deadlineHours) {
      deadline = new Date(start.getTime() + t.deadlineHours * 3600000).toISOString();
    } else if (t.deadlineDays) {
      deadline = new Date(start.getTime() + t.deadlineDays * 86400000).toISOString();
    } else {
      deadline = new Date(start.getTime() + 90 * 86400000).toISOString();
    }

    return {
      id: t.id,
      regulation: t.regulation,
      deadline,
      status: "Not Applicable" as const,
      statusHistory: [{ status: "Not Applicable", changedBy: "System", changedAt: new Date().toISOString() }],
    };
  });
}

export function getFilingTimeRemaining(deadline: string): { text: string; overdue: boolean; percentElapsed: number } {
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const remaining = dl - now;

  if (remaining <= 0) {
    return { text: "OVERDUE", overdue: true, percentElapsed: 100 };
  }

  const hours = Math.floor(remaining / 3600000);
  if (hours < 24) {
    return { text: `${hours}hr remaining`, overdue: false, percentElapsed: 100 - (remaining / (72 * 3600000)) * 100 };
  }
  const days = Math.floor(hours / 24);
  return { text: `${days} day${days !== 1 ? "s" : ""} remaining`, overdue: false, percentElapsed: Math.min(90, 100 - (days / 60) * 100) };
}
