import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/threat-intel/feed-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/threat-intel — Fetch current threat intel items.
 * Query params: ?industry=Healthcare&category=global
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get("industry") || undefined;
    const category = searchParams.get("category") || undefined;
    const nvdApiKey = process.env.NVD_API_KEY;

    const items = await fetchAllFeeds(industry, nvdApiKey);

    const filtered = category
      ? items.filter((i) => i.feedCategory === category)
      : items;

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
