import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeadStage, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateIntakeDraftDto } from './dto/create-intake-draft.dto';
import { RunConflictCheckDto } from './dto/run-conflict-check.dto';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';
import { GenerateEngagementDto } from './dto/generate-engagement.dto';
import { SendEngagementDto } from './dto/send-engagement.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(organizationId: string) {
    return this.prisma.lead.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, actorUserId: string, dto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({
      data: {
        organizationId,
        source: dto.source,
        referralContactId: dto.referralContactId,
        assignedToUserId: dto.assignedToUserId,
        notes: dto.notes,
      },
    });

    await this.appendTransitionEvent(organizationId, actorUserId, lead.id, 'lead.created', {
      toStage: lead.stage,
      source: lead.source,
    });

    return lead;
  }

  async getById(organizationId: string, id: string) {
    return this.requireLead(organizationId, id);
  }

  async update(organizationId: string, actorUserId: string, id: string, dto: UpdateLeadDto) {
    const existing = await this.requireLead(organizationId, id);
    const lead = await this.prisma.lead.update({
      where: { id: existing.id },
      data: {
        source: dto.source,
        referralContactId: dto.referralContactId,
        assignedToUserId: dto.assignedToUserId,
        notes: dto.notes,
        stage: dto.stage,
      },
    });

    if (dto.stage && dto.stage !== existing.stage) {
      await this.appendTransitionEvent(organizationId, actorUserId, lead.id, 'lead.stage.transitioned', {
        fromStage: existing.stage,
        toStage: dto.stage,
      });
    } else {
      await this.appendTransitionEvent(organizationId, actorUserId, lead.id, 'lead.updated', {
        fields: Object.keys(dto),
      });
    }

    return lead;
  }

  async createIntakeDraft(organizationId: string, actorUserId: string, leadId: string, dto: CreateIntakeDraftDto) {
    const lead = await this.requireLead(organizationId, leadId);
    const submission = await this.prisma.intakeSubmission.create({
      data: {
        organizationId,
        leadId: lead.id,
        intakeFormDefinitionId: dto.intakeFormDefinitionId,
        submittedByContactId: dto.submittedByContactId,
        dataJson: dto.dataJson as Prisma.InputJsonValue,
      },
    });

    await this.transitionStage(organizationId, actorUserId, lead.id, lead.stage, LeadStage.SCREENING, 'lead.intake_draft.created', {
      intakeSubmissionId: submission.id,
    });

    return submission;
  }

  async runConflictCheck(organizationId: string, actorUserId: string, leadId: string, dto: RunConflictCheckDto) {
    const lead = await this.requireLead(organizationId, leadId);
    const conflictCheck = await this.prisma.conflictCheckResult.create({
      data: {
        organizationId,
        queryText: dto.queryText,
        searchedByUserId: actorUserId,
        resultJson: {
          ...(dto.resultJson ?? {}),
          resolved: false,
          leadId,
        },
      },
    });

    await this.transitionStage(
      organizationId,
      actorUserId,
      lead.id,
      lead.stage,
      LeadStage.CONFLICT_CHECK,
      'lead.conflict_check.completed',
      { conflictCheckId: conflictCheck.id },
    );

    return conflictCheck;
  }

  async resolveConflict(organizationId: string, actorUserId: string, leadId: string, dto: ResolveConflictDto) {
    const lead = await this.requireLead(organizationId, leadId);
    const latest = await this.getLatestConflictCheck(organizationId, leadId);

    if (!latest) {
      throw new BadRequestException('Conflict check must be run before resolution');
    }

    const mergedResult = this.asObject(latest.resultJson);
    const conflictCheck = await this.prisma.conflictCheckResult.update({
      where: { id: latest.id },
      data: {
        resultJson: {
          ...mergedResult,
          resolved: dto.resolved,
          resolutionNotes: dto.resolutionNotes ?? null,
          resolvedAt: new Date().toISOString(),
        },
      },
    });

    await this.transitionStage(
      organizationId,
      actorUserId,
      lead.id,
      lead.stage,
      dto.resolved ? LeadStage.CONSULTATION : LeadStage.CONFLICT_CHECK,
      'lead.conflict_resolution.recorded',
      { conflictCheckId: conflictCheck.id, resolved: dto.resolved },
    );

    return conflictCheck;
  }

  async generateEngagement(organizationId: string, actorUserId: string, leadId: string, dto: GenerateEngagementDto) {
    const lead = await this.requireLead(organizationId, leadId);
    const envelope = await this.prisma.eSignEnvelope.create({
      data: {
        organizationId,
        engagementLetterTemplateId: dto.engagementLetterTemplateId,
        provider: dto.provider ?? 'INTERNAL',
        status: 'DRAFT',
        payloadJson: {
          ...((dto.payloadJson ?? {}) as Prisma.InputJsonObject),
          leadId: lead.id,
          generatedByUserId: actorUserId,
        },
      },
    });

    await this.appendTransitionEvent(organizationId, actorUserId, lead.id, 'lead.engagement.generated', {
      envelopeId: envelope.id,
      stage: lead.stage,
    });

    return envelope;
  }

  async sendEngagement(organizationId: string, actorUserId: string, leadId: string, dto: SendEngagementDto) {
    await this.requireLead(organizationId, leadId);
    const isConflictResolved = await this.isConflictResolved(organizationId, leadId);
    if (!isConflictResolved) {
      throw new BadRequestException('Conflict resolution is required before sending engagement');
    }

    const envelope = await this.prisma.eSignEnvelope.findFirst({
      where: {
        id: dto.envelopeId,
        organizationId,
        payloadJson: {
          path: ['leadId'],
          equals: leadId,
        },
      },
    });

    if (!envelope) {
      throw new NotFoundException('Engagement envelope not found');
    }

    const updated = await this.prisma.eSignEnvelope.update({
      where: { id: envelope.id },
      data: {
        status: 'SENT',
        externalId: dto.externalId,
        payloadJson: {
          ...this.asObject(envelope.payloadJson),
          sentAt: new Date().toISOString(),
          sentByUserId: actorUserId,
        },
      },
    });

    await this.appendTransitionEvent(organizationId, actorUserId, leadId, 'lead.engagement.sent', {
      envelopeId: updated.id,
    });

    return updated;
  }

  async convert(organizationId: string, actorUserId: string, leadId: string, dto: ConvertLeadDto) {
    const lead = await this.requireLead(organizationId, leadId);

    const signedEnvelope = await this.prisma.eSignEnvelope.findFirst({
      where: {
        organizationId,
        status: 'SIGNED',
        payloadJson: {
          path: ['leadId'],
          equals: leadId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!signedEnvelope) {
      throw new BadRequestException('Signed engagement is required before converting lead');
    }

    const matter = await this.prisma.matter.create({
      data: {
        organizationId,
        name: dto.name,
        matterNumber: dto.matterNumber,
        practiceArea: dto.practiceArea,
        jurisdiction: dto.jurisdiction,
        venue: dto.venue,
      },
    });

    await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        stage: LeadStage.RETAINED,
      },
    });

    await this.appendTransitionEvent(organizationId, actorUserId, leadId, 'lead.converted', {
      fromStage: lead.stage,
      toStage: LeadStage.RETAINED,
      matterId: matter.id,
      envelopeId: signedEnvelope.id,
    });

    return {
      leadId,
      matter,
    };
  }

  async setupChecklist(organizationId: string, leadId: string) {
    await this.requireLead(organizationId, leadId);

    const [intakeCount, conflict, engagementEnvelope] = await Promise.all([
      this.prisma.intakeSubmission.count({ where: { organizationId, leadId } }),
      this.getLatestConflictCheck(organizationId, leadId),
      this.prisma.eSignEnvelope.findFirst({
        where: {
          organizationId,
          payloadJson: { path: ['leadId'], equals: leadId },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const conflictResult = conflict ? this.asObject(conflict.resultJson) : null;
    const conflictResolved = Boolean(conflictResult?.resolved);
    const engagementSent = engagementEnvelope?.status === 'SENT' || engagementEnvelope?.status === 'SIGNED';
    const engagementSigned = engagementEnvelope?.status === 'SIGNED';

    return {
      leadId,
      intakeDraftCreated: intakeCount > 0,
      conflictChecked: Boolean(conflict),
      conflictResolved,
      engagementGenerated: Boolean(engagementEnvelope),
      engagementSent,
      engagementSigned,
      convertible: engagementSigned,
    };
  }

  private async requireLead(organizationId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, organizationId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  private async transitionStage(
    organizationId: string,
    actorUserId: string,
    leadId: string,
    fromStage: LeadStage,
    toStage: LeadStage,
    action: string,
    metadata: Record<string, unknown>,
  ) {
    if (fromStage !== toStage) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { stage: toStage },
      });
    }

    await this.appendTransitionEvent(organizationId, actorUserId, leadId, action, {
      ...metadata,
      fromStage,
      toStage,
    });
  }

  private async appendTransitionEvent(
    organizationId: string,
    actorUserId: string,
    leadId: string,
    action: string,
    metadata: Record<string, unknown>,
  ) {
    await this.audit.appendEvent({
      organizationId,
      actorUserId,
      action,
      entityType: 'lead',
      entityId: leadId,
      metadata,
    });
  }

  private async getLatestConflictCheck(organizationId: string, leadId: string) {
    return this.prisma.conflictCheckResult.findFirst({
      where: {
        organizationId,
        resultJson: {
          path: ['leadId'],
          equals: leadId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async isConflictResolved(organizationId: string, leadId: string) {
    const latest = await this.getLatestConflictCheck(organizationId, leadId);
    if (!latest) {
      return false;
    }

    const result = this.asObject(latest.resultJson);
    return result.resolved === true;
  }

  private asObject(value: Prisma.JsonValue | null | undefined): Record<string, any> {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return {};
    }

    return value as Record<string, any>;
  }
}
