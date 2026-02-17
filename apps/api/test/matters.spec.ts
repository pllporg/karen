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
});
