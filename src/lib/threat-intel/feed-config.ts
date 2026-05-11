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

// Industry-feed configuration.
//
// IMPORTANT: keys here MUST match the Onboarding INDUSTRIES list exactly
// (src/data/tech-options.ts). A mismatch like "Legal" vs "Legal Services"
// produces silent zero-result tabs.
//
// We deliberately fall back to known-stable CISA / vendor blog feeds where
// sector-specific RSS endpoints don't exist or routinely 404 — better to
// show useful adjacent content than an empty pane. Membership-only feeds
// (Health-ISAC, FS-ISAC, REN-ISAC) are surfaced in the UI as "join to enable"
// but excluded from fetch attempts in feed-service.
export const INDUSTRY_FEEDS: Record<string, FeedSource[]> = {
  "Federal / Government": [
    { name: "CISA Advisories",          url: "https://www.cisa.gov/cybersecurity-advisories/all.xml",          type: "rss", category: "industry", industryTag: "Federal / Government" },
    { name: "FedScoop Security",        url: "https://fedscoop.com/topic/cybersecurity/feed/",                 type: "rss", category: "industry", industryTag: "Federal / Government" },
    { name: "Nextgov Cybersecurity",    url: "https://www.nextgov.com/rss/cybersecurity/",                     type: "rss", category: "industry", industryTag: "Federal / Government" },
  ],
  "Defense / DIB": [
    { name: "CISA Advisories",          url: "https://www.cisa.gov/cybersecurity-advisories/all.xml",          type: "rss", category: "industry", industryTag: "Defense / DIB" },
    { name: "Breaking Defense Cyber",   url: "https://breakingdefense.com/full-rss-feed/",                     type: "rss", category: "industry", industryTag: "Defense / DIB" },
    { name: "DefenseScoop",             url: "https://defensescoop.com/feed/",                                 type: "rss", category: "industry", industryTag: "Defense / DIB" },
  ],
  "Healthcare": [
    { name: "HIPAA Journal",            url: "https://www.hipaajournal.com/feed/",                             type: "rss", category: "industry", industryTag: "Healthcare" },
    { name: "Healthcare IT News Security", url: "https://www.healthcareitnews.com/taxonomy/term/4341/feed",    type: "rss", category: "industry", industryTag: "Healthcare" },
    { name: "Health-ISAC",              url: "https://health-isac.org",                                        type: "rss", category: "industry", industryTag: "Healthcare", requiresMembership: true, membershipOrg: "Health-ISAC", membershipUrl: "https://health-isac.org/membership/" },
  ],
  "Financial Services": [
    { name: "American Banker Cybersecurity", url: "https://www.americanbanker.com/feed?rss=/tag/cybersecurity", type: "rss", category: "industry", industryTag: "Financial Services" },
    { name: "Bank Info Security",       url: "https://www.bankinfosecurity.com/rss-feeds",                     type: "rss", category: "industry", industryTag: "Financial Services" },
    { name: "FS-ISAC",                  url: "https://www.fsisac.com",                                         type: "rss", category: "industry", industryTag: "Financial Services", requiresMembership: true, membershipOrg: "FS-ISAC", membershipUrl: "https://www.fsisac.com/membership" },
  ],
  "Technology": [
    { name: "GitHub Security Blog",     url: "https://github.blog/category/security/feed/",                    type: "rss", category: "industry", industryTag: "Technology" },
    { name: "Dark Reading App Sec",     url: "https://www.darkreading.com/rss.xml",                            type: "rss", category: "industry", industryTag: "Technology" },
  ],
  "Manufacturing": [
    { name: "CISA ICS Advisories",      url: "https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml", type: "rss", category: "industry", industryTag: "Manufacturing" },
    { name: "Dragos Industrial Cyber",  url: "https://www.dragos.com/blog/feed/",                              type: "rss", category: "industry", industryTag: "Manufacturing" },
    { name: "Industrial Cyber",         url: "https://industrialcyber.co/feed/",                               type: "rss", category: "industry", industryTag: "Manufacturing" },
  ],
  "Legal": [
    { name: "Bloomberg Law Privacy",    url: "https://news.bloomberglaw.com/privacy-and-data-security/rss",    type: "rss", category: "industry", industryTag: "Legal" },
    { name: "JD Supra Cybersecurity",   url: "https://www.jdsupra.com/feed/?topic=cybersecurity",              type: "rss", category: "industry", industryTag: "Legal" },
  ],
  "Education": [
    { name: "EdScoop Cybersecurity",    url: "https://edscoop.com/feed/",                                      type: "rss", category: "industry", industryTag: "Education" },
    { name: "Inside Higher Ed Tech",    url: "https://www.insidehighered.com/news/topic/technology/feed",      type: "rss", category: "industry", industryTag: "Education" },
    { name: "REN-ISAC",                 url: "https://www.ren-isac.net",                                       type: "rss", category: "industry", industryTag: "Education", requiresMembership: true, membershipOrg: "REN-ISAC", membershipUrl: "https://www.ren-isac.net/membership/" },
  ],
  "Energy": [
    { name: "CISA ICS Advisories",      url: "https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml", type: "rss", category: "industry", industryTag: "Energy" },
    { name: "Dragos Industrial Cyber",  url: "https://www.dragos.com/blog/feed/",                              type: "rss", category: "industry", industryTag: "Energy" },
    { name: "Industrial Cyber",         url: "https://industrialcyber.co/feed/",                               type: "rss", category: "industry", industryTag: "Energy" },
  ],
  "Retail": [
    { name: "Retail Dive Cybersecurity", url: "https://www.retaildive.com/feeds/news/",                        type: "rss", category: "industry", industryTag: "Retail" },
    { name: "PCI SSC Bulletins",        url: "https://blog.pcisecuritystandards.org/rss.xml",                  type: "rss", category: "industry", industryTag: "Retail" },
  ],
  "Other": [
    // Generic fallback so tenants without a sector-specific feed still see industry context.
    { name: "Krebs on Security",        url: "https://krebsonsecurity.com/feed/",                              type: "rss", category: "industry", industryTag: "Other" },
    { name: "Dark Reading",             url: "https://www.darkreading.com/rss.xml",                            type: "rss", category: "industry", industryTag: "Other" },
  ],
};

export function getIndustryFeeds(industry: string): FeedSource[] {
  return INDUSTRY_FEEDS[industry] || [];
}

/** All industry keys the system knows about. Used by the cron to enumerate. */
export function listIndustryKeys(): string[] {
  return Object.keys(INDUSTRY_FEEDS);
}
