import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, emailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Weekly digest cron — runs Mondays 09:00 UTC (see vercel.json).
 *
 * For every active, non-demo tenant, compiles last-week activity (new
 * incidents, tickets, tasks, assessments, lessons) and emails the digest
 * to that tenant's tenant_admin users.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}` if CRON_SECRET is
 * set. Vercel's scheduled jobs auto-attach this header when configured.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!emailConfigured()) {
    return NextResponse.json({
      success: false,
      error: "Email not configured. Set RESEND_API_KEY + EMAIL_FROM to enable digest delivery.",
    }, { status: 200 });
  }

  const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const tenants = await prisma.tenant.findMany({
    where: { status: "active", isDemoTenant: false },
    include: {
      users: { where: { active: true, role: { in: ["tenant_admin", "super_admin"] } }, select: { email: true } },
      organization: { select: { name: true, industry: true } },
    },
  });

  const results: Array<{ tenant: string; recipients: number; status: string; error?: string }> = [];

  for (const tenant of tenants) {
    const recipients = tenant.users.map((u) => u.email).filter(Boolean);
    if (recipients.length === 0) {
      results.push({ tenant: tenant.name, recipients: 0, status: "no_recipients" });
      continue;
    }

    // Last-week activity counts
    const [newIncidents, newTickets, newTasks, newAssessments, newLessons] = await Promise.all([
      prisma.incident.count({ where: { tenantId: tenant.id, createdAt: { gte: sinceDate } } }),
      prisma.ticket.count({ where: { tenantId: tenant.id, createdAt: { gte: sinceDate } } }),
      prisma.task.count({ where: { tenantId: tenant.id, createdAt: { gte: sinceDate } } }),
      prisma.assessment.count({ where: { tenantId: tenant.id, createdAt: { gte: sinceDate } } }),
      prisma.lesson.count({ where: { tenantId: tenant.id, createdAt: { gte: sinceDate } } }),
    ]);

    // Open posture totals (snapshots, not delta)
    const [openTickets, openTasks, activeIncidents, totalStakeholders, totalVendors] = await Promise.all([
      prisma.ticket.count({ where: { tenantId: tenant.id, status: { not: "Closed" } } }),
      prisma.task.count({ where: { tenantId: tenant.id, status: { not: "Done" } } }),
      prisma.incident.count({ where: { tenantId: tenant.id, status: "Active" } }),
      prisma.stakeholder.count({ where: { tenantId: tenant.id } }),
      prisma.vendor.count({ where: { tenantId: tenant.id } }),
    ]);

    const lastAssessment = await prisma.assessment.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      select: { score: true, date: true },
    });

    const subject = `Sentry weekly digest — ${tenant.name}`;
    const body = renderDigestText({
      tenantName: tenant.name,
      weekEnding: new Date().toLocaleDateString(),
      newIncidents, newTickets, newTasks, newAssessments, newLessons,
      openTickets, openTasks, activeIncidents, totalStakeholders, totalVendors,
      latestScore: lastAssessment?.score,
      latestScoreDate: lastAssessment?.date,
    });
    const html = renderDigestHtml({
      tenantName: tenant.name,
      weekEnding: new Date().toLocaleDateString(),
      newIncidents, newTickets, newTasks, newAssessments, newLessons,
      openTickets, openTasks, activeIncidents, totalStakeholders, totalVendors,
      latestScore: lastAssessment?.score,
      latestScoreDate: lastAssessment?.date,
    });

    const sendResult = await sendEmail({
      to: recipients,
      subject,
      text: body,
      html,
      tags: [{ name: "module", value: "weekly-digest" }, { name: "tenantId", value: tenant.id }],
    });

    if (sendResult.ok) {
      results.push({ tenant: tenant.name, recipients: recipients.length, status: "sent" });
    } else {
      results.push({
        tenant: tenant.name,
        recipients: recipients.length,
        status: "failed",
        error: sendResult.reason === "not_configured" ? "not_configured" : sendResult.error,
      });
    }
  }

  return NextResponse.json({
    success: true,
    runAt: new Date().toISOString(),
    tenantsProcessed: tenants.length,
    results,
  });
}

interface DigestData {
  tenantName: string;
  weekEnding: string;
  newIncidents: number;
  newTickets: number;
  newTasks: number;
  newAssessments: number;
  newLessons: number;
  openTickets: number;
  openTasks: number;
  activeIncidents: number;
  totalStakeholders: number;
  totalVendors: number;
  latestScore?: number;
  latestScoreDate?: string;
}

