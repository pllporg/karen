import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import XLSX from 'xlsx';
import { UploadedFile } from '../../common/types';
import { ImportPlugin, ParsedImportRow } from './import-plugin.interface';

type TransformResult = {
  rawJson: Prisma.InputJsonObject;
  warnings?: Prisma.InputJsonArray;
};

type ClioDefinition = {
  entityType: string;
  aliases: string[];
  knownColumns: string[];
  transform: (rawInput: Record<string, unknown>) => TransformResult;
};

function normalizeKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function lowerCaseRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    normalized[normalizeKey(key)] = value;
  }
  return normalized;
}

function pickString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[normalizeKey(key)];
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    return asString(value);
  }
  return '';
}

function buildWarning(code: string, message: string, context?: Record<string, unknown>): Prisma.InputJsonObject {
  return {
    code,
    message,
    context: (context ? JSON.parse(JSON.stringify(context)) : {}) as Prisma.InputJsonObject,
  };
}

function makeContactTransform(defaultKind: 'PERSON' | 'ORGANIZATION') {
  return (rawInput: Record<string, unknown>): TransformResult => {
    const normalized = lowerCaseRecord(rawInput);
    const firstName = pickString(normalized, ['first_name', 'firstname', 'given_name']);
    const lastName = pickString(normalized, ['last_name', 'lastname', 'surname', 'family_name']);
    const nameFromParts = [firstName, lastName].filter(Boolean).join(' ').trim();
    const displayName = pickString(normalized, [
      'display_name',
      'full_name',
      'name',
      'company_name',
      'organization_name',
      'legal_name',
      'dba',
    ]);
    const resolvedDisplayName = displayName || nameFromParts || 'Imported Contact';

    const canonical: Record<string, unknown> = {
      id: pickString(normalized, ['id', 'contact_id', 'person_id', 'company_id']) || resolvedDisplayName,
      display_name: resolvedDisplayName,
      name: resolvedDisplayName,
      email: pickString(normalized, ['email', 'primary_email', 'email_address']),
      phone: pickString(normalized, ['phone', 'primary_phone', 'phone_number', 'mobile']),
    };

    if (defaultKind === 'ORGANIZATION') {
      canonical.organization = true;
      canonical.legal_name = resolvedDisplayName;
    }

    return { rawJson: canonical as Prisma.InputJsonObject };
  };
}

function transformMatter(rawInput: Record<string, unknown>): TransformResult {
  const normalized = lowerCaseRecord(rawInput);
  const externalId = pickString(normalized, ['id', 'matter_id']);
  const matterNumber = pickString(normalized, ['matter_number', 'number', 'file_number']) || externalId;
  const name = pickString(normalized, ['name', 'title', 'matter_name']) || `Imported Matter ${matterNumber || ''}`.trim();

  return {
    rawJson: {
      id: externalId || matterNumber,
      matter_number: matterNumber || externalId,
      name,
      practice_area: pickString(normalized, ['practice_area', 'practice', 'area']),
      jurisdiction: pickString(normalized, ['jurisdiction']),
      venue: pickString(normalized, ['venue']),
    } as Prisma.InputJsonObject,
  };
}

function transformTask(rawInput: Record<string, unknown>): TransformResult {
  const normalized = lowerCaseRecord(rawInput);
  const matterId = pickString(normalized, ['matter_id', 'matter', 'matter_external_id']);
  const warnings: Prisma.InputJsonObject[] = [];
  if (!matterId) {
    warnings.push(
      buildWarning('missing_matter_reference', 'Task row missing matter reference', {
        candidateFields: ['matter_id', 'matter', 'matter_external_id'],
      }),
    );
  }

  return {
    rawJson: {
      id: pickString(normalized, ['id', 'task_id']),
      matter_id: matterId,
      title: pickString(normalized, ['title', 'name', 'task_name']) || 'Imported Task',
      description: pickString(normalized, ['description', 'details', 'note']),
      due_at: pickString(normalized, ['due_at', 'due_date', 'deadline']),
    } as Prisma.InputJsonObject,
    warnings: warnings.length ? (warnings as Prisma.InputJsonArray) : undefined,
  };
}

function transformCalendar(rawInput: Record<string, unknown>): TransformResult {
  const normalized = lowerCaseRecord(rawInput);
  const matterId = pickString(normalized, ['matter_id', 'matter', 'matter_external_id']);
  const warnings: Prisma.InputJsonObject[] = [];
  if (!matterId) {
    warnings.push(
      buildWarning('missing_matter_reference', 'Calendar row missing matter reference', {
        candidateFields: ['matter_id', 'matter', 'matter_external_id'],
      }),
    );
  }

  return {
    rawJson: {
      id: pickString(normalized, ['id', 'event_id']),
      matter_id: matterId,
      title: pickString(normalized, ['title', 'name']) || 'Imported Event',
      type: pickString(normalized, ['type', 'event_type']) || pickString(normalized, ['title', 'name']) || 'Imported Event',
      start_at: pickString(normalized, ['start_at', 'start', 'start_time', 'date']),
      end_at: pickString(normalized, ['end_at', 'end', 'end_time']),
      location: pickString(normalized, ['location']),
      description: pickString(normalized, ['description', 'details']),
    } as Prisma.InputJsonObject,
    warnings: warnings.length ? (warnings as Prisma.InputJsonArray) : undefined,
  };
}

