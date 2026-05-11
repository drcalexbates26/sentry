import { NextResponse } from "next/server";
import { readCachedThreatIntel, isCacheStale, refreshThreatIntel } from "@/lib/threat-intel/persist";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/threat-intel — Return cached threat intel.
 * Query params: ?industry=Healthcare&category=global
 *
 * Caching strategy:
 *   - Always reads from DB cache (fast, < 100ms).
 *   - If the cache is stale (>30 min), kicks off a background refresh
 *     and still returns the current cache so the UI is never blocked.
 *   - If the cache is empty (cold start), refreshes synchronously and
 *     returns the fresh data.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get("industry") || undefined;
    const category = searchParams.get("category") || undefined;

    let items = await readCachedThreatIntel({ industry });

    if (items.length === 0) {
      // Cold start — refresh inline so we have something to return.
      await refreshThreatIntel(industry);
      items = await readCachedThreatIntel({ industry });
    } else if (await isCacheStale()) {
      // Stale but populated — fire-and-forget refresh, return current cache.
      refreshThreatIntel(industry).catch(() => {});
    }

    const filtered = category ? items.filter((i) => i.feedCategory === category) : items;

    return NextResponse.json({
      count: filtered.length,
      fetchedAt: new Date().toISOString(),
      items: filtered,
    });
  } catch (error) {
    console.error("Threat intel fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch threat intel" }, { status: 500 });
  }
}
