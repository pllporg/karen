import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import { UploadedFile } from '../../common/types';
import { ImportPlugin, ParsedImportRow } from './import-plugin.interface';

type ParsedRowTransformResult = {
  rawJson: Prisma.InputJsonObject;
  warnings?: Prisma.InputJsonArray;
};

type MyCaseFileDefinition = {
  entityType: string;
  aliases: string[];
  transform: (raw: Record<string, unknown>) => ParsedRowTransformResult;
};

function normalizeKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeBaseName(entryName: string): string {
  const base = entryName.split('/').pop() || entryName;
  const withoutExt = base.replace(/\.csv$/i, '');
  return normalizeKey(withoutExt);
}

function lowerCaseRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    normalized[normalizeKey(key)] = value;
  }
  return normalized;
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function pickValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const normalizedKey = normalizeKey(key);
    if (!(normalizedKey in record)) continue;
    const value = record[normalizedKey];
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    return value;
  }
  return '';
}

function pickString(record: Record<string, unknown>, keys: string[]): string {
  return asString(pickValue(record, keys));
}

function buildWarning(code: string, message: string, context?: Record<string, unknown>): Prisma.InputJsonObject {
  const safeContext = context
    ? (JSON.parse(JSON.stringify(context)) as Prisma.InputJsonObject)
    : ({} as Prisma.InputJsonObject);
  return {
    code,
    message,
    context: safeContext,
  };
}

