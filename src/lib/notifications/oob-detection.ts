import type { Incident } from "@/types/incident";

export interface OOBCondition {
  detected: boolean;
  reasons: string[];
}

export function detectOOBCondition(incident: Incident): OOBCondition {
  const reasons: string[] = [];
  const text = [
    incident.title,
    ...incident.iocs,
    ...incident.findings.map((f) => f.text),
  ].join(" ").toLowerCase();

  if (/business.email.compromise|bec/.test(text)) reasons.push("Business Email Compromise indicators detected");
  if (/oauth.token|token.compromise/.test(text)) reasons.push("OAuth token compromise indicators detected");
  if (/email.compromise|mail.flow|exchange/.test(text)) reasons.push("Email infrastructure compromise indicators detected");
  if (/identity.compromise|entra.id|azure.ad|mfa.bypass/.test(text)) reasons.push("Identity provider compromise indicators detected");
  if (/token.theft|session.hijack/.test(text)) reasons.push("Session/token theft indicators detected");
  if (/m365|microsoft.365|office.365/.test(text)) reasons.push("Microsoft 365 compromise indicators detected");

  return { detected: reasons.length > 0, reasons };
}

export function formatOOBMessage(body: string, maxLength: number = 500): string {
  // Reformat for short channels (SMS, Signal)
  const lines = body.split("\n").filter((l) => l.trim());
  let short = "";
  for (const line of lines) {
    if (short.length + line.length > maxLength) break;
    short += line.trim() + "\n";
  }
  return short + "\n[Full details available in Sentry]";
}
