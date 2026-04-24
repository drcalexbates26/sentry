import type { ThreatIntelItem } from "@/types/threat-intel";

export function generateExecutiveSummary(item: ThreatIntelItem): string {
  const cvss = item.cvssScore ? `CVSS ${item.cvssScore}` : "Unscored";

  let summary = `THREAT ASSESSMENT: ${item.title}\n${"━".repeat(60)}\n\n`;
  summary += `Classification: ${item.severityRank} | Risk Score: ${item.riskScore}/100 | ${cvss}\n`;
  summary += `Source: ${item.feedSource} | Published: ${item.publishedAt}\n\n`;

  if (item.isZeroDay) {
    summary += `⚠️ ZERO-DAY VULNERABILITY — No vendor patch is currently available. Implement compensating controls immediately.\n\n`;
  }
  if (item.isActivelyExploited) {
    summary += `🔴 ACTIVELY EXPLOITED — This vulnerability is confirmed to be exploited in the wild. Prioritize patching above all other remediation activities.\n\n`;
  }

  summary += `OVERVIEW\n${"─".repeat(40)}\n${item.description}\n\n`;

  if (item.affectedVendors.length > 0) {
    summary += `AFFECTED VENDORS & PRODUCTS\n${"─".repeat(40)}\n`;
    summary += item.affectedVendors.map((v) => `  • ${v}`).join("\n") + "\n";
    if (item.affectedProducts.length > 0) {
      summary += item.affectedProducts.map((p) => `  • ${p}`).join("\n") + "\n";
    }
    summary += "\n";
  }

  summary += `IMPACT ASSESSMENT\n${"─".repeat(40)}\n`;
  summary += `  Impact:     ${item.impactScore}/10 — `;
  summary += item.impactScore >= 8 ? "Critical business impact expected.\n" :
    item.impactScore >= 5 ? "Moderate business impact possible.\n" :
    "Limited business impact anticipated.\n";
  summary += `  Likelihood: ${item.likelihoodScore}/10 — `;
  summary += item.likelihoodScore >= 8 ? "Active exploitation confirmed or imminent.\n" :
    item.likelihoodScore >= 5 ? "Exploitation likely within days to weeks.\n" :
    "Exploitation possible but not yet observed.\n";
  summary += `  Risk Score: ${item.riskScore}/100\n\n`;

  if (item.cveId) {
    summary += `TECHNICAL DETAILS\n${"─".repeat(40)}\n`;
    summary += `  CVE ID:        ${item.cveId}\n`;
    if (item.cvssScore) summary += `  CVSS Score:    ${item.cvssScore}\n`;
    if (item.cvssVector) summary += `  CVSS Vector:   ${item.cvssVector}\n`;
    if (item.cweId) summary += `  CWE:           ${item.cweId}\n`;
    summary += "\n";
  }

  if (item.mitreAttackIds.length > 0) {
    summary += `MITRE ATT&CK\n${"─".repeat(40)}\n`;
    summary += item.mitreAttackIds.map((id) => `  • ${id}`).join("\n") + "\n\n";
  }

  summary += `RECOMMENDED ACTIONS\n${"─".repeat(40)}\n`;
  if (item.riskScore >= 50) {
    summary += `  1. [IMMEDIATE] Apply vendor patches or implement vendor-recommended mitigations within 24 hours\n`;
    summary += `  2. [IMMEDIATE] Scan environment for indicators of compromise related to this vulnerability\n`;
    summary += `  3. [SHORT-TERM] Review and validate compensating controls if patching requires a maintenance window\n`;
    summary += `  4. [ONGOING] Monitor threat intelligence feeds for exploitation activity targeting your industry\n`;
  } else {
    summary += `  1. Review vendor advisory and assess applicability to your environment\n`;
    summary += `  2. Schedule patching within standard maintenance windows per patch management policy\n`;
    summary += `  3. Monitor for escalation in exploitation activity\n`;
  }

  summary += `\n${"━".repeat(60)}\nDark Rock Labs Sentry — Threat Intelligence\n`;
  return summary;
}

export function generateRecommendations(item: ThreatIntelItem): string[] {
  const recs: string[] = [];
  if (item.riskScore >= 50) {
    recs.push("Apply vendor patches or implement mitigations within 24 hours");
    recs.push("Scan environment for indicators of compromise");
    recs.push("Review compensating controls if patching requires maintenance window");
    if (item.isZeroDay) recs.push("Implement virtual patching via WAF/IPS rules");
    if (item.isActivelyExploited) recs.push("Verify no exploitation has occurred in your environment");
  }
  recs.push("Monitor threat intelligence feeds for escalation");
  if (item.tags.includes("ransomware")) recs.push("Validate backup integrity and test restoration procedures");
  if (item.tags.includes("phishing")) recs.push("Alert staff via security awareness communication");
  if (item.tags.includes("identity")) recs.push("Review authentication logs for anomalous activity");
  return recs;
}
