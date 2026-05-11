import { prisma } from "@/lib/db";
import { fetchAllFeeds } from "./feed-service";
import type { ThreatIntelItem } from "@/types/threat-intel";

const TTL_DAYS = 7;
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 min — auto-refresh below this

/**
 * Upsert scored threat-intel items into the ThreatIntel table. Deduped by
 * stable id (CVE id or hashed link). Sets expiresAt = now + 7 days.
 */
export async function persistThreatIntel(items: ThreatIntelItem[]): Promise<{ written: number }> {
  if (items.length === 0) return { written: 0 };
  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);

  await Promise.all(
    items.map((i) => {
      const data = {
        feedSource: i.feedSource,
        feedCategory: i.feedCategory,
        industryTag: i.industryTag ?? null,
        title: i.title,
        description: i.description,
        link: i.link,
        publishedAt: new Date(i.publishedAt),
        cveId: i.cveId ?? null,
        cvssScore: i.cvssScore ?? null,
        cvssVector: i.cvssVector ?? null,
        cweId: i.cweId ?? null,
        affectedVendors: i.affectedVendors,
        affectedProducts: i.affectedProducts,
        severityRank: i.severityRank,
        impactScore: i.impactScore,
        likelihoodScore: i.likelihoodScore,
        riskScore: i.riskScore,
        isZeroDay: i.isZeroDay,
        isActivelyExploited: i.isActivelyExploited,
        tags: i.tags,
        mitreAttackIds: i.mitreAttackIds,
        recommendations: i.recommendations ?? null,
        executiveSummary: i.executiveSummary ?? null,
        expiresAt,
      };
      return prisma.threatIntel.upsert({
        where: { id: i.id },
        create: { id: i.id, fetchedAt: new Date(), ...data },
        update: { fetchedAt: new Date(), ...data },
      });
    }),
  );
  return { written: items.length };
}

/** Remove expired threat-intel rows. Safe to call from cron. */
export async function pruneExpiredThreatIntel(): Promise<number> {
  const result = await prisma.threatIntel.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return result.count;
}

/**
 * Read cached threat intel for a tenant. Filters to (global ∪ industry's
 * feeds). Ordered by riskScore desc, capped to `limit`.
 */
export async function readCachedThreatIntel(opts: { industry?: string | null; limit?: number }): Promise<ThreatIntelItem[]> {
  const limit = opts.limit ?? 200;
  const rows = await prisma.threatIntel.findMany({
    where: {
      expiresAt: { gt: new Date() },
      ...(opts.industry
        ? { OR: [{ feedCategory: "global" }, { industryTag: opts.industry }] }
        : { feedCategory: "global" }),
    },
    orderBy: [{ riskScore: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });

  return rows.map((r) => ({
    id: r.id,
    feedSource: r.feedSource,
    feedCategory: r.feedCategory as "global" | "industry",
    industryTag: r.industryTag ?? undefined,
    title: r.title,
    description: r.description,
    link: r.link,
    publishedAt: r.publishedAt.toISOString(),
    cveId: r.cveId ?? undefined,
    cvssScore: r.cvssScore ?? undefined,
    cvssVector: r.cvssVector ?? undefined,
    cweId: r.cweId ?? undefined,
    affectedVendors: r.affectedVendors,
    affectedProducts: r.affectedProducts,
    severityRank: r.severityRank as ThreatIntelItem["severityRank"],
    impactScore: r.impactScore,
    likelihoodScore: r.likelihoodScore,
    riskScore: r.riskScore,
    isZeroDay: r.isZeroDay,
    isActivelyExploited: r.isActivelyExploited,
    tags: r.tags,
    mitreAttackIds: r.mitreAttackIds,
    recommendations: r.recommendations ?? undefined,
    executiveSummary: r.executiveSummary ?? undefined,
  }));
}

/** Returns the most recent fetchedAt across all rows, or null if empty. */
export async function getLastFetchAt(): Promise<Date | null> {
  const row = await prisma.threatIntel.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } });
  return row?.fetchedAt ?? null;
}

export async function isCacheStale(): Promise<boolean> {
  const last = await getLastFetchAt();
  if (!last) return true;
  return Date.now() - last.getTime() > STALE_THRESHOLD_MS;
}

/**
 * Fetch + persist + prune. Used by cron and by the on-login/on-onboarding
 * refresh triggers. Returns counts; never throws (errors logged + swallowed).
 */
export async function refreshThreatIntel(industry?: string | null): Promise<{ written: number; pruned: number; error?: string }> {
  try {
    const items = await fetchAllFeeds(industry ?? undefined, process.env.NVD_API_KEY);
    const pruned = await pruneExpiredThreatIntel();
    const { written } = await persistThreatIntel(items);
    return { written, pruned };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("refreshThreatIntel failed:", msg);
    return { written: 0, pruned: 0, error: msg };
  }
}
