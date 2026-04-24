import type { NotificationTier, SLAStatus, GroupClock } from "@/types/notification";
import type { StakeholderData, StakeholderPerson } from "@/types/stakeholder";

export interface CadenceConfig {
  hours: number | null;
  label: string;
  tier: NotificationTier;
}

export const CADENCE_THRESHOLDS: Record<string, CadenceConfig> = {
  incidentCommander:      { hours: 2, label: "Every 2 hours", tier: 1 },
  securityEngineers:      { hours: 2, label: "Every 2 hours", tier: 1 },
  ciso:                   { hours: 4, label: "Every 4 hours", tier: 2 },
  riskContact:            { hours: 4, label: "Every 4 hours", tier: 2 },
  privacyContact:         { hours: 4, label: "Every 4 hours", tier: 2 },
  executivePOC:           { hours: 8, label: "Every 8 hours", tier: 3 },
  cyberInsuranceInternal: { hours: 8, label: "Every 8 hours", tier: 3 },
  cyberInsuranceExternal: { hours: 12, label: "Every 12 hours", tier: 3 },
  legalContact:           { hours: 8, label: "Every 8 hours", tier: 4 },
  externalLegal:          { hours: null, label: "On significant change", tier: 4 },
  forensicsContact:       { hours: null, label: "On significant change", tier: 4 },
  hrContacts:             { hours: null, label: "On significant change", tier: 4 },
  prContact:              { hours: null, label: "On significant change", tier: 4 },
  lawEnforcement:         { hours: null, label: "On significant change", tier: 4 },
};

export const GROUP_LABELS: Record<string, string> = {
  incidentCommander: "Incident Commander",
  securityEngineers: "Security Engineering",
  ciso: "CISO",
  riskContact: "Risk Management",
  privacyContact: "Privacy Officer / DPO",
  executivePOC: "Executive Leadership",
  cyberInsuranceInternal: "Cyber Insurance (Internal)",
  cyberInsuranceExternal: "Cyber Insurance (External)",
  legalContact: "Legal Counsel",
  externalLegal: "External Legal",
  forensicsContact: "Forensics / Dark Rock",
  hrContacts: "Human Resources",
  prContact: "PR / Communications",
  lawEnforcement: "Law Enforcement",
};

export function computeSLAStatus(
  lastNotifiedAt: string | null,
  cadenceHours: number | null,
  incidentStartTime: string,
): { status: SLAStatus; elapsedMs: number; percentElapsed: number } {
  if (cadenceHours === null) {
    return { status: "standing_by", elapsedMs: 0, percentElapsed: 0 };
  }

  const now = Date.now();
  const refTime = lastNotifiedAt ? new Date(lastNotifiedAt).getTime() : new Date(incidentStartTime).getTime();
  const elapsedMs = now - refTime;
  const thresholdMs = cadenceHours * 3600000;
  const percentElapsed = Math.min((elapsedMs / thresholdMs) * 100, 150);

  let status: SLAStatus = "on_track";
  if (percentElapsed >= 100) status = "overdue";
  else if (percentElapsed >= 75) status = "due_soon";

  return { status, elapsedMs, percentElapsed };
}

export function buildGroupClocks(
  stakeholders: StakeholderData,
  lastNotifications: Record<string, { at: string; by: string; version: number }>,
  incidentStartTime: string,
): GroupClock[] {
  return Object.entries(CADENCE_THRESHOLDS).map(([groupKey, config]) => {
    const contacts = (stakeholders[groupKey] as StakeholderPerson[] | undefined) || [];
    const last = lastNotifications[groupKey];
    const { status, elapsedMs, percentElapsed } = computeSLAStatus(last?.at || null, config.hours, incidentStartTime);

    return {
      groupKey,
      groupLabel: GROUP_LABELS[groupKey] || groupKey,
      tier: config.tier,
      lastNotifiedAt: last?.at || null,
      lastNotifiedBy: last?.by || null,
      version: last?.version || 0,
      nextDueAt: last?.at && config.hours
        ? new Date(new Date(last.at).getTime() + config.hours * 3600000).toISOString()
        : null,
      cadenceHours: config.hours,
      cadenceLabel: config.label,
      status,
      elapsedMs,
      percentElapsed,
      contactCount: contacts.length,
    };
  });
}
