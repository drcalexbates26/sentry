/**
 * Email delivery smoke test.
 *
 * Sends a single notification-style email through the configured Resend
 * SMTP. Useful for verifying:
 *   • RESEND_API_KEY + EMAIL_FROM are correct
 *   • The sending domain is verified (DKIM/SPF aligned)
 *   • Templates render correctly in your inbox
 *
 * Usage:
 *   node scripts/test-email.mjs --to you@example.com
 *   node scripts/test-email.mjs --to you@example.com --kind digest
 *
 * Kinds:
 *   notification (default) — IR notification template with privileged banner
 *   digest                 — weekly digest preview
 *   plain                  — minimal "hello" email
 */

import { config } from "dotenv";
import { Resend } from "resend";

config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const TO = args.to;
const KIND = args.kind || "notification";

if (!TO) {
  console.error("Usage: node scripts/test-email.mjs --to <email> [--kind notification|digest|plain]");
  process.exit(1);
}
if (!process.env.RESEND_API_KEY) {
  console.error("✕ RESEND_API_KEY is not set. Add it to .env first.");
  process.exit(1);
}
if (!process.env.EMAIL_FROM) {
  console.error("✕ EMAIL_FROM is not set. Add it to .env (format: \"Display Name <noreply@your-domain>\").");
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

console.log(`→ Sending test email`);
console.log(`  from: ${process.env.EMAIL_FROM}`);
console.log(`  to:   ${TO}`);
console.log(`  kind: ${KIND}`);
console.log("");

const payload = buildPayload(KIND, TO);
const { data, error } = await resend.emails.send(payload);

if (error) {
  console.error(`✕ Send failed: ${error.message}`);
  if (error.message?.toLowerCase().includes("verify")) {
    console.error("");
    console.error("  Likely causes:");
    console.error("  • Sending domain not verified in Resend → Settings → Domains");
    console.error("  • DKIM/SPF DNS records not propagated yet");
    console.error("  • EMAIL_FROM uses a domain you don't own");
  }
  process.exit(1);
}

console.log(`✓ Sent successfully`);
console.log(`  message id: ${data?.id ?? "unknown"}`);
console.log(`  dashboard:  https://resend.com/emails/${data?.id ?? ""}`);
console.log("");
console.log("Check your inbox (and spam folder if first time).");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      out[key] = val;
    }
  }
  return out;
}

function buildPayload(kind, to) {
  const from = process.env.EMAIL_FROM;
  const tags = [{ name: "module", value: "smoke-test" }, { name: "kind", value: kind }];

  if (kind === "plain") {
    return {
      from,
      to: [to],
      subject: "Sentry email smoke test",
      text: "If you received this, Resend is configured correctly.",
      html: "<p>If you received this, Resend is configured correctly.</p>",
      tags,
    };
  }

  if (kind === "digest") {
    return {
      from,
      to: [to],
      subject: "Sentry weekly digest — Smoke Test Inc",
      text: "Sentry weekly digest preview. Real digests run Mondays at 09:00 UTC.",
      html: digestHtml(),
      tags,
    };
  }

  // notification (default)
  return {
    from,
    to: [to],
    subject: "[CONFIDENTIAL] Sentry notification smoke test",
    text: notificationText(),
    html: notificationHtml(),
    tags,
  };
}

function notificationText() {
  return [
    "[CONFIDENTIAL]",
    "",
    "INCIDENT NOTIFICATION — Smoke Test",
    "━".repeat(60),
    "",
    "This is a test of the Sentry email delivery path. If you received it,",
    "the Resend integration is wired correctly and ready for production",
    "incident notifications.",
    "",
    "Sent at: " + new Date().toLocaleString(),
    "",
    "Sentry by Dark Rock Labs",
  ].join("\n");
}

function notificationHtml() {
  return `
<div style="background:#F7F8FA;padding:24px;font-family:Figtree,system-ui,sans-serif">
  <div style="max-width:680px;margin:0 auto;background:#FFFFFF;border:1px solid #D1D9E6;border-radius:6px;overflow:hidden">
    <div style="background:#0F1623;color:#33C4B8;padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase">CONFIDENTIAL</div>
    <div style="padding:20px 24px">
      <h1 style="color:#1A202C;font-size:18px;margin:0 0 14px">Sentry notification smoke test</h1>
      <p style="color:#1A202C;font-size:14px;line-height:1.55;margin:0 0 12px">If you received this, the Resend integration is wired correctly and ready for production incident notifications.</p>
      <p style="color:#4A5568;font-size:12px;margin:0">Sent at ${new Date().toLocaleString()}</p>
    </div>
    <div style="padding:14px 24px;border-top:1px solid #E2E7EE;color:#718096;font-size:11px;line-height:1.5">
      Sent by Sentry by Dark Rock Labs · This is a smoke test. No action required.
    </div>
  </div>
</div>`.trim();
}

function digestHtml() {
  const stat = (label, value, accent = "#00B4A6") =>
    `<td style="background:#0F1623;border:1px solid #1E293B;border-top:2px solid ${accent};border-radius:8px;padding:14px;text-align:center;width:50%">
      <div style="color:#94A3B8;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px">${label}</div>
      <div style="color:${accent};font-size:24px;font-weight:800;line-height:1">${value}</div>
    </td>`;
  return `
<div style="background:#080C12;padding:24px;font-family:Figtree,system-ui,sans-serif">
  <div style="max-width:680px;margin:0 auto">
    <div style="text-align:center;margin-bottom:20px">
      <div style="color:#33C4B8;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase">Sentry · Dark Rock Labs</div>
      <h1 style="color:#E2E8F0;font-size:22px;font-weight:800;margin:6px 0 0">Weekly Digest — Smoke Test Inc</h1>
      <div style="color:#94A3B8;font-size:13px;margin-top:4px">Week ending ${new Date().toLocaleDateString()}</div>
    </div>
    <table style="width:100%;border-collapse:separate;border-spacing:8px"><tr>
      ${stat("New incidents", 0, "#22C55E")}${stat("New tickets", 3, "#F97316")}
    </tr><tr>
      ${stat("New tasks", 7, "#3B82F6")}${stat("New lessons", 2, "#EAB308")}
    </tr></table>
    <div style="color:#64748B;font-size:11px;text-align:center;margin-top:24px">Smoke test preview · Real digests run Mondays 09:00 UTC.</div>
  </div>
</div>`.trim();
}
