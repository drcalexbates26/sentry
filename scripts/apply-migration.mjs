/**
 * Apply a raw SQL migration file via pg, bypassing prisma migrate
 * (works around pgBouncer prepared-statement conflicts in serverless URLs).
 *
 * Usage:
 *   node scripts/apply-migration.mjs prisma/migrations/<dir>/migration.sql
 */
import { readFileSync } from "node:fs";
import { Client } from "pg";
import { config } from "dotenv";
config({ quiet: true });

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-migration.mjs <path-to-migration.sql>");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL (or DIRECT_URL) not set");
  process.exit(1);
}

const client = new Client({ connectionString: url });
console.log(`→ Connecting…`);
await client.connect();
console.log(`→ Applying ${file}`);
await client.query(sql);
console.log(`✓ Applied`);
await client.end();
