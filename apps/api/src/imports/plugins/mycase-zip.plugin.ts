import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import { UploadedFile } from '../../common/types';
import { ImportPlugin, ParsedImportRow } from './import-plugin.interface';

const FILE_TO_ENTITY: Record<string, string> = {
  contacts: 'contact',
  companies: 'contact',
  matters: 'matter',
  cases: 'matter',
  tasks: 'task',
  calendar_events: 'calendar_event',
  invoices: 'invoice',
  payments: 'payment',
  time_entries: 'time_entry',
  notes: 'communication_message',
  messages: 'communication_message',
};

@Injectable()
export class MyCaseZipImportPlugin implements ImportPlugin {
  sourceSystem = 'mycase_backup_zip';

  async parse(file: UploadedFile): Promise<ParsedImportRow[]> {
    const zip = new AdmZip(file.buffer);
    const rows: ParsedImportRow[] = [];

    for (const entry of zip.getEntries()) {
      if (entry.isDirectory || !entry.entryName.toLowerCase().endsWith('.csv')) continue;

      const base = entry.entryName.split('/').pop()?.replace(/\.csv$/i, '').toLowerCase() ?? '';
      const entityType = FILE_TO_ENTITY[base];
      if (!entityType) continue;

      const csv = entry.getData().toString('utf8');
      const records = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, unknown>[];
      records.forEach((rawJson, index) => {
        rows.push({
          entityType,
          rowNumber: index + 1,
          rawJson: { ...rawJson, __source_file: entry.entryName } as Prisma.InputJsonObject,
        });
      });
    }

    return rows;
  }
}
