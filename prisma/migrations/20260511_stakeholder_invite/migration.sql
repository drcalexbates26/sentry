-- Add fine-grained appRole to User (defaults to "viewer" for existing rows)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "appRole" TEXT NOT NULL DEFAULT 'viewer';

-- Add invite tracking + linked-user to Stakeholder
ALTER TABLE "Stakeholder"
  ADD COLUMN IF NOT EXISTS "userId"       TEXT,
  ADD COLUMN IF NOT EXISTS "invitedAt"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "inviteStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "appRole"      TEXT;

-- Lookup index for finding stakeholders by linked user
CREATE INDEX IF NOT EXISTS "Stakeholder_tenantId_userId_idx"
  ON "Stakeholder" ("tenantId", "userId");
