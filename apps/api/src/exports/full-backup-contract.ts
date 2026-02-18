export const FULL_BACKUP_CONTRACT_VERSION = '1.0.0';

export type FullBackupCsvContract = {
  fileName: string;
  requiredColumns: string[];
};

export const FULL_BACKUP_CSV_CONTRACT: FullBackupCsvContract[] = [
  {
    fileName: 'contacts.csv',
    requiredColumns: [
      'id',
      'organizationId',
      'kind',
      'displayName',
      'primaryEmail',
      'primaryPhone',
      'tags',
      'rawSourcePayload',
      'createdAt',
      'updatedAt',
    ],
  },
  {
    fileName: 'matters.csv',
    requiredColumns: [
      'id',
      'organizationId',
      'matterNumber',
      'name',
      'practiceArea',
      'jurisdiction',
      'venue',
      'stageId',
      'matterTypeId',
      'status',
      'ethicalWallEnabled',
      'openedAt',
      'closedAt',
      'rawSourcePayload',
      'createdAt',
      'updatedAt',
    ],
  },
  {
    fileName: 'tasks.csv',
    requiredColumns: [
      'id',
      'organizationId',
      'matterId',
      'title',
      'description',
      'assigneeUserId',
      'dueAt',
      'priority',
      'status',
      'checklistJson',
      'dependenciesJson',
      'createdByUserId',
      'rawSourcePayload',
      'createdAt',
      'updatedAt',
    ],
  },
  {
    fileName: 'events.csv',
    requiredColumns: [
      'id',
      'organizationId',
      'matterId',
      'startAt',
      'endAt',
      'type',
      'location',
      'attendeesJson',
      'description',
      'source',
      'rawSourcePayload',
      'createdAt',
      'updatedAt',
    ],
  },
  {
    fileName: 'time_entries.csv',
    requiredColumns: [
      'id',
      'organizationId',
      'matterId',
      'userId',
      'description',
      'startedAt',
      'endedAt',
      'durationMinutes',
      'billableRate',
      'amount',
      'utbmsPhaseCode',
      'utbmsTaskCode',
      'status',
      'rawSourcePayload',
      'createdAt',
      'updatedAt',
    ],
  },
  {
    fileName: 'invoices.csv',
    requiredColumns: [
      'id',
      'organizationId',
      'matterId',
      'invoiceNumber',
      'status',
      'issuedAt',
      'dueAt',
      'subtotal',
      'tax',
      'total',
      'balanceDue',
      'notes',
      'jurisdictionDisclaimer',
      'pdfStorageKey',
      'stripeCheckoutUrl',
      'rawSourcePayload',
      'createdAt',
      'updatedAt',
    ],
  },
  {
    fileName: 'payments.csv',
    requiredColumns: [
      'id',
      'organizationId',
      'invoiceId',
      'amount',
      'method',
      'stripePaymentIntentId',
      'receivedAt',
      'reference',
      'rawSourcePayload',
      'createdAt',
    ],
  },
  {
    fileName: 'messages.csv',
    requiredColumns: [
      'id',
      'organizationId',
      'threadId',
      'type',
      'direction',
      'subject',
      'body',
      'occurredAt',
      'createdByUserId',
      'rawSourcePayload',
      'createdAt',
      'updatedAt',
    ],
  },
  {
    fileName: 'notes.csv',
    requiredColumns: [
      'id',
      'organizationId',
      'threadId',
      'type',
      'direction',
      'subject',
      'body',
      'occurredAt',
      'createdByUserId',
      'rawSourcePayload',
      'createdAt',
      'updatedAt',
    ],
  },
  {
    fileName: 'custom_fields.csv',
    requiredColumns: [
      'id',
      'organizationId',
      'entityType',
      'entityId',
      'fieldDefinitionId',
      'valueJson',
      'createdAt',
      'updatedAt',
    ],
  },
];

export const FULL_BACKUP_MANIFEST_FILE = 'documents/manifest.json';
const MANIFEST_REQUIRED_FIELDS = ['documentId', 'documentVersionId', 'path', 'matterId', 'title'] as const;

export type FullBackupManifestEntry = {
  documentId: string;
  documentVersionId: string;
  path: string;
  matterId: string;
  title: string;
  storageKey?: string;
  mimeType?: string;
  size?: number;
  sha256?: string;
  placeholder?: boolean;
};

export type FullBackupValidationIssueCode =
  | 'missing_required_file'
  | 'missing_required_column'
  | 'manifest_missing_field'
  | 'manifest_invalid_path'
  | 'manifest_missing_blob'
  | 'manifest_duplicate_document_version'
  | 'manifest_duplicate_path'
  | 'manifest_placeholder_mismatch';

