CREATE TABLE IF NOT EXISTS "CustomPlaybook" (
  "id"               TEXT PRIMARY KEY,
  "sourcePlaybookId" TEXT,
  "name"             TEXT NOT NULL,
  "cat"              TEXT NOT NULL,
  "sev"              TEXT NOT NULL,
  "icon"             TEXT NOT NULL DEFAULT '📋',
  "desc"             TEXT NOT NULL,
  "iocs"             TEXT[] NOT NULL DEFAULT '{}',
  "contain"          TEXT[] NOT NULL DEFAULT '{}',
  "erad"             TEXT[] NOT NULL DEFAULT '{}',
  "recover"          TEXT[] NOT NULL DEFAULT '{}',
  "mitre"            TEXT[] NOT NULL DEFAULT '{}',
  "tenantId"         TEXT NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "CustomPlaybook_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "CustomPlaybook_tenantId_idx"
  ON "CustomPlaybook" ("tenantId");
CREATE INDEX IF NOT EXISTS "CustomPlaybook_tenantId_sourcePlaybookId_idx"
  ON "CustomPlaybook" ("tenantId", "sourcePlaybookId");
