import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { UploadedFile } from '../../common/types';
import { ImportPlugin, ParsedImportRow } from './import-plugin.interface';

@Injectable()
export class GenericCsvImportPlugin implements ImportPlugin {
  sourceSystem = 'generic_csv';

  async parse(file: UploadedFile): Promise<ParsedImportRow[]> {
    const csv = file.buffer.toString('utf8');
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, unknown>[];

    const entityType = (records[0]?.entity_type as string) || 'contact';

    return records.map((rawJson, index) => ({
      entityType,
      rowNumber: index + 1,
      rawJson: rawJson as Prisma.InputJsonObject,
    }));
  }
}