function renderDigestText(d: DigestData): string {
  const lines: string[] = [];
  lines.push(`SENTRY WEEKLY DIGEST — ${d.tenantName.toUpperCase()}`);
  lines.push(`Week ending ${d.weekEnding}`);
  lines.push("━".repeat(60));
  lines.push("");
  lines.push("LAST 7 DAYS");
  lines.push("─".repeat(60));
  lines.push(`  ${d.newIncidents} new incident${d.newIncidents === 1 ? "" : "s"}`);
  lines.push(`  ${d.newTickets} new ticket${d.newTickets === 1 ? "" : "s"}`);
  lines.push(`  ${d.newTasks} new task${d.newTasks === 1 ? "" : "s"}`);
  lines.push(`  ${d.newAssessments} new assessment${d.newAssessments === 1 ? "" : "s"}`);
  lines.push(`  ${d.newLessons} new lesson${d.newLessons === 1 ? "" : "s"} learned`);
  lines.push("");
  lines.push("CURRENT POSTURE");
  lines.push("─".repeat(60));
  lines.push(`  Active incidents:  ${d.activeIncidents}`);
  lines.push(`  Open tickets:      ${d.openTickets}`);
  lines.push(`  Open tasks:        ${d.openTasks}`);
  lines.push(`  Stakeholders:      ${d.totalStakeholders}`);
  lines.push(`  Vendors:           ${d.totalVendors}`);
  if (d.latestScore != null) {
    lines.push(`  Resilience score:  ${d.latestScore}/100 (assessed ${d.latestScoreDate})`);
  }
  lines.push("");
  lines.push("Sign in to Sentry for full detail and the operational metrics dashboard.");
  return lines.join("\n");
}

function renderDigestHtml(d: DigestData): string {
  const stat = (label: string, value: string | number, accent = "#00B4A6") =>
    `<td style="background:#0F1623;border:1px solid #1E293B;border-top:2px solid ${accent};border-radius:8px;padding:14px;text-align:center;width:50%">
      <div style="color:#94A3B8;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px">${escapeHtml(label)}</div>
      <div style="color:${accent};font-size:24px;font-weight:800;line-height:1">${escapeHtml(String(value))}</div>
    </td>`;

  const score = d.latestScore != null
    ? `<tr><td colspan="2" style="padding:8px 0">
        <div style="background:#0F1623;border:1px solid #1E293B;border-top:2px solid #33C4B8;border-radius:8px;padding:14px">
          <div style="color:#94A3B8;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase">Resilience score</div>
          <div style="color:#33C4B8;font-size:30px;font-weight:800;margin-top:4px">${d.latestScore}<span style="color:#94A3B8;font-size:14px">/100</span></div>
          <div style="color:#64748B;font-size:11px;margin-top:4px">Assessed ${escapeHtml(d.latestScoreDate ?? "")}</div>
        </div>
      </td></tr>`
    : "";

  return [
    `<div style="background:#080C12;padding:24px;font-family:Figtree,system-ui,sans-serif">`,
    `<div style="max-width:680px;margin:0 auto">`,
    `<div style="text-align:center;margin-bottom:20px">`,
    `<div style="color:#33C4B8;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase">Sentry · Dark Rock Labs</div>`,
    `<h1 style="color:#E2E8F0;font-size:22px;font-weight:800;margin:6px 0 0;letter-spacing:-0.01em">Weekly Digest — ${escapeHtml(d.tenantName)}</h1>`,
    `<div style="color:#94A3B8;font-size:13px;margin-top:4px">Week ending ${escapeHtml(d.weekEnding)}</div>`,
    `</div>`,
    `<div style="color:#94A3B8;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:18px 0 8px">Last 7 days</div>`,
    `<table style="width:100%;border-collapse:separate;border-spacing:8px"><tr>`,
      stat("New incidents", d.newIncidents, "#EF4444"),
      stat("New tickets", d.newTickets, "#F97316"),
    `</tr><tr>`,
      stat("New tasks", d.newTasks, "#3B82F6"),
      stat("New lessons", d.newLessons, "#EAB308"),
    `</tr></table>`,
    `<div style="color:#94A3B8;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:24px 0 8px">Current posture</div>`,
    `<table style="width:100%;border-collapse:separate;border-spacing:8px"><tr>`,
      stat("Active incidents", d.activeIncidents, d.activeIncidents > 0 ? "#EF4444" : "#22C55E"),
      stat("Open tickets", d.openTickets, d.openTickets > 0 ? "#F97316" : "#22C55E"),
    `</tr><tr>`,
      stat("Open tasks", d.openTasks, "#3B82F6"),
      stat("Stakeholders", d.totalStakeholders, "#00B4A6"),
    `</tr>`,
    score,
    `</table>`,
    `<div style="color:#64748B;font-size:11px;text-align:center;margin-top:24px;line-height:1.5">Sent by Sentry by Dark Rock Labs · Sign in for full detail and the operational metrics dashboard.</div>`,
    `</div></div>`,
  ].join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
