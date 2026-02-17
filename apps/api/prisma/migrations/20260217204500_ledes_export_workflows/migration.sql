-- LEDES export profile + job workflows

CREATE TYPE "LEDESFormat" AS ENUM ('LEDES98B');
CREATE TYPE "LEDESValidationStatus" AS ENUM ('PASSED', 'FAILED');

CREATE TABLE "LEDESExportProfile" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "format" "LEDESFormat" NOT NULL DEFAULT 'LEDES98B',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "requireUtbmsPhaseCode" BOOLEAN NOT NULL DEFAULT true,
  "requireUtbmsTaskCode" BOOLEAN NOT NULL DEFAULT true,
  "includeExpenseLineItems" BOOLEAN NOT NULL DEFAULT true,
  "validationRulesJson" JSONB,
  "createdByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LEDESExportProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LEDESExportJob" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "profileId" UUID NOT NULL,
  "requestedByUserId" UUID,
  "matterId" UUID,
  "status" "ExportJobStatus" NOT NULL DEFAULT 'QUEUED',
  "validationStatus" "LEDESValidationStatus",
  "format" "LEDESFormat" NOT NULL,
  "invoiceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "lineCount" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "storageKey" TEXT,
  "checksumSha256" TEXT,
  "summaryJson" JSONB,
  "error" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LEDESExportJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LEDESExportProfile_organizationId_name_key" ON "LEDESExportProfile"("organizationId", "name");
CREATE INDEX "LEDESExportProfile_organizationId_isDefault_idx" ON "LEDESExportProfile"("organizationId", "isDefault");
CREATE INDEX "LEDESExportJob_organizationId_status_createdAt_idx" ON "LEDESExportJob"("organizationId", "status", "createdAt");
CREATE INDEX "LEDESExportJob_profileId_idx" ON "LEDESExportJob"("profileId");

ALTER TABLE "LEDESExportProfile"
  ADD CONSTRAINT "LEDESExportProfile_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LEDESExportJob"
  ADD CONSTRAINT "LEDESExportJob_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "LEDESExportProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LEDESExportJob_requestedByUserId_fkey"
  FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "LEDESExportJob_matterId_fkey"
  FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
