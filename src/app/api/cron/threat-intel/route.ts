import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/threat-intel/feed-service";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint: Fetch all threat intel feeds, score, and return.
 * In production with a database, this would store to Prisma and clean up expired entries.
 * For now, it returns the scored items as JSON for client consumption.
 *
 * Vercel cron: "0 * /2 * * *" (every 2 hours)
 */
export async function GET(request: Request) {
  // Verify cron authorization in production
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const nvdApiKey = process.env.NVD_API_KEY;
    const items = await fetchAllFeeds(undefined, nvdApiKey);

    // In production: store to database, clean up expired
    // await prisma.threatIntel.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    // await prisma.threatIntel.createMany({ data: items.map(i => ({ ...i, expiresAt: new Date(Date.now() + 7*24*60*60*1000) })) });

    return NextResponse.json({
      success: true,
      count: items.length,
      fetchedAt: new Date().toISOString(),
      items,
    });
  } catch (error) {
    console.error("Threat intel cron failed:", error);
    return NextResponse.json({ error: "Feed fetch failed" }, { status: 500 });
  }
}
