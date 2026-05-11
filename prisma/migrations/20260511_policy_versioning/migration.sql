-- Extend Policy with version pointers
ALTER TABLE "Policy"
  ADD COLUMN IF NOT EXISTS "publishedVersionId" TEXT,
  ADD COLUMN IF NOT EXISTS "draftVersionId"     TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- New PolicyVersion table — append-only version log per policy.
CREATE TABLE IF NOT EXISTS "PolicyVersion" (
  "id"                 TEXT PRIMARY KEY,
  "policyId"           TEXT NOT NULL,
  "versionNumber"      INTEGER NOT NULL,
  "content"            TEXT NOT NULL,
  "status"             TEXT NOT NULL,
  "changesSummary"     TEXT,
  "signoff1UserId"     TEXT,
  "signoff1Name"       TEXT,
  "signoff1At"         TIMESTAMP(3),
  "signoff2UserId"     TEXT,
  "signoff2Name"       TEXT,
  "signoff2At"         TIMESTAMP(3),
  "publishedAt"        TIMESTAMP(3),
  "publishedByUserId"  TEXT,
  "publishedByName"    TEXT,
  "createdByUserId"    TEXT NOT NULL,
  "createdByName"      TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "PolicyVersion_policyId_fkey"
    FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PolicyVersion_policyId_idx"               ON "PolicyVersion" ("policyId");
CREATE INDEX IF NOT EXISTS "PolicyVersion_policyId_versionNumber_idx" ON "PolicyVersion" ("policyId", "versionNumber");
CREATE INDEX IF NOT EXISTS "PolicyVersion_policyId_status_idx"        ON "PolicyVersion" ("policyId", "status");
