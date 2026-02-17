import { Injectable, NotFoundException, OnModuleInit, Optional } from '@nestjs/common';
import { ContactKind, ImportBatchStatus, ImportItemStatus, Prisma } from '@prisma/client';
import { distance } from 'fastest-levenshtein';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser, UploadedFile } from '../common/types';
import { toJsonValue, toJsonValueOrUndefined } from '../common/utils/json.util';
import { ImportPlugin } from './plugins/import-plugin.interface';
import { GenericCsvImportPlugin } from './plugins/generic-csv.plugin';
import { MyCaseZipImportPlugin } from './plugins/mycase-zip.plugin';
import { ClioTemplateImportPlugin } from './plugins/clio-template.plugin';

type ImportWarning = Prisma.InputJsonObject;

@Injectable()
export class ImportsService implements OnModuleInit {
  private readonly plugins = new Map<string, ImportPlugin>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Optional() private readonly genericCsvPlugin?: GenericCsvImportPlugin,
    @Optional() private readonly myCaseZipPlugin?: MyCaseZipImportPlugin,
    @Optional() private readonly clioTemplatePlugin?: ClioTemplateImportPlugin,
  ) {}

  onModuleInit() {
    if (this.genericCsvPlugin) this.registerPlugin(this.genericCsvPlugin);
    if (this.myCaseZipPlugin) this.registerPlugin(this.myCaseZipPlugin);
    if (this.clioTemplatePlugin) this.registerPlugin(this.clioTemplatePlugin);
  }

  registerPlugin(plugin: ImportPlugin): void {
    this.plugins.set(plugin.sourceSystem, plugin);
  }

  async createMappingProfile(input: {
    organizationId: string;
    actorUserId: string;
    name: string;
    sourceSystem: string;
    fieldMappings?: Record<string, unknown>;
    transforms?: Record<string, unknown>;
    dedupeRules?: Record<string, unknown>;
    conflictRules?: Record<string, unknown>;
  }) {
    const profile = await this.prisma.mappingProfile.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        sourceSystem: input.sourceSystem,
        fieldMappingsJson: toJsonValueOrUndefined(input.fieldMappings),
        transformsJson: toJsonValueOrUndefined(input.transforms),
        dedupeRulesJson: toJsonValueOrUndefined(input.dedupeRules),
        conflictRulesJson: toJsonValueOrUndefined(input.conflictRules),
      },
    });

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: 'mapping_profile.created',
      entityType: 'mappingProfile',
      entityId: profile.id,
      metadata: profile,
    });

    return profile;
  }

  async listMappingProfiles(organizationId: string, sourceSystem?: string) {
    return this.prisma.mappingProfile.findMany({
      where: {
        organizationId,
        ...(sourceSystem ? { sourceSystem } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async runImport(input: {
    user: AuthenticatedUser;
    sourceSystem: string;
    file: UploadedFile;
    mappingProfileId?: string;
    entityTypeOverride?: string;
  }) {
    const plugin = this.plugins.get(input.sourceSystem);
    if (!plugin) {
      throw new NotFoundException(`No importer plugin registered for source system: ${input.sourceSystem}`);
    }

    const batch = await this.prisma.importBatch.create({
      data: {
        organizationId: input.user.organizationId,
        sourceSystem: input.sourceSystem,
        status: ImportBatchStatus.RUNNING,
        startedByUserId: input.user.id,
        mappingProfileId: input.mappingProfileId,
      },
    });

    const parsedRows = await plugin.parse(input.file);
    const orderedRows = this.orderImportRows(parsedRows);

    let imported = 0;
    let failed = 0;
    let warningCount = 0;
    const warningCodeCounts: Record<string, number> = {};
    const unmappedColumnsBySource: Record<string, Set<string>> = {};

    for (const row of orderedRows) {
      const entityType = input.entityTypeOverride || row.entityType;
      const rowContext = this.buildRowContext(entityType, row);
      const rowWarnings = this.normalizeWarnings(row.warnings, rowContext);
      warningCount += rowWarnings.length;
      this.captureWarningStats(rowWarnings, warningCodeCounts, unmappedColumnsBySource);
      try {
        const resolvedEntityId = await this.importRow({
          organizationId: input.user.organizationId,
          sourceSystem: input.sourceSystem,
          importBatchId: batch.id,
          entityType,
          rawJson: row.rawJson,
        });

        await this.prisma.importItem.create({
          data: {
            importBatchId: batch.id,
              entityType,
              rowNumber: row.rowNumber,
              rawJson: toJsonValue(row.rawJson),
              resolvedEntityId,
              warningsJson: rowWarnings.length > 0 ? toJsonValue(rowWarnings) : undefined,
              status: ImportItemStatus.IMPORTED,
            },
        });
        imported += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown import error';
        await this.prisma.importItem.create({
          data: {
            importBatchId: batch.id,
              entityType,
              rowNumber: row.rowNumber,
              rawJson: toJsonValue(row.rawJson),
              status: ImportItemStatus.FAILED,
              warningsJson: rowWarnings.length > 0 ? toJsonValue(rowWarnings) : undefined,
              errorsJson: toJsonValue(this.buildErrorPayload(message, rowContext)),
            },
          });
        failed += 1;
      }
    }

    const status = failed > 0 ? (imported > 0 ? ImportBatchStatus.PARTIAL : ImportBatchStatus.FAILED) : ImportBatchStatus.COMPLETED;

    await this.prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status,
        finishedAt: new Date(),
        summaryJson: toJsonValue({
          total: parsedRows.length,
          orderedTotal: orderedRows.length,
          imported,
          failed,
          warnings: warningCount,
          warningCodeCounts,
          unmappedColumnsBySource: this.serializeUnmappedColumns(unmappedColumnsBySource),
        }),
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'import_batch.completed',
      entityType: 'importBatch',
      entityId: batch.id,
      metadata: {
        sourceSystem: input.sourceSystem,
        totalRows: parsedRows.length,
        imported,
        failed,
        warnings: warningCount,
        warningCodeCounts,
        unmappedColumnsBySource: this.serializeUnmappedColumns(unmappedColumnsBySource),
      },
    });

    return this.prisma.importBatch.findUnique({
      where: { id: batch.id },
      include: { items: true },
    });
  }

  async listBatches(organizationId: string) {
    return this.prisma.importBatch.findMany({
      where: { organizationId },
      include: { items: true },
      orderBy: { startedAt: 'desc' },
    });
  }

  private async importRow(input: {
    organizationId: string;
    sourceSystem: string;
    importBatchId: string;
    entityType: string;
    rawJson: Prisma.InputJsonObject;
  }): Promise<string> {
    if (input.entityType === 'contact') {
      return this.importContact(input);
    }

    if (input.entityType === 'matter') {
      return this.importMatter(input);
    }

    if (input.entityType === 'task') {
      return this.importTask(input);
    }

    if (input.entityType === 'calendar_event') {
      return this.importCalendarEvent(input);
    }

    if (input.entityType === 'invoice') {
      return this.importInvoice(input);
    }

    if (input.entityType === 'payment') {
      return this.importPayment(input);
    }

    if (input.entityType === 'time_entry') {
      return this.importTimeEntry(input);
    }

    if (input.entityType === 'communication_message' || input.entityType === 'note') {
      return this.importCommunicationMessage(input);
    }

    throw new Error(`Unsupported entity type for import: ${input.entityType}`);
  }

  private async importContact(input: {
    organizationId: string;
    sourceSystem: string;
    importBatchId: string;
    entityType: string;
    rawJson: Prisma.InputJsonObject;
  }): Promise<string> {
    const displayName = this.asString(input.rawJson.display_name || input.rawJson.name || input.rawJson.full_name || 'Imported Contact');
    const email = this.asString(input.rawJson.email || input.rawJson.primary_email || '');
    const phone = this.asString(input.rawJson.phone || input.rawJson.primary_phone || '');

    const dedupe = await this.findPotentialDuplicateContact(input.organizationId, displayName, email, phone);
    const contact = dedupe
      ? dedupe
      : await this.prisma.contact.create({
          data: {
            organizationId: input.organizationId,
            kind: this.detectContactKind(input.rawJson),
            displayName,
            primaryEmail: email || null,
            primaryPhone: phone || null,
            rawSourcePayload: toJsonValue(input.rawJson),
          },
        });

    await this.recordExternalRef({
      organizationId: input.organizationId,
      entityType: 'contact',
      entityId: contact.id,
      sourceSystem: input.sourceSystem,
      externalId: this.asString(input.rawJson.id || input.rawJson.external_id || displayName),
      externalParentId: this.asString(input.rawJson.parent_id || input.rawJson.external_parent_id || ''),
      importBatchId: input.importBatchId,
      rawSourcePayload: input.rawJson,
    });

    return contact.id;
  }

  private async importMatter(input: {
    organizationId: string;
    sourceSystem: string;
    importBatchId: string;
    entityType: string;
    rawJson: Prisma.InputJsonObject;
  }): Promise<string> {
    const matterNumber = this.asString(input.rawJson.matter_number || input.rawJson.case_number || input.rawJson.id || `M-${Date.now()}`);
    const name = this.asString(input.rawJson.name || input.rawJson.title || `Imported Matter ${matterNumber}`);

    const matter = await this.prisma.matter.upsert({
      where: {
        organizationId_matterNumber: {
          organizationId: input.organizationId,
          matterNumber,
        },
      },
      update: {
        name,
        practiceArea: this.asString(input.rawJson.practice_area || 'General Litigation'),
        rawSourcePayload: toJsonValue(input.rawJson),
      },
      create: {
        organizationId: input.organizationId,
        matterNumber,
        name,
        practiceArea: this.asString(input.rawJson.practice_area || 'General Litigation'),
        rawSourcePayload: toJsonValue(input.rawJson),
      },
    });

    await this.recordExternalRef({
      organizationId: input.organizationId,
      entityType: 'matter',
      entityId: matter.id,
      sourceSystem: input.sourceSystem,
      externalId: this.asString(input.rawJson.id || matterNumber),
      externalParentId: '',
      importBatchId: input.importBatchId,
      rawSourcePayload: input.rawJson,
    });

    return matter.id;
  }

  private async importTask(input: {
    organizationId: string;
    sourceSystem: string;
    importBatchId: string;
    entityType: string;
    rawJson: Prisma.InputJsonObject;
  }): Promise<string> {
    const matterId = await this.resolveMatterIdByExternal(
      input.organizationId,
      input.sourceSystem,
      this.asString(input.rawJson.matter_id || input.rawJson.case_id || ''),
    );

    if (!matterId) throw new Error('Task row missing resolvable matter reference');

    const task = await this.prisma.task.create({
      data: {
        organizationId: input.organizationId,
        matterId,
        title: this.asString(input.rawJson.title || input.rawJson.name || 'Imported Task'),
        description: this.asString(input.rawJson.description || ''),
        dueAt: input.rawJson.due_at ? new Date(String(input.rawJson.due_at)) : null,
        rawSourcePayload: toJsonValue(input.rawJson),
      },
    });

    await this.recordExternalRef({
      organizationId: input.organizationId,
      entityType: 'task',
      entityId: task.id,
      sourceSystem: input.sourceSystem,
      externalId: this.asString(input.rawJson.id || task.id),
      externalParentId: this.asString(input.rawJson.matter_id || ''),
      importBatchId: input.importBatchId,
      rawSourcePayload: input.rawJson,
    });

    return task.id;
  }

  private async importCalendarEvent(input: {
    organizationId: string;
    sourceSystem: string;
    importBatchId: string;
    entityType: string;
    rawJson: Prisma.InputJsonObject;
  }): Promise<string> {
    const matterId = await this.resolveMatterIdByExternal(
      input.organizationId,
      input.sourceSystem,
      this.asString(input.rawJson.matter_id || input.rawJson.case_id || ''),
    );

    if (!matterId) throw new Error('Calendar row missing resolvable matter reference');

    const event = await this.prisma.calendarEvent.create({
      data: {
        organizationId: input.organizationId,
        matterId,
        type: this.asString(input.rawJson.type || input.rawJson.title || 'Imported Event'),
        startAt: new Date(String(input.rawJson.start_at || input.rawJson.start || new Date())),
        endAt: input.rawJson.end_at ? new Date(String(input.rawJson.end_at)) : null,
        location: this.asString(input.rawJson.location || ''),
        description: this.asString(input.rawJson.description || ''),
        rawSourcePayload: toJsonValue(input.rawJson),
      },
    });

    await this.recordExternalRef({
      organizationId: input.organizationId,
      entityType: 'calendar_event',
      entityId: event.id,
      sourceSystem: input.sourceSystem,
      externalId: this.asString(input.rawJson.id || event.id),
      externalParentId: this.asString(input.rawJson.matter_id || ''),
      importBatchId: input.importBatchId,
      rawSourcePayload: input.rawJson,
    });

    return event.id;
  }

  private async importInvoice(input: {
    organizationId: string;
    sourceSystem: string;
    importBatchId: string;
    entityType: string;
    rawJson: Prisma.InputJsonObject;
  }): Promise<string> {
    const matterId = await this.resolveMatterIdByExternal(
      input.organizationId,
      input.sourceSystem,
      this.asString(input.rawJson.matter_id || input.rawJson.case_id || ''),
    );

    if (!matterId) throw new Error('Invoice row missing resolvable matter reference');

    const invoice = await this.prisma.invoice.create({
      data: {
        organizationId: input.organizationId,
        matterId,
        invoiceNumber: this.asString(input.rawJson.invoice_number || input.rawJson.number || `IMP-${Date.now()}`),
        status: 'SENT',
        issuedAt: input.rawJson.issued_at ? new Date(String(input.rawJson.issued_at)) : new Date(),
        dueAt: input.rawJson.due_at ? new Date(String(input.rawJson.due_at)) : null,
        subtotal: this.asNumber(input.rawJson.subtotal || input.rawJson.amount || 0),
        tax: this.asNumber(input.rawJson.tax || 0),
        total: this.asNumber(input.rawJson.total || input.rawJson.amount || 0),
        balanceDue: this.asNumber(input.rawJson.balance_due || input.rawJson.total || 0),
        rawSourcePayload: toJsonValue(input.rawJson),
      },
    });

    await this.recordExternalRef({
      organizationId: input.organizationId,
      entityType: 'invoice',
      entityId: invoice.id,
      sourceSystem: input.sourceSystem,
      externalId: this.asString(input.rawJson.id || invoice.invoiceNumber),
      externalParentId: this.asString(input.rawJson.matter_id || ''),
      importBatchId: input.importBatchId,
      rawSourcePayload: input.rawJson,
    });

    return invoice.id;
  }

  private async importPayment(input: {
    organizationId: string;
    sourceSystem: string;
    importBatchId: string;
    entityType: string;
    rawJson: Prisma.InputJsonObject;
  }): Promise<string> {
    const invoiceId = await this.resolveEntityIdByExternal(
      input.organizationId,
      input.sourceSystem,
      'invoice',
      this.asString(input.rawJson.invoice_id || ''),
    );

    if (!invoiceId) throw new Error('Payment row missing resolvable invoice reference');

    const payment = await this.prisma.payment.create({
      data: {
        organizationId: input.organizationId,
        invoiceId,
        amount: this.asNumber(input.rawJson.amount || 0),
        method: 'MANUAL',
        receivedAt: input.rawJson.received_at ? new Date(String(input.rawJson.received_at)) : new Date(),
        reference: this.asString(input.rawJson.reference || input.rawJson.check_no || ''),
        rawSourcePayload: toJsonValue(input.rawJson),
      },
    });

    await this.recordExternalRef({
      organizationId: input.organizationId,
      entityType: 'payment',
      entityId: payment.id,
      sourceSystem: input.sourceSystem,
      externalId: this.asString(input.rawJson.id || payment.id),
      externalParentId: this.asString(input.rawJson.invoice_id || ''),
      importBatchId: input.importBatchId,
      rawSourcePayload: input.rawJson,
    });

    return payment.id;
  }

  private async importTimeEntry(input: {
    organizationId: string;
    sourceSystem: string;
    importBatchId: string;
    entityType: string;
    rawJson: Prisma.InputJsonObject;
  }): Promise<string> {
    const matterId = await this.resolveMatterIdByExternal(
      input.organizationId,
      input.sourceSystem,
      this.asString(input.rawJson.matter_id || input.rawJson.case_id || ''),
    );

    if (!matterId) throw new Error('Time entry row missing resolvable matter reference');

    const timeEntry = await this.prisma.timeEntry.create({
      data: {
        organizationId: input.organizationId,
        matterId,
        userId: null,
        description: this.asString(input.rawJson.description || ''),
        startedAt: new Date(String(input.rawJson.started_at || input.rawJson.date || new Date())),
        endedAt: input.rawJson.ended_at ? new Date(String(input.rawJson.ended_at)) : null,
        durationMinutes: Math.max(1, this.asNumber(input.rawJson.minutes || 60)),
        billableRate: this.asNumber(input.rawJson.rate || 0),
        amount: this.asNumber(input.rawJson.amount || 0),
        utbmsPhaseCode: this.asString(input.rawJson.utbms_phase || ''),
        utbmsTaskCode: this.asString(input.rawJson.utbms_task || ''),
        rawSourcePayload: toJsonValue(input.rawJson),
      },
    });

    await this.recordExternalRef({
      organizationId: input.organizationId,
      entityType: 'time_entry',
      entityId: timeEntry.id,
      sourceSystem: input.sourceSystem,
      externalId: this.asString(input.rawJson.id || timeEntry.id),
      externalParentId: this.asString(input.rawJson.matter_id || ''),
      importBatchId: input.importBatchId,
      rawSourcePayload: input.rawJson,
    });

    return timeEntry.id;
  }

  private async importCommunicationMessage(input: {
    organizationId: string;
    sourceSystem: string;
    importBatchId: string;
    entityType: string;
    rawJson: Prisma.InputJsonObject;
  }): Promise<string> {
    const matterExternalId = this.asString(input.rawJson.matter_id || input.rawJson.case_id || '');
    const matterId = matterExternalId
      ? await this.resolveMatterIdByExternal(input.organizationId, input.sourceSystem, matterExternalId)
      : null;

    const thread = await this.prisma.communicationThread.create({
      data: {
        organizationId: input.organizationId,
        matterId: matterId || undefined,
        subject: this.asString(input.rawJson.subject || input.rawJson.title || 'Imported Communication'),
      },
    });

    const message = await this.prisma.communicationMessage.create({
      data: {
        organizationId: input.organizationId,
        threadId: thread.id,
        type: 'INTERNAL_NOTE',
        direction: 'INTERNAL',
        subject: this.asString(input.rawJson.subject || ''),
        body: this.asString(input.rawJson.body || input.rawJson.note || ''),
        occurredAt: input.rawJson.occurred_at ? new Date(String(input.rawJson.occurred_at)) : new Date(),
        rawSourcePayload: toJsonValue(input.rawJson),
      },
    });

    await this.recordExternalRef({
      organizationId: input.organizationId,
      entityType: 'communication_message',
      entityId: message.id,
      sourceSystem: input.sourceSystem,
      externalId: this.asString(input.rawJson.id || message.id),
      externalParentId: matterExternalId,
      importBatchId: input.importBatchId,
      rawSourcePayload: input.rawJson,
    });

    return message.id;
  }

  private async resolveMatterIdByExternal(organizationId: string, sourceSystem: string, externalId: string): Promise<string | null> {
    if (!externalId) return null;

    const direct = await this.resolveEntityIdByExternal(organizationId, sourceSystem, 'matter', externalId);
    if (direct) return direct;

    const matter = await this.prisma.matter.findFirst({
      where: {
        organizationId,
        OR: [{ matterNumber: externalId }, { id: externalId }],
      },
    });

    return matter?.id ?? null;
  }

  private async resolveEntityIdByExternal(
    organizationId: string,
    sourceSystem: string,
    entityType: string,
    externalId: string,
  ): Promise<string | null> {
    if (!externalId) return null;

    const ref = await this.prisma.externalReference.findFirst({
      where: {
        organizationId,
        sourceSystem,
        entityType,
        externalId,
      },
    });

    return ref?.entityId ?? null;
  }

  private async recordExternalRef(input: {
    organizationId: string;
    entityType: string;
    entityId: string;
    sourceSystem: string;
    externalId: string;
    externalParentId?: string;
    importBatchId?: string;
    rawSourcePayload?: Prisma.InputJsonObject;
  }) {
    await this.prisma.externalReference.upsert({
      where: {
        organizationId_sourceSystem_entityType_externalId: {
          organizationId: input.organizationId,
          sourceSystem: input.sourceSystem,
          entityType: input.entityType,
          externalId: input.externalId,
        },
      },
      update: {
        entityId: input.entityId,
        externalParentId: input.externalParentId || null,
        importBatchId: input.importBatchId,
        rawSourcePayload: toJsonValueOrUndefined(input.rawSourcePayload),
        importedAt: new Date(),
      },
      create: {
        organizationId: input.organizationId,
        entityType: input.entityType,
        entityId: input.entityId,
        sourceSystem: input.sourceSystem,
        externalId: input.externalId,
        externalParentId: input.externalParentId || null,
        importBatchId: input.importBatchId,
        rawSourcePayload: toJsonValueOrUndefined(input.rawSourcePayload),
      },
    });
  }

  private async findPotentialDuplicateContact(
    organizationId: string,
    displayName: string,
    email: string,
    phone: string,
  ) {
    const candidates = await this.prisma.contact.findMany({
      where: {
        organizationId,
        OR: [
          ...(email ? [{ primaryEmail: email }] : []),
          ...(phone ? [{ primaryPhone: phone }] : []),
          { displayName: { contains: displayName.slice(0, Math.min(8, displayName.length)), mode: 'insensitive' } },
        ],
      },
      take: 20,
    });

    let best: { contact: (typeof candidates)[number]; score: number } | null = null;
    for (const candidate of candidates) {
      let score = 0;
      if (email && candidate.primaryEmail?.toLowerCase() === email.toLowerCase()) score += 0.7;
      if (phone && candidate.primaryPhone === phone) score += 0.2;
      const max = Math.max(candidate.displayName.length, displayName.length, 1);
      const similarity = 1 - distance(candidate.displayName.toLowerCase(), displayName.toLowerCase()) / max;
      if (similarity > 0.8) score += 0.2;

      if (!best || score > best.score) {
        best = { contact: candidate, score };
      }
    }

    return best && best.score >= 0.7 ? best.contact : null;
  }

  private orderImportRows(
    rows: Array<{
      entityType: string;
      rowNumber: number;
      rawJson: Prisma.InputJsonObject;
      warnings?: Prisma.InputJsonArray;
    }>,
  ) {
    return [...rows].sort((a, b) => {
      const priorityDiff = this.importPriority(a.entityType) - this.importPriority(b.entityType);
      if (priorityDiff !== 0) return priorityDiff;

      const sourceFileA = this.asString((a.rawJson as Record<string, unknown>).__source_file || '');
      const sourceFileB = this.asString((b.rawJson as Record<string, unknown>).__source_file || '');
      const sourceDiff = sourceFileA.localeCompare(sourceFileB);
      if (sourceDiff !== 0) return sourceDiff;

      return a.rowNumber - b.rowNumber;
    });
  }

  private importPriority(entityType: string): number {
    const priorities: Record<string, number> = {
      contact: 10,
      matter: 20,
      invoice: 30,
      task: 40,
      calendar_event: 50,
      time_entry: 60,
      payment: 70,
      communication_message: 80,
      note: 80,
    };
    return priorities[entityType] ?? 999;
  }

  private normalizeWarnings(warnings: Prisma.InputJsonArray | undefined, rowContext: Prisma.InputJsonObject): ImportWarning[] {
    const input = Array.isArray(warnings) ? warnings : [];
    const normalized: ImportWarning[] = [];
    for (const warning of input) {
      if (!warning || typeof warning !== 'object' || Array.isArray(warning)) continue;
      const record = warning as Record<string, unknown>;
      const code = this.asString(record.code || 'import_warning');
      const message = this.asString(record.message || 'Importer warning');
      const field = this.asString(record.field || '');
      const context =
        record.context && typeof record.context === 'object' && !Array.isArray(record.context)
          ? (record.context as Record<string, unknown>)
          : {};

      normalized.push({
        code,
        message,
        ...(field ? { field } : {}),
        context: {
          ...context,
          rowContext,
        },
      });
    }
    return normalized;
  }

  private captureWarningStats(
    warnings: ImportWarning[],
    warningCodeCounts: Record<string, number>,
    unmappedColumnsBySource: Record<string, Set<string>>,
  ) {
    for (const warning of warnings) {
      const code = this.asString((warning as Record<string, unknown>).code || 'import_warning');
      warningCodeCounts[code] = (warningCodeCounts[code] || 0) + 1;

      const warningContext = (warning as Record<string, unknown>).context;
      if (!warningContext || typeof warningContext !== 'object' || Array.isArray(warningContext)) continue;
      const contextRecord = warningContext as Record<string, unknown>;
      if (code !== 'unmapped_columns') continue;

      const rowContext =
        contextRecord.rowContext && typeof contextRecord.rowContext === 'object' && !Array.isArray(contextRecord.rowContext)
          ? (contextRecord.rowContext as Record<string, unknown>)
          : {};
      const sourceFile = this.asString(rowContext.sourceFile || 'unknown-source');

      const columns =
        Array.isArray(contextRecord.unmappedColumns) && contextRecord.unmappedColumns.length > 0
          ? contextRecord.unmappedColumns.map((value) => this.asString(value)).filter(Boolean)
          : [];
      if (columns.length === 0) continue;

      if (!unmappedColumnsBySource[sourceFile]) {
        unmappedColumnsBySource[sourceFile] = new Set<string>();
      }
      for (const column of columns) {
        unmappedColumnsBySource[sourceFile].add(column);
      }
    }
  }

  private serializeUnmappedColumns(input: Record<string, Set<string>>) {
    const output: Record<string, string[]> = {};
    for (const [sourceFile, columns] of Object.entries(input)) {
      output[sourceFile] = [...columns].sort();
    }
    return output;
  }

  private buildRowContext(entityType: string, row: { rowNumber: number; rawJson: Prisma.InputJsonObject }): Prisma.InputJsonObject {
    const record = row.rawJson as Record<string, unknown>;
    const availableFields = Object.keys(record).filter((key) => !key.startsWith('__'));
    const sourceFile = this.asString(record.__source_file || '');
    const sourceEntity = this.asString(record.__source_entity || '');
    const externalId = this.asString(record.id || record.external_id || '');
    const externalParentId = this.asString(
      record.matter_id || record.case_id || record.invoice_id || record.parent_id || record.external_parent_id || '',
    );

    return {
      entityType,
      rowNumber: row.rowNumber,
      sourceFile,
      sourceEntity,
      externalId,
      externalParentId,
      availableFields,
    } as Prisma.InputJsonObject;
  }

  private buildErrorPayload(message: string, rowContext: Prisma.InputJsonObject): Prisma.InputJsonObject {
    return {
      message,
      rowContext,
    } as Prisma.InputJsonObject;
  }

  private detectContactKind(raw: Prisma.InputJsonObject): ContactKind {
    const company = raw.company || raw.organization || raw.legal_name;
    return company ? ContactKind.ORGANIZATION : ContactKind.PERSON;
  }

  private asString(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  private asNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
