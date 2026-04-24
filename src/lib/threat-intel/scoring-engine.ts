import type { RawFeedItem, ThreatIntelItem, ThreatSeverity } from "@/types/threat-intel";

export function scoreThreat(item: RawFeedItem): ThreatIntelItem {
  let impact = 1;
  let likelihood = 1;

  if (item.cvssScore) {
    if (item.cvssScore >= 9.0) impact = 10;
    else if (item.cvssScore >= 7.0) impact = 8;
    else if (item.cvssScore >= 4.0) impact = 5;
    else impact = 3;
  }

  const text = (item.title + " " + item.description).toLowerCase();

  const isZeroDay = /zero.?day|0.?day|actively.?exploit|in.the.wild/.test(text);
  if (isZeroDay) { impact = Math.max(impact, 9); likelihood = Math.max(likelihood, 8); }

  const isExploited = /exploit|proof.of.concept|poc|weaponized|in.the.wild|kev/.test(text);
  if (isExploited) likelihood = Math.max(likelihood, 7);

  if (/ransomware|encrypt|ransom|lockbit|blackcat|cl0p|play|akira/.test(text)) {
    impact = Math.max(impact, 8); likelihood = Math.max(likelihood, 6);
  }
  if (/apt|nation.state|state.sponsored|lazarus|cozy.bear|fancy.bear|volt.typhoon|salt.typhoon/.test(text)) {
    impact = Math.max(impact, 9); likelihood = Math.max(likelihood, 5);
  }
  if (/critical.infrastructure|ics|scada|plc|ot.security|industrial.control/.test(text)) {
    impact = Math.max(impact, 8);
  }
  if (/data.breach|data.leak|pii|phi|ssn|credentials.exposed|million.records/.test(text)) {
    impact = Math.max(impact, 7);
  }
  if (/supply.chain|dependency|npm|pypi|package.manager|solarwinds|codecov/.test(text)) {
    impact = Math.max(impact, 8); likelihood = Math.max(likelihood, 5);
  }
  if (/widespread|mass.exploit|millions|critical.patch|emergency.patch/.test(text)) {
    likelihood = Math.max(likelihood, 8);
  }

  if (impact === 1 && likelihood === 1) { impact = 3; likelihood = 2; }

  const riskScore = impact * likelihood;
  const severityRank: ThreatSeverity =
    riskScore >= 80 ? "Critical" :
    riskScore >= 50 ? "High" :
    riskScore >= 25 ? "Medium" :
    riskScore >= 10 ? "Low" : "Informational";

  return {
    id: item.cveId || `ti_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    feedSource: item.feedSource,
    feedCategory: item.feedCategory,
    industryTag: item.industryTag,
    title: item.title,
    description: item.description,
    link: item.link,
    publishedAt: item.publishedAt,
    cveId: item.cveId,
    cvssScore: item.cvssScore,
    cvssVector: item.cvssVector,
    cweId: item.cweId,
    affectedVendors: item.affectedVendors || [],
    affectedProducts: item.affectedProducts || [],
    severityRank,
    impactScore: impact,
    likelihoodScore: likelihood,
    riskScore,
    isZeroDay,
    isActivelyExploited: isExploited,
    tags: extractTags(text),
    mitreAttackIds: extractMitre(text),
  };
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const patterns: [RegExp, string][] = [
    [/ransomware/, "ransomware"], [/zero.?day|0.?day/, "zero-day"],
    [/phishing/, "phishing"], [/apt|nation.state/, "APT"],
    [/supply.chain/, "supply-chain"], [/data.breach/, "data-breach"],
    [/ics|scada|ot/, "ICS/OT"], [/cloud/, "cloud"],
    [/identity|authentication|oauth/, "identity"], [/malware/, "malware"],
    [/ddos|denial.of.service/, "DDoS"], [/insider/, "insider-threat"],
    [/ai|llm|machine.learning/, "AI/ML"], [/critical.patch|emergency.update/, "patch-urgent"],
  ];
  for (const [re, tag] of patterns) if (re.test(text)) tags.push(tag);
  return tags;
}

function extractMitre(text: string): string[] {
  const ids: string[] = [];
  const match = text.match(/t1\d{3,4}(\.\d{3})?/gi);
  if (match) ids.push(...match.map((m) => m.toUpperCase()));
  if (/phishing/.test(text)) ids.push("T1566");
  if (/exploit.*public/.test(text)) ids.push("T1190");
  if (/ransomware|encrypt/.test(text)) ids.push("T1486");
  if (/supply.chain/.test(text)) ids.push("T1195");
  return [...new Set(ids)];
}
