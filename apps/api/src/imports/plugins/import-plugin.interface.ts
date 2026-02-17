import { Prisma } from '@prisma/client';
import { UploadedFile } from '../../common/types';

export type ParsedImportRow = {
  entityType: string;
  rowNumber: number;
  rawJson: Prisma.InputJsonObject;
  warnings?: Prisma.InputJsonArray;
};

export type ImportPlugin = {
  sourceSystem: string;
  parse(file: UploadedFile): Promise<ParsedImportRow[]>;
};
