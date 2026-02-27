-- CreateEnum
CREATE TYPE "MatterAuditSignalReviewState" AS ENUM ('GENERATED', 'IN_REVIEW', 'RESOLVED_ACTIONED', 'RESOLVED_DISMISSED');

-- CreateTable
CREATE TABLE "MatterAuditSignal" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "signalKey" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "citationsJson" JSONB NOT NULL,
    "reviewState" "MatterAuditSignalReviewState" NOT NULL DEFAULT 'GENERATED',
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "reviewStateChangedAt" TIMESTAMP(3),
    "reviewedByUserId" UUID,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatterAuditSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatterAuditSignal_organizationId_signalKey_key" ON "MatterAuditSignal"("organizationId", "signalKey");

-- CreateIndex
CREATE INDEX "MatterAuditSignal_organizationId_reviewState_generatedAt_idx" ON "MatterAuditSignal"("organizationId", "reviewState", "generatedAt");

-- CreateIndex
CREATE INDEX "MatterAuditSignal_organizationId_matterId_generatedAt_idx" ON "MatterAuditSignal"("organizationId", "matterId", "generatedAt");

-- AddForeignKey
ALTER TABLE "MatterAuditSignal" ADD CONSTRAINT "MatterAuditSignal_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterAuditSignal" ADD CONSTRAINT "MatterAuditSignal_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
