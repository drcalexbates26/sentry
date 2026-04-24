export type ThreatSeverity = "Critical" | "High" | "Medium" | "Low" | "Informational";

export interface ThreatIntelItem {
  id: string;
  feedSource: string;
  feedCategory: "global" | "industry";
  industryTag?: string;

  title: string;
  description: string;
  link: string;
  publishedAt: string;

  cveId?: string;
  cvssScore?: number;
  cvssVector?: string;
  cweId?: string;
  affectedVendors: string[];
  affectedProducts: string[];

  severityRank: ThreatSeverity;
  impactScore: number;
  likelihoodScore: number;
  riskScore: number;
  isZeroDay: boolean;
  isActivelyExploited: boolean;

  tags: string[];
  mitreAttackIds: string[];
  recommendations?: string;
  executiveSummary?: string;
}

export interface RawFeedItem {
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  feedSource: string;
  feedCategory: "global" | "industry";
  industryTag?: string;
  cveId?: string;
  cvssScore?: number;
  cvssVector?: string;
  cweId?: string;
  affectedVendors?: string[];
  affectedProducts?: string[];
}