function transformActivity(rawInput: Record<string, unknown>): TransformResult {
  const normalized = lowerCaseRecord(rawInput);
  const matterId = pickString(normalized, ['matter_id', 'matter', 'matter_external_id']);
  const warnings: Prisma.InputJsonObject[] = [];
  if (!matterId) {
    warnings.push(
      buildWarning('missing_matter_reference', 'Activity row missing matter reference', {
        candidateFields: ['matter_id', 'matter', 'matter_external_id'],
      }),
    );
  }

  return {
    rawJson: {
      id: pickString(normalized, ['id', 'activity_id', 'time_entry_id']),
      matter_id: matterId,
      description: pickString(normalized, ['description', 'narrative', 'note']),
      started_at: pickString(normalized, ['started_at', 'start', 'start_time', 'date']),
      ended_at: pickString(normalized, ['ended_at', 'end', 'end_time']),
      minutes: pickString(normalized, ['minutes', 'duration_minutes', 'duration']),
      rate: pickString(normalized, ['rate', 'billable_rate']),
      amount: pickString(normalized, ['amount', 'total']),
      utbms_phase: pickString(normalized, ['utbms_phase', 'phase_code']),
      utbms_task: pickString(normalized, ['utbms_task', 'task_code']),
    } as Prisma.InputJsonObject,
    warnings: warnings.length ? (warnings as Prisma.InputJsonArray) : undefined,
  };
}

function transformCommunication(rawInput: Record<string, unknown>): TransformResult {
  const normalized = lowerCaseRecord(rawInput);
  const matterId = pickString(normalized, ['matter_id', 'matter', 'matter_external_id']);
  const warnings: Prisma.InputJsonObject[] = [];
  if (!matterId) {
    warnings.push(
      buildWarning('unlinked_to_matter', 'Communication row has no matter reference and will be imported as unlinked.', {
        candidateFields: ['matter_id', 'matter', 'matter_external_id'],
      }),
    );
  }

  const note = pickString(normalized, ['note']);
  const body = pickString(normalized, ['body', 'content', 'message']) || note;
  return {
    rawJson: {
      id: pickString(normalized, ['id', 'note_id', 'message_id', 'email_id', 'phone_log_id']),
      matter_id: matterId,
      subject: pickString(normalized, ['subject', 'title', 'topic']),
      title: pickString(normalized, ['title', 'subject', 'topic']),
      body,
      note: note || body,
      occurred_at: pickString(normalized, ['occurred_at', 'created_at', 'sent_at', 'date']),
    } as Prisma.InputJsonObject,
    warnings: warnings.length ? (warnings as Prisma.InputJsonArray) : undefined,
  };
}

const DEFINITIONS: ClioDefinition[] = [
  {
    entityType: 'contact',
    aliases: ['contacts', 'contact', 'people', 'persons'],
    knownColumns: [
      'id',
      'contact_id',
      'person_id',
      'first_name',
      'last_name',
      'full_name',
      'display_name',
      'name',
      'email',
      'primary_email',
      'email_address',
      'phone',
      'primary_phone',
      'phone_number',
      'mobile',
      'entity_type',
    ],
    transform: makeContactTransform('PERSON'),
  },
  {
    entityType: 'contact',
    aliases: ['companies', 'company', 'organizations', 'organization'],
    knownColumns: [
      'id',
      'company_id',
      'company_name',
      'organization_name',
      'legal_name',
      'dba',
      'name',
      'display_name',
      'email',
      'primary_email',
      'email_address',
      'phone',
      'primary_phone',
      'phone_number',
      'entity_type',
    ],
    transform: makeContactTransform('ORGANIZATION'),
  },
  {
    entityType: 'matter',
    aliases: ['matters', 'matter'],
    knownColumns: [
      'id',
      'matter_id',
      'matter_number',
      'number',
      'file_number',
      'name',
      'title',
      'matter_name',
      'practice_area',
      'practice',
      'area',
      'jurisdiction',
      'venue',
      'entity_type',
    ],
    transform: transformMatter,
  },
  {
    entityType: 'task',
    aliases: ['tasks', 'task'],
    knownColumns: [
      'id',
      'task_id',
      'matter_id',
      'matter',
      'matter_external_id',
      'title',
      'name',
      'task_name',
      'description',
      'details',
      'note',
      'due_at',
      'due_date',
      'deadline',
      'entity_type',
    ],
    transform: transformTask,
  },
  {
    entityType: 'calendar_event',
    aliases: ['calendar', 'calendar_events', 'events', 'event'],
    knownColumns: [
      'id',
      'event_id',
      'matter_id',
      'matter',
      'matter_external_id',
      'title',
      'name',
      'type',
      'event_type',
      'start_at',
      'start',
      'start_time',
      'date',
      'end_at',
      'end',
      'end_time',
      'location',
      'description',
      'details',
      'entity_type',
    ],
    transform: transformCalendar,
  },
  {
    entityType: 'time_entry',
    aliases: ['activities', 'activity', 'time_entries', 'time_entry'],
    knownColumns: [
      'id',
      'activity_id',
      'time_entry_id',
      'matter_id',
      'matter',
      'matter_external_id',
      'description',
      'narrative',
      'note',
      'started_at',
      'start',
      'start_time',
      'date',
      'ended_at',
      'end',
      'end_time',
      'minutes',
      'duration_minutes',
      'duration',
      'rate',
      'billable_rate',
      'amount',
      'total',
      'utbms_phase',
      'phase_code',
      'utbms_task',
      'task_code',
      'entity_type',
    ],
    transform: transformActivity,
  },
  {
    entityType: 'communication_message',
    aliases: ['notes', 'note', 'phone_logs', 'phone_log', 'emails', 'email', 'messages', 'message'],
    knownColumns: [
      'id',
      'note_id',
      'message_id',
      'email_id',
      'phone_log_id',
      'matter_id',
      'matter',
      'matter_external_id',
      'subject',
      'title',
      'topic',
      'body',
      'content',
      'message',
      'note',
      'occurred_at',
      'created_at',
      'sent_at',
      'date',
      'entity_type',
    ],
    transform: transformCommunication,
  },
];

