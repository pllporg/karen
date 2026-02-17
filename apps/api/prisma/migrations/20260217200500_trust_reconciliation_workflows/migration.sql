-- Trust reconciliation run + discrepancy workflows

CREATE TYPE "TrustReconciliationRunStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'COMPLETED');
CREATE TYPE "TrustReconciliationDiscrepancyStatus" AS ENUM ('OPEN', 'RESOLVED', 'WAIVED');

CREATE TABLE "TrustReconciliationRun" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "trustAccountId" UUID,
  "statementStartAt" TIMESTAMP(3) NOT NULL,
  "statementEndAt" TIMESTAMP(3) NOT NULL,
  "status" "TrustReconciliationRunStatus" NOT NULL DEFAULT 'DRAFT',
  "summaryJson" JSONB,
  "notes" TEXT,
  "createdByUserId" UUID,
  "signedOffByUserId" UUID,
  "signedOffAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TrustReconciliationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrustReconciliationDiscrepancy" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "runId" UUID NOT NULL,
  "trustAccountId" UUID,
  "matterId" UUID,
  "reasonCode" TEXT NOT NULL,
  "expectedBalance" DOUBLE PRECISION NOT NULL,
  "ledgerBalance" DOUBLE PRECISION NOT NULL,
  "difference" DOUBLE PRECISION NOT NULL,
  "status" "TrustReconciliationDiscrepancyStatus" NOT NULL DEFAULT 'OPEN',
  "resolutionNote" TEXT,
  "resolvedByUserId" UUID,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TrustReconciliationDiscrepancy_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TrustReconciliationRun_organizationId_status_createdAt_idx" ON "TrustReconciliationRun"("organizationId", "status", "createdAt");
CREATE INDEX "TrustReconciliationDiscrepancy_organizationId_status_createdAt_idx" ON "TrustReconciliationDiscrepancy"("organizationId", "status", "createdAt");
CREATE INDEX "TrustReconciliationDiscrepancy_runId_idx" ON "TrustReconciliationDiscrepancy"("runId");

ALTER TABLE "TrustReconciliationRun"
  ADD CONSTRAINT "TrustReconciliationRun_trustAccountId_fkey"
  FOREIGN KEY ("trustAccountId") REFERENCES "TrustAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "TrustReconciliationRun_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "TrustReconciliationRun_signedOffByUserId_fkey"
  FOREIGN KEY ("signedOffByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TrustReconciliationDiscrepancy"
  ADD CONSTRAINT "TrustReconciliationDiscrepancy_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "TrustReconciliationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TrustReconciliationDiscrepancy_trustAccountId_fkey"
  FOREIGN KEY ("trustAccountId") REFERENCES "TrustAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "TrustReconciliationDiscrepancy_matterId_fkey"
  FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "TrustReconciliationDiscrepancy_resolvedByUserId_fkey"
  FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
