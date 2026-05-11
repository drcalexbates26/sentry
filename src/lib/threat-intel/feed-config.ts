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
  // Government / authoritative
  { name: "CISA Advisories", url: "https://www.cisa.gov/cybersecurity-advisories/all.xml", type: "rss", category: "global" },
  { name: "US-CERT Activity", url: "https://www.cisa.gov/uscert/ncas/current-activity.xml", type: "rss", category: "global" },
  { name: "MS-ISAC Advisories", url: "https://www.cisecurity.org/feed/advisories", type: "rss", category: "global" },
  // News / research
  { name: "Bleeping Computer", url: "https://www.bleepingcomputer.com/feed/", type: "rss", category: "global" },
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews", type: "rss", category: "global" },
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", type: "rss", category: "global" },
  { name: "Dark Reading", url: "https://www.darkreading.com/rss.xml", type: "rss", category: "global" },
  { name: "SC Media", url: "https://www.scmagazine.com/feed", type: "rss", category: "global" },
  { name: "SANS ISC", url: "https://isc.sans.edu/rssfeed.xml", type: "rss", category: "global" },
  { name: "The Record", url: "https://therecord.media/feed/", type: "rss", category: "global" },
  // Vendor threat-intel research blogs
  { name: "Microsoft MSRC", url: "https://msrc.microsoft.com/blog/feed", type: "rss", category: "global" },
  { name: "Cisco Talos", url: "https://blog.talosintelligence.com/feeds/posts/default", type: "rss", category: "global" },
  { name: "Mandiant Threat Intel", url: "https://www.mandiant.com/resources/blog/rss.xml", type: "rss", category: "global" },
  { name: "Unit 42 (Palo Alto)", url: "https://unit42.paloaltonetworks.com/feed/", type: "rss", category: "global" },
  // Exploit / vuln databases
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
    { name: "HHS 405(d)", url: "https://405d.hhs.gov/feed/", type: "rss", category: "industry", industryTag: "Healthcare" },
    { name: "Health-ISAC", url: "https://health-isac.org", type: "rss", category: "industry", industryTag: "Healthcare", requiresMembership: true, membershipOrg: "Health-ISAC", membershipUrl: "https://health-isac.org/membership/" },
  ],
  "Financial Services": [
    { name: "ABA Banking Journal Cybersecurity", url: "https://bankingjournal.aba.com/category/technology/cybersecurity/feed/", type: "rss", category: "industry", industryTag: "Financial Services" },
    { name: "FS-ISAC", url: "https://www.fsisac.com", type: "rss", category: "industry", industryTag: "Financial Services", requiresMembership: true, membershipOrg: "FS-ISAC", membershipUrl: "https://www.fsisac.com/membership" },
  ],
  "Manufacturing": [
    { name: "CISA ICS Advisories", url: "https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml", type: "rss", category: "industry", industryTag: "Manufacturing" },
    { name: "Dragos Industrial Cybersecurity", url: "https://www.dragos.com/blog/feed/", type: "rss", category: "industry", industryTag: "Manufacturing" },
  ],
  "Federal / Government": [
    { name: "FedScoop Security", url: "https://fedscoop.com/topic/cybersecurity/feed/", type: "rss", category: "industry", industryTag: "Federal / Government" },
    { name: "Nextgov Cybersecurity", url: "https://www.nextgov.com/rss/cybersecurity/", type: "rss", category: "industry", industryTag: "Federal / Government" },
  ],
  "Technology": [
    { name: "GitHub Security Lab", url: "https://github.blog/category/security/feed/", type: "rss", category: "industry", industryTag: "Technology" },
  ],
  "Energy": [
    { name: "CISA ICS Advisories", url: "https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml", type: "rss", category: "industry", industryTag: "Energy" },
    { name: "Dragos Industrial Cybersecurity", url: "https://www.dragos.com/blog/feed/", type: "rss", category: "industry", industryTag: "Energy" },
  ],
  "Education": [
    { name: "Inside Higher Ed Tech", url: "https://www.insidehighered.com/rss/topic/technology", type: "rss", category: "industry", industryTag: "Education" },
    { name: "REN-ISAC", url: "https://www.ren-isac.net", type: "rss", category: "industry", industryTag: "Education", requiresMembership: true, membershipOrg: "REN-ISAC", membershipUrl: "https://www.ren-isac.net/membership/" },
  ],
  "Defense / DIB": [
    { name: "Breaking Defense Cyber", url: "https://breakingdefense.com/full-rss-feed/", type: "rss", category: "industry", industryTag: "Defense / DIB" },
  ],
  "Retail": [
    { name: "RH-ISAC Resources", url: "https://rhisac.org/feed/", type: "rss", category: "industry", industryTag: "Retail" },
  ],
  "Legal Services": [
    { name: "Law.com Cybersecurity", url: "https://www.law.com/feed/?industry=cybersecurity", type: "rss", category: "industry", industryTag: "Legal Services" },
  ],
};

export function getIndustryFeeds(industry: string): FeedSource[] {
  return INDUSTRY_FEEDS[industry] || [];
}
