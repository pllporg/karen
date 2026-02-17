import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MatterStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AccessService } from '../access/access.service';
import { AuthenticatedUser } from '../common/types';

@Injectable()
export class MattersService {
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

  private isCounselRole(roleKey: string, roleLabel?: string | null) {
    const fingerprint = `${roleKey} ${roleLabel || ''}`.toLowerCase();
    return /(counsel|attorney|lawyer)/.test(fingerprint);
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
      },
    });

    if (!matter) {
      throw new NotFoundException('Matter not found');
    }

    return matter;
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
  }) {
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

    return this.dashboard(input.user, matter.id);
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