export type FullBackupValidationIssue = {
  code: FullBackupValidationIssueCode;
  file?: string;
  field?: string;
  entryIndex?: number;
  message: string;
};

export type FullBackupValidationResult = {
  valid: boolean;
  contractVersion: string;
  checkedAt: string;
  issues: FullBackupValidationIssue[];
};

export function validateFullBackupPackageConformance(input: {
  csvColumnsByFile: Record<string, string[]>;
  manifestEntries: FullBackupManifestEntry[];
  archivePaths: Iterable<string>;
}): FullBackupValidationResult {
  const issues: FullBackupValidationIssue[] = [];
  const archivePaths = new Set(input.archivePaths);
  const seenDocumentVersions = new Map<string, number>();
  const seenPaths = new Map<string, number>();

  for (const contract of FULL_BACKUP_CSV_CONTRACT) {
    if (!archivePaths.has(contract.fileName) || !input.csvColumnsByFile[contract.fileName]) {
      issues.push({
        code: 'missing_required_file',
        file: contract.fileName,
        message: `Missing required export file: ${contract.fileName}`,
      });
      continue;
    }

    const actualColumns = new Set(input.csvColumnsByFile[contract.fileName]);
    for (const column of contract.requiredColumns) {
      if (!actualColumns.has(column)) {
        issues.push({
          code: 'missing_required_column',
          file: contract.fileName,
          field: column,
          message: `Missing required column "${column}" in ${contract.fileName}`,
        });
      }
    }
  }

  if (!archivePaths.has(FULL_BACKUP_MANIFEST_FILE)) {
    issues.push({
      code: 'missing_required_file',
      file: FULL_BACKUP_MANIFEST_FILE,
      message: `Missing required export file: ${FULL_BACKUP_MANIFEST_FILE}`,
    });
  }

  input.manifestEntries.forEach((entry, entryIndex) => {
    MANIFEST_REQUIRED_FIELDS.forEach((field) => {
      const value = entry[field];
      if (typeof value !== 'string' || value.trim().length === 0) {
        issues.push({
          code: 'manifest_missing_field',
          file: FULL_BACKUP_MANIFEST_FILE,
          field,
          entryIndex,
          message: `Manifest entry ${entryIndex} missing required field "${field}"`,
        });
      }
    });

    const path = entry.path;
    if (typeof path === 'string') {
      if (!path.startsWith('documents/') || path.includes('..')) {
        issues.push({
          code: 'manifest_invalid_path',
          file: FULL_BACKUP_MANIFEST_FILE,
          field: 'path',
          entryIndex,
          message: `Manifest entry ${entryIndex} has invalid path "${path}"`,
        });
      }

      const priorPathIndex = seenPaths.get(path);
      if (priorPathIndex !== undefined) {
        issues.push({
          code: 'manifest_duplicate_path',
          file: FULL_BACKUP_MANIFEST_FILE,
          field: 'path',
          entryIndex,
          message: `Manifest entry ${entryIndex} reuses path "${path}" from entry ${priorPathIndex}`,
        });
      } else {
        seenPaths.set(path, entryIndex);
      }

      const placeholder = entry.placeholder === true;
      const hasMissingSuffix = path.endsWith('.missing.txt');
      if (placeholder !== hasMissingSuffix) {
        issues.push({
          code: 'manifest_placeholder_mismatch',
          file: FULL_BACKUP_MANIFEST_FILE,
          field: 'placeholder',
          entryIndex,
          message: `Manifest entry ${entryIndex} placeholder flag does not match path suffix for "${path}"`,
        });
      }

      if (!archivePaths.has(path)) {
        issues.push({
          code: 'manifest_missing_blob',
          file: FULL_BACKUP_MANIFEST_FILE,
          field: 'path',
          entryIndex,
          message: `Manifest entry ${entryIndex} references missing file "${path}"`,
        });
      }
    }

    if (typeof entry.documentVersionId === 'string' && entry.documentVersionId.trim().length > 0) {
      const priorVersionIndex = seenDocumentVersions.get(entry.documentVersionId);
      if (priorVersionIndex !== undefined) {
        issues.push({
          code: 'manifest_duplicate_document_version',
          file: FULL_BACKUP_MANIFEST_FILE,
          field: 'documentVersionId',
          entryIndex,
          message: `Manifest entry ${entryIndex} reuses documentVersionId "${entry.documentVersionId}" from entry ${priorVersionIndex}`,
        });
      } else {
        seenDocumentVersions.set(entry.documentVersionId, entryIndex);
      }
    }
  });

  return {
    valid: issues.length === 0,
    contractVersion: FULL_BACKUP_CONTRACT_VERSION,
    checkedAt: new Date().toISOString(),
    issues,
  };
}
