import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommunicationParticipantRole, ContactKind, MatterStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AccessService } from '../access/access.service';
import { AuthenticatedUser } from '../common/types';

@Injectable()
export class MattersService {
  private static readonly INTAKE_WIZARD_DRAFT_FORM_NAME = 'Matter Intake Wizard Draft';

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly accessService: AccessService,
  ) {}

  async list(organizationId: string) {
    return this.prisma.matter.findMany({
      where: { organizationId },
      include: {
        stage: true,
        matterType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: {
    organizationId: string;
    actorUserId: string;
    name: string;
    matterNumber: string;
    practiceArea: string;
    jurisdiction?: string;
    venue?: string;
    matterTypeId?: string;
    stageId?: string;
    openedAt?: string;
    ethicalWallEnabled?: boolean;
  }) {
    const matter = await this.prisma.matter.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        matterNumber: input.matterNumber,
        practiceArea: input.practiceArea,
        jurisdiction: input.jurisdiction,
        venue: input.venue,
        matterTypeId: input.matterTypeId,
        stageId: input.stageId,
        openedAt: input.openedAt ? new Date(input.openedAt) : new Date(),
        status: MatterStatus.OPEN,
        ethicalWallEnabled: input.ethicalWallEnabled ?? false,
      },
    });

    await this.prisma.matterTeamMember.create({
      data: {
        matterId: matter.id,
        userId: input.actorUserId,
        canWrite: true,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: 'matter.created',
      entityType: 'matter',
      entityId: matter.id,
      metadata: matter,
    });

    return matter;
  }

  async updateMatter(input: {
    user: AuthenticatedUser;
    matterId: string;
    name?: string;
    matterNumber?: string;
    practiceArea?: string;
    status?: MatterStatus;
    jurisdiction?: string | null;
    venue?: string | null;
    stageId?: string | null;
    matterTypeId?: string | null;
    openedAt?: string;
    closedAt?: string | null;
  }) {
    await this.accessService.assertMatterAccess(input.user, input.matterId, 'write');

    const matter = await this.prisma.matter.findFirst({
      where: {
        id: input.matterId,
        organizationId: input.user.organizationId,
      },
      select: {
        id: true,
      },
    });
    if (!matter) {
      throw new NotFoundException('Matter not found');
    }

    const data: Prisma.MatterUpdateInput = {};
    const updatedFields: string[] = [];

    if (input.name !== undefined) {
      const name = this.safeString(input.name);
      if (!name) {
        throw new BadRequestException('Matter name cannot be empty');
      }
      data.name = name;
      updatedFields.push('name');
    }

    if (input.matterNumber !== undefined) {
      const matterNumber = this.safeString(input.matterNumber);
      if (!matterNumber) {
        throw new BadRequestException('Matter number cannot be empty');
      }
      const duplicate = await this.prisma.matter.findFirst({
        where: {
          organizationId: input.user.organizationId,
          matterNumber,
          id: {
            not: input.matterId,
          },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new BadRequestException('Matter number already exists in this organization');
      }
      data.matterNumber = matterNumber;
      updatedFields.push('matterNumber');
    }

    if (input.practiceArea !== undefined) {
      const practiceArea = this.safeString(input.practiceArea);
      if (!practiceArea) {
        throw new BadRequestException('Practice area cannot be empty');
      }
      data.practiceArea = practiceArea;
      updatedFields.push('practiceArea');
    }

    if (input.status !== undefined) {
      data.status = input.status;
      updatedFields.push('status');
    }

    if (input.jurisdiction !== undefined) {
      data.jurisdiction = this.normalizeOptionalText(input.jurisdiction) ?? null;
      updatedFields.push('jurisdiction');
    }

    if (input.venue !== undefined) {
      data.venue = this.normalizeOptionalText(input.venue) ?? null;
      updatedFields.push('venue');
    }

    if (input.stageId !== undefined) {
      const stageId = this.normalizeOptionalText(input.stageId);
      if (stageId) {
        const stage = await this.prisma.matterStage.findFirst({
          where: {
            id: stageId,
            organizationId: input.user.organizationId,
          },
          select: { id: true },
        });
        if (!stage) {
          throw new NotFoundException('Matter stage not found');
        }
        data.stage = {
          connect: { id: stageId },
        };
      } else {
        data.stage = {
          disconnect: true,
        };
      }
      updatedFields.push('stageId');
    }

    if (input.matterTypeId !== undefined) {
      const matterTypeId = this.normalizeOptionalText(input.matterTypeId);
      if (matterTypeId) {
        const matterType = await this.prisma.matterType.findFirst({
          where: {
            id: matterTypeId,
            organizationId: input.user.organizationId,
          },
          select: { id: true },
        });
        if (!matterType) {
          throw new NotFoundException('Matter type not found');
        }
        data.matterType = {
          connect: { id: matterTypeId },
        };
      } else {
        data.matterType = {
          disconnect: true,
        };
      }
      updatedFields.push('matterTypeId');
    }

    if (input.openedAt !== undefined) {
      const openedAt = new Date(input.openedAt);
      if (Number.isNaN(openedAt.getTime())) {
        throw new BadRequestException('Invalid openedAt timestamp');
      }
      data.openedAt = openedAt;
      updatedFields.push('openedAt');
    }

    if (input.closedAt !== undefined) {
      const closedAtValue = this.normalizeOptionalText(input.closedAt);
      if (!closedAtValue) {
        data.closedAt = null;
      } else {
        const closedAt = new Date(closedAtValue);
        if (Number.isNaN(closedAt.getTime())) {
          throw new BadRequestException('Invalid closedAt timestamp');
        }
        data.closedAt = closedAt;
      }
      updatedFields.push('closedAt');
    }

    if (updatedFields.length === 0) {
      return this.dashboard(input.user, input.matterId);
    }

    const updatedMatter = await this.prisma.matter.update({
      where: { id: input.matterId },
      data,
      select: {
        id: true,
        matterNumber: true,
        name: true,
        practiceArea: true,
        status: true,
        stageId: true,
        matterTypeId: true,
        jurisdiction: true,
        venue: true,
        openedAt: true,
        closedAt: true,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'matter.updated',
      entityType: 'matter',
      entityId: input.matterId,
      metadata: {
        updatedFields,
        matter: updatedMatter,
      },
    });

    return this.dashboard(input.user, input.matterId);
  }

  async addParticipant(input: {
    user: AuthenticatedUser;
    matterId: string;
    contactId: string;
    participantRoleKey: string;
    side?: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT';
    isPrimary?: boolean;
    representedByContactId?: string;
    lawFirmContactId?: string;
    notes?: string;
  }) {
    await this.accessService.assertMatterAccess(input.user, input.matterId, 'write');

    const roleDef = await this.prisma.participantRoleDefinition.findFirst({
      where: {
        organizationId: input.user.organizationId,
        key: input.participantRoleKey,
      },
    });
    if (!roleDef) {
      throw new NotFoundException(`Participant role definition not found: ${input.participantRoleKey}`);
    }

    await this.assertContactInOrganization(
      input.user.organizationId,
      input.contactId,
      `Participant contact not found: ${input.contactId}`,
    );

    if (input.representedByContactId) {
      if (input.representedByContactId === input.contactId) {
        throw new BadRequestException('representedByContactId cannot match contactId');
      }
      await this.assertContactInOrganization(
        input.user.organizationId,
        input.representedByContactId,
        `Representing contact not found: ${input.representedByContactId}`,
      );
    }

    if (input.lawFirmContactId) {
      if (input.lawFirmContactId === input.contactId) {
        throw new BadRequestException('lawFirmContactId cannot match contactId');
      }
      await this.assertContactInOrganization(
        input.user.organizationId,
        input.lawFirmContactId,
        `Law firm contact not found: ${input.lawFirmContactId}`,
      );
    }

    const counselRole = this.isCounselRole(roleDef.key, roleDef.label);
    if (counselRole && input.representedByContactId) {
      throw new BadRequestException('Counsel roles cannot use representedByContactId; add represented parties instead');
    }
    if (!counselRole && input.lawFirmContactId) {
      throw new BadRequestException('lawFirmContactId is only valid for counsel roles');
    }

    const participant = await this.prisma.matterParticipant.create({
      data: {
        organizationId: input.user.organizationId,
        matterId: input.matterId,
        contactId: input.contactId,
        participantRoleKey: input.participantRoleKey,
        participantRoleDefinitionId: roleDef.id,
        side: input.side ?? roleDef.sideDefault,
        isPrimary: input.isPrimary ?? false,
        representedByContactId: input.representedByContactId,
        lawFirmContactId: input.lawFirmContactId,
        notes: input.notes,
      },
      include: {
        contact: true,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'matter.participant.added',
      entityType: 'matterParticipant',
      entityId: participant.id,
      metadata: participant,
    });

    return participant;
  }

  async removeParticipant(input: {
    user: AuthenticatedUser;
    matterId: string;
    participantId: string;
  }) {
    await this.accessService.assertMatterAccess(input.user, input.matterId, 'write');

    const participant = await this.prisma.matterParticipant.findFirst({
      where: {
        id: input.participantId,
        matterId: input.matterId,
        organizationId: input.user.organizationId,
      },
    });

    if (!participant) {
      throw new NotFoundException('Matter participant not found');
    }

    await this.prisma.matterParticipant.delete({
      where: { id: participant.id },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'matter.participant.removed',
      entityType: 'matterParticipant',
      entityId: participant.id,
      metadata: {
        matterId: participant.matterId,
        contactId: participant.contactId,
        participantRoleKey: participant.participantRoleKey,
      },
    });

    return { id: participant.id, removed: true };
  }

  async listParticipantRoleOptions(user: AuthenticatedUser, matterId: string) {
    await this.accessService.assertMatterAccess(user, matterId, 'read');

    return this.prisma.participantRoleDefinition.findMany({
      where: {
        organizationId: user.organizationId,
      },
      orderBy: [{ label: 'asc' }, { key: 'asc' }],
    });
  }

  async logCommunicationEntry(input: {
    user: AuthenticatedUser;
    matterId: string;
    threadId?: string;
    threadSubject?: string;
    type: 'EMAIL' | 'SMS' | 'CALL_LOG' | 'PORTAL_MESSAGE' | 'INTERNAL_NOTE';
    direction: 'INBOUND' | 'OUTBOUND' | 'INTERNAL';
    subject?: string;
    body: string;
    participantContactId?: string;
    occurredAt?: string;
  }) {
    await this.accessService.assertMatterAccess(input.user, input.matterId, 'write');

    const body = this.normalizeOptionalText(input.body);
    if (!body) {
      throw new BadRequestException('Communication body is required');
    }

    const subject = this.normalizeOptionalText(input.subject);
    const threadSubject = this.normalizeOptionalText(input.threadSubject);
    const participantContactId = this.normalizeOptionalText(input.participantContactId);
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : undefined;
    if (occurredAt && Number.isNaN(occurredAt.getTime())) {
      throw new BadRequestException('Invalid occurredAt timestamp');
    }

    let thread = null;
    if (input.threadId) {
      thread = await this.prisma.communicationThread.findFirst({
        where: {
          id: input.threadId,
          organizationId: input.user.organizationId,
          matterId: input.matterId,
        },
      });
      if (!thread) {
        throw new NotFoundException('Matter communication thread not found');
      }
    } else {
      thread = await this.prisma.communicationThread.create({
        data: {
          organizationId: input.user.organizationId,
          matterId: input.matterId,
          subject: threadSubject || subject || `${input.type} log`,
        },
      });
    }

    if (participantContactId) {
      await this.assertContactInOrganization(
        input.user.organizationId,
        participantContactId,
        `Communication contact not found: ${participantContactId}`,
      );
    }

    const message = await this.prisma.communicationMessage.create({
      data: {
        organizationId: input.user.organizationId,
        threadId: thread.id,
        type: input.type,
        direction: input.direction,
        subject,
        body,
        occurredAt: occurredAt ?? undefined,
        createdByUserId: input.user.id,
        participants: participantContactId
          ? {
              create: [
                {
                  contactId: participantContactId,
                  role: this.participantRoleForDirection(input.direction),
                },
              ],
            }
          : undefined,
      },
      include: {
        participants: true,
      },
    });

    await this.prisma.communicationThread.update({
      where: { id: thread.id },
      data: {
        subject: thread.subject || threadSubject || subject || undefined,
        updatedAt: new Date(),
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'matter.communication.logged',
      entityType: 'communicationMessage',
      entityId: message.id,
      metadata: {
        matterId: input.matterId,
        threadId: thread.id,
        type: input.type,
        direction: input.direction,
        participantContactId,
      },
    });

    return {
      ...message,
      threadId: thread.id,
      matterId: input.matterId,
    };
  }

  async updateCommunicationEntry(input: {
    user: AuthenticatedUser;
    matterId: string;
    messageId: string;
    threadId?: string;
    type?: 'EMAIL' | 'SMS' | 'CALL_LOG' | 'PORTAL_MESSAGE' | 'INTERNAL_NOTE';
    direction?: 'INBOUND' | 'OUTBOUND' | 'INTERNAL';
    subject?: string;
    body?: string;
    participantContactId?: string;
    occurredAt?: string;
  }) {
    await this.accessService.assertMatterAccess(input.user, input.matterId, 'write');

    const message = await this.findMatterScopedCommunicationMessage({
      organizationId: input.user.organizationId,
      matterId: input.matterId,
      messageId: input.messageId,
    });

    let targetThreadId = message.threadId;
    if (input.threadId) {
      const targetThread = await this.prisma.communicationThread.findFirst({
        where: {
          id: input.threadId,
          organizationId: input.user.organizationId,
          matterId: input.matterId,
        },
      });
      if (!targetThread) {
        throw new NotFoundException('Matter communication thread not found');
      }
      targetThreadId = targetThread.id;
    }

    const normalizedBody = input.body === undefined ? undefined : this.normalizeOptionalText(input.body);
    if (input.body !== undefined && !normalizedBody) {
      throw new BadRequestException('Communication body is required');
    }

    const occurredAt = input.occurredAt === undefined ? undefined : new Date(input.occurredAt);
    if (occurredAt && Number.isNaN(occurredAt.getTime())) {
      throw new BadRequestException('Invalid occurredAt timestamp');
    }

    const hasParticipantField = Object.prototype.hasOwnProperty.call(input, 'participantContactId');
    const normalizedParticipantContactId = this.normalizeOptionalText(input.participantContactId);
    if (hasParticipantField && normalizedParticipantContactId) {
      await this.assertContactInOrganization(
        input.user.organizationId,
        normalizedParticipantContactId,
        `Communication contact not found: ${normalizedParticipantContactId}`,
      );
    }

    const nextDirection = input.direction || message.direction;
    const updated = await this.prisma.communicationMessage.update({
      where: { id: message.id },
      data: {
        threadId: targetThreadId,
        ...(input.type ? { type: input.type } : {}),
        ...(input.direction ? { direction: input.direction } : {}),
        ...(input.subject !== undefined ? { subject: this.normalizeOptionalText(input.subject) ?? null } : {}),
        ...(input.body !== undefined ? { body: normalizedBody } : {}),
        ...(input.occurredAt !== undefined ? { occurredAt } : {}),
        ...(hasParticipantField
          ? {
              participants: {
                deleteMany: {},
                ...(normalizedParticipantContactId
                  ? {
                      create: [
                        {
                          contactId: normalizedParticipantContactId,
                          role: this.participantRoleForDirection(nextDirection),
                        },
                      ],
                    }
                  : {}),
              },
            }
          : {}),
      },
      include: {
        participants: {
          include: {
            contact: true,
          },
        },
      },
    });

    await this.prisma.communicationThread.update({
      where: { id: targetThreadId },
      data: { updatedAt: new Date() },
    });

    if (message.threadId !== targetThreadId) {
      await this.prisma.communicationThread.update({
        where: { id: message.threadId },
        data: { updatedAt: new Date() },
      });
    }

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'matter.communication.updated',
      entityType: 'communicationMessage',
      entityId: message.id,
      metadata: {
        matterId: input.matterId,
        previousThreadId: message.threadId,
        threadId: targetThreadId,
        type: updated.type,
        direction: updated.direction,
        participantContactId: normalizedParticipantContactId || null,
      },
    });

    return {
      ...updated,
      matterId: input.matterId,
    };
  }

  async deleteCommunicationEntry(input: {
    user: AuthenticatedUser;
    matterId: string;
    messageId: string;
  }) {
    await this.accessService.assertMatterAccess(input.user, input.matterId, 'write');

    const message = await this.findMatterScopedCommunicationMessage({
      organizationId: input.user.organizationId,
      matterId: input.matterId,
      messageId: input.messageId,
    });

    await this.prisma.communicationMessage.delete({
      where: { id: message.id },
    });

    await this.prisma.communicationThread.update({
      where: { id: message.threadId },
      data: { updatedAt: new Date() },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'matter.communication.deleted',
      entityType: 'communicationMessage',
      entityId: message.id,
      metadata: {
        matterId: input.matterId,
        threadId: message.threadId,
      },
    });

    return { id: message.id, removed: true };
  }

  private isCounselRole(roleKey: string, roleLabel?: string | null) {
    const fingerprint = `${roleKey} ${roleLabel || ''}`.toLowerCase();
    return /(counsel|attorney|lawyer)/.test(fingerprint);
  }

  private normalizeOptionalText(value?: string | null) {
    const trimmed = String(value || '').trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private participantRoleForDirection(direction: 'INBOUND' | 'OUTBOUND' | 'INTERNAL'): CommunicationParticipantRole {
    if (direction === 'INBOUND') {
      return CommunicationParticipantRole.FROM;
    }
    if (direction === 'OUTBOUND') {
      return CommunicationParticipantRole.TO;
    }
    return CommunicationParticipantRole.OTHER;
  }

  private async findMatterScopedCommunicationMessage(input: {
    organizationId: string;
    matterId: string;
    messageId: string;
  }) {
    const message = await this.prisma.communicationMessage.findFirst({
      where: {
        id: input.messageId,
        organizationId: input.organizationId,
        thread: {
          matterId: input.matterId,
        },
      },
      include: {
        thread: true,
        participants: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Matter communication entry not found');
    }

    return message;
  }

  private async assertContactInOrganization(
    organizationId: string,
    contactId: string,
    errorMessage: string,
  ) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        organizationId,
        id: contactId,
      },
      select: { id: true },
    });
    if (!contact) {
      throw new NotFoundException(errorMessage);
    }
  }

  async dashboard(user: AuthenticatedUser, matterId: string) {
    await this.accessService.assertMatterAccess(user, matterId, 'read');

    const matter = await this.prisma.matter.findFirst({
      where: {
        id: matterId,
        organizationId: user.organizationId,
      },
      include: {
        stage: true,
        participants: {
          include: {
            contact: true,
            participantRoleDefinition: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        docketEntries: { orderBy: { filedAt: 'desc' }, take: 20 },
        tasks: { orderBy: { dueAt: 'asc' }, take: 20 },
        calendarEvents: { orderBy: { startAt: 'asc' }, take: 20 },
        communicationThreads: {
          include: {
            messages: {
              orderBy: { occurredAt: 'desc' },
              take: 5,
              include: {
                participants: {
                  include: {
                    contact: true,
                  },
                },
              },
            },
          },
          take: 10,
        },
        documents: {
          include: { versions: { orderBy: { uploadedAt: 'desc' }, take: 1 } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        invoices: { orderBy: { issuedAt: 'desc' }, take: 10 },
        aiJobs: {
          include: { artifacts: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        propertyProfile: true,
        contractProfile: true,
        defectIssues: true,
        projectMilestones: true,
        damagesItems: true,
        lienModels: {
          include: {
            claimantContact: true,
          },
        },
        insuranceClaims: {
          include: {
            adjusterContact: true,
            insurerContact: true,
          },
        },
        expertEngagements: {
          include: {
            expertContact: true,
          },
        },
      },
    });

    if (!matter) {
      throw new NotFoundException('Matter not found');
    }

    const domainSections = {
      property: Boolean(matter.propertyProfile?.addressLine1),
      contract: Boolean(matter.contractProfile),
      defects: matter.defectIssues.length > 0,
      damages: matter.damagesItems.length > 0,
      liens: matter.lienModels.length > 0,
      insuranceClaims: matter.insuranceClaims.length > 0,
      expertEngagements: matter.expertEngagements.length > 0,
      milestones: matter.projectMilestones.length > 0,
    };
    const completedCount = Object.values(domainSections).filter(Boolean).length;
    const totalCount = Object.keys(domainSections).length;
    const missingSections = Object.entries(domainSections)
      .filter(([, complete]) => !complete)
      .map(([section]) => section);

    return {
      ...matter,
      domainSectionCompleteness: {
        sections: domainSections,
        completedCount,
        totalCount,
        completionPercent: Number(((completedCount / totalCount) * 100).toFixed(1)),
        missingSections,
      },
    };
  }

  async intakeWizard(input: {
    user: AuthenticatedUser;
    name: string;
    matterNumber: string;
    practiceArea: string;
    property: {
      addressLine1: string;
      city?: string;
      state?: string;
      postalCode?: string;
      parcelNumber?: string;
      permits?: unknown;
      inspections?: unknown;
    };
    contract: {
      contractDate?: string;
      contractPrice?: number;
      paymentSchedule?: unknown;
      changeOrders?: unknown;
      warranties?: unknown;
    };
    defects?: Array<{
      category: string;
      locationInHome?: string;
      severity?: string;
      description?: string;
      photoDocumentVersionIds?: string[];
    }>;
    milestones?: Array<{
      name: string;
      plannedDate?: string;
      actualDate?: string;
      status?: string;
      notes?: string;
    }>;
    damages?: Array<{
      category?: string;
      repairEstimate?: number;
      paidAmount?: number;
      completionCost?: number;
      consequentialAmount?: number;
      notes?: string;
    }>;
    liens?: Array<{
      claimantContactId?: string;
      claimantName?: string;
      amount?: number;
      recordingDate?: string;
      releaseDate?: string;
      status?: string;
      notes?: string;
    }>;
    insuranceClaims?: Array<{
      policyNumber?: string;
      claimNumber?: string;
      adjusterContactId?: string;
      adjusterName?: string;
      insurerContactId?: string;
      insurerName?: string;
      coverageNotes?: string;
      status?: string;
    }>;
    expertEngagements?: Array<{
      expertContactId?: string;
      expertName?: string;
      scope?: string;
      feeArrangement?: string;
      reportDocumentId?: string;
      status?: string;
    }>;
  }) {
    this.assertRequiredIntakeCoverage(input);

    const matter = await this.create({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      name: input.name,
      matterNumber: input.matterNumber,
      practiceArea: input.practiceArea,
    });

    await this.prisma.propertyProfile.create({
      data: {
        organizationId: input.user.organizationId,
        matterId: matter.id,
        addressLine1: input.property.addressLine1,
        city: input.property.city,
        state: input.property.state,
        postalCode: input.property.postalCode,
        parcelNumber: input.property.parcelNumber,
        permitsJson: input.property.permits as object | undefined,
        inspectionsJson: input.property.inspections as object | undefined,
      },
    });

    await this.prisma.contractProfile.create({
      data: {
        organizationId: input.user.organizationId,
        matterId: matter.id,
        contractDate: input.contract.contractDate ? new Date(input.contract.contractDate) : null,
        contractPrice: input.contract.contractPrice,
        paymentScheduleJson: input.contract.paymentSchedule as object | undefined,
        changeOrdersJson: input.contract.changeOrders as object | undefined,
        warrantiesJson: input.contract.warranties as object | undefined,
      },
    });

    if (input.defects?.length) {
      for (const defect of input.defects) {
        await this.prisma.defectIssue.create({
          data: {
            organizationId: input.user.organizationId,
            matterId: matter.id,
            category: defect.category,
            locationInHome: defect.locationInHome,
            severity: defect.severity,
            description: defect.description,
            photoDocumentVersionIds: defect.photoDocumentVersionIds ?? [],
          },
        });
      }
    }

    if (input.milestones?.length) {
      for (const milestone of input.milestones) {
        await this.prisma.projectMilestone.create({
          data: {
            organizationId: input.user.organizationId,
            matterId: matter.id,
            name: milestone.name,
            plannedDate: milestone.plannedDate ? new Date(milestone.plannedDate) : null,
            actualDate: milestone.actualDate ? new Date(milestone.actualDate) : null,
            status: milestone.status,
            notes: milestone.notes,
          },
        });
      }
    }

    if (input.damages?.length) {
      for (const item of input.damages) {
        await this.prisma.damagesItem.create({
          data: {
            organizationId: input.user.organizationId,
            matterId: matter.id,
            category: item.category!,
            repairEstimate: item.repairEstimate,
            paidAmount: item.paidAmount,
            completionCost: item.completionCost,
            consequentialAmount: item.consequentialAmount,
            notes: item.notes,
          },
        });
      }
    }

    if (input.liens?.length) {
      for (const lien of input.liens) {
        const claimantContactId = await this.resolveIntakeContact({
          organizationId: input.user.organizationId,
          providedContactId: lien.claimantContactId,
          fallbackName: lien.claimantName,
          fallbackKind: ContactKind.ORGANIZATION,
          missingError: 'Lien claimant contact or claimant name is required',
        });

        await this.prisma.lienModel.create({
          data: {
            organizationId: input.user.organizationId,
            matterId: matter.id,
            claimantContactId,
            amount: lien.amount!,
            recordingDate: lien.recordingDate ? new Date(lien.recordingDate) : null,
            releaseDate: lien.releaseDate ? new Date(lien.releaseDate) : null,
            status: lien.status!,
            notes: lien.notes,
          },
        });
      }
    }

    if (input.insuranceClaims?.length) {
      for (const claim of input.insuranceClaims) {
        const adjusterContactId = claim.adjusterContactId || claim.adjusterName
          ? await this.resolveIntakeContact({
              organizationId: input.user.organizationId,
              providedContactId: claim.adjusterContactId,
              fallbackName: claim.adjusterName,
              fallbackKind: ContactKind.PERSON,
              missingError: 'Insurance adjuster contact or name is required',
            })
          : null;

        const insurerContactId = claim.insurerContactId || claim.insurerName
          ? await this.resolveIntakeContact({
              organizationId: input.user.organizationId,
              providedContactId: claim.insurerContactId,
              fallbackName: claim.insurerName,
              fallbackKind: ContactKind.ORGANIZATION,
              missingError: 'Insurance insurer contact or name is required',
            })
          : null;

        await this.prisma.insuranceClaim.create({
          data: {
            organizationId: input.user.organizationId,
            matterId: matter.id,
            policyNumber: claim.policyNumber,
            claimNumber: claim.claimNumber,
            adjusterContactId,
            insurerContactId,
            coverageNotes: claim.coverageNotes,
            status: claim.status || 'OPEN',
          },
        });
      }
    }

    if (input.expertEngagements?.length) {
      for (const expert of input.expertEngagements) {
        const expertContactId = await this.resolveIntakeContact({
          organizationId: input.user.organizationId,
          providedContactId: expert.expertContactId,
          fallbackName: expert.expertName,
          fallbackKind: ContactKind.PERSON,
          missingError: 'Expert contact or expert name is required',
        });

        await this.prisma.expertEngagement.create({
          data: {
            organizationId: input.user.organizationId,
            matterId: matter.id,
            expertContactId,
            scope: expert.scope,
            feeArrangement: expert.feeArrangement,
            reportDocumentId: expert.reportDocumentId,
            status: expert.status || 'ENGAGED',
          },
        });
      }
    }

    return this.dashboard(input.user, matter.id);
  }

  async listIntakeDrafts(user: AuthenticatedUser) {
    const formId = await this.getOrCreateIntakeDraftFormId(user.organizationId);
    const drafts = await this.prisma.intakeSubmission.findMany({
      where: {
        organizationId: user.organizationId,
        intakeFormDefinitionId: formId,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return drafts
      .map((draft) => this.mapDraftSummary(draft))
      .sort((a, b) => Date.parse(b.savedAt || '') - Date.parse(a.savedAt || ''));
  }

  async getIntakeDraft(input: {
    user: AuthenticatedUser;
    draftId: string;
  }) {
    const formId = await this.getOrCreateIntakeDraftFormId(input.user.organizationId);
    const draft = await this.prisma.intakeSubmission.findFirst({
      where: {
        id: input.draftId,
        organizationId: input.user.organizationId,
        intakeFormDefinitionId: formId,
      },
    });
    if (!draft) {
      throw new NotFoundException('Intake draft not found');
    }
    const envelope = this.parseDraftEnvelope(draft.dataJson);
    return {
      id: draft.id,
      savedAt: envelope.savedAt || draft.createdAt.toISOString(),
      payload: envelope.payload,
    };
  }

  async saveIntakeDraft(input: {
    user: AuthenticatedUser;
    draftId?: string;
    payload: Record<string, unknown>;
  }) {
    const formId = await this.getOrCreateIntakeDraftFormId(input.user.organizationId);
    const savedAt = new Date().toISOString();
    const payload = this.toPrismaInputJsonObject(input.payload ?? {});
    const envelope: Prisma.InputJsonObject = {
      kind: 'matter_intake_wizard_draft',
      savedAt,
      payload,
    };

    let draft;
    if (input.draftId) {
      const existing = await this.prisma.intakeSubmission.findFirst({
        where: {
          id: input.draftId,
          organizationId: input.user.organizationId,
          intakeFormDefinitionId: formId,
        },
      });
      if (!existing) {
        throw new NotFoundException('Intake draft not found');
      }
      draft = await this.prisma.intakeSubmission.update({
        where: { id: existing.id },
        data: {
          dataJson: envelope,
        },
      });
    } else {
      draft = await this.prisma.intakeSubmission.create({
        data: {
          organizationId: input.user.organizationId,
          intakeFormDefinitionId: formId,
          submittedByContactId: input.user.membership.contactId || null,
          dataJson: envelope,
        },
      });
    }

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'matter.intake_draft.saved',
      entityType: 'intakeSubmission',
      entityId: draft.id,
      metadata: {
        savedAt,
        matterNumber: (input.payload?.matterNumber as string | undefined) || null,
      },
    });

    return {
      id: draft.id,
      savedAt,
      payload,
    };
  }

  private async getOrCreateIntakeDraftFormId(organizationId: string) {
    const existing = await this.prisma.intakeFormDefinition.findFirst({
      where: {
        organizationId,
        name: MattersService.INTAKE_WIZARD_DRAFT_FORM_NAME,
      },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await this.prisma.intakeFormDefinition.create({
      data: {
        organizationId,
        name: MattersService.INTAKE_WIZARD_DRAFT_FORM_NAME,
        isClientPortalEnabled: false,
        schemaJson: {
          type: 'object',
          title: 'Matter Intake Wizard Draft',
        },
      },
      select: { id: true },
    });
    return created.id;
  }

  private mapDraftSummary(draft: { id: string; dataJson: unknown; createdAt: Date }) {
    const envelope = this.parseDraftEnvelope(draft.dataJson);
    const payload = envelope.payload as Record<string, unknown>;
    const matterNumber = this.safeString(payload.matterNumber);
    const name = this.safeString(payload.name);
    const practiceArea = this.safeString(payload.practiceArea);
    return {
      id: draft.id,
      matterNumber: matterNumber || null,
      name: name || null,
      practiceArea: practiceArea || null,
      savedAt: envelope.savedAt || draft.createdAt.toISOString(),
      label: [matterNumber, name].filter(Boolean).join(' - ') || 'Untitled Intake Draft',
    };
  }

  private parseDraftEnvelope(value: unknown): { savedAt?: string; payload: Record<string, unknown> } {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { payload: {} };
    }
    const record = value as Record<string, unknown>;
    const payload =
      record.payload && typeof record.payload === 'object' && !Array.isArray(record.payload)
        ? (record.payload as Record<string, unknown>)
        : {};
    const savedAt = typeof record.savedAt === 'string' ? record.savedAt : undefined;
    return { savedAt, payload };
  }

  private safeString(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private toPrismaInputJsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
    try {
      const normalized: unknown = JSON.parse(JSON.stringify(value));
      if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)) {
        return {};
      }
      return normalized as Prisma.InputJsonObject;
    } catch {
      throw new BadRequestException('Intake draft payload must be JSON serializable');
    }
  }

  private assertRequiredIntakeCoverage(input: {
    property: { addressLine1?: string };
    contract: { contractPrice?: number };
    defects?: Array<{ category?: string }>;
    damages?: Array<{ category?: string; repairEstimate?: number }>;
    liens?: Array<{ amount?: number; status?: string; claimantContactId?: string; claimantName?: string }>;
    insuranceClaims?: Array<{ claimNumber?: string; policyNumber?: string; insurerContactId?: string; insurerName?: string }>;
    expertEngagements?: Array<{ scope?: string; expertContactId?: string; expertName?: string }>;
  }) {
    if (!this.safeString(input.property?.addressLine1)) {
      throw new BadRequestException('Property address is required for intake wizard');
    }
    if (!Number.isFinite(input.contract?.contractPrice ?? NaN) || Number(input.contract?.contractPrice) <= 0) {
      throw new BadRequestException('Contract price must be greater than zero');
    }
    if (!input.defects?.length) {
      throw new BadRequestException('At least one defect entry is required');
    }
    if (!input.damages?.length) {
      throw new BadRequestException('At least one damages entry is required');
    }
    if (!input.liens?.length) {
      throw new BadRequestException('At least one lien entry is required');
    }
    if (!input.insuranceClaims?.length) {
      throw new BadRequestException('At least one insurance claim entry is required');
    }
    if (!input.expertEngagements?.length) {
      throw new BadRequestException('At least one expert engagement entry is required');
    }

    for (const defect of input.defects) {
      if (!this.safeString(defect.category)) {
        throw new BadRequestException('Defect category is required');
      }
    }
    for (const damage of input.damages) {
      if (!this.safeString(damage.category)) {
        throw new BadRequestException('Damages category is required');
      }
      if (!Number.isFinite(damage.repairEstimate ?? NaN) || Number(damage.repairEstimate) < 0) {
        throw new BadRequestException('Damages repair estimate must be a non-negative number');
      }
    }
    for (const lien of input.liens) {
      if (!Number.isFinite(lien.amount ?? NaN) || Number(lien.amount) <= 0) {
        throw new BadRequestException('Lien amount must be greater than zero');
      }
      if (!this.safeString(lien.status)) {
        throw new BadRequestException('Lien status is required');
      }
      if (!lien.claimantContactId && !this.safeString(lien.claimantName)) {
        throw new BadRequestException('Lien claimant contact or claimant name is required');
      }
    }
    for (const claim of input.insuranceClaims) {
      if (!this.safeString(claim.claimNumber) && !this.safeString(claim.policyNumber)) {
        throw new BadRequestException('Insurance claim requires a claim number or policy number');
      }
      if (!claim.insurerContactId && !this.safeString(claim.insurerName)) {
        throw new BadRequestException('Insurance claim requires insurer contact or insurer name');
      }
    }
    for (const expert of input.expertEngagements) {
      if (!this.safeString(expert.scope)) {
        throw new BadRequestException('Expert engagement scope is required');
      }
      if (!expert.expertContactId && !this.safeString(expert.expertName)) {
        throw new BadRequestException('Expert engagement requires expert contact or expert name');
      }
    }
  }

  private async resolveIntakeContact(input: {
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

    const name = this.safeString(input.fallbackName);
    if (!name) {
      throw new BadRequestException(input.missingError);
    }

    const existing = await this.prisma.contact.findFirst({
      where: {
        organizationId: input.organizationId,
        displayName: name,
      },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await this.prisma.contact.create({
      data: {
        organizationId: input.organizationId,
        kind: input.fallbackKind,
        displayName: name,
        tags: ['intake-generated'],
      },
    });

    if (input.fallbackKind === ContactKind.PERSON) {
      const [firstName, ...rest] = name.split(' ').filter(Boolean);
      await this.prisma.personProfile.create({
        data: {
          contactId: created.id,
          firstName: firstName || name,
          lastName: rest.join(' ') || null,
        },
      });
    } else {
      await this.prisma.organizationProfile.create({
        data: {
          contactId: created.id,
          legalName: name,
        },
      });
    }

    return created.id;
  }

  async setEthicalWall(input: {
    user: AuthenticatedUser;
    matterId: string;
    enabled: boolean;
  }) {
    await this.accessService.assertMatterAccess(input.user, input.matterId, 'write');
    return this.prisma.matter.update({
      where: { id: input.matterId },
      data: {
        ethicalWallEnabled: input.enabled,
      },
    });
  }

  async addDeniedUser(input: {
    user: AuthenticatedUser;
    matterId: string;
    deniedUserId: string;
    reason?: string;
  }) {
    await this.accessService.assertMatterAccess(input.user, input.matterId, 'write');
    return this.prisma.matterAccessDeny.create({
      data: {
        matterId: input.matterId,
        userId: input.deniedUserId,
        reason: input.reason,
      },
    });
  }
}
