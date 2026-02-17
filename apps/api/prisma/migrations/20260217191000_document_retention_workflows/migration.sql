-- Document retention policies, legal holds, and disposition workflows

CREATE TYPE "DocumentDispositionStatus" AS ENUM ('ACTIVE', 'PENDING_DISPOSITION', 'DISPOSED');
CREATE TYPE "RetentionScope" AS ENUM ('ALL_DOCUMENTS', 'MATTER', 'CATEGORY');
CREATE TYPE "RetentionTrigger" AS ENUM ('DOCUMENT_UPLOADED', 'MATTER_CLOSED');
CREATE TYPE "DocumentLegalHoldStatus" AS ENUM ('ACTIVE', 'RELEASED');
CREATE TYPE "DocumentDispositionRunStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED', 'CANCELED');
CREATE TYPE "DocumentDispositionItemStatus" AS ENUM ('PENDING', 'SKIPPED_LEGAL_HOLD', 'DISPOSED');

ALTER TABLE "Document"
  ADD COLUMN "retentionPolicyId" UUID,
  ADD COLUMN "retentionEligibleAt" TIMESTAMP(3),
  ADD COLUMN "legalHoldActive" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "dispositionStatus" "DocumentDispositionStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "disposedAt" TIMESTAMP(3);

CREATE TABLE "DocumentRetentionPolicy" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "matterId" UUID,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "scope" "RetentionScope" NOT NULL DEFAULT 'ALL_DOCUMENTS',
  "category" TEXT,
  "retentionDays" INTEGER NOT NULL,
  "trigger" "RetentionTrigger" NOT NULL DEFAULT 'DOCUMENT_UPLOADED',
  "requireApproval" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DocumentRetentionPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentLegalHold" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "documentId" UUID NOT NULL,
  "matterId" UUID,
  "reason" TEXT NOT NULL,
  "status" "DocumentLegalHoldStatus" NOT NULL DEFAULT 'ACTIVE',
  "placedByUserId" UUID,
  "releasedByUserId" UUID,
  "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DocumentLegalHold_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentDispositionRun" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "policyId" UUID,
  "status" "DocumentDispositionRunStatus" NOT NULL DEFAULT 'DRAFT',
  "cutoffAt" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "requestedByUserId" UUID,
  "approvedByUserId" UUID,
  "approvedAt" TIMESTAMP(3),
  "executedByUserId" UUID,
  "executedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DocumentDispositionRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentDispositionItem" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "runId" UUID NOT NULL,
  "documentId" UUID NOT NULL,
  "status" "DocumentDispositionItemStatus" NOT NULL DEFAULT 'PENDING',
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "appliedAt" TIMESTAMP(3),
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DocumentDispositionItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Document_organizationId_retentionEligibleAt_idx" ON "Document"("organizationId", "retentionEligibleAt");
CREATE INDEX "Document_organizationId_dispositionStatus_idx" ON "Document"("organizationId", "dispositionStatus");

CREATE INDEX "DocumentRetentionPolicy_organizationId_isActive_idx" ON "DocumentRetentionPolicy"("organizationId", "isActive");
CREATE INDEX "DocumentRetentionPolicy_organizationId_scope_idx" ON "DocumentRetentionPolicy"("organizationId", "scope");

CREATE INDEX "DocumentLegalHold_organizationId_status_placedAt_idx" ON "DocumentLegalHold"("organizationId", "status", "placedAt");
CREATE INDEX "DocumentLegalHold_organizationId_documentId_idx" ON "DocumentLegalHold"("organizationId", "documentId");

CREATE INDEX "DocumentDispositionRun_organizationId_status_createdAt_idx" ON "DocumentDispositionRun"("organizationId", "status", "createdAt");

CREATE UNIQUE INDEX "DocumentDispositionItem_runId_documentId_key" ON "DocumentDispositionItem"("runId", "documentId");
CREATE INDEX "DocumentDispositionItem_organizationId_status_scheduledAt_idx" ON "DocumentDispositionItem"("organizationId", "status", "scheduledAt");

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_retentionPolicyId_fkey"
  FOREIGN KEY ("retentionPolicyId") REFERENCES "DocumentRetentionPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentRetentionPolicy"
  ADD CONSTRAINT "DocumentRetentionPolicy_matterId_fkey"
  FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentRetentionPolicy_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentLegalHold"
  ADD CONSTRAINT "DocumentLegalHold_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentLegalHold_matterId_fkey"
  FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentLegalHold_placedByUserId_fkey"
  FOREIGN KEY ("placedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentLegalHold_releasedByUserId_fkey"
  FOREIGN KEY ("releasedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentDispositionRun"
  ADD CONSTRAINT "DocumentDispositionRun_policyId_fkey"
  FOREIGN KEY ("policyId") REFERENCES "DocumentRetentionPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentDispositionRun_requestedByUserId_fkey"
  FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentDispositionRun_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentDispositionRun_executedByUserId_fkey"
  FOREIGN KEY ("executedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentDispositionItem"
  ADD CONSTRAINT "DocumentDispositionItem_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "DocumentDispositionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentDispositionItem_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
