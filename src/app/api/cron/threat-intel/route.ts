import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { refreshThreatIntel } from "@/lib/threat-intel/persist";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

/**
 * Vercel cron: "0 * /2 * * *" (every 2 hours)
 *
 * 1. Refresh global feeds (NVD + CISA KEV + curated RSS).
 * 2. Enumerate every distinct industry value across active tenants.
 *    For each, run an industry-scoped refresh so industry-tagged rows
 *    land in the cache and don't expire silently between user sessions.
 *
 * Previously, industry feeds only refreshed when a user manually clicked
 * Refresh or loaded /app while the cache was stale. After 7 days of no
 * traffic, industry items expired and never returned — the "Industry tab
 * is empty" symptom.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Global refresh (also prunes expired rows).
  const global = await refreshThreatIntel();

  // 2. Industry refreshes — one per distinct industry value.
  const orgs = await prisma.organization.findMany({
    where: { industry: { not: null } },
    select: { industry: true },
    distinct: ["industry"],
  });
  const industries = orgs.map((o) => o.industry).filter((v): v is string => !!v);

  const industryResults: Record<string, { written: number; error?: string }> = {};
  for (const industry of industries) {
    const r = await refreshThreatIntel(industry);
    industryResults[industry] = { written: r.written, error: r.error };
  }

  return NextResponse.json({
    success: !global.error,
    fetchedAt: new Date().toISOString(),
    global,
    industries: industryResults,
    distinctIndustryCount: industries.length,
  });
}
