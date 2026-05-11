import { NextResponse } from "next/server";
import { refreshThreatIntel } from "@/lib/threat-intel/persist";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel cron: "0 * /2 * * *" (every 2 hours)
 * Fetches all global feeds, scores them, prunes expired rows, and upserts
 * fresh rows into ThreatIntel. Industry feeds are fetched per-tenant via
 * the refresh server actions, not here.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await refreshThreatIntel();
  return NextResponse.json({
    success: !result.error,
    fetchedAt: new Date().toISOString(),
    ...result,
  });
}
