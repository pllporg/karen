-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ContactKind" AS ENUM ('PERSON', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "ContactMethodType" AS ENUM ('EMAIL', 'PHONE', 'ADDRESS', 'SOCIAL');

-- CreateEnum
CREATE TYPE "MatterStatus" AS ENUM ('OPEN', 'PENDING', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MatterParticipantSide" AS ENUM ('CLIENT_SIDE', 'OPPOSING_SIDE', 'NEUTRAL', 'COURT');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELED');

-- CreateEnum
CREATE TYPE "CommunicationMessageType" AS ENUM ('EMAIL', 'SMS', 'CALL_LOG', 'PORTAL_MESSAGE', 'INTERNAL_NOTE');

-- CreateEnum
CREATE TYPE "CommunicationDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL');

-- CreateEnum
CREATE TYPE "CommunicationParticipantRole" AS ENUM ('FROM', 'TO', 'CC', 'BCC', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentConfidentiality" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'VOID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'MANUAL', 'CHECK', 'ACH', 'CASH');

-- CreateEnum
CREATE TYPE "TrustTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'SCREENING', 'CONFLICT_CHECK', 'CONSULTATION', 'RETAINED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AiJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiArtifactReviewStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('QUEUED', 'RUNNING', 'PARTIAL', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportItemStatus" AS ENUM ('PENDING', 'IMPORTED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('CLIO', 'MYCASE', 'FILEVINE', 'PRACTICEPANTHER', 'GMAIL', 'OUTLOOK', 'GENERIC_REST');

-- CreateEnum
CREATE TYPE "IntegrationConnectionStatus" AS ENUM ('CONNECTED', 'ERROR', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "IntegrationSyncStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "IntegrationWebhookStatus" AS ENUM ('ACTIVE', 'ERROR', 'DISABLED');

-- CreateEnum
CREATE TYPE "ExportJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "settingsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT,
    "mfaSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID,
    "contactId" UUID,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessPolicy" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "resourceType" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "conditionsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogEvent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadataJson" JSONB,
    "previousHash" TEXT,
    "eventHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "kind" "ContactKind" NOT NULL,
    "displayName" TEXT NOT NULL,
    "primaryEmail" TEXT,
    "primaryPhone" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rawSourcePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonProfile" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "barNumber" TEXT,
    "licenseJurisdiction" TEXT,
    "title" TEXT,

    CONSTRAINT "PersonProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationProfile" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "legalName" TEXT NOT NULL,
    "dba" TEXT,
    "website" TEXT,

    CONSTRAINT "OrganizationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMethod" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "type" "ContactMethodType" NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRelationship" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "fromContactId" UUID NOT NULL,
    "toContactId" UUID NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterType" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatterType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterStage" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "practiceArea" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatterStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantRoleDefinition" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sideDefault" "MatterParticipantSide",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantRoleDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matter" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "practiceArea" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "venue" TEXT,
    "stageId" UUID,
    "matterTypeId" UUID,
    "status" "MatterStatus" NOT NULL DEFAULT 'OPEN',
    "ethicalWallEnabled" BOOLEAN NOT NULL DEFAULT false,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "rawSourcePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterTeam" (
    "id" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatterTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterTeamMember" (
    "id" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "matterTeamId" UUID,
    "userId" UUID NOT NULL,
    "canWrite" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatterTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterAccessDeny" (
    "id" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatterAccessDeny_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterParticipant" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "participantRoleKey" TEXT NOT NULL,
    "participantRoleDefinitionId" UUID,
    "side" "MatterParticipantSide",
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "representedByContactId" UUID,
    "lawFirmContactId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatterParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterRelationship" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "fromMatterId" UUID NOT NULL,
    "toMatterId" UUID NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatterRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldDefinition" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "optionsJson" JSONB,
    "validationsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldValue" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldDefinitionId" UUID NOT NULL,
    "valueJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionDefinition" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterTypeId" UUID,
    "name" TEXT NOT NULL,
    "schemaJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionInstance" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "sectionDefinitionId" UUID NOT NULL,
    "dataJson" JSONB NOT NULL,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterTemplate" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "matterTypeId" UUID,
    "configJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatterTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageAutomation" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "fromStageId" UUID,
    "toStageId" UUID NOT NULL,
    "actionsJson" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeUserId" UUID,
    "dueAt" TIMESTAMP(3),
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "checklistJson" JSONB,
    "dependenciesJson" JSONB,
    "createdByUserId" UUID,
    "rawSourcePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "taskId" UUID,
    "userId" UUID NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "type" TEXT NOT NULL,
    "location" TEXT,
    "attendeesJson" JSONB,
    "description" TEXT,
    "source" TEXT,
    "rawSourcePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeadlineRuleTemplate" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "offsetDays" INTEGER NOT NULL,
    "businessDaysOnly" BOOLEAN NOT NULL DEFAULT false,
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeadlineRuleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceEvent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "detailsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocketEntry" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "filedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "sourceDocumentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocketEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationThread" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID,
    "contactId" UUID,
    "subject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationMessage" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "type" "CommunicationMessageType" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" UUID,
    "rawSourcePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationParticipant" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "contactId" UUID,
    "role" "CommunicationParticipantRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationAttachment" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "documentVersionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentFolder" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID,
    "parentFolderId" UUID,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "folderId" UUID,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidentialityLevel" "DocumentConfidentiality" NOT NULL DEFAULT 'CONFIDENTIAL',
    "sharedWithClient" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" UUID,
    "rawSourcePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedByUserId" UUID,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentShareLink" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "documentVersionId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "userId" UUID,
    "description" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER NOT NULL,
    "billableRate" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION NOT NULL,
    "utbmsPhaseCode" TEXT,
    "utbmsTaskCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "rawSourcePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "incurredAt" TIMESTAMP(3) NOT NULL,
    "receiptDocumentVersionId" UUID,
    "createdByUserId" UUID,
    "rawSourcePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "balanceDue" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "jurisdictionDisclaimer" TEXT,
    "pdfStorageKey" TEXT,
    "stripeCheckoutUrl" TEXT,
    "rawSourcePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "timeEntryId" UUID,
    "expenseId" UUID,
    "utbmsPhaseCode" TEXT,
    "utbmsTaskCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "stripePaymentIntentId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "rawSourcePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustAccount" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNumberMasked" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustTransaction" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "trustAccountId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "type" "TrustTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterTrustLedger" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "trustAccountId" UUID NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatterTrustLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "referralContactId" UUID,
    "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
    "assignedToUserId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeFormDefinition" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "schemaJson" JSONB NOT NULL,
    "isClientPortalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeFormDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeSubmission" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "intakeFormDefinitionId" UUID NOT NULL,
    "matterId" UUID,
    "leadId" UUID,
    "submittedByContactId" UUID,
    "dataJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntakeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConflictCheckResult" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "queryText" TEXT NOT NULL,
    "resultJson" JSONB NOT NULL,
    "searchedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConflictCheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementLetterTemplate" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "mergeFieldsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngagementLetterTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ESignEnvelope" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "engagementLetterTemplateId" UUID NOT NULL,
    "matterId" UUID,
    "documentId" UUID,
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ESignEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiJob" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "toolName" TEXT NOT NULL,
    "status" "AiJobStatus" NOT NULL DEFAULT 'QUEUED',
    "model" TEXT,
    "createdByUserId" UUID,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiArtifact" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadataJson" JSONB,
    "reviewedStatus" "AiArtifactReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSourceChunk" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "documentVersionId" UUID NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embedding" vector,
    "embeddingJson" JSONB,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSourceChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StylePack" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StylePack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StylePackSourceDoc" (
    "id" UUID NOT NULL,
    "stylePackId" UUID NOT NULL,
    "documentVersionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StylePackSourceDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiExecutionLog" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "aiJobId" UUID NOT NULL,
    "promptText" TEXT NOT NULL,
    "sourceRefsJson" JSONB,
    "modelParamsJson" JSONB,
    "systemPromptHash" TEXT,
    "createdByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'QUEUED',
    "startedByUserId" UUID,
    "mappingProfileId" UUID,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "summaryJson" JSONB,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportItem" (
    "id" UUID NOT NULL,
    "importBatchId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rawJson" JSONB NOT NULL,
    "resolvedEntityId" TEXT,
    "errorsJson" JSONB,
    "warningsJson" JSONB,
    "status" "ImportItemStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MappingProfile" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "fieldMappingsJson" JSONB,
    "transformsJson" JSONB,
    "dedupeRulesJson" JSONB,
    "conflictRulesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MappingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalReference" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalParentId" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importBatchId" UUID,
    "rawSourcePayload" JSONB,

    CONSTRAINT "ExternalReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyProfile" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "parcelNumber" TEXT,
    "permitsJson" JSONB,
    "inspectionsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractProfile" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "contractDate" TIMESTAMP(3),
    "contractPrice" DOUBLE PRECISION,
    "paymentScheduleJson" JSONB,
    "changeOrdersJson" JSONB,
    "warrantiesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "plannedDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "status" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefectIssue" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "locationInHome" TEXT,
    "severity" TEXT,
    "description" TEXT,
    "photoDocumentVersionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefectIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DamagesItem" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "repairEstimate" DOUBLE PRECISION,
    "paidAmount" DOUBLE PRECISION,
    "completionCost" DOUBLE PRECISION,
    "consequentialAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DamagesItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LienModel" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "claimantContactId" UUID,
    "amount" DOUBLE PRECISION NOT NULL,
    "recordingDate" TIMESTAMP(3),
    "releaseDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "documentId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LienModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceClaim" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "policyNumber" TEXT,
    "claimNumber" TEXT,
    "adjusterContactId" UUID,
    "insurerContactId" UUID,
    "coverageNotes" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertEngagement" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "matterId" UUID NOT NULL,
    "expertContactId" UUID NOT NULL,
    "scope" TEXT,
    "feeArrangement" TEXT,
    "reportDocumentId" UUID,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "IntegrationConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "configJson" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSyncRun" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "connectionId" UUID NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "IntegrationSyncStatus" NOT NULL DEFAULT 'QUEUED',
    "cursor" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationSyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationWebhookSubscription" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "connectionId" UUID NOT NULL,
    "event" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "status" "IntegrationWebhookStatus" NOT NULL DEFAULT 'ACTIVE',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationWebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" UUID NOT NULL,
    "webhookEndpointId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "responseCode" INTEGER,
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportJob" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "requestedByUserId" UUID,
    "exportType" TEXT NOT NULL,
    "status" "ExportJobStatus" NOT NULL DEFAULT 'QUEUED',
    "storageKey" TEXT,
    "summaryJson" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RolePermissions" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_RolePermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_organizationId_userId_key" ON "Membership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Role_organizationId_idx" ON "Role"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_organizationId_name_key" ON "Role"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Permission_organizationId_idx" ON "Permission"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_organizationId_key_key" ON "Permission"("organizationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_organizationId_idx" ON "Session"("organizationId");

-- CreateIndex
CREATE INDEX "AccessPolicy_organizationId_resourceType_idx" ON "AccessPolicy"("organizationId", "resourceType");

-- CreateIndex
CREATE INDEX "AuditLogEvent_organizationId_createdAt_idx" ON "AuditLogEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLogEvent_organizationId_eventHash_key" ON "AuditLogEvent"("organizationId", "eventHash");

-- CreateIndex
CREATE INDEX "Contact_organizationId_idx" ON "Contact"("organizationId");

-- CreateIndex
CREATE INDEX "Contact_primaryEmail_idx" ON "Contact"("primaryEmail");

-- CreateIndex
CREATE INDEX "Contact_primaryPhone_idx" ON "Contact"("primaryPhone");

-- CreateIndex
CREATE UNIQUE INDEX "PersonProfile_contactId_key" ON "PersonProfile"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationProfile_contactId_key" ON "OrganizationProfile"("contactId");

-- CreateIndex
CREATE INDEX "ContactRelationship_organizationId_idx" ON "ContactRelationship"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "MatterType_organizationId_name_key" ON "MatterType"("organizationId", "name");

-- CreateIndex
CREATE INDEX "MatterStage_organizationId_practiceArea_orderIndex_idx" ON "MatterStage"("organizationId", "practiceArea", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantRoleDefinition_organizationId_key_key" ON "ParticipantRoleDefinition"("organizationId", "key");

-- CreateIndex
CREATE INDEX "Matter_organizationId_status_idx" ON "Matter"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Matter_organizationId_matterNumber_key" ON "Matter"("organizationId", "matterNumber");

-- CreateIndex
CREATE INDEX "MatterTeam_matterId_idx" ON "MatterTeam"("matterId");

-- CreateIndex
CREATE INDEX "MatterTeamMember_matterTeamId_idx" ON "MatterTeamMember"("matterTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "MatterTeamMember_matterId_userId_key" ON "MatterTeamMember"("matterId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatterAccessDeny_matterId_userId_key" ON "MatterAccessDeny"("matterId", "userId");

-- CreateIndex
CREATE INDEX "MatterParticipant_organizationId_matterId_idx" ON "MatterParticipant"("organizationId", "matterId");

-- CreateIndex
CREATE INDEX "MatterParticipant_participantRoleKey_idx" ON "MatterParticipant"("participantRoleKey");

-- CreateIndex
CREATE INDEX "MatterRelationship_organizationId_idx" ON "MatterRelationship"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_organizationId_entityType_key_key" ON "CustomFieldDefinition"("organizationId", "entityType", "key");

-- CreateIndex
CREATE INDEX "CustomFieldValue_organizationId_entityType_entityId_idx" ON "CustomFieldValue"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldValue_organizationId_entityType_entityId_fieldDe_key" ON "CustomFieldValue"("organizationId", "entityType", "entityId", "fieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionInstance_matterId_sectionDefinitionId_key" ON "SectionInstance"("matterId", "sectionDefinitionId");

-- CreateIndex
CREATE INDEX "Task_organizationId_matterId_dueAt_idx" ON "Task"("organizationId", "matterId", "dueAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_organizationId_startAt_idx" ON "CalendarEvent"("organizationId", "startAt");

-- CreateIndex
CREATE INDEX "CommunicationThread_organizationId_matterId_idx" ON "CommunicationThread"("organizationId", "matterId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_organizationId_occurredAt_idx" ON "CommunicationMessage"("organizationId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationAttachment_messageId_documentVersionId_key" ON "CommunicationAttachment"("messageId", "documentVersionId");

-- CreateIndex
CREATE INDEX "Document_organizationId_matterId_idx" ON "Document"("organizationId", "matterId");

-- CreateIndex
CREATE INDEX "DocumentVersion_organizationId_documentId_idx" ON "DocumentVersion"("organizationId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentShareLink_token_key" ON "DocumentShareLink"("token");

-- CreateIndex
CREATE INDEX "TimeEntry_organizationId_matterId_idx" ON "TimeEntry"("organizationId", "matterId");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_status_idx" ON "Invoice"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_organizationId_invoiceNumber_key" ON "Invoice"("organizationId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "Payment_organizationId_idx" ON "Payment"("organizationId");

-- CreateIndex
CREATE INDEX "TrustTransaction_organizationId_trustAccountId_idx" ON "TrustTransaction"("organizationId", "trustAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "MatterTrustLedger_organizationId_matterId_trustAccountId_key" ON "MatterTrustLedger"("organizationId", "matterId", "trustAccountId");

-- CreateIndex
CREATE INDEX "AiJob_organizationId_matterId_createdAt_idx" ON "AiJob"("organizationId", "matterId", "createdAt");

-- CreateIndex
CREATE INDEX "AiSourceChunk_organizationId_documentVersionId_idx" ON "AiSourceChunk"("organizationId", "documentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "StylePack_organizationId_name_key" ON "StylePack"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "StylePackSourceDoc_stylePackId_documentVersionId_key" ON "StylePackSourceDoc"("stylePackId", "documentVersionId");

-- CreateIndex
CREATE INDEX "ImportBatch_organizationId_startedAt_idx" ON "ImportBatch"("organizationId", "startedAt");

-- CreateIndex
CREATE INDEX "ImportItem_importBatchId_status_idx" ON "ImportItem"("importBatchId", "status");

-- CreateIndex
CREATE INDEX "ExternalReference_organizationId_entityType_entityId_idx" ON "ExternalReference"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalReference_organizationId_sourceSystem_entityType_ex_key" ON "ExternalReference"("organizationId", "sourceSystem", "entityType", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyProfile_matterId_key" ON "PropertyProfile"("matterId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractProfile_matterId_key" ON "ContractProfile"("matterId");

-- CreateIndex
CREATE INDEX "IntegrationConnection_organizationId_provider_idx" ON "IntegrationConnection"("organizationId", "provider");

-- CreateIndex
CREATE INDEX "IntegrationSyncRun_organizationId_status_idx" ON "IntegrationSyncRun"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationSyncRun_connectionId_idempotencyKey_key" ON "IntegrationSyncRun"("connectionId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationWebhookSubscription_connectionId_event_targetUrl_key" ON "IntegrationWebhookSubscription"("connectionId", "event", "targetUrl");

-- CreateIndex
CREATE INDEX "WebhookDelivery_webhookEndpointId_status_idx" ON "WebhookDelivery"("webhookEndpointId", "status");

-- CreateIndex
CREATE INDEX "ExportJob_organizationId_createdAt_idx" ON "ExportJob"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "_RolePermissions_B_index" ON "_RolePermissions"("B");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogEvent" ADD CONSTRAINT "AuditLogEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonProfile" ADD CONSTRAINT "PersonProfile_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationProfile" ADD CONSTRAINT "OrganizationProfile_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMethod" ADD CONSTRAINT "ContactMethod_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRelationship" ADD CONSTRAINT "ContactRelationship_fromContactId_fkey" FOREIGN KEY ("fromContactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRelationship" ADD CONSTRAINT "ContactRelationship_toContactId_fkey" FOREIGN KEY ("toContactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "MatterStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_matterTypeId_fkey" FOREIGN KEY ("matterTypeId") REFERENCES "MatterType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterTeam" ADD CONSTRAINT "MatterTeam_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterTeamMember" ADD CONSTRAINT "MatterTeamMember_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterTeamMember" ADD CONSTRAINT "MatterTeamMember_matterTeamId_fkey" FOREIGN KEY ("matterTeamId") REFERENCES "MatterTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterTeamMember" ADD CONSTRAINT "MatterTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterAccessDeny" ADD CONSTRAINT "MatterAccessDeny_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterAccessDeny" ADD CONSTRAINT "MatterAccessDeny_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterParticipant" ADD CONSTRAINT "MatterParticipant_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterParticipant" ADD CONSTRAINT "MatterParticipant_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterParticipant" ADD CONSTRAINT "MatterParticipant_participantRoleDefinitionId_fkey" FOREIGN KEY ("participantRoleDefinitionId") REFERENCES "ParticipantRoleDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterParticipant" ADD CONSTRAINT "MatterParticipant_representedByContactId_fkey" FOREIGN KEY ("representedByContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterParticipant" ADD CONSTRAINT "MatterParticipant_lawFirmContactId_fkey" FOREIGN KEY ("lawFirmContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterRelationship" ADD CONSTRAINT "MatterRelationship_fromMatterId_fkey" FOREIGN KEY ("fromMatterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterRelationship" ADD CONSTRAINT "MatterRelationship_toMatterId_fkey" FOREIGN KEY ("toMatterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "CustomFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionDefinition" ADD CONSTRAINT "SectionDefinition_matterTypeId_fkey" FOREIGN KEY ("matterTypeId") REFERENCES "MatterType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionInstance" ADD CONSTRAINT "SectionInstance_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionInstance" ADD CONSTRAINT "SectionInstance_sectionDefinitionId_fkey" FOREIGN KEY ("sectionDefinitionId") REFERENCES "SectionDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionInstance" ADD CONSTRAINT "SectionInstance_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageAutomation" ADD CONSTRAINT "StageAutomation_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "MatterStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageAutomation" ADD CONSTRAINT "StageAutomation_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "MatterStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceEvent" ADD CONSTRAINT "ServiceEvent_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocketEntry" ADD CONSTRAINT "DocketEntry_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocketEntry" ADD CONSTRAINT "DocketEntry_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationThread" ADD CONSTRAINT "CommunicationThread_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationThread" ADD CONSTRAINT "CommunicationThread_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CommunicationThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationParticipant" ADD CONSTRAINT "CommunicationParticipant_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CommunicationMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationParticipant" ADD CONSTRAINT "CommunicationParticipant_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationAttachment" ADD CONSTRAINT "CommunicationAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CommunicationMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationAttachment" ADD CONSTRAINT "CommunicationAttachment_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShareLink" ADD CONSTRAINT "DocumentShareLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShareLink" ADD CONSTRAINT "DocumentShareLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_receiptDocumentVersionId_fkey" FOREIGN KEY ("receiptDocumentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_timeEntryId_fkey" FOREIGN KEY ("timeEntryId") REFERENCES "TimeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustTransaction" ADD CONSTRAINT "TrustTransaction_trustAccountId_fkey" FOREIGN KEY ("trustAccountId") REFERENCES "TrustAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustTransaction" ADD CONSTRAINT "TrustTransaction_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterTrustLedger" ADD CONSTRAINT "MatterTrustLedger_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterTrustLedger" ADD CONSTRAINT "MatterTrustLedger_trustAccountId_fkey" FOREIGN KEY ("trustAccountId") REFERENCES "TrustAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_referralContactId_fkey" FOREIGN KEY ("referralContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeSubmission" ADD CONSTRAINT "IntakeSubmission_intakeFormDefinitionId_fkey" FOREIGN KEY ("intakeFormDefinitionId") REFERENCES "IntakeFormDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeSubmission" ADD CONSTRAINT "IntakeSubmission_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeSubmission" ADD CONSTRAINT "IntakeSubmission_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConflictCheckResult" ADD CONSTRAINT "ConflictCheckResult_searchedByUserId_fkey" FOREIGN KEY ("searchedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ESignEnvelope" ADD CONSTRAINT "ESignEnvelope_engagementLetterTemplateId_fkey" FOREIGN KEY ("engagementLetterTemplateId") REFERENCES "EngagementLetterTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ESignEnvelope" ADD CONSTRAINT "ESignEnvelope_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ESignEnvelope" ADD CONSTRAINT "ESignEnvelope_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiJob" ADD CONSTRAINT "AiJob_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiJob" ADD CONSTRAINT "AiJob_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiArtifact" ADD CONSTRAINT "AiArtifact_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "AiJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiArtifact" ADD CONSTRAINT "AiArtifact_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSourceChunk" ADD CONSTRAINT "AiSourceChunk_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StylePackSourceDoc" ADD CONSTRAINT "StylePackSourceDoc_stylePackId_fkey" FOREIGN KEY ("stylePackId") REFERENCES "StylePack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StylePackSourceDoc" ADD CONSTRAINT "StylePackSourceDoc_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiExecutionLog" ADD CONSTRAINT "AiExecutionLog_aiJobId_fkey" FOREIGN KEY ("aiJobId") REFERENCES "AiJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiExecutionLog" ADD CONSTRAINT "AiExecutionLog_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_startedByUserId_fkey" FOREIGN KEY ("startedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_mappingProfileId_fkey" FOREIGN KEY ("mappingProfileId") REFERENCES "MappingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportItem" ADD CONSTRAINT "ImportItem_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalReference" ADD CONSTRAINT "ExternalReference_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyProfile" ADD CONSTRAINT "PropertyProfile_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractProfile" ADD CONSTRAINT "ContractProfile_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefectIssue" ADD CONSTRAINT "DefectIssue_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamagesItem" ADD CONSTRAINT "DamagesItem_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LienModel" ADD CONSTRAINT "LienModel_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LienModel" ADD CONSTRAINT "LienModel_claimantContactId_fkey" FOREIGN KEY ("claimantContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LienModel" ADD CONSTRAINT "LienModel_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_adjusterContactId_fkey" FOREIGN KEY ("adjusterContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_insurerContactId_fkey" FOREIGN KEY ("insurerContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertEngagement" ADD CONSTRAINT "ExpertEngagement_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertEngagement" ADD CONSTRAINT "ExpertEngagement_expertContactId_fkey" FOREIGN KEY ("expertContactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertEngagement" ADD CONSTRAINT "ExpertEngagement_reportDocumentId_fkey" FOREIGN KEY ("reportDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncRun" ADD CONSTRAINT "IntegrationSyncRun_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhookSubscription" ADD CONSTRAINT "IntegrationWebhookSubscription_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookEndpointId_fkey" FOREIGN KEY ("webhookEndpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportJob" ADD CONSTRAINT "ExportJob_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