function findDefinition(input: string): ClioDefinition | null {
  const normalized = normalizeKey(input);
  for (const definition of DEFINITIONS) {
    if (definition.aliases.some((alias) => normalizeKey(alias) === normalized)) {
      return definition;
    }
  }
  return null;
}

function appendUnmappedColumnWarning(
  rawInput: Record<string, unknown>,
  knownColumns: string[],
  warnings: Prisma.InputJsonArray | undefined,
): Prisma.InputJsonArray | undefined {
  const normalizedInput = lowerCaseRecord(rawInput);
  const rawKeys = Object.keys(normalizedInput);
  const known = new Set(knownColumns.map((column) => normalizeKey(column)));
  const unmapped = rawKeys.filter((key) => !known.has(key));
  if (unmapped.length === 0) return warnings;

  const next = Array.isArray(warnings) ? [...warnings] : [];
  next.push(
    buildWarning('unmapped_columns', 'Row includes columns that are not currently mapped by the Clio template importer.', {
      unmappedColumns: unmapped,
    }),
  );
  return next as Prisma.InputJsonArray;
}

function attachSource(
  rawInput: Record<string, unknown>,
  canonical: Prisma.InputJsonObject,
  sourceFile: string,
  sourceEntity: string,
): Prisma.InputJsonObject {
  return {
    ...rawInput,
    ...canonical,
    __source_file: sourceFile,
    __source_entity: sourceEntity,
  } as Prisma.InputJsonObject;
}

@Injectable()
export class ClioTemplateImportPlugin implements ImportPlugin {
  sourceSystem = 'clio_template';

  async parse(file: UploadedFile): Promise<ParsedImportRow[]> {
    const filename = file.originalname.toLowerCase();
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      return this.parseXlsx(file.buffer, file.originalname);
    }

    return this.parseCsv(file.buffer, file.originalname);
  }

  private parseCsv(buffer: Buffer, sourceFilename: string): ParsedImportRow[] {
    const csv = buffer.toString('utf8');
    const records = parse(csv, { columns: true, skip_empty_lines: true, trim: true, bom: true }) as Record<string, unknown>[];

    return records.flatMap((rawInput, index) => {
      const normalized = lowerCaseRecord(rawInput);
      const entityHint = asString(normalized.entity_type || 'contacts');
      const definition = findDefinition(entityHint);
      if (!definition) return [];
      const sourceEntity = normalizeKey(entityHint) || normalizeKey(definition.aliases[0]);

      const transformed = definition.transform(rawInput);
      const warnings = appendUnmappedColumnWarning(rawInput, definition.knownColumns, transformed.warnings);
      return [
        {
          entityType: definition.entityType,
          rowNumber: index + 1,
          rawJson: attachSource(rawInput, transformed.rawJson, sourceFilename, sourceEntity),
          warnings,
        },
      ];
    });
  }

  private parseXlsx(buffer: Buffer, sourceFilename: string): ParsedImportRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rows: ParsedImportRow[] = [];

    for (const sheetName of workbook.SheetNames) {
      const definition = findDefinition(sheetName);
      if (!definition) continue;

      const worksheet = workbook.Sheets[sheetName];
      const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: null });

      records.forEach((rawInput, index) => {
        const sourceEntity = normalizeKey(sheetName) || normalizeKey(definition.aliases[0]);
        const transformed = definition.transform(rawInput);
        const warnings = appendUnmappedColumnWarning(rawInput, definition.knownColumns, transformed.warnings);
        rows.push({
          entityType: definition.entityType,
          rowNumber: index + 1,
          rawJson: attachSource(rawInput, transformed.rawJson, `${sourceFilename}#${sheetName}`, sourceEntity),
          warnings,
        });
      });
    }

    return rows;
  }
}
