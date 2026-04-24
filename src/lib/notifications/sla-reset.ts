// SLA clock reset logic

export interface GroupClockState {
  at: string;
  by: string;
  version: number;
}

export function resetGroupClock(
  groupKey: string,
  senderName: string,
  previousVersion: number,
): GroupClockState {
  return {
    at: new Date().toISOString(),
    by: senderName,
    version: previousVersion + 1,
  };
}

/**
 * Maps reporting deadlines to the group that resets them when notified.
 * DFARS and HIPAA are filing deadlines and NEVER reset.
 */
export const DEADLINE_RESET_MAP: Record<string, string | null> = {
  "Internal Management": "incidentCommander",
  "Legal Counsel": "legalContact",
  "Executive Leadership": "executivePOC",
  "Cyber Insurance Carrier": "cyberInsuranceInternal",
  "Board / Audit Committee": "executivePOC",
  "DFARS DIBNet Report": null,
  "HIPAA Notification": null,
};

export function shouldResetDeadline(deadlineLabel: string, notifiedGroupKey: string): boolean {
  const mappedGroup = DEADLINE_RESET_MAP[deadlineLabel];
  if (mappedGroup === null) return false;
  return mappedGroup === notifiedGroupKey;
}
