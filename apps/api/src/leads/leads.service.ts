import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContactKind, LeadStage, Prisma } from '@prisma/client';
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

type ProposalLifecycleStatus = 'PROPOSED' | 'IN_REVIEW' | 'APPROVED' | 'EXECUTED' | 'RETURNED';

type ProactiveLeadProposal = {
  id: string;
  kind: 'CLIENT_ENGAGEMENT' | 'LIFECYCLE_NEXT_ACTION';
  status: ProposalLifecycleStatus;
  draftOnly: true;
  autoSend: false;
  confidence: number;
  reason: string;
  rationale: string;
  lifecycle: {
    currentStage: LeadStage;
    recommendedStage: LeadStage;
  };
  citations: Array<{ entityType: string; entityId: string; field?: string }>;
  createdAt: string;
};

type LeadConversionPreview = {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  propertyAddress?: string;
  suggestedMatterName: string;
  suggestedMatterNumber: string;
  defaultParticipants: Array<{
    name: string;
    roleKey: string;
    side: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT';
    isPrimary: boolean;
    existingContactId?: string;
  }>;
};

@Injectable()
export class LeadsService {
  private static readonly DEFAULT_LEAD_INTAKE_FORM_NAME = 'construction-intake-v1';
  private static readonly DEFAULT_ENGAGEMENT_TEMPLATES: Record<
    string,
    { name: string; bodyTemplate: string; mergeFieldsJson?: Record<string, unknown> }
  > = {
    'engagement-template-standard': {
      name: 'Standard Hourly',
      bodyTemplate:
        'Client: {{clientName}}\nMatter: {{matterName}}\nFee Type: Hourly\nRate: {{rate}}\nRetainer: {{retainerAmount}}\n',
      mergeFieldsJson: { feeType: 'HOURLY', defaults: ['rate', 'retainerAmount'] },
    },
    'engagement-template-contingency': {
      name: 'Contingency 33/40',
      bodyTemplate:
        'Client: {{clientName}}\nMatter: {{matterName}}\nFee Type: Contingency\nTerms: 33% pre-suit / 40% post-filing.\n',
      mergeFieldsJson: { feeType: 'CONTINGENCY' },
    },
    'engagement-template-flat-fee': {
      name: 'Flat Fee',
      bodyTemplate:
        'Client: {{clientName}}\nMatter: {{matterName}}\nFee Type: Flat Fee\nFlat Fee Amount: {{retainerAmount}}\n',
      mergeFieldsJson: { feeType: 'FLAT' },
    },
  };

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
    const intakeFormDefinitionId = await this.resolveIntakeFormDefinitionId(
      organizationId,
      dto.intakeFormDefinitionId,
    );
    const submission = await this.prisma.intakeSubmission.create({
      data: {
        organizationId,
        leadId: lead.id,
        intakeFormDefinitionId,
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
    const engagementLetterTemplateId = await this.resolveEngagementTemplateId(
      organizationId,
      dto.engagementLetterTemplateId,
    );
    const envelope = await this.prisma.eSignEnvelope.create({
      data: {
        organizationId,
        engagementLetterTemplateId,
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

  async getLatestEngagementEnvelope(organizationId: string, leadId: string) {
    await this.requireLead(organizationId, leadId);
    return this.prisma.eSignEnvelope.findFirst({
      where: {
        organizationId,
        payloadJson: {
          path: ['leadId'],
          equals: leadId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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

    const participants = Array.isArray(dto.participants) ? dto.participants : [];
    const participantRoleKeys = [...new Set(
      participants
        .map((participant) => this.normalizeOptionalText(participant.roleKey))
        .filter((value): value is string => Boolean(value)),
    )];
    const participantRoleDefinitions = participantRoleKeys.length
      ? await this.prisma.participantRoleDefinition.findMany({
          where: {
            organizationId,
            key: {
              in: participantRoleKeys,
            },
          },
        })
      : [];
    const participantRoleDefinitionMap = new Map(
      participantRoleDefinitions.map((definition) => [definition.key, definition]),
    );

    for (const roleKey of participantRoleKeys) {
      if (!participantRoleDefinitionMap.has(roleKey)) {
        throw new NotFoundException(`Participant role definition not found: ${roleKey}`);
      }
    }

    const deniedUserIds = this.uniqueTextArray(dto.deniedUserIds);
    if (deniedUserIds.length > 0) {
      const memberships = await this.prisma.membership.findMany({
        where: {
          organizationId,
          userId: {
            in: deniedUserIds,
          },
        },
        select: { userId: true },
      });
      const validUserIds = new Set(memberships.map((membership) => membership.userId));
      const invalidUserIds = deniedUserIds.filter((userId) => !validUserIds.has(userId));
      if (invalidUserIds.length > 0) {
        throw new NotFoundException(`Denied users not found in organization: ${invalidUserIds.join(', ')}`);
      }
    }

    const matter = await this.prisma.matter.create({
      data: {
        organizationId,
        name: dto.name,
        matterNumber: dto.matterNumber,
        practiceArea: dto.practiceArea,
        jurisdiction: dto.jurisdiction,
        venue: dto.venue,
        ethicalWallEnabled: dto.ethicalWallEnabled ?? false,
      },
    });

    await this.prisma.matterTeamMember.create({
      data: {
        matterId: matter.id,
        userId: actorUserId,
        canWrite: true,
      },
    });

    for (const participant of participants) {
      const roleKey = this.normalizeOptionalText(participant.roleKey);
      const participantName = this.normalizeOptionalText(participant.name);
      if (!roleKey || !participantName) {
        throw new BadRequestException('Participant name and role are required');
      }

      const roleDefinition = participantRoleDefinitionMap.get(roleKey);
      if (!roleDefinition) {
        throw new NotFoundException(`Participant role definition not found: ${roleKey}`);
      }

      const counselRole = this.isCounselRole(roleDefinition.key, roleDefinition.label);
      const contactId = await this.resolveLeadContactId({
        organizationId,
        providedContactId: participant.existingContactId,
        fallbackName: participantName,
        fallbackKind: ContactKind.PERSON,
        missingError: 'Participant contact is required',
      });
      const representedByContactId = counselRole
        ? undefined
        : await this.resolveOptionalLeadContactId({
            organizationId,
            providedContactId: participant.representedByContactId,
            fallbackName: participant.representedByName,
            fallbackKind: ContactKind.PERSON,
          });
      const lawFirmContactId = counselRole
        ? await this.resolveOptionalLeadContactId({
            organizationId,
            providedContactId: participant.lawFirmContactId,
            fallbackName: participant.lawFirmName,
            fallbackKind: ContactKind.ORGANIZATION,
          })
        : undefined;

      if (counselRole && representedByContactId) {
        throw new BadRequestException('Counsel participants cannot set represented-by links');
      }
      if (!counselRole && lawFirmContactId) {
        throw new BadRequestException('Law firm links are only valid for counsel participants');
      }

      await this.prisma.matterParticipant.create({
        data: {
          organizationId,
          matterId: matter.id,
          contactId,
          participantRoleKey: roleDefinition.key,
          participantRoleDefinitionId: roleDefinition.id,
          side: participant.side ?? roleDefinition.sideDefault,
          isPrimary: participant.isPrimary ?? false,
          representedByContactId,
          lawFirmContactId,
          notes: this.normalizeOptionalText(participant.notes),
        },
      });
    }

    const deniedUsersToCreate = deniedUserIds.filter((userId) => userId !== actorUserId);
    if (deniedUsersToCreate.length > 0) {
      await this.prisma.matterAccessDeny.createMany({
        data: deniedUsersToCreate.map((userId) => ({
          matterId: matter.id,
          userId,
          reason: this.normalizeOptionalText(dto.ethicalWallNotes) ?? 'Lead conversion ethical wall',
        })),
        skipDuplicates: true,
      });
    }

    await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        stage: LeadStage.RETAINED,
      },
    });

    await this.audit.appendEvent({
      organizationId,
      actorUserId,
      action: 'matter.created',
      entityType: 'matter',
      entityId: matter.id,
      metadata: {
        source: 'lead.convert',
        leadId,
        participantCount: participants.length,
        ethicalWallEnabled: dto.ethicalWallEnabled ?? false,
      },
    });

    await this.appendTransitionEvent(organizationId, actorUserId, leadId, 'lead.converted', {
      fromStage: lead.stage,
      toStage: LeadStage.RETAINED,
      matterId: matter.id,
      envelopeId: signedEnvelope.id,
      participantCount: participants.length,
      ethicalWallEnabled: dto.ethicalWallEnabled ?? false,
      deniedUserIds,
    });

    return {
      leadId,
      matter,
    };
  }

  async setupChecklist(organizationId: string, actorUserId: string, leadId: string) {
    const lead = await this.requireLead(organizationId, leadId);

    const [intakeCount, latestIntakeSubmission, conflict, engagementEnvelope] = await Promise.all([
      this.prisma.intakeSubmission.count({ where: { organizationId, leadId } }),
      this.prisma.intakeSubmission.findFirst({
        where: { organizationId, leadId },
        orderBy: { createdAt: 'desc' },
      }),
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
    const conversionPreview = this.buildLeadConversionPreview(lead.id, latestIntakeSubmission?.dataJson);

    const checklist = {
      leadId,
      intakeDraftCreated: intakeCount > 0,
      conflictChecked: Boolean(conflict),
      conflictResolved,
      engagementGenerated: Boolean(engagementEnvelope),
      engagementSent,
      engagementSigned,
      convertible: engagementSigned,
      intakeDraft: intakeCount > 0,
      readyToConvert: engagementSigned,
      conversionPreview,
    };

    const proactiveProposals = this.evaluateProactiveProposals({
      lead,
      checklist,
      conflictCheckId: conflict?.id,
      engagementEnvelopeId: engagementEnvelope?.id,
    });

    await this.audit.appendEvent({
      organizationId,
      actorUserId,
      action: 'lead.proactive_proposals.evaluated',
      entityType: 'lead',
      entityId: leadId,
      metadata: {
        proposalCount: proactiveProposals.length,
        proposals: proactiveProposals.map((proposal) => ({
          id: proposal.id,
          kind: proposal.kind,
          status: proposal.status,
          reason: proposal.reason,
          confidence: proposal.confidence,
          rationale: proposal.rationale,
          citations: proposal.citations,
          draftOnly: proposal.draftOnly,
          autoSend: proposal.autoSend,
          createdAt: proposal.createdAt,
        })),
      },
    });

    return {
      ...checklist,
      proactiveProposals,
    };
  }


  private evaluateProactiveProposals(input: {
    lead: Awaited<ReturnType<LeadsService['requireLead']>>;
    checklist: {
      leadId: string;
      intakeDraftCreated: boolean;
      conflictChecked: boolean;
      conflictResolved: boolean;
      engagementGenerated: boolean;
      engagementSent: boolean;
      engagementSigned: boolean;
      convertible: boolean;
    };
    conflictCheckId?: string;
    engagementEnvelopeId?: string;
  }): ProactiveLeadProposal[] {
    const proposals: ProactiveLeadProposal[] = [];
    const now = new Date().toISOString();
    const currentStageRank = this.stageRank(input.lead.stage);

    const pushProposal = (proposal: Omit<ProactiveLeadProposal, 'status' | 'draftOnly' | 'autoSend' | 'createdAt'>) => {
      proposals.push({
        ...proposal,
        status: 'PROPOSED',
        draftOnly: true,
        autoSend: false,
        createdAt: now,
      });
    };

    if (!input.checklist.intakeDraftCreated && currentStageRank <= this.stageRank(LeadStage.NEW)) {
      pushProposal({
        id: `lead-${input.lead.id}-proposal-intake`,
        kind: 'LIFECYCLE_NEXT_ACTION',
        confidence: 0.96,
        reason: 'Intake draft is missing for early-stage lead triage',
        rationale: 'Create an intake draft to move lead discovery from NEW to SCREENING.',
        lifecycle: {
          currentStage: input.lead.stage,
          recommendedStage: LeadStage.SCREENING,
        },
        citations: [{ entityType: 'lead', entityId: input.lead.id, field: 'stage' }],
      });
    }

    if (!input.checklist.conflictChecked && currentStageRank >= this.stageRank(LeadStage.SCREENING)) {
      pushProposal({
        id: `lead-${input.lead.id}-proposal-conflict-check`,
        kind: 'LIFECYCLE_NEXT_ACTION',
        confidence: 0.93,
        reason: 'Conflict check has not been completed',
        rationale: 'Run conflict checks before consultation and any external engagement workflow.',
        lifecycle: {
          currentStage: input.lead.stage,
          recommendedStage: LeadStage.CONFLICT_CHECK,
        },
        citations: [{ entityType: 'lead', entityId: input.lead.id, field: 'stage' }],
      });
    }

    if (!input.checklist.engagementGenerated && input.checklist.conflictResolved) {
      pushProposal({
        id: `lead-${input.lead.id}-proposal-engagement-generate`,
        kind: 'CLIENT_ENGAGEMENT',
        confidence: 0.91,
        reason: 'Conflict is resolved but engagement draft is not prepared',
        rationale: 'Generate a draft engagement letter for attorney review; do not auto-send.',
        lifecycle: {
          currentStage: input.lead.stage,
          recommendedStage: LeadStage.CONSULTATION,
        },
        citations: [
          { entityType: 'lead', entityId: input.lead.id, field: 'stage' },
          ...(input.conflictCheckId ? [{ entityType: 'conflictCheckResult', entityId: input.conflictCheckId }] : []),
        ],
      });
    }

    if (input.checklist.engagementGenerated && !input.checklist.engagementSent && input.checklist.conflictResolved) {
      pushProposal({
        id: `lead-${input.lead.id}-proposal-engagement-review-send`,
        kind: 'CLIENT_ENGAGEMENT',
        confidence: 0.89,
        reason: 'Engagement draft exists but has not progressed to delivery',
        rationale: 'Route the engagement draft through attorney review and explicit approval before send.',
        lifecycle: {
          currentStage: input.lead.stage,
          recommendedStage: LeadStage.CONSULTATION,
        },
        citations: [
          { entityType: 'lead', entityId: input.lead.id, field: 'stage' },
          ...(input.engagementEnvelopeId ? [{ entityType: 'eSignEnvelope', entityId: input.engagementEnvelopeId, field: 'status' }] : []),
        ],
      });
    }

    if (input.checklist.engagementSigned && input.lead.stage !== LeadStage.RETAINED) {
      pushProposal({
        id: `lead-${input.lead.id}-proposal-convert`,
        kind: 'LIFECYCLE_NEXT_ACTION',
        confidence: 0.97,
        reason: 'Signed engagement qualifies lead for matter conversion',
        rationale: 'Convert retained lead into a matter and advance lifecycle from consultation to retained.',
        lifecycle: {
          currentStage: input.lead.stage,
          recommendedStage: LeadStage.RETAINED,
        },
        citations: [
          { entityType: 'lead', entityId: input.lead.id, field: 'stage' },
          ...(input.engagementEnvelopeId ? [{ entityType: 'eSignEnvelope', entityId: input.engagementEnvelopeId, field: 'status' }] : []),
        ],
      });
    }

    return proposals;
  }

  private stageRank(stage: LeadStage): number {
    const ordered: LeadStage[] = [
      LeadStage.NEW,
      LeadStage.SCREENING,
      LeadStage.CONFLICT_CHECK,
      LeadStage.CONSULTATION,
      LeadStage.RETAINED,
      LeadStage.REJECTED,
    ];
    const index = ordered.indexOf(stage);
    return index === -1 ? 0 : index;
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

  private buildLeadConversionPreview(leadId: string, draftJson: Prisma.JsonValue | null | undefined): LeadConversionPreview {
    const draft = this.asObject(draftJson);
    const client = this.asObject(draft.client);
    const property = this.asObject(draft.property);

    const clientName =
      this.safeString([client.firstName, client.lastName].filter(Boolean).join(' ')) ??
      this.safeString(client.company) ??
      'Lead Intake';
    const clientEmail = this.normalizeOptionalText(client.email);
    const clientPhone = this.normalizeOptionalText(client.phone);
    const propertyAddress = [property.addressLine1, property.city, property.state, property.zip]
      .map((value) => this.normalizeOptionalText(value))
      .filter(Boolean)
      .join(', ');
    const matterNameSegments = [clientName, this.normalizeOptionalText(property.addressLine1)]
      .filter(Boolean)
      .join(' - ');

    return {
      clientName: clientName || undefined,
      clientEmail,
      clientPhone,
      propertyAddress: propertyAddress || undefined,
      suggestedMatterName: matterNameSegments || 'Construction Intake Matter',
      suggestedMatterNumber: this.buildSuggestedMatterNumber(leadId),
      defaultParticipants: clientName
        ? [
            {
              name: clientName,
              roleKey: 'client',
              side: 'CLIENT_SIDE',
              isPrimary: true,
              existingContactId: this.normalizeOptionalText(client.linkedContactId),
            },
          ]
        : [],
    };
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

  private buildSuggestedMatterNumber(leadId: string) {
    const stamp = new Date().getFullYear();
    const suffix = leadId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'LEAD';
    return `M-${stamp}-${suffix}`;
  }

  private async resolveIntakeFormDefinitionId(organizationId: string, requestedIdOrName: string) {
    const normalized = requestedIdOrName?.trim() || LeadsService.DEFAULT_LEAD_INTAKE_FORM_NAME;
    const existing = await this.prisma.intakeFormDefinition.findFirst({
      where: {
        organizationId,
        OR: [{ id: normalized }, { name: normalized }],
      },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }

    if (this.isUuidLike(normalized)) {
      throw new NotFoundException('Intake form definition not found');
    }

    const created = await this.prisma.intakeFormDefinition.create({
      data: {
        organizationId,
        name: normalized,
        isClientPortalEnabled: false,
        schemaJson: {
          type: 'object',
          title: 'Lead Intake Wizard Draft',
        },
      },
      select: { id: true },
    });

    return created.id;
  }

  private async resolveEngagementTemplateId(organizationId: string, requestedIdOrName: string) {
    const normalized = requestedIdOrName?.trim() || 'engagement-template-standard';
    const existing = await this.prisma.engagementLetterTemplate.findFirst({
      where: {
        organizationId,
        OR: [{ id: normalized }, { name: normalized }],
      },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }

    if (this.isUuidLike(normalized)) {
      throw new NotFoundException('Engagement letter template not found');
    }

    const fallback =
      LeadsService.DEFAULT_ENGAGEMENT_TEMPLATES[normalized] ?? {
        name: normalized,
        bodyTemplate: 'Client: {{clientName}}\nMatter: {{matterName}}\n',
        mergeFieldsJson: { generatedFrom: 'lead.generateEngagement' },
      };

    const created = await this.prisma.engagementLetterTemplate.create({
      data: {
        organizationId,
        name: fallback.name,
        bodyTemplate: fallback.bodyTemplate,
        mergeFieldsJson: (fallback.mergeFieldsJson ?? {}) as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    return created.id;
  }

  private async resolveLeadContactId(input: {
    organizationId: string;
    providedContactId?: string;
    fallbackName?: string;
    fallbackKind: ContactKind;
    missingError: string;
  }) {
    if (input.providedContactId) {
      await this.assertContactInOrganization(input.organizationId, input.providedContactId, input.missingError);
      return input.providedContactId;
    }

    const displayName = this.normalizeOptionalText(input.fallbackName);
    if (!displayName) {
      throw new BadRequestException(input.missingError);
    }

    const existing = await this.prisma.contact.findFirst({
      where: {
        organizationId: input.organizationId,
        displayName,
      },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }

    const contact = await this.prisma.contact.create({
      data: {
        organizationId: input.organizationId,
        kind: input.fallbackKind,
        displayName,
        tags: ['lead-convert-generated'],
      },
      select: { id: true },
    });

    if (input.fallbackKind === ContactKind.PERSON) {
      const [firstName, ...rest] = displayName.split(' ').filter(Boolean);
      await this.prisma.personProfile.create({
        data: {
          contactId: contact.id,
          firstName: firstName || displayName,
          lastName: rest.join(' ') || null,
        },
      });
    } else {
      await this.prisma.organizationProfile.create({
        data: {
          contactId: contact.id,
          legalName: displayName,
        },
      });
    }

    return contact.id;
  }

  private async resolveOptionalLeadContactId(input: {
    organizationId: string;
    providedContactId?: string;
    fallbackName?: string;
    fallbackKind: ContactKind;
  }) {
    const providedContactId = this.normalizeOptionalText(input.providedContactId);
    const fallbackName = this.normalizeOptionalText(input.fallbackName);
    if (!providedContactId && !fallbackName) {
      return undefined;
    }

    return this.resolveLeadContactId({
      organizationId: input.organizationId,
      providedContactId,
      fallbackName,
      fallbackKind: input.fallbackKind,
      missingError: 'Related contact is required',
    });
  }

  private async assertContactInOrganization(organizationId: string, contactId: string, missingError: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId,
      },
      select: { id: true },
    });

    if (!contact) {
      throw new NotFoundException(missingError);
    }
  }

  private isUuidLike(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private isCounselRole(roleKey: string, roleLabel?: string | null) {
    const fingerprint = `${roleKey} ${roleLabel || ''}`.toLowerCase();
    return /(counsel|attorney|lawyer)/.test(fingerprint);
  }

  private normalizeOptionalText(value?: string | null) {
    const trimmed = String(value || '').trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private safeString(value?: string | null) {
    return this.normalizeOptionalText(value);
  }

  private uniqueTextArray(values?: string[] | null) {
    return [...new Set((values ?? []).map((value) => this.normalizeOptionalText(value)).filter(Boolean) as string[])];
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
