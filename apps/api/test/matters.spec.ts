import { MattersService } from '../src/matters/matters.service';

describe('MattersService', () => {
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

  it('adds participant with participant role key', async () => {
    const prisma = {
      participantRoleDefinition: {
        findFirst: jest.fn().mockResolvedValue({ id: 'role1' }),
      },
      matterParticipant: {
        create: jest.fn().mockResolvedValue({ id: 'participant1' }),
      },
    } as any;

    const service = new MattersService(
      prisma,
      { appendEvent: jest.fn() } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
    );

    const participant = await service.addParticipant({
      user: {
        id: 'user1',
        email: 'u@example.com',
        organizationId: 'org1',
        permissions: [],
        membership: { role: { name: 'Attorney' } },
      } as any,
      matterId: 'matter1',
      contactId: 'contact1',
      participantRoleKey: 'opposing_counsel',
    });

    expect(participant.id).toBe('participant1');
    expect(prisma.matterParticipant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ participantRoleKey: 'opposing_counsel' }),
      }),
    );
  });
});
