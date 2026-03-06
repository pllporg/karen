import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { LeadsService } from '../src/leads/leads.service';

describe('LeadsService', () => {
  const organizationId = 'org-1';
  const actorUserId = 'user-1';

  const buildService = () => {
    const prisma = {
      lead: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      engagementLetterTemplate: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      intakeFormDefinition: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      intakeSubmission: {
        create: jest.fn(),
        count: jest.fn(),
      },
      conflictCheckResult: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      eSignEnvelope: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      matter: {
        create: jest.fn(),
      },
    } as any;

    const audit = {
      appendEvent: jest.fn(),
    } as any;

    const service = new LeadsService(prisma, audit);
    return { service, prisma, audit };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks engagement send when conflict is unresolved', async () => {
    const { service, prisma } = buildService();
    prisma.lead.findFirst.mockResolvedValue({ id: 'lead-1', organizationId, stage: LeadStage.CONFLICT_CHECK });
    prisma.conflictCheckResult.findFirst.mockResolvedValue({
      id: 'check-1',
      resultJson: { leadId: 'lead-1', resolved: false },
    });

    await expect(
      service.sendEngagement(organizationId, actorUserId, 'lead-1', { envelopeId: 'env-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks convert when engagement is not signed', async () => {
    const { service, prisma } = buildService();
    prisma.lead.findFirst.mockResolvedValue({ id: 'lead-1', organizationId, stage: LeadStage.CONSULTATION });
    prisma.eSignEnvelope.findFirst.mockResolvedValue(null);

    await expect(
      service.convert(organizationId, actorUserId, 'lead-1', {
        name: 'Matter',
        matterNumber: 'M-1',
        practiceArea: 'Family',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records audit events for state transitions', async () => {
    const { service, prisma, audit } = buildService();
    prisma.lead.findFirst.mockResolvedValue({ id: 'lead-1', organizationId, stage: LeadStage.NEW });
    prisma.intakeFormDefinition.findFirst.mockResolvedValue({ id: 'intake-def-1' });
    prisma.intakeSubmission.create.mockResolvedValue({ id: 'intake-1' });
    prisma.lead.update.mockResolvedValue({ id: 'lead-1', stage: LeadStage.SCREENING });

    await service.createIntakeDraft(organizationId, actorUserId, 'lead-1', {
      intakeFormDefinitionId: 'construction-intake-v1',
      dataJson: { firstName: 'Taylor' },
    });

    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId,
        actorUserId,
        action: 'lead.intake_draft.created',
        entityType: 'lead',
        entityId: 'lead-1',
      }),
    );
  });

  it('resolves named intake form definitions before saving draft submissions', async () => {
    const { service, prisma } = buildService();
    prisma.lead.findFirst.mockResolvedValue({ id: 'lead-1', organizationId, stage: LeadStage.NEW });
    prisma.intakeFormDefinition.findFirst.mockResolvedValue({ id: 'intake-def-1' });
    prisma.intakeSubmission.create.mockResolvedValue({ id: 'intake-1' });
    prisma.lead.update.mockResolvedValue({ id: 'lead-1', stage: LeadStage.SCREENING });

    await service.createIntakeDraft(organizationId, actorUserId, 'lead-1', {
      intakeFormDefinitionId: 'construction-intake-v1',
      dataJson: { firstName: 'Taylor' },
    });

    expect(prisma.intakeSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          intakeFormDefinitionId: 'intake-def-1',
        }),
      }),
    );
  });

  it('resolves named engagement templates before generating envelopes', async () => {
    const { service, prisma } = buildService();
    prisma.lead.findFirst.mockResolvedValue({ id: 'lead-1', organizationId, stage: LeadStage.CONSULTATION });
    prisma.engagementLetterTemplate.findFirst.mockResolvedValue({ id: 'template-1' });
    prisma.eSignEnvelope.create.mockResolvedValue({ id: 'env-1' });

    await service.generateEngagement(organizationId, actorUserId, 'lead-1', {
      engagementLetterTemplateId: 'engagement-template-standard',
      provider: 'INTERNAL',
    });

    expect(prisma.eSignEnvelope.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          engagementLetterTemplateId: 'template-1',
        }),
      }),
    );
  });



  it('generates deterministic proactive proposals with rationale citations', async () => {
    const { service, prisma, audit } = buildService();
    prisma.lead.findFirst.mockResolvedValue({ id: 'lead-1', organizationId, stage: LeadStage.CONSULTATION });
    prisma.intakeSubmission.count.mockResolvedValue(1);
    prisma.conflictCheckResult.findFirst.mockResolvedValue({
      id: 'check-1',
      resultJson: { leadId: 'lead-1', resolved: true },
    });
    prisma.eSignEnvelope.findFirst.mockResolvedValue({ id: 'env-1', status: 'DRAFT' });

    const checklist = await service.setupChecklist(organizationId, actorUserId, 'lead-1');

    expect(checklist.proactiveProposals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'lead-lead-1-proposal-engagement-review-send',
          kind: 'CLIENT_ENGAGEMENT',
          status: 'PROPOSED',
          draftOnly: true,
          autoSend: false,
          lifecycle: {
            currentStage: LeadStage.CONSULTATION,
            recommendedStage: LeadStage.CONSULTATION,
          },
          citations: expect.arrayContaining([
            expect.objectContaining({ entityType: 'eSignEnvelope', entityId: 'env-1' }),
          ]),
        }),
      ]),
    );

    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'lead.proactive_proposals.evaluated',
        actorUserId,
        entityType: 'lead',
        entityId: 'lead-1',
        metadata: expect.objectContaining({ proposalCount: checklist.proactiveProposals.length }),
      }),
    );
  });

  it('enforces tenant isolation for getById', async () => {
    const { service, prisma } = buildService();
    prisma.lead.findFirst.mockResolvedValue(null);

    await expect(service.getById('org-2', 'lead-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lead.findFirst).toHaveBeenCalledWith({ where: { id: 'lead-1', organizationId: 'org-2' } });
  });
});
