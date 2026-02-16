import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import XLSX from 'xlsx';
import { UploadedFile } from '../../common/types';
import { ImportPlugin, ParsedImportRow } from './import-plugin.interface';

const SHEET_TO_ENTITY: Record<string, string> = {
  contacts: 'contact',
  matters: 'matter',
  tasks: 'task',
  calendar: 'calendar_event',
  activities: 'time_entry',
  notes: 'communication_message',
  phone_logs: 'communication_message',
  emails: 'communication_message',
};

@Injectable()
export class ClioTemplateImportPlugin implements ImportPlugin {
  sourceSystem = 'clio_template';

  async parse(file: UploadedFile): Promise<ParsedImportRow[]> {
    const filename = file.originalname.toLowerCase();
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      return this.parseXlsx(file.buffer);
    }

    return this.parseCsv(file.buffer);
  }

  private parseCsv(buffer: Buffer): ParsedImportRow[] {
    const csv = buffer.toString('utf8');
    const records = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, unknown>[];

    return records.map((record, index) => ({
      entityType: (record.entity_type as string) || 'contact',
      rowNumber: index + 1,
      rawJson: record as Prisma.InputJsonObject,
    }));
  }

  private parseXlsx(buffer: Buffer): ParsedImportRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rows: ParsedImportRow[] = [];

    for (const sheetName of workbook.SheetNames) {
      const entityType = SHEET_TO_ENTITY[sheetName.toLowerCase()];
      if (!entityType) continue;

      const worksheet = workbook.Sheets[sheetName];
      const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: null });
      records.forEach((record, index) => {
        rows.push({ entityType, rowNumber: index + 1, rawJson: { ...record, __sheet: sheetName } as Prisma.InputJsonObject });
      });
    }

    return rows;
  }
}
