import { Injectable } from '@nestjs/common';
import archiver from 'archiver';
import { stringify } from 'csv-stringify/sync';
import { PassThrough } from 'stream';
import { ExportJobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types';
import { S3Service } from '../files/s3.service';
import { AuditService } from '../audit/audit.service';
import {
  FULL_BACKUP_CONTRACT_VERSION,
  FULL_BACKUP_CSV_CONTRACT,
  FULL_BACKUP_MANIFEST_FILE,
  FullBackupManifestEntry,
  validateFullBackupPackageConformance,
} from './full-backup-contract';

type FullBackupCsvArtifact = {
  fileName: string;
  columns: string[];
  rowCount: number;
  content: string;
};

type FullBackupDocumentArtifact = {
  path: string;
  content: Buffer;
  placeholder: boolean;
};

type FullBackupBuildResult = {
  zipBuffer: Buffer;
  csvFiles: FullBackupCsvArtifact[];
  documentFiles: FullBackupDocumentArtifact[];
  manifestEntries: FullBackupManifestEntry[];
  validation: ReturnType<typeof validateFullBackupPackageConformance>;
};

@Injectable()
export class ExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly audit: AuditService,
  ) {}

  async listJobs(organizationId: string) {
    return this.prisma.exportJob.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async runFullBackup(user: AuthenticatedUser) {
    const job = await this.prisma.exportJob.create({
      data: {
        organizationId: user.organizationId,
        status: ExportJobStatus.RUNNING,
        requestedByUserId: user.id,
        exportType: 'full_backup',
      },
    });

    try {
      const built = await this.buildFullBackupZip(user.organizationId);
      const uploaded = await this.s3.upload(built.zipBuffer, 'application/zip', `org/${user.organizationId}/exports`);
      const downloadUrl = await this.s3.signedDownloadUrl(uploaded.key, 60 * 60);

      await this.prisma.exportJob.update({
        where: { id: job.id },
        data: {
          status: ExportJobStatus.COMPLETED,
          finishedAt: new Date(),
          storageKey: uploaded.key,
          summaryJson: {
            sizeBytes: built.zipBuffer.byteLength,
            contractVersion: FULL_BACKUP_CONTRACT_VERSION,
            csvFileCount: built.csvFiles.length,
            documentFileCount: built.documentFiles.length,
            manifestEntryCount: built.manifestEntries.length,
            validation: built.validation,
          },
        },
      });

      await this.audit.appendEvent({
        organizationId: user.organizationId,
        actorUserId: user.id,
        action: 'export.full_backup.completed',
        entityType: 'exportJob',
        entityId: job.id,
        metadata: { storageKey: uploaded.key },
      });

      return {
        jobId: job.id,
        downloadUrl,
      };
    } catch (error) {
      await this.prisma.exportJob.update({
        where: { id: job.id },
        data: {
          status: ExportJobStatus.FAILED,
          finishedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown export error',
        },
      });
      throw error;
    }
  }

  private async buildFullBackupZip(organizationId: string): Promise<FullBackupBuildResult> {
    const [
      contacts,
      matters,
      tasks,
      events,
      timeEntries,
      invoices,
      payments,
      messages,
      notes,
      customFields,
      documents,
      documentVersions,
    ] = await Promise.all([
      this.prisma.contact.findMany({ where: { organizationId } }),
      this.prisma.matter.findMany({ where: { organizationId } }),
      this.prisma.task.findMany({ where: { organizationId } }),
      this.prisma.calendarEvent.findMany({ where: { organizationId } }),
      this.prisma.timeEntry.findMany({ where: { organizationId } }),
      this.prisma.invoice.findMany({ where: { organizationId } }),
      this.prisma.payment.findMany({ where: { organizationId } }),
      this.prisma.communicationMessage.findMany({ where: { organizationId, type: { not: 'INTERNAL_NOTE' } } }),
      this.prisma.communicationMessage.findMany({ where: { organizationId, type: 'INTERNAL_NOTE' } }),
      this.prisma.customFieldValue.findMany({ where: { organizationId } }),
      this.prisma.document.findMany({ where: { organizationId } }),
      this.prisma.documentVersion.findMany({ where: { organizationId } }),
    ]);

    const rowsByCsvFile: Record<string, Array<Record<string, unknown>>> = {
      'contacts.csv': contacts as Array<Record<string, unknown>>,
      'matters.csv': matters as Array<Record<string, unknown>>,
      'tasks.csv': tasks as Array<Record<string, unknown>>,
      'events.csv': events as Array<Record<string, unknown>>,
      'time_entries.csv': timeEntries as Array<Record<string, unknown>>,
      'invoices.csv': invoices as Array<Record<string, unknown>>,
      'payments.csv': payments as Array<Record<string, unknown>>,
      'messages.csv': messages as Array<Record<string, unknown>>,
      'notes.csv': notes as Array<Record<string, unknown>>,
      'custom_fields.csv': customFields as Array<Record<string, unknown>>,
    };

    const csvFiles = FULL_BACKUP_CSV_CONTRACT.map((contract) => {
      const rows = rowsByCsvFile[contract.fileName] || [];
      const columns = this.resolveColumns(rows, contract.requiredColumns);
      return {
        fileName: contract.fileName,
        columns,
        rowCount: rows.length,
        content: this.toCsv(rows, columns),
      };
    });

    const documentById = new Map(documents.map((item) => [item.id, item]));
    const documentFiles: FullBackupDocumentArtifact[] = [];
    const manifest: FullBackupManifestEntry[] = [];
    const archivePaths = new Set<string>(csvFiles.map((item) => item.fileName));

    for (const version of documentVersions) {
      const document = documentById.get(version.documentId);
      if (!document) continue;
      const filename = `${document.title.replace(/[^a-z0-9-_]/gi, '_').slice(0, 80)}-${version.id}`;
      const basePath = `documents/${document.matterId}/${filename}`;

      let path = basePath;
      let content: Buffer;
      let placeholder = false;

      try {
        content = await this.s3.getObjectBuffer(version.storageKey);
      } catch {
        placeholder = true;
        path = `${basePath}.missing.txt`;
        content = Buffer.from('Document blob not available in export environment.');
      }

      documentFiles.push({
        path,
        content,
        placeholder,
      });
      archivePaths.add(path);

      manifest.push({
        documentId: document.id,
        documentVersionId: version.id,
        path,
        matterId: document.matterId,
        title: document.title,
        storageKey: version.storageKey,
        mimeType: version.mimeType,
        size: version.size,
        sha256: version.sha256,
        placeholder,
      });
    }

    archivePaths.add(FULL_BACKUP_MANIFEST_FILE);
    const validation = validateFullBackupPackageConformance({
      csvColumnsByFile: Object.fromEntries(csvFiles.map((item) => [item.fileName, item.columns])),
      manifestEntries: manifest,
      archivePaths,
    });

    if (!validation.valid) {
      const summary = validation.issues
        .slice(0, 5)
        .map((issue) => issue.message)
        .join('; ');
      throw new Error(
        `Full backup package failed conformance checks (${validation.issues.length} issues): ${summary}`,
      );
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = new PassThrough();
    const chunks: Buffer[] = [];

    output.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    archive.pipe(output);

    const archiveCompletion = new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      output.on('end', () => resolve());
      output.on('error', reject);
      archive.on('error', reject);
    });

    for (const csvFile of csvFiles) {
      archive.append(csvFile.content, { name: csvFile.fileName });
    }

    for (const documentFile of documentFiles) {
      archive.append(documentFile.content, { name: documentFile.path });
    }

    archive.append(JSON.stringify(manifest, null, 2), { name: FULL_BACKUP_MANIFEST_FILE });

    await archive.finalize();
    await archiveCompletion;

    return {
      zipBuffer: Buffer.concat(chunks),
      csvFiles,
      documentFiles,
      manifestEntries: manifest,
      validation,
    };
  }

  private toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
    const normalized = rows.map((row) => this.normalizeCsvRow(row, columns));
    return stringify(normalized, {
      header: true,
      columns,
      cast: {
        object: (value) => JSON.stringify(value),
      },
    });
  }

  private resolveColumns(rows: Array<Record<string, unknown>>, requiredColumns: string[]): string[] {
    const dynamicColumns = new Set<string>();
    for (const row of rows) {
      for (const column of Object.keys(row)) {
        dynamicColumns.add(column);
      }
    }

    return [...requiredColumns, ...Array.from(dynamicColumns).filter((column) => !requiredColumns.includes(column))];
  }

  private normalizeCsvRow(row: Record<string, unknown>, columns: string[]) {
    const normalized: Record<string, unknown> = {};
    for (const column of columns) {
      normalized[column] = column in row ? row[column] : null;
    }
    return normalized;
  }
}
