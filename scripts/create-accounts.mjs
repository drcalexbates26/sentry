/**
 * Provision Supabase auth users + Sentry User rows for:
 *   1. The screenshot system account (Acme Demo tenant)
 *   2. David Driggers, Jason Clauer, Steve Proud (Dark Rock Labs tenant)
 *
 * Idempotent: re-running this updates each user's password rather than
 * erroring on duplicates. Passwords are printed ONCE to stdout — capture them.
 * The system-account password is also written into .env as SCREENSHOT_PASSWORD
 * so `npm run screenshots` works on the next run.
 *
 * Usage:
 *   node scripts/create-accounts.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { Client as PgClient } from "pg";
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

config({ quiet: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const pg = new PgClient({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
await pg.connect();

/** Strong human-typeable password: 4 random word-ish blocks + 3 digits + symbol. */
function strongPassword() {
  const blocks = Array.from({ length: 3 }, () => randomBytes(3).toString("base64url").slice(0, 5));
  const digits = String(100 + Math.floor(Math.random() * 900));
  const sym = "!@#$%&*".charAt(Math.floor(Math.random() * 7));
  return `${blocks.join("-")}-${digits}${sym}`;
}

const ACCOUNTS = [
  {
    email: "sentry-bot@darkrocksecurity.com",
    fullName: "Sentry Screenshot Bot",
    tenantId: "tenant_demo",
    role: "tenant_admin",
    appRole: "admin",
    purpose: "Headless system account for screenshot capture against the demo tenant.",
    writeToEnv: "SCREENSHOT_PASSWORD",
    writeUserEnv: "SENTRY_AUTH_USER_EMAIL",
  },
  {
    email: "david.driggers@darkrocksecurity.com",
    fullName: "David Driggers",
    tenantId: "tenant_darkrock",
    role: "tenant_admin",
    appRole: "admin",
    purpose: "Dark Rock Labs team member — full admin access.",
  },
  {
    email: "jason.clauer@darkrocksecurity.com",
    fullName: "Jason Clauer",
    tenantId: "tenant_darkrock",
    role: "tenant_admin",
    appRole: "admin",
    purpose: "Dark Rock Labs team member — full admin access.",
  },
  {
    email: "steve.proud@darkrocksecurity.com",
    fullName: "Steve Proud",
    tenantId: "tenant_darkrock",
    role: "tenant_admin",
    appRole: "admin",
    purpose: "Dark Rock Labs team member — full admin access.",
  },
];

const summary = [];

for (const acct of ACCOUNTS) {
  const email = acct.email.toLowerCase();
  const password = strongPassword();

  // Look up existing
  const { data: existing, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) {
    console.error(`✕ listUsers failed for ${email}: ${listErr.message}`);
    continue;
  }
  const found = existing?.users.find((u) => u.email?.toLowerCase() === email);

  let authUserId;
  let isNew;
  if (found) {
    authUserId = found.id;
    isNew = false;
    const { error: updErr } = await supabase.auth.admin.updateUserById(authUserId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: acct.fullName },
    });
    if (updErr) {
      console.error(`✕ updateUserById failed for ${email}: ${updErr.message}`);
      continue;
    }
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: acct.fullName },
    });
    if (error || !data?.user) {
      console.error(`✕ createUser failed for ${email}: ${error?.message ?? "unknown"}`);
      continue;
    }
    authUserId = data.user.id;
    isNew = true;
  }

  // Upsert User row via raw SQL (the generated prisma client is TS-only)
  await pg.query(
    `INSERT INTO "User" (id, email, "fullName", role, "appRole", "tenantId", "invitedAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4::"UserRole", $5, $6, NOW(), NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       "fullName" = EXCLUDED."fullName",
       role = EXCLUDED.role,
       "appRole" = EXCLUDED."appRole",
       "tenantId" = EXCLUDED."tenantId",
       "updatedAt" = NOW()`,
    [authUserId, email, acct.fullName, acct.role, acct.appRole, acct.tenantId],
  );

  summary.push({ email, password, role: acct.role, tenantId: acct.tenantId, isNew, fullName: acct.fullName });
  console.log(`${isNew ? "✓ created" : "↻ updated"}  ${email}  (${acct.tenantId} · ${acct.role})`);

  if (acct.writeToEnv) {
    updateEnvLine(acct.writeToEnv, password);
    if (acct.writeUserEnv) updateEnvLine(acct.writeUserEnv, email);
    console.log(`    .env updated: ${acct.writeToEnv}, ${acct.writeUserEnv ?? "(no user var)"}`);
  }
}

console.log("\n" + "═".repeat(72));
console.log("ACCOUNT CREDENTIALS — capture these now; they will not be re-shown.");
console.log("═".repeat(72));
for (const s of summary) {
  console.log();
  console.log(`Name:     ${s.fullName}`);
  console.log(`Email:    ${s.email}`);
  console.log(`Password: ${s.password}`);
  console.log(`Tenant:   ${s.tenantId}  (role: ${s.role})`);
  console.log(`Status:   ${s.isNew ? "NEW account" : "Password ROTATED on existing account"}`);
}
console.log("\n" + "═".repeat(72));
console.log("• Recipients should change their password on first sign-in.");
console.log("• sentry-bot is for headless screenshot capture; do not share.");
console.log("═".repeat(72));

await pg.end();

// ── helpers ──
function updateEnvLine(key, value) {
  const path = ".env";
  let txt = readFileSync(path, "utf8");
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(txt)) {
    txt = txt.replace(pattern, `${key}=${value}`);
  } else {
    if (!txt.endsWith("\n")) txt += "\n";
    txt += `${key}=${value}\n`;
  }
  writeFileSync(path, txt);
}
