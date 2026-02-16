import { Injectable } from '@nestjs/common';
import archiver from 'archiver';
import { stringify } from 'csv-stringify/sync';
import { PassThrough } from 'stream';
import { ExportJobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types';
import { S3Service } from '../files/s3.service';
import { AuditService } from '../audit/audit.service';

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
      const zipBuffer = await this.buildFullBackupZip(user.organizationId);
      const uploaded = await this.s3.upload(zipBuffer, 'application/zip', `org/${user.organizationId}/exports`);
      const downloadUrl = await this.s3.signedDownloadUrl(uploaded.key, 60 * 60);

      await this.prisma.exportJob.update({
        where: { id: job.id },
        data: {
          status: ExportJobStatus.COMPLETED,
          finishedAt: new Date(),
          storageKey: uploaded.key,
          summaryJson: {
            sizeBytes: zipBuffer.byteLength,
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

  private async buildFullBackupZip(organizationId: string): Promise<Buffer> {
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

    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = new PassThrough();
    const chunks: Buffer[] = [];

    output.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    archive.pipe(output);

    archive.append(this.toCsv(contacts), { name: 'contacts.csv' });
    archive.append(this.toCsv(matters), { name: 'matters.csv' });
    archive.append(this.toCsv(tasks), { name: 'tasks.csv' });
    archive.append(this.toCsv(events), { name: 'events.csv' });
    archive.append(this.toCsv(timeEntries), { name: 'time_entries.csv' });
    archive.append(this.toCsv(invoices), { name: 'invoices.csv' });
    archive.append(this.toCsv(payments), { name: 'payments.csv' });
    archive.append(this.toCsv(messages), { name: 'messages.csv' });
    archive.append(this.toCsv(notes), { name: 'notes.csv' });
    archive.append(this.toCsv(customFields), { name: 'custom_fields.csv' });

    const manifest: Array<{
      documentId: string;
      documentVersionId: string;
      path: string;
      matterId: string;
      title: string;
    }> = [];

    for (const version of documentVersions) {
      const document = documents.find((item) => item.id === version.documentId);
      if (!document) continue;
      const filename = `${document.title.replace(/[^a-z0-9-_]/gi, '_').slice(0, 80)}-${version.id}`;
      const path = `documents/${document.matterId}/${filename}`;

      try {
        const content = await this.s3.getObjectBuffer(version.storageKey);
        archive.append(content, { name: path });
      } catch {
        archive.append(Buffer.from('Document blob not available in export environment.'), { name: `${path}.txt` });
      }

      manifest.push({
        documentId: document.id,
        documentVersionId: version.id,
        path,
        matterId: document.matterId,
        title: document.title,
      });
    }

    archive.append(JSON.stringify(manifest, null, 2), { name: 'documents/manifest.json' });

    await archive.finalize();
    await new Promise<void>((resolve, reject) => {
      output.on('end', () => resolve());
      output.on('error', reject);
      archive.on('error', reject);
    });

    return Buffer.concat(chunks);
  }

  private toCsv(rows: object[]): string {
    if (rows.length === 0) {
      return '';
    }

    return stringify(rows, {
      header: true,
      columns: Object.keys(rows[0]),
      cast: {
        object: (value) => JSON.stringify(value),
      },
    });
  }
}
