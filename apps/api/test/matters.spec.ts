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

  it('updates participant relationship mapping and emits audit event', async () => {
    const prisma = {
      contact: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: 'contact-2' })
          .mockResolvedValueOnce({ id: 'firm-1' }),
      },
      participantRoleDefinition: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'role-counsel',
          key: 'opposing_counsel',
          label: 'Opposing Counsel',
          sideDefault: 'OPPOSING_SIDE',
        }),
      },
      matterParticipant: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'participant-1',
          organizationId: 'org1',
          matterId: 'matter1',
          contactId: 'contact-1',
          participantRoleKey: 'expert',
          participantRoleDefinition: {
            id: 'role-expert',
            key: 'expert',
            label: 'Expert Witness',
            sideDefault: 'NEUTRAL',
          },
          side: 'NEUTRAL',
          isPrimary: false,
          representedByContactId: 'contact-3',
          lawFirmContactId: null,
          notes: 'Initial note',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'participant-1',
          participantRoleKey: 'opposing_counsel',
          contactId: 'contact-2',
          side: 'OPPOSING_SIDE',
          isPrimary: true,
          representedByContactId: null,
          lawFirmContactId: 'firm-1',
          notes: 'Updated note',
        }),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new MattersService(prisma, audit, access);

    const result = await service.updateParticipant({
      user: baseUser,
      matterId: 'matter1',
      participantId: 'participant-1',
      contactId: 'contact-2',
      participantRoleKey: 'opposing_counsel',
      side: 'OPPOSING_SIDE',
      isPrimary: true,
      representedByContactId: '',
      lawFirmContactId: 'firm-1',
      notes: 'Updated note',
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter1', 'write');
    expect(prisma.matterParticipant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'participant-1' },
        data: expect.objectContaining({
          contactId: 'contact-2',
          participantRoleKey: 'opposing_counsel',
          participantRoleDefinitionId: 'role-counsel',
          side: 'OPPOSING_SIDE',
          isPrimary: true,
          representedByContactId: null,
          lawFirmContactId: 'firm-1',
          notes: 'Updated note',
        }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'matter.participant.updated',
        entityType: 'matterParticipant',
        entityId: 'participant-1',
      }),
    );
    expect(result.id).toBe('participant-1');
  });

  it('rejects representedByContactId when update target role is counsel', async () => {
    const prisma = {
      contact: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: 'contact-1' })
          .mockResolvedValueOnce({ id: 'contact-3' }),
      },
      participantRoleDefinition: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'role-counsel',
          key: 'opposing_counsel',
          label: 'Opposing Counsel',
          sideDefault: 'OPPOSING_SIDE',
        }),
      },
      matterParticipant: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'participant-1',
          organizationId: 'org1',
          matterId: 'matter1',
          contactId: 'contact-1',
          participantRoleKey: 'expert',
          participantRoleDefinition: {
            id: 'role-expert',
            key: 'expert',
            label: 'Expert Witness',
            sideDefault: 'NEUTRAL',
          },
          side: 'NEUTRAL',
          isPrimary: false,
          representedByContactId: null,
          lawFirmContactId: null,
          notes: null,
        }),
        update: jest.fn(),
      },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.updateParticipant({
        user: baseUser,
        matterId: 'matter1',
        participantId: 'participant-1',
        participantRoleKey: 'opposing_counsel',
        representedByContactId: 'contact-3',
      }),
    ).rejects.toThrow('Counsel roles cannot use representedByContactId');

    expect(prisma.matterParticipant.update).not.toHaveBeenCalled();
  });

  it('removes participant within matter scope and emits audit event', async () => {
    const prisma = {
      matterParticipant: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'participant-1',
          organizationId: 'org1',
          matterId: 'matter1',
          contactId: 'contact1',
          participantRoleKey: 'expert',
        }),
        delete: jest.fn().mockResolvedValue({ id: 'participant-1' }),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new MattersService(prisma, audit, access);

    const result = await service.removeParticipant({
      user: baseUser,
      matterId: 'matter1',
      participantId: 'participant-1',
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter1', 'write');
    expect(prisma.matterParticipant.delete).toHaveBeenCalledWith({ where: { id: 'participant-1' } });
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'matter.participant.removed',
        entityType: 'matterParticipant',
        entityId: 'participant-1',
      }),
    );
    expect(result).toEqual({ id: 'participant-1', removed: true });
  });

  it('lists participant role options for a matter after access check', async () => {
    const prisma = {
      participantRoleDefinition: {
        findMany: jest.fn().mockResolvedValue([{ id: 'role-1', key: 'expert', label: 'Expert Witness' }]),
      },
    } as any;

    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      access,
    );

    const roles = await service.listParticipantRoleOptions(baseUser, 'matter1');

    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter1', 'read');
    expect(prisma.participantRoleDefinition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org1' },
      }),
    );
    expect(roles).toHaveLength(1);
  });

  it('logs communication entry and creates a new matter thread when threadId is not provided', async () => {
    const prisma = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({ id: 'contact-1' }),
      },
      communicationThread: {
        create: jest.fn().mockResolvedValue({
          id: 'thread-1',
          organizationId: 'org1',
          matterId: 'matter1',
          subject: 'Client updates',
        }),
        update: jest.fn().mockResolvedValue({ id: 'thread-1' }),
      },
      communicationMessage: {
        create: jest.fn().mockResolvedValue({
          id: 'message-1',
          threadId: 'thread-1',
          type: 'CALL_LOG',
          direction: 'INBOUND',
          subject: 'Inspection call',
          body: 'Client reported follow-up inspection notes.',
          participants: [{ contactId: 'contact-1', role: 'FROM' }],
        }),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new MattersService(prisma, audit, access);

    const message = await service.logCommunicationEntry({
      user: baseUser,
      matterId: 'matter1',
      threadSubject: 'Client updates',
      type: 'CALL_LOG',
      direction: 'INBOUND',
      subject: 'Inspection call',
      body: 'Client reported follow-up inspection notes.',
      participantContactId: 'contact-1',
      occurredAt: '2026-02-19T10:00:00.000Z',
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter1', 'write');
    expect(prisma.communicationThread.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org1',
          matterId: 'matter1',
          subject: 'Client updates',
        }),
      }),
    );
    expect(prisma.communicationMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          threadId: 'thread-1',
          type: 'CALL_LOG',
          direction: 'INBOUND',
          occurredAt: new Date('2026-02-19T10:00:00.000Z'),
          participants: {
            create: [
              {
                contactId: 'contact-1',
                role: 'FROM',
              },
            ],
          },
        }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'matter.communication.logged',
        entityType: 'communicationMessage',
        entityId: 'message-1',
      }),
    );
    expect(message).toEqual(
      expect.objectContaining({
        id: 'message-1',
        threadId: 'thread-1',
        matterId: 'matter1',
      }),
    );
  });

  it('rejects logging communication against a thread outside matter scope', async () => {
    const prisma = {
      communicationThread: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      access,
    );

    await expect(
      service.logCommunicationEntry({
        user: baseUser,
        matterId: 'matter1',
        threadId: 'thread-outside-scope',
        type: 'INTERNAL_NOTE',
        direction: 'INTERNAL',
        body: 'Internal chronology update.',
      }),
    ).rejects.toThrow('Matter communication thread not found');
    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter1', 'write');
  });

  it('updates communication entry and remaps participant in matter scope', async () => {
    const prisma = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({ id: 'contact-2' }),
      },
      communicationMessage: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'message-1',
          organizationId: 'org1',
          threadId: 'thread-1',
          direction: 'INBOUND',
          thread: { id: 'thread-1', matterId: 'matter1' },
          participants: [{ id: 'participant-1', contactId: 'contact-1', role: 'FROM' }],
        }),
        update: jest.fn().mockResolvedValue({
          id: 'message-1',
          threadId: 'thread-1',
          type: 'EMAIL',
          direction: 'OUTBOUND',
          subject: 'Updated subject',
          body: 'Updated body',
          participants: [{ id: 'participant-2', contactId: 'contact-2', role: 'TO' }],
        }),
      },
      communicationThread: {
        update: jest.fn().mockResolvedValue({ id: 'thread-1' }),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new MattersService(prisma, audit, access);

    const updated = await service.updateCommunicationEntry({
      user: baseUser,
      matterId: 'matter1',
      messageId: 'message-1',
      type: 'EMAIL',
      direction: 'OUTBOUND',
      subject: 'Updated subject',
      body: 'Updated body',
      participantContactId: 'contact-2',
      occurredAt: '2026-02-20T10:30:00.000Z',
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter1', 'write');
    expect(prisma.communicationMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'message-1' },
        data: expect.objectContaining({
          type: 'EMAIL',
          direction: 'OUTBOUND',
          subject: 'Updated subject',
          body: 'Updated body',
          participants: {
            deleteMany: {},
            create: [{ contactId: 'contact-2', role: 'TO' }],
          },
          occurredAt: new Date('2026-02-20T10:30:00.000Z'),
        }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'matter.communication.updated',
        entityType: 'communicationMessage',
        entityId: 'message-1',
      }),
    );
    expect(updated).toEqual(
      expect.objectContaining({
        id: 'message-1',
        matterId: 'matter1',
      }),
    );
  });

  it('deletes communication entry within matter scope and emits audit event', async () => {
    const prisma = {
      communicationMessage: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'message-1',
          organizationId: 'org1',
          threadId: 'thread-1',
          direction: 'INBOUND',
          thread: { id: 'thread-1', matterId: 'matter1' },
          participants: [],
        }),
        delete: jest.fn().mockResolvedValue({ id: 'message-1' }),
      },
      communicationThread: {
        update: jest.fn().mockResolvedValue({ id: 'thread-1' }),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new MattersService(prisma, audit, access);

    const result = await service.deleteCommunicationEntry({
      user: baseUser,
      matterId: 'matter1',
      messageId: 'message-1',
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter1', 'write');
    expect(prisma.communicationMessage.delete).toHaveBeenCalledWith({ where: { id: 'message-1' } });
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'matter.communication.deleted',
        entityType: 'communicationMessage',
        entityId: 'message-1',
      }),
    );
    expect(result).toEqual({ id: 'message-1', removed: true });
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

  it('updates matter overview fields and emits audit events', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValueOnce({ id: 'matter-1' }).mockResolvedValueOnce(null),
        update: jest.fn().mockResolvedValue({
          id: 'matter-1',
          matterNumber: 'M-2',
          name: 'Updated Matter',
          practiceArea: 'Construction Litigation',
          status: 'PENDING',
          stageId: null,
          matterTypeId: null,
          jurisdiction: 'CA',
          venue: 'Los Angeles',
          openedAt: new Date('2026-02-01T12:00:00.000Z'),
          closedAt: null,
        }),
      },
    } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new MattersService(prisma, audit, access);
    jest.spyOn(service, 'dashboard').mockResolvedValue({ id: 'matter-1', name: 'Updated Matter' } as any);

    const result = await service.updateMatter({
      user: baseUser,
      matterId: 'matter-1',
      name: ' Updated Matter ',
      matterNumber: ' M-2 ',
      practiceArea: ' Construction Litigation ',
      status: 'PENDING' as any,
      jurisdiction: ' CA ',
      venue: ' Los Angeles ',
      openedAt: '2026-02-01T12:00:00.000Z',
      closedAt: null,
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter-1', 'write');
    expect(prisma.matter.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'matter-1' },
        data: expect.objectContaining({
          name: 'Updated Matter',
          matterNumber: 'M-2',
          practiceArea: 'Construction Litigation',
          status: 'PENDING',
          jurisdiction: 'CA',
          venue: 'Los Angeles',
          openedAt: expect.any(Date),
          closedAt: null,
        }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'matter.updated',
        entityType: 'matter',
        entityId: 'matter-1',
      }),
    );
    expect(result).toEqual({ id: 'matter-1', name: 'Updated Matter' });
  });

  it('rejects duplicate matter number updates within organization', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValueOnce({ id: 'matter-1' }).mockResolvedValueOnce({ id: 'matter-2' }),
        update: jest.fn(),
      },
    } as any;
    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.updateMatter({
        user: baseUser,
        matterId: 'matter-1',
        matterNumber: 'M-2',
      }),
    ).rejects.toThrow('Matter number already exists in this organization');
    expect(prisma.matter.update).not.toHaveBeenCalled();
  });
});
