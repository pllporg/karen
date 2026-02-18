import { MattersService } from '../src/matters/matters.service';

describe('MattersService', () => {
  const baseUser = {
    id: 'user1',
    email: 'u@example.com',
    organizationId: 'org1',
    permissions: [],
    membership: { role: { name: 'Attorney' } },
  } as any;

  it('creates matter and seeds actor into team', async () => {
    const prisma = {
      matter: {
        create: jest.fn().mockResolvedValue({ id: 'matter1' }),
      },
      matterTeamMember: {
        create: jest.fn().mockResolvedValue({ id: 'member1' }),
      },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn() } as any,
      { assertMatterAccess: jest.fn() } as any,
    );

    const matter = await service.create({
      organizationId: 'org1',
      actorUserId: 'user1',
      matterNumber: 'M-1',
      name: 'Matter',
      practiceArea: 'Construction Litigation',
    });

    expect(matter.id).toBe('matter1');
    expect(prisma.matterTeamMember.create).toHaveBeenCalled();
  });

  it('adds participant with role-definition default side', async () => {
    const prisma = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({ id: 'contact1' }),
      },
      participantRoleDefinition: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'role1',
          key: 'opposing_party',
          label: 'Opposing Party',
          sideDefault: 'OPPOSING_SIDE',
        }),
      },
      matterParticipant: {
        create: jest.fn().mockResolvedValue({ id: 'participant1', side: 'OPPOSING_SIDE' }),
      },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn() } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );

    const participant = await service.addParticipant({
      user: baseUser,
      matterId: 'matter1',
      contactId: 'contact1',
      participantRoleKey: 'opposing_party',
    });

    expect(participant.id).toBe('participant1');
    expect(prisma.matterParticipant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ participantRoleKey: 'opposing_party', side: 'OPPOSING_SIDE' }),
      }),
    );
  });

  it('rejects representedByContactId for counsel roles', async () => {
    const prisma = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({ id: 'contact1' }),
      },
      participantRoleDefinition: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'role1',
          key: 'opposing_counsel',
          label: 'Opposing Counsel',
          sideDefault: 'OPPOSING_SIDE',
        }),
      },
      matterParticipant: {
        create: jest.fn(),
      },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn() } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.addParticipant({
        user: baseUser,
        matterId: 'matter1',
        contactId: 'contact1',
        participantRoleKey: 'opposing_counsel',
        representedByContactId: 'contact2',
      }),
    ).rejects.toThrow('Counsel roles cannot use representedByContactId');
    expect(prisma.matterParticipant.create).not.toHaveBeenCalled();
  });

  it('rejects lawFirmContactId for non-counsel roles', async () => {
    const prisma = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({ id: 'contact1' }),
      },
      participantRoleDefinition: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'role1',
          key: 'expert',
          label: 'Expert',
          sideDefault: 'NEUTRAL',
        }),
      },
      matterParticipant: {
        create: jest.fn(),
      },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn() } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.addParticipant({
        user: baseUser,
        matterId: 'matter1',
        contactId: 'contact1',
        participantRoleKey: 'expert',
        lawFirmContactId: 'firm1',
      }),
    ).rejects.toThrow('lawFirmContactId is only valid for counsel roles');
    expect(prisma.matterParticipant.create).not.toHaveBeenCalled();
  });

  it('rejects unknown participant role definition keys', async () => {
    const prisma = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({ id: 'contact1' }),
      },
      participantRoleDefinition: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      matterParticipant: {
        create: jest.fn(),
      },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn() } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.addParticipant({
        user: baseUser,
        matterId: 'matter1',
        contactId: 'contact1',
        participantRoleKey: 'non_existent_role',
      }),
    ).rejects.toThrow('Participant role definition not found');
    expect(prisma.matterParticipant.create).not.toHaveBeenCalled();
  });

  it('rejects representedByContactId when it matches participant contact', async () => {
    const prisma = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({ id: 'contact1' }),
      },
      participantRoleDefinition: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'role1',
          key: 'opposing_party',
          label: 'Opposing Party',
          sideDefault: 'OPPOSING_SIDE',
        }),
      },
      matterParticipant: {
        create: jest.fn(),
      },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn() } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.addParticipant({
        user: baseUser,
        matterId: 'matter1',
        contactId: 'contact1',
        participantRoleKey: 'opposing_party',
        representedByContactId: 'contact1',
      }),
    ).rejects.toThrow('representedByContactId cannot match contactId');
    expect(prisma.matterParticipant.create).not.toHaveBeenCalled();
  });

  it('rejects lawFirmContactId when it matches participant contact', async () => {
    const prisma = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({ id: 'contact1' }),
      },
      participantRoleDefinition: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'role1',
          key: 'opposing_counsel',
          label: 'Opposing Counsel',
          sideDefault: 'OPPOSING_SIDE',
        }),
      },
      matterParticipant: {
        create: jest.fn(),
      },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn() } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.addParticipant({
        user: baseUser,
        matterId: 'matter1',
        contactId: 'contact1',
        participantRoleKey: 'opposing_counsel',
        lawFirmContactId: 'contact1',
      }),
    ).rejects.toThrow('lawFirmContactId cannot match contactId');
    expect(prisma.matterParticipant.create).not.toHaveBeenCalled();
  });

  it('accepts explicit side and primary overrides for non-counsel roles', async () => {
    const prisma = {
      contact: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: 'contact1' })
          .mockResolvedValueOnce({ id: 'contact-counsel' }),
      },
      participantRoleDefinition: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'role1',
          key: 'expert',
          label: 'Expert Witness',
          sideDefault: 'NEUTRAL',
        }),
      },
      matterParticipant: {
        create: jest.fn().mockResolvedValue({ id: 'participant1', side: 'CLIENT_SIDE', isPrimary: true }),
      },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn() } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await service.addParticipant({
      user: baseUser,
      matterId: 'matter1',
      contactId: 'contact1',
      participantRoleKey: 'expert',
      representedByContactId: 'contact-counsel',
      side: 'CLIENT_SIDE',
      isPrimary: true,
    });

    expect(prisma.matterParticipant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          side: 'CLIENT_SIDE',
          isPrimary: true,
          representedByContactId: 'contact-counsel',
        }),
      }),
    );
  });

  it('treats attorney labels as counsel roles even when key omits counsel', async () => {
    const prisma = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({ id: 'contact-exists' }),
      },
      participantRoleDefinition: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'role1',
          key: 'carrier_attorney',
          label: 'Attorney for Carrier',
          sideDefault: 'OPPOSING_SIDE',
        }),
      },
      matterParticipant: {
        create: jest.fn(),
      },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn() } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.addParticipant({
        user: baseUser,
        matterId: 'matter1',
        contactId: 'contact1',
        participantRoleKey: 'carrier_attorney',
        representedByContactId: 'contact2',
      }),
    ).rejects.toThrow('Counsel roles cannot use representedByContactId');
    expect(prisma.matterParticipant.create).not.toHaveBeenCalled();
  });

  it('supports all required participant categories through configurable role keys', async () => {
    const categories = [
      { key: 'opposing_counsel', label: 'Opposing Counsel', sideDefault: 'OPPOSING_SIDE', counsel: true },
      { key: 'opposing_party', label: 'Opposing Party', sideDefault: 'OPPOSING_SIDE', counsel: false },
      { key: 'co_counsel', label: 'Co-Counsel', sideDefault: 'CLIENT_SIDE', counsel: true },
      { key: 'local_counsel', label: 'Local Counsel', sideDefault: 'CLIENT_SIDE', counsel: true },
      { key: 'adjuster', label: 'Adjuster', sideDefault: 'OPPOSING_SIDE', counsel: false },
      { key: 'insurer', label: 'Insurer', sideDefault: 'OPPOSING_SIDE', counsel: false },
      { key: 'mediator', label: 'Mediator', sideDefault: 'NEUTRAL', counsel: false },
      { key: 'arbitrator', label: 'Arbitrator', sideDefault: 'NEUTRAL', counsel: false },
      { key: 'judge', label: 'Judge', sideDefault: 'COURT', counsel: false },
      { key: 'court_staff', label: 'Court Staff', sideDefault: 'COURT', counsel: false },
      { key: 'expert', label: 'Expert', sideDefault: 'NEUTRAL', counsel: false },
      { key: 'inspector', label: 'Inspector', sideDefault: 'NEUTRAL', counsel: false },
      { key: 'process_server', label: 'Process Server', sideDefault: 'NEUTRAL', counsel: false },
      { key: 'lien_claimant', label: 'Lien Claimant', sideDefault: 'OPPOSING_SIDE', counsel: false },
      { key: 'witness', label: 'Witness', sideDefault: 'NEUTRAL', counsel: false },
      { key: 'subcontractor', label: 'Subcontractor', sideDefault: 'OPPOSING_SIDE', counsel: false },
      { key: 'supplier', label: 'Supplier', sideDefault: 'OPPOSING_SIDE', counsel: false },
    ];
    const roleMap = new Map(categories.map((category) => [category.key, { id: `role-${category.key}`, ...category }]));
    const matterParticipantCreate = jest.fn().mockImplementation(async ({ data }: any) => ({ id: `p-${data.participantRoleKey}` }));

    const prisma = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({ id: 'contact-exists' }),
      },
      participantRoleDefinition: {
        findFirst: jest.fn().mockImplementation(async ({ where }: any) => roleMap.get(where.key) || null),
      },
      matterParticipant: {
        create: matterParticipantCreate,
      },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn() } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );

    for (const category of categories) {
      await service.addParticipant({
        user: baseUser,
        matterId: 'matter1',
        contactId: `contact-${category.key}`,
        participantRoleKey: category.key,
        lawFirmContactId: category.counsel ? `firm-${category.key}` : undefined,
        representedByContactId: category.counsel ? undefined : `counsel-for-${category.key}`,
      });
    }

    expect(matterParticipantCreate).toHaveBeenCalledTimes(categories.length);
    const createdKeys = matterParticipantCreate.mock.calls.map((call: any) => call[0].data.participantRoleKey);
    expect(new Set(createdKeys)).toEqual(new Set(categories.map((category) => category.key)));
  });

  it('intake wizard persists all construction domain sections', async () => {
    const prisma = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({ id: 'contact-exists' }),
      },
      propertyProfile: { create: jest.fn().mockResolvedValue({ id: 'property-1' }) },
      contractProfile: { create: jest.fn().mockResolvedValue({ id: 'contract-1' }) },
      defectIssue: { create: jest.fn().mockResolvedValue({ id: 'defect-1' }) },
      projectMilestone: { create: jest.fn().mockResolvedValue({ id: 'milestone-1' }) },
      damagesItem: { create: jest.fn().mockResolvedValue({ id: 'damage-1' }) },
      lienModel: { create: jest.fn().mockResolvedValue({ id: 'lien-1' }) },
      insuranceClaim: { create: jest.fn().mockResolvedValue({ id: 'claim-1' }) },
      expertEngagement: { create: jest.fn().mockResolvedValue({ id: 'expert-1' }) },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );
    jest.spyOn(service, 'create').mockResolvedValue({ id: 'matter-1' } as any);
    jest.spyOn(service, 'dashboard').mockResolvedValue({ id: 'matter-1' } as any);

    await service.intakeWizard({
      user: baseUser,
      name: 'Kitchen Defect',
      matterNumber: 'M-21',
      practiceArea: 'Construction Litigation',
      property: { addressLine1: '100 Main', city: 'Pasadena', state: 'CA' },
      contract: { contractPrice: 120000, contractDate: '2025-02-10' },
      defects: [{ category: 'Water Intrusion', severity: 'High' }],
      milestones: [{ name: 'Initial inspection complete', status: 'OPEN' }],
      damages: [{ category: 'Repair Estimate', repairEstimate: 28000 }],
      liens: [{ claimantContactId: 'claimant-1', amount: 15000, status: 'RECORDED' }],
      insuranceClaims: [{ claimNumber: 'CLM-1', insurerContactId: 'insurer-1', adjusterContactId: 'adjuster-1' }],
      expertEngagements: [{ expertContactId: 'expert-contact-1', scope: 'Causation analysis' }],
    });

    expect(prisma.propertyProfile.create).toHaveBeenCalled();
    expect(prisma.contractProfile.create).toHaveBeenCalled();
    expect(prisma.defectIssue.create).toHaveBeenCalled();
    expect(prisma.projectMilestone.create).toHaveBeenCalled();
    expect(prisma.damagesItem.create).toHaveBeenCalled();
    expect(prisma.lienModel.create).toHaveBeenCalled();
    expect(prisma.insuranceClaim.create).toHaveBeenCalled();
    expect(prisma.expertEngagement.create).toHaveBeenCalled();
  });

  it('intake wizard enforces required domain coverage validations', async () => {
    const service = new MattersService(
      {} as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );
    const createSpy = jest.spyOn(service, 'create').mockResolvedValue({ id: 'matter-1' } as any);

    const basePayload = {
      user: baseUser,
      name: 'Kitchen Defect',
      matterNumber: 'M-21',
      practiceArea: 'Construction Litigation',
      property: { addressLine1: '100 Main' },
      contract: { contractPrice: 120000 },
      defects: [{ category: 'Water Intrusion', severity: 'High' }],
      damages: [{ category: 'Repair Estimate', repairEstimate: 28000 }],
      liens: [{ claimantName: 'Sunset Carpentry', amount: 15000, status: 'RECORDED' }],
      insuranceClaims: [{ claimNumber: 'CLM-1', insurerName: 'Blue Harbor Insurance' }],
      expertEngagements: [{ expertName: 'Dr. Maya Expert', scope: 'Causation analysis' }],
    };

    const cases: Array<{ mutate: (payload: any) => void; message: string }> = [
      {
        mutate: (payload) => {
          payload.property.addressLine1 = '';
        },
        message: 'Property address is required for intake wizard',
      },
      {
        mutate: (payload) => {
          payload.contract.contractPrice = 0;
        },
        message: 'Contract price must be greater than zero',
      },
      {
        mutate: (payload) => {
          payload.defects = [];
        },
        message: 'At least one defect entry is required',
      },
      {
        mutate: (payload) => {
          payload.damages[0].repairEstimate = -1;
        },
        message: 'Damages repair estimate must be a non-negative number',
      },
      {
        mutate: (payload) => {
          payload.liens[0].claimantName = '';
          payload.liens[0].claimantContactId = undefined;
        },
        message: 'Lien claimant contact or claimant name is required',
      },
      {
        mutate: (payload) => {
          payload.insuranceClaims[0].claimNumber = '';
          payload.insuranceClaims[0].policyNumber = '';
        },
        message: 'Insurance claim requires a claim number or policy number',
      },
      {
        mutate: (payload) => {
          payload.expertEngagements[0].scope = '';
        },
        message: 'Expert engagement scope is required',
      },
    ];

    for (const entry of cases) {
      const candidate = structuredClone(basePayload);
      entry.mutate(candidate);
      await expect(service.intakeWizard(candidate as any)).rejects.toThrow(entry.message);
    }

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('intake wizard resolves fallback contacts from names and reuses existing contacts', async () => {
    const contactCreate = jest
      .fn()
      .mockResolvedValueOnce({ id: 'claimant-generated' })
      .mockResolvedValueOnce({ id: 'adjuster-generated' })
      .mockResolvedValueOnce({ id: 'expert-generated' });
    const insuranceClaimCreate = jest.fn().mockResolvedValue({ id: 'claim-1' });

    const prisma = {
      contact: {
        findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
          if (where?.displayName === 'Blue Harbor Insurance') {
            return { id: 'insurer-existing' };
          }
          return null;
        }),
        create: contactCreate,
      },
      personProfile: { create: jest.fn().mockResolvedValue({ id: 'person-profile' }) },
      organizationProfile: { create: jest.fn().mockResolvedValue({ id: 'org-profile' }) },
      propertyProfile: { create: jest.fn().mockResolvedValue({ id: 'property-1' }) },
      contractProfile: { create: jest.fn().mockResolvedValue({ id: 'contract-1' }) },
      defectIssue: { create: jest.fn().mockResolvedValue({ id: 'defect-1' }) },
      projectMilestone: { create: jest.fn().mockResolvedValue({ id: 'milestone-1' }) },
      damagesItem: { create: jest.fn().mockResolvedValue({ id: 'damage-1' }) },
      lienModel: { create: jest.fn().mockResolvedValue({ id: 'lien-1' }) },
      insuranceClaim: { create: insuranceClaimCreate },
      expertEngagement: { create: jest.fn().mockResolvedValue({ id: 'expert-1' }) },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );
    jest.spyOn(service, 'create').mockResolvedValue({ id: 'matter-1' } as any);
    jest.spyOn(service, 'dashboard').mockResolvedValue({ id: 'matter-1' } as any);

    await service.intakeWizard({
      user: baseUser,
      name: 'Kitchen Defect',
      matterNumber: 'M-21',
      practiceArea: 'Construction Litigation',
      property: { addressLine1: '100 Main', city: 'Pasadena', state: 'CA' },
      contract: { contractPrice: 120000, contractDate: '2025-02-10' },
      defects: [{ category: 'Water Intrusion', severity: 'High' }],
      milestones: [{ name: 'Initial inspection complete', status: 'OPEN' }],
      damages: [{ category: 'Repair Estimate', repairEstimate: 28000 }],
      liens: [{ claimantName: 'Sunset Carpentry', amount: 15000, status: 'RECORDED' }],
      insuranceClaims: [{ claimNumber: 'CLM-1', insurerName: 'Blue Harbor Insurance', adjusterName: 'Jordan Adjuster' }],
      expertEngagements: [{ expertName: 'Dr. Maya Expert', scope: 'Causation analysis' }],
    });

    expect(contactCreate).toHaveBeenCalledTimes(3);
    expect(prisma.organizationProfile.create).toHaveBeenCalledTimes(1);
    expect(prisma.personProfile.create).toHaveBeenCalledTimes(2);
    expect(insuranceClaimCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          insurerContactId: 'insurer-existing',
          adjusterContactId: 'adjuster-generated',
        }),
      }),
    );
  });

  it('dashboard returns domain completeness indicators', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'matter-1',
          matterNumber: 'M-1',
          name: 'Matter',
          practiceArea: 'Construction Litigation',
          status: 'OPEN',
          stage: null,
          participants: [],
          docketEntries: [],
          tasks: [],
          calendarEvents: [],
          communicationThreads: [],
          documents: [],
          invoices: [],
          aiJobs: [],
          propertyProfile: { id: 'property-1', addressLine1: '123 Lane' },
          contractProfile: { id: 'contract-1' },
          defectIssues: [{ id: 'defect-1' }],
          damagesItems: [{ id: 'damage-1' }],
          lienModels: [{ id: 'lien-1' }],
          insuranceClaims: [{ id: 'claim-1' }],
          expertEngagements: [{ id: 'expert-1' }],
          projectMilestones: [{ id: 'mile-1' }],
        }),
      },
    } as any;
    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn() } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );

    const dashboard = await service.dashboard(baseUser, 'matter-1');
    expect(dashboard.domainSectionCompleteness).toEqual(
      expect.objectContaining({
        completedCount: 8,
        totalCount: 8,
        completionPercent: 100,
      }),
    );
    expect(dashboard.domainSectionCompleteness.sections.defects).toBe(true);
    expect(dashboard.domainSectionCompleteness.sections.expertEngagements).toBe(true);
  });

  it('saves and resumes intake drafts', async () => {
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const prisma = {
      intakeFormDefinition: {
        findFirst: jest.fn().mockResolvedValue({ id: 'draft-form-1' }),
      },
      intakeSubmission: {
        create: jest.fn().mockResolvedValue({ id: 'draft-1' }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'draft-1',
            createdAt: new Date('2026-02-17T01:00:00.000Z'),
            dataJson: {
              kind: 'matter_intake_wizard_draft',
              savedAt: '2026-02-17T01:10:00.000Z',
              payload: {
                matterNumber: 'M-21-INTAKE',
                name: 'Kitchen Defect (Intake)',
                practiceArea: 'Construction Litigation',
              },
            },
          },
        ]),
        findFirst: jest.fn().mockResolvedValue({
          id: 'draft-1',
          createdAt: new Date('2026-02-17T01:00:00.000Z'),
          dataJson: {
            kind: 'matter_intake_wizard_draft',
            savedAt: '2026-02-17T01:10:00.000Z',
            payload: { matterNumber: 'M-21-INTAKE', name: 'Kitchen Defect (Intake)' },
          },
        }),
      },
    } as any;
    const service = new MattersService(prisma, audit, { assertMatterAccess: jest.fn() } as any);

    const saved = await service.saveIntakeDraft({
      user: baseUser,
      payload: { matterNumber: 'M-21-INTAKE', name: 'Kitchen Defect (Intake)' },
    });
    expect(saved.id).toBe('draft-1');
    expect(prisma.intakeSubmission.create).toHaveBeenCalled();

    const list = await service.listIntakeDrafts(baseUser);
    expect(list).toHaveLength(1);
    expect(list[0].label).toContain('M-21-INTAKE');

    const loaded = await service.getIntakeDraft({ user: baseUser, draftId: 'draft-1' });
    expect(loaded.id).toBe('draft-1');
    expect(loaded.payload.matterNumber).toBe('M-21-INTAKE');
  });
});
