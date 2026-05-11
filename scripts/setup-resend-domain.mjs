/**
 * Set up a custom sender domain in Resend.
 *
 * Usage:
 *   npm run resend:setup -- --domain darkrocksecurity.com [--region us-east-1]
 *   npm run resend:setup -- --domain darkrocksecurity.com --check     # only check existing
 *
 * What it does:
 *   1. Calls Resend API to register the domain (idempotent — re-uses existing if present)
 *   2. Prints every DNS record you need to add (DKIM CNAMEs, SPF TXT, optionally DMARC)
 *   3. Verifies records once added (use --check after DNS propagates)
 */

import { config } from "dotenv";
config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const DOMAIN = args.domain;
const REGION = args.region || "us-east-1";
const CHECK_ONLY = args.check === true;

if (!DOMAIN) {
  console.error("Usage: node scripts/setup-resend-domain.mjs --domain <example.com> [--region <region>] [--check]");
  process.exit(1);
}
if (!process.env.RESEND_API_KEY) {
  console.error("✕ RESEND_API_KEY not set in .env");
  process.exit(1);
}

const BASE = "https://api.resend.com";
const HEADERS = {
  Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
  "Content-Type": "application/json",
};

console.log(`\nResend domain setup\n${"─".repeat(60)}\n`);
console.log(`Domain: ${DOMAIN}`);
console.log(`Region: ${REGION}\n`);

// Fetch existing domains
const existing = await api("/domains");
const found = existing.data?.find((d) => d.name === DOMAIN);

let domain = found;
if (!domain) {
  if (CHECK_ONLY) {
    console.error(`✕ Domain "${DOMAIN}" not found in Resend (and --check passed). Run without --check to add it.`);
    process.exit(1);
  }
  console.log("→ Adding domain to Resend...");
  const created = await api("/domains", {
    method: "POST",
    body: JSON.stringify({ name: DOMAIN, region: REGION }),
  });
  domain = created;
  console.log(`  ✓ Added · id=${domain.id} · status=${domain.status}\n`);
} else {
  console.log(`→ Domain already exists in Resend (id=${domain.id} · status=${domain.status})\n`);
}

// Get full domain record incl. records
const full = await api(`/domains/${domain.id}`);

console.log(`Status:  ${statusLabel(full.status)}`);
console.log(`Region:  ${full.region}\n`);

if (!full.records || full.records.length === 0) {
  console.log("No DNS records returned by Resend (unexpected).");
  process.exit(1);
}

console.log("DNS records to add at your registrar:\n");
console.log("─".repeat(60));
for (const r of full.records) {
  const status = r.status ? `   [${r.status}]` : "";
  console.log();
  console.log(`Type:  ${r.type}${status}`);
  console.log(`Name:  ${r.name}`);
  console.log(`Value: ${r.value}`);
  if (r.ttl) console.log(`TTL:   ${r.ttl}`);
  if (r.priority) console.log(`Pri:   ${r.priority}`);
}
console.log();
console.log("─".repeat(60));

if (full.status === "verified") {
  console.log("\n✓ Domain is verified and ready to send from.");
  console.log(`  Set EMAIL_FROM="Sentry by Dark Rock <noreply@${DOMAIN}>" in .env (and Vercel).`);
} else if (full.status === "pending") {
  console.log("\n⏳ Domain is pending verification.");
  console.log(`  After adding the records above, run:`);
  console.log(`    node scripts/check-dns.mjs --domain ${DOMAIN} --email ${DOMAIN}`);
  console.log(`  Then in the Resend dashboard click "Verify domain", or re-run this script with --check.`);
} else {
  console.log(`\nStatus: ${full.status}. Check the Resend dashboard for details.`);
}

// ── helpers ──────────────────────────────────────────────────────
async function api(path, init = {}) {
  const r = await fetch(`${BASE}${path}`, { ...init, headers: { ...HEADERS, ...(init.headers || {}) } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error(`✕ Resend API error: ${r.status} ${r.statusText}`);
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }
  return body;
}

function statusLabel(s) {
  if (s === "verified") return "✓ verified";
  if (s === "pending") return "⏳ pending verification";
  if (s === "not_started") return "⚠ not started";
  if (s === "failed") return "✕ failed";
  return s;
}

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
