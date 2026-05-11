/**
 * DNS pre-check for custom-domain + Resend setup.
 *
 * Usage:
 *   npm run check:dns -- --domain sentry.darkrocklabs.com
 *   npm run check:dns -- --domain sentry.darkrocklabs.com --email darkrocksecurity.com
 *
 * Verifies:
 *   • <domain> CNAME → cname.vercel-dns.com (or A → 76.76.21.21)
 *   • <email-domain> DKIM CNAMEs (resend._domainkey, send._domainkey)
 *   • <email-domain> SPF TXT record includes resend
 *   • <email-domain> DMARC TXT record presence
 */

import dns from "node:dns/promises";

const args = parseArgs(process.argv.slice(2));
const DOMAIN = args.domain;
const EMAIL_DOMAIN = args.email;

if (!DOMAIN) {
  console.error("Usage: node scripts/check-dns.mjs --domain <app-domain> [--email <email-sending-domain>]");
  console.error("Example: node scripts/check-dns.mjs --domain sentry.darkrocklabs.com --email darkrocksecurity.com");
  process.exit(1);
}

const PASS = "✓";
const FAIL = "✕";
const WARN = "⚠";

console.log(`\nDNS pre-flight check\n${"─".repeat(60)}\n`);
console.log(`Domain:        ${DOMAIN}`);
if (EMAIL_DOMAIN) console.log(`Email sender:  ${EMAIL_DOMAIN}`);
console.log();

let issues = 0;

// ── App domain: CNAME or A pointing at Vercel ─────────────────────
console.log(`▸ Vercel custom domain · ${DOMAIN}`);
const VERCEL_CNAME = "cname.vercel-dns.com";
const VERCEL_A = ["76.76.21.21", "76.76.21.61"];

try {
  const cnames = await dns.resolveCname(DOMAIN).catch(() => []);
  const aRecords = await dns.resolve4(DOMAIN).catch(() => []);

  if (cnames.some((c) => c.toLowerCase().includes("vercel-dns.com"))) {
    console.log(`  ${PASS} CNAME → ${cnames[0]}`);
  } else if (aRecords.some((a) => VERCEL_A.includes(a))) {
    console.log(`  ${PASS} A → ${aRecords[0]} (Vercel)`);
  } else if (cnames.length > 0 || aRecords.length > 0) {
    console.log(`  ${FAIL} Resolves but not to Vercel: CNAME=${cnames.join(", ") || "—"}, A=${aRecords.join(", ") || "—"}`);
    console.log(`     Add: ${DOMAIN}  CNAME  ${VERCEL_CNAME}`);
    issues++;
  } else {
    console.log(`  ${WARN} No DNS records yet — domain not configured`);
    console.log(`     Add: ${DOMAIN}  CNAME  ${VERCEL_CNAME}`);
    issues++;
  }
} catch (e) {
  console.log(`  ${FAIL} Lookup failed: ${(e instanceof Error ? e.message : String(e))}`);
  issues++;
}

// ── HTTPS reachability ────────────────────────────────────────────
console.log(`\n▸ HTTPS reachability · https://${DOMAIN}`);
try {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  const r = await fetch(`https://${DOMAIN}/`, { signal: ctrl.signal, redirect: "manual" });
  clearTimeout(t);
  console.log(`  ${PASS} HTTP ${r.status} · server: ${r.headers.get("server") ?? "unknown"}`);
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("ENOTFOUND") || msg.includes("aborted")) {
    console.log(`  ${WARN} Not reachable yet — DNS may still be propagating`);
  } else {
    console.log(`  ${FAIL} ${msg}`);
  }
  issues++;
}

// ── Email-sending domain (Resend) ─────────────────────────────────
if (EMAIL_DOMAIN) {
  console.log(`\n▸ Resend / email-sending domain · ${EMAIL_DOMAIN}`);

  // SPF check
  try {
    const txt = (await dns.resolveTxt(EMAIL_DOMAIN).catch(() => [])).map((r) => r.join(""));
    const spf = txt.find((t) => t.toLowerCase().startsWith("v=spf1"));
    if (spf?.toLowerCase().includes("resend")) {
      console.log(`  ${PASS} SPF includes Resend`);
    } else if (spf) {
      console.log(`  ${WARN} SPF exists but doesn't include Resend: ${spf.slice(0, 80)}`);
      console.log(`     Add include:_spf.resend.com or merge with existing SPF record`);
      issues++;
    } else {
      console.log(`  ${FAIL} No SPF TXT record`);
      console.log(`     Add: TXT  ${EMAIL_DOMAIN}  "v=spf1 include:_spf.resend.com ~all"`);
      issues++;
    }
  } catch (e) {
    console.log(`  ${FAIL} SPF lookup failed: ${(e instanceof Error ? e.message : String(e))}`);
    issues++;
  }

  // DKIM check — Resend uses resend._domainkey + send._domainkey CNAMEs
  for (const selector of ["resend._domainkey", "send._domainkey"]) {
    const host = `${selector}.${EMAIL_DOMAIN}`;
    try {
      const records = await dns.resolveCname(host).catch(() => []);
      if (records.length > 0) {
        console.log(`  ${PASS} DKIM ${selector} → ${records[0]}`);
      } else {
        console.log(`  ${FAIL} DKIM ${selector} not configured`);
        console.log(`     Add the CNAME shown in Resend → Domains → ${EMAIL_DOMAIN}`);
        issues++;
      }
    } catch {
      console.log(`  ${FAIL} DKIM ${selector} lookup failed`);
      issues++;
    }
  }

  // DMARC check (informational)
  try {
    const dmarcTxt = (await dns.resolveTxt(`_dmarc.${EMAIL_DOMAIN}`).catch(() => [])).map((r) => r.join(""));
    const dmarc = dmarcTxt.find((t) => t.toLowerCase().startsWith("v=dmarc1"));
    if (dmarc) {
      console.log(`  ${PASS} DMARC present (${dmarc.slice(0, 80)})`);
    } else {
      console.log(`  ${WARN} No DMARC — recommended for deliverability and brand protection`);
      console.log(`     Add: TXT  _dmarc.${EMAIL_DOMAIN}  "v=DMARC1; p=quarantine; rua=mailto:dmarc@${EMAIL_DOMAIN}"`);
    }
  } catch {
    console.log(`  ${WARN} DMARC lookup failed (non-blocking)`);
  }
}

console.log(`\n${"─".repeat(60)}`);
if (issues === 0) {
  console.log(`${PASS} All checks passed.`);
  process.exit(0);
} else {
  console.log(`${issues} issue${issues === 1 ? "" : "s"} to resolve. See above.`);
  process.exit(1);
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
