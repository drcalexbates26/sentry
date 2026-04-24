import type { RawFeedItem } from "@/types/threat-intel";
import { GLOBAL_FEEDS, NVD_CONFIG, CISA_KEV_URL, type FeedSource } from "./feed-config";
import { scoreThreat } from "./scoring-engine";
import type { ThreatIntelItem } from "@/types/threat-intel";

/**
 * Fetch and parse a single RSS feed.
 * Uses dynamic import of rss-parser since it's a Node.js module.
 */
export async function fetchRSSFeed(source: FeedSource): Promise<RawFeedItem[]> {
  try {
    const RSSParser = (await import("rss-parser")).default;
    const parser = new RSSParser({ timeout: 10000 });
    const feed = await parser.parseURL(source.url);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return (feed.items || [])
      .filter((item) => {
        const pub = item.pubDate ? new Date(item.pubDate) : new Date();
        return pub >= sevenDaysAgo;
      })
      .map((item) => ({
        title: item.title || "Untitled",
        description: stripHtml(item.contentSnippet || item.content || item.title || ""),
        link: item.link || source.url,
        publishedAt: item.pubDate || new Date().toISOString(),
        feedSource: source.name,
        feedCategory: source.category,
        industryTag: source.industryTag,
      }));
  } catch (err) {
    console.error(`Failed to fetch RSS from ${source.name}:`, err);
    return [];
  }
}

/**
 * Fetch CVEs from the NVD API 2.0 for the last 7 days.
 */
export async function fetchNVD(apiKey?: string): Promise<RawFeedItem[]> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      lastModStartDate: sevenDaysAgo.toISOString(),
      lastModEndDate: now.toISOString(),
      resultsPerPage: NVD_CONFIG.resultsPerPage.toString(),
      startIndex: "0",
    });

    const headers: Record<string, string> = {};
    if (apiKey) headers["apiKey"] = apiKey;

    const res = await fetch(`${NVD_CONFIG.baseUrl}?${params}`, { headers, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`NVD API returned ${res.status}`);

    const data = await res.json();
    const items: RawFeedItem[] = [];

    for (const vuln of data.vulnerabilities || []) {
      const cve = vuln.cve;
      const desc = cve.descriptions?.find((d: { lang: string; value: string }) => d.lang === "en")?.value || "";
      const cvssV31 = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
      const cvssV30 = cve.metrics?.cvssMetricV30?.[0]?.cvssData;
      const cvss = cvssV31 || cvssV30;

      items.push({
        title: `${cve.id}: ${desc.substring(0, 120)}`,
        description: desc,
        link: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
        publishedAt: cve.published || new Date().toISOString(),
        feedSource: "NVD",
        feedCategory: "global",
        cveId: cve.id,
        cvssScore: cvss?.baseScore,
        cvssVector: cvss?.vectorString,
        cweId: cve.weaknesses?.[0]?.description?.[0]?.value,
      });
    }

    return items;
  } catch (err) {
    console.error("Failed to fetch NVD:", err);
    return [];
  }
}

/**
 * Fetch CISA Known Exploited Vulnerabilities catalog.
 */
export async function fetchCISAKEV(): Promise<RawFeedItem[]> {
  try {
    const res = await fetch(CISA_KEV_URL, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`CISA KEV returned ${res.status}`);
    const data = await res.json();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return (data.vulnerabilities || [])
      .filter((v: { dateAdded: string }) => new Date(v.dateAdded) >= sevenDaysAgo)
      .map((v: { cveID: string; vulnerabilityName: string; shortDescription: string; vendorProject: string; product: string; dateAdded: string }) => ({
        title: `${v.cveID}: ${v.vulnerabilityName}`,
        description: v.shortDescription,
        link: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
        publishedAt: v.dateAdded,
        feedSource: "CISA KEV",
        feedCategory: "global" as const,
        cveId: v.cveID,
        affectedVendors: [v.vendorProject],
        affectedProducts: [v.product],
      }));
  } catch (err) {
    console.error("Failed to fetch CISA KEV:", err);
    return [];
  }
}

/**
 * Fetch all feeds, score, deduplicate, and return scored items.
 */
export async function fetchAllFeeds(industry?: string, nvdApiKey?: string): Promise<ThreatIntelItem[]> {
  const allRaw: RawFeedItem[] = [];

  // Fetch global RSS feeds in parallel
  const rssResults = await Promise.allSettled(GLOBAL_FEEDS.map((f) => fetchRSSFeed(f)));
  for (const result of rssResults) {
    if (result.status === "fulfilled") allRaw.push(...result.value);
  }

  // Fetch NVD (limit to top CVEs to avoid overwhelming)
  const nvdItems = await fetchNVD(nvdApiKey);
  // Only take high-severity NVD items to keep the list manageable
  allRaw.push(...nvdItems.filter((i) => (i.cvssScore || 0) >= 7.0).slice(0, 100));

  // Fetch CISA KEV
  const kevItems = await fetchCISAKEV();
  allRaw.push(...kevItems);

  // Fetch industry feeds if applicable
  if (industry) {
    const { getIndustryFeeds } = await import("./feed-config");
    const industryFeeds = getIndustryFeeds(industry).filter((f) => !f.requiresMembership);
    const industryResults = await Promise.allSettled(industryFeeds.map((f) => fetchRSSFeed(f)));
    for (const result of industryResults) {
      if (result.status === "fulfilled") allRaw.push(...result.value);
    }
  }

  // Deduplicate by link or CVE ID
  const seen = new Set<string>();
  const deduplicated: RawFeedItem[] = [];
  for (const item of allRaw) {
    const key = item.cveId || item.link;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(item);
    }
  }

  // Score all items
  return deduplicated.map((item) => scoreThreat(item));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}
