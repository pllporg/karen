import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const schemaPath = join(__dirname, '../prisma/schema.prisma');
const checklistPath = join(__dirname, '../../../docs/parity/data-model-checklist.md');

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getModelNames(schema: string) {
  return [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((match) => match[1]);
}

function getModelBlock(schema: string, modelName: string) {
  const pattern = new RegExp(`model\\s+${escapeRegExp(modelName)}\\s+\\{([\\s\\S]*?)\\n\\}`, 'm');
  const match = schema.match(pattern);
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}

describe('Prisma schema conformance', () => {
  const schema = readFileSync(schemaPath, 'utf8');
  const checklist = readFileSync(checklistPath, 'utf8');

  it('includes prompt-required core models tracked as complete/partial in the parity checklist', () => {
    const requiredModels = [
      'Organization',
      'User',
      'Membership',
      'Role',
      'Permission',
      'AccessPolicy',
      'AuditLogEvent',
      'MatterTeam',
      'MatterTeamMember',
      'Contact',
      'PersonProfile',
      'OrganizationProfile',
      'ContactMethod',
      'ContactRelationship',
      'Matter',
      'MatterStage',
      'MatterType',
      'ParticipantRoleDefinition',
      'MatterParticipant',
      'MatterRelationship',
      'CustomFieldDefinition',
      'CustomFieldValue',
      'SectionDefinition',
      'SectionInstance',
      'Task',
      'TaskTemplate',
      'MatterTemplate',
      'StageAutomation',
      'Reminder',
      'Notification',
      'CalendarEvent',
      'DeadlineRuleTemplate',
      'ServiceEvent',
      'DocketEntry',
      'CommunicationThread',
      'CommunicationMessage',
      'CommunicationParticipant',
      'CommunicationAttachment',
      'Document',
      'DocumentVersion',
      'DocumentFolder',
      'DocumentShareLink',
      'EvidenceItem',
      'DocumentRetentionPolicy',
      'DocumentLegalHold',
      'DocumentDispositionRun',
      'DocumentDispositionItem',
      'TimeEntry',
      'Expense',
      'Invoice',
      'InvoiceLineItem',
      'Payment',
      'TrustAccount',
      'TrustTransaction',
      'MatterTrustLedger',
      'TrustReconciliationRun',
      'TrustReconciliationDiscrepancy',
      'Lead',
      'IntakeFormDefinition',
      'IntakeSubmission',
      'ConflictCheckResult',
      'EngagementLetterTemplate',
      'ESignEnvelope',
      'AiJob',
      'AiArtifact',
      'AiSourceChunk',
      'StylePack',
      'StylePackSourceDoc',
      'AiExecutionLog',
      'ImportBatch',
      'ImportItem',
      'MappingProfile',
      'ExternalReference',
      'PropertyProfile',
      'ContractProfile',
      'ProjectMilestone',
      'DefectIssue',
      'DamagesItem',
      'LienModel',
      'InsuranceClaim',
      'ExpertEngagement',
      'IntegrationConnection',
      'IntegrationSyncRun',
      'IntegrationWebhookSubscription',
      'WebhookEndpoint',
      'WebhookDelivery',
      'LEDESExportProfile',
      'LEDESExportJob',
    ];

    const modelNames = new Set(getModelNames(schema));
    for (const modelName of requiredModels) {
      expect(modelNames.has(modelName)).toBe(true);
    }
  });

  it('uses UUID-backed string IDs consistently across all Prisma models', () => {
    const modelNames = getModelNames(schema);
    for (const modelName of modelNames) {
      const block = getModelBlock(schema, modelName);
      expect(block).toMatch(/^\s*id\s+String\s+@id\s+@default\(uuid\(\)\)/m);
    }
  });

  it('preserves required field semantics for high-risk schema surfaces', () => {
    const requiredFieldMap: Record<string, string[]> = {
      AuditLogEvent: ['organizationId', 'previousHash', 'eventHash', 'entityType', 'entityId'],
      Contact: ['kind', 'displayName', 'primaryEmail', 'primaryPhone', 'tags', 'rawSourcePayload'],
      MatterParticipant: [
        'organizationId',
        'participantRoleKey',
        'participantRoleDefinitionId',
        'side',
        'isPrimary',
        'representedByContactId',
        'lawFirmContactId',
      ],
      ImportBatch: ['organizationId', 'sourceSystem', 'status', 'startedByUserId', 'mappingProfileId', 'summaryJson'],
      ImportItem: ['importBatchId', 'entityType', 'rowNumber', 'rawJson', 'resolvedEntityId', 'errorsJson', 'warningsJson'],
      MappingProfile: ['organizationId', 'fieldMappingsJson', 'transformsJson', 'dedupeRulesJson', 'conflictRulesJson'],
      ExternalReference: [
        'organizationId',
        'entityType',
        'entityId',
        'sourceSystem',
        'externalId',
        'externalParentId',
        'importedAt',
        'importBatchId',
        'rawSourcePayload',
      ],
      DocumentRetentionPolicy: [
        'organizationId',
        'scope',
        'retentionDays',
        'trigger',
        'requireApproval',
        'isActive',
      ],
      DocumentLegalHold: ['organizationId', 'documentId', 'status', 'placedByUserId', 'releasedByUserId', 'placedAt', 'releasedAt'],
      DocumentDispositionRun: ['organizationId', 'policyId', 'status', 'cutoffAt', 'requestedByUserId', 'approvedByUserId', 'executedByUserId'],
      TrustReconciliationRun: [
        'organizationId',
        'trustAccountId',
        'statementStartAt',
        'statementEndAt',
        'status',
        'summaryJson',
        'signedOffByUserId',
      ],
      TrustReconciliationDiscrepancy: [
        'organizationId',
        'runId',
        'trustAccountId',
        'matterId',
        'reasonCode',
        'expectedBalance',
        'ledgerBalance',
        'difference',
        'status',
        'resolvedByUserId',
      ],
      LEDESExportProfile: [
        'organizationId',
        'format',
        'requireUtbmsPhaseCode',
        'requireUtbmsTaskCode',
        'includeExpenseLineItems',
        'validationRulesJson',
      ],
      LEDESExportJob: [
        'organizationId',
        'profileId',
        'validationStatus',
        'format',
        'invoiceIds',
        'lineCount',
        'totalAmount',
        'checksumSha256',
      ],
      AiSourceChunk: ['organizationId', 'documentVersionId', 'chunkText', 'embedding', 'embeddingJson', 'metadataJson'],
      AiExecutionLog: ['organizationId', 'aiJobId', 'promptText', 'sourceRefsJson', 'modelParamsJson', 'systemPromptHash', 'createdByUserId'],
      IntegrationConnection: ['organizationId', 'provider', 'encryptedAccessToken', 'encryptedRefreshToken', 'tokenExpiresAt'],
      IntegrationSyncRun: ['organizationId', 'connectionId', 'idempotencyKey', 'status', 'cursor'],
      IntegrationWebhookSubscription: ['organizationId', 'connectionId', 'event', 'targetUrl', 'status', 'externalId'],
    };

    for (const [modelName, fields] of Object.entries(requiredFieldMap)) {
      const block = getModelBlock(schema, modelName);
      for (const field of fields) {
        expect(block).toMatch(new RegExp(`^\\s*${escapeRegExp(field)}\\b`, 'm'));
      }
    }
  });

  it('keeps explicit partial/missing gap links documented for non-REQ-DATA-001 items', () => {
    const requiredGapRefs = ['REQ-DATA-003', 'REQ-MAT-001', 'REQ-MAT-004', 'REQ-PORT-003'];
    for (const requirementId of requiredGapRefs) {
      expect(checklist).toContain(requirementId);
    }
  });
});
