-- Rename TenantPlan enum values. Postgres enum rename is in-place and
-- preserves all existing rows; no data backfill needed.
ALTER TYPE "TenantPlan" RENAME VALUE 'starter'      TO 'starter_ir';
ALTER TYPE "TenantPlan" RENAME VALUE 'professional' TO 'smb';

-- Add Tenant.seatLimit. Existing rows get NULL (interpreted as unlimited /
-- legacy unmetered); the admin UI prompts to set a limit on next edit.
ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "seatLimit" INTEGER;

-- Time-limited storage of one-time provisioning secrets (magic links,
-- temporary passwords). Indexed for the per-tenant detail-view query.
CREATE TABLE IF NOT EXISTS "ProvisioningCredential" (
  "id"              TEXT PRIMARY KEY,
  "tenantId"        TEXT NOT NULL,
  "userId"          TEXT,
  "userEmail"       TEXT NOT NULL,
  "kind"            TEXT NOT NULL,
  "value"           TEXT NOT NULL,
  "expiresAt"       TIMESTAMP(3) NOT NULL,
  "viewedByUserId"  TEXT,
  "viewedByName"    TEXT,
  "viewedAt"        TIMESTAMP(3),
  "invalidatedAt"   TIMESTAMP(3),
  "source"          TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdByName"   TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "ProvisioningCredential_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProvisioningCredential_tenantId_expiresAt_idx"
  ON "ProvisioningCredential" ("tenantId", "expiresAt");
CREATE INDEX IF NOT EXISTS "ProvisioningCredential_tenantId_userId_idx"
  ON "ProvisioningCredential" ("tenantId", "userId");
