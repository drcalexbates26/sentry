export interface FeedSource {
  name: string;
  url: string;
  type: "rss" | "json" | "nvd";
  category: "global" | "industry";
  industryTag?: string;
  requiresMembership?: boolean;
  membershipUrl?: string;
  membershipOrg?: string;
}

export const GLOBAL_FEEDS: FeedSource[] = [
  { name: "CISA Advisories", url: "https://www.cisa.gov/cybersecurity-advisories/all.xml", type: "rss", category: "global" },
  { name: "US-CERT Activity", url: "https://www.cisa.gov/uscert/ncas/current-activity.xml", type: "rss", category: "global" },
  { name: "Bleeping Computer", url: "https://www.bleepingcomputer.com/feed/", type: "rss", category: "global" },
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews", type: "rss", category: "global" },
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", type: "rss", category: "global" },
  { name: "Dark Reading", url: "https://www.darkreading.com/rss.xml", type: "rss", category: "global" },
  { name: "SC Media", url: "https://www.scmagazine.com/feed", type: "rss", category: "global" },
  { name: "SANS ISC", url: "https://isc.sans.edu/rssfeed.xml", type: "rss", category: "global" },
  { name: "Packet Storm", url: "https://packetstormsecurity.com/feeds/", type: "rss", category: "global" },
  { name: "Exploit-DB", url: "https://www.exploit-db.com/rss.xml", type: "rss", category: "global" },
];

export const NVD_CONFIG = {
  baseUrl: "https://services.nvd.nist.gov/rest/json/cves/2.0",
  resultsPerPage: 2000,
};

export const CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

export const INDUSTRY_FEEDS: Record<string, FeedSource[]> = {
  "Healthcare": [
    { name: "HHS Cybersecurity", url: "https://www.hhs.gov/cybersecurity", type: "rss", category: "industry", industryTag: "Healthcare" },
    { name: "Health-ISAC", url: "https://health-isac.org", type: "rss", category: "industry", industryTag: "Healthcare", requiresMembership: true, membershipOrg: "Health-ISAC", membershipUrl: "https://health-isac.org/membership/" },
  ],
  "Financial Services": [
    { name: "FS-ISAC", url: "https://www.fsisac.com", type: "rss", category: "industry", industryTag: "Financial Services", requiresMembership: true, membershipOrg: "FS-ISAC", membershipUrl: "https://www.fsisac.com/membership" },
  ],
  "Manufacturing": [
    { name: "CISA ICS Advisories", url: "https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml", type: "rss", category: "industry", industryTag: "Manufacturing" },
  ],
  "Federal / Government": [
    { name: "FedScoop Security", url: "https://fedscoop.com/topic/cybersecurity/feed/", type: "rss", category: "industry", industryTag: "Federal / Government" },
  ],
  "Technology": [
    { name: "GitHub Security Advisories", url: "https://github.com/advisories", type: "rss", category: "industry", industryTag: "Technology" },
  ],
  "Energy": [
    { name: "CISA Energy Sector", url: "https://www.cisa.gov/topics/critical-infrastructure-security-and-resilience/critical-infrastructure-sectors/energy-sector", type: "rss", category: "industry", industryTag: "Energy" },
  ],
  "Education": [
    { name: "REN-ISAC", url: "https://www.ren-isac.net", type: "rss", category: "industry", industryTag: "Education", requiresMembership: true, membershipOrg: "REN-ISAC", membershipUrl: "https://www.ren-isac.net/membership/" },
  ],
  "Defense / DIB": [
    { name: "Defense.gov Cyber", url: "https://www.defense.gov/", type: "rss", category: "industry", industryTag: "Defense / DIB" },
  ],
};

export function getIndustryFeeds(industry: string): FeedSource[] {
  return INDUSTRY_FEEDS[industry] || [];
}