function attachSourceContext(
  rawInput: Record<string, unknown>,
  canonical: Record<string, unknown>,
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

function buildContactTransformer(defaultKind: 'PERSON' | 'ORGANIZATION') {
  return (rawInput: Record<string, unknown>): ParsedRowTransformResult => {
    const normalized = lowerCaseRecord(rawInput);
    const firstName = pickString(normalized, ['first_name', 'firstname', 'given_name']);
    const lastName = pickString(normalized, ['last_name', 'lastname', 'surname', 'family_name']);
    const nameFromParts = [firstName, lastName].filter(Boolean).join(' ').trim();
    const displayName = pickString(normalized, [
      'display_name',
      'full_name',
      'name',
      'legal_name',
      'company_name',
      'organization_name',
      'dba',
    ]);
    const resolvedDisplayName = displayName || nameFromParts || 'Imported Contact';
    const email = pickString(normalized, ['primary_email', 'email', 'email_address']);
    const phone = pickString(normalized, ['primary_phone', 'phone', 'phone_number', 'mobile', 'mobile_phone']);
    const externalId = pickString(normalized, ['id', 'contact_id', 'person_id', 'company_id']) || resolvedDisplayName;

    const canonical: Record<string, unknown> = {
      id: externalId,
      display_name: resolvedDisplayName,
      name: resolvedDisplayName,
      email,
      phone,
    };

    if (defaultKind === 'ORGANIZATION') {
      canonical.organization = true;
      canonical.legal_name = resolvedDisplayName;
    }

    return { rawJson: canonical as Prisma.InputJsonObject };
  };
}

function transformMatter(rawInput: Record<string, unknown>): ParsedRowTransformResult {
  const normalized = lowerCaseRecord(rawInput);
  const externalId = pickString(normalized, ['id', 'matter_id', 'case_id']);
  const matterNumber = pickString(normalized, ['matter_number', 'case_number', 'number', 'file_number']) || externalId;
  const name = pickString(normalized, ['name', 'title', 'case_name', 'matter_name']) || `Imported Matter ${matterNumber || ''}`.trim();

  return {
    rawJson: {
      id: externalId || matterNumber,
      matter_number: matterNumber || externalId,
      case_number: matterNumber || externalId,
      name,
      practice_area: pickString(normalized, ['practice_area', 'practice', 'area']),
      jurisdiction: pickString(normalized, ['jurisdiction']),
      venue: pickString(normalized, ['venue']),
    } as Prisma.InputJsonObject,
  };
}

function transformTask(rawInput: Record<string, unknown>): ParsedRowTransformResult {
  const normalized = lowerCaseRecord(rawInput);
  const matterId = pickString(normalized, ['matter_id', 'case_id']);
  const warnings: Prisma.InputJsonObject[] = [];
  if (!matterId) {
    warnings.push(
      buildWarning('missing_matter_reference', 'Task row missing matter/case reference', {
        candidateFields: ['matter_id', 'case_id'],
      }),
    );
  }

  return {
    rawJson: {
      id: pickString(normalized, ['id', 'task_id']),
      matter_id: matterId,
      case_id: matterId,
      title: pickString(normalized, ['title', 'name', 'task_name']) || 'Imported Task',
      description: pickString(normalized, ['description', 'details', 'note']),
      due_at: pickString(normalized, ['due_at', 'due_date', 'deadline']),
    } as Prisma.InputJsonObject,
    warnings: warnings.length ? (warnings as Prisma.InputJsonArray) : undefined,
  };
}

function transformCalendarEvent(rawInput: Record<string, unknown>): ParsedRowTransformResult {
  const normalized = lowerCaseRecord(rawInput);
  const matterId = pickString(normalized, ['matter_id', 'case_id']);
  const warnings: Prisma.InputJsonObject[] = [];
  if (!matterId) {
    warnings.push(
      buildWarning('missing_matter_reference', 'Calendar row missing matter/case reference', {
        candidateFields: ['matter_id', 'case_id'],
      }),
    );
  }

  return {
    rawJson: {
      id: pickString(normalized, ['id', 'event_id']),
      matter_id: matterId,
      case_id: matterId,
      title: pickString(normalized, ['title', 'name']) || 'Imported Event',
      type: pickString(normalized, ['type', 'event_type']) || pickString(normalized, ['title', 'name']) || 'Imported Event',
      start_at: pickString(normalized, ['start_at', 'start', 'start_time', 'begins_at', 'date']),
      end_at: pickString(normalized, ['end_at', 'end', 'end_time', 'ends_at']),
      location: pickString(normalized, ['location', 'place']),
      description: pickString(normalized, ['description', 'details', 'note']),
    } as Prisma.InputJsonObject,
    warnings: warnings.length ? (warnings as Prisma.InputJsonArray) : undefined,
  };
}

function transformInvoice(rawInput: Record<string, unknown>): ParsedRowTransformResult {
  const normalized = lowerCaseRecord(rawInput);
  const matterId = pickString(normalized, ['matter_id', 'case_id']);
  const warnings: Prisma.InputJsonObject[] = [];
  if (!matterId) {
    warnings.push(
      buildWarning('missing_matter_reference', 'Invoice row missing matter/case reference', {
        candidateFields: ['matter_id', 'case_id'],
      }),
    );
  }

  return {
    rawJson: {
      id: pickString(normalized, ['id', 'invoice_id']),
      matter_id: matterId,
      case_id: matterId,
      invoice_number: pickString(normalized, ['invoice_number', 'number', 'invoice_no']),
      issued_at: pickString(normalized, ['issued_at', 'issued_on', 'issued_date', 'date']),
      due_at: pickString(normalized, ['due_at', 'due_on', 'due_date']),
      subtotal: pickString(normalized, ['subtotal', 'sub_total']),
      tax: pickString(normalized, ['tax', 'tax_amount']),
      total: pickString(normalized, ['total', 'amount', 'total_amount']),
      balance_due: pickString(normalized, ['balance_due', 'balance']),
    } as Prisma.InputJsonObject,
    warnings: warnings.length ? (warnings as Prisma.InputJsonArray) : undefined,
  };
}

function transformPayment(rawInput: Record<string, unknown>): ParsedRowTransformResult {
  const normalized = lowerCaseRecord(rawInput);
  const invoiceId = pickString(normalized, ['invoice_id', 'invoice', 'bill_id']);
  const warnings: Prisma.InputJsonObject[] = [];
  if (!invoiceId) {
    warnings.push(
      buildWarning('missing_invoice_reference', 'Payment row missing invoice reference', {
        candidateFields: ['invoice_id', 'invoice', 'bill_id'],
      }),
    );
  }

  return {
    rawJson: {
      id: pickString(normalized, ['id', 'payment_id']),
      invoice_id: invoiceId,
      amount: pickString(normalized, ['amount', 'payment_amount']),
      received_at: pickString(normalized, ['received_at', 'received_on', 'received_date', 'date']),
      reference: pickString(normalized, ['reference', 'check_no', 'check_number', 'payment_reference']),
    } as Prisma.InputJsonObject,
    warnings: warnings.length ? (warnings as Prisma.InputJsonArray) : undefined,
  };
}

function transformTimeEntry(rawInput: Record<string, unknown>): ParsedRowTransformResult {
  const normalized = lowerCaseRecord(rawInput);
  const matterId = pickString(normalized, ['matter_id', 'case_id']);
  const warnings: Prisma.InputJsonObject[] = [];
  if (!matterId) {
    warnings.push(
      buildWarning('missing_matter_reference', 'Time entry row missing matter/case reference', {
        candidateFields: ['matter_id', 'case_id'],
      }),
    );
  }

  return {
    rawJson: {
      id: pickString(normalized, ['id', 'time_entry_id', 'activity_id']),
      matter_id: matterId,
      case_id: matterId,
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

function transformCommunication(rawInput: Record<string, unknown>): ParsedRowTransformResult {
  const normalized = lowerCaseRecord(rawInput);
  const matterId = pickString(normalized, ['matter_id', 'case_id']);
  const warnings: Prisma.InputJsonObject[] = [];
  if (!matterId) {
    warnings.push(
      buildWarning('unlinked_to_matter', 'Communication row has no matter/case reference and will be imported as unlinked.', {
        candidateFields: ['matter_id', 'case_id'],
      }),
    );
  }

  const note = pickString(normalized, ['note']);
  const body = pickString(normalized, ['body', 'message', 'content']) || note;
  return {
    rawJson: {
      id: pickString(normalized, ['id', 'message_id', 'note_id']),
      matter_id: matterId,
      case_id: matterId,
      subject: pickString(normalized, ['subject', 'title', 'topic']),
      title: pickString(normalized, ['title', 'subject', 'topic']),
      body,
      note: note || body,
      occurred_at: pickString(normalized, ['occurred_at', 'sent_at', 'created_at', 'date']),
    } as Prisma.InputJsonObject,
    warnings: warnings.length ? (warnings as Prisma.InputJsonArray) : undefined,
  };
}

const FILE_DEFINITIONS: MyCaseFileDefinition[] = [
  { entityType: 'contact', aliases: ['contacts', 'contact', 'people', 'persons'], transform: buildContactTransformer('PERSON') },
  {
    entityType: 'contact',
    aliases: ['companies', 'company', 'organizations', 'organization', 'firms', 'firm'],
    transform: buildContactTransformer('ORGANIZATION'),
  },
  { entityType: 'matter', aliases: ['matters', 'matter', 'cases', 'case'], transform: transformMatter },
  { entityType: 'task', aliases: ['tasks', 'task'], transform: transformTask },
  {
    entityType: 'calendar_event',
    aliases: ['calendar_events', 'calendar_event', 'calendar', 'events', 'event', 'appointments'],
    transform: transformCalendarEvent,
  },
  { entityType: 'invoice', aliases: ['invoices', 'invoice'], transform: transformInvoice },
  { entityType: 'payment', aliases: ['payments', 'payment'], transform: transformPayment },
  {
    entityType: 'time_entry',
    aliases: ['time_entries', 'time_entry', 'time_logs', 'activities', 'activity'],
    transform: transformTimeEntry,
  },
  { entityType: 'communication_message', aliases: ['notes', 'note', 'case_notes'], transform: transformCommunication },
  {
    entityType: 'communication_message',
    aliases: ['messages', 'message', 'emails', 'email', 'phone_logs', 'phone_log'],
    transform: transformCommunication,
  },
];

function findFileDefinition(baseName: string): MyCaseFileDefinition | null {
  const normalizedBase = normalizeKey(baseName);
  for (const definition of FILE_DEFINITIONS) {
    if (definition.aliases.some((alias) => normalizeKey(alias) === normalizedBase)) {
      return definition;
    }
  }
  return null;
}

@Injectable()
export class MyCaseZipImportPlugin implements ImportPlugin {
  sourceSystem = 'mycase_backup_zip';

  async parse(file: UploadedFile): Promise<ParsedImportRow[]> {
    const zip = new AdmZip(file.buffer);
    const rows: ParsedImportRow[] = [];

    for (const entry of zip.getEntries()) {
      if (entry.isDirectory || !entry.entryName.toLowerCase().endsWith('.csv')) continue;

      const baseName = normalizeBaseName(entry.entryName);
      const definition = findFileDefinition(baseName);
      if (!definition) continue;

      const csv = entry.getData().toString('utf8');
      const records = parse(csv, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      }) as Record<string, unknown>[];

      records.forEach((rawInput, index) => {
        const transformed = definition.transform(rawInput);
        rows.push({
          entityType: definition.entityType,
          rowNumber: index + 1,
          rawJson: attachSourceContext(rawInput, transformed.rawJson, entry.entryName, definition.entityType),
          warnings: transformed.warnings,
        });
      });
    }

    return rows;
  }
}
