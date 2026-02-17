import { AdminService } from '../src/admin/admin.service';

describe('AdminService', () => {
  it('lists participant role definitions for organization', async () => {
    const prisma = {
      participantRoleDefinition: {
        findMany: jest.fn().mockResolvedValue([{ id: 'pr-1', key: 'opposing_counsel', label: 'Opposing Counsel' }]),
      },
    } as any;
    const service = new AdminService(prisma, { appendEvent: jest.fn() } as any);

    const roles = await service.listParticipantRoles('org-1');
    expect(roles).toHaveLength(1);
    expect(prisma.participantRoleDefinition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1' },
      }),
    );
  });

  it('upserts participant role definition and writes audit event', async () => {
    const upserted = { id: 'pr-1', key: 'opposing_counsel', label: 'Opposing Counsel', sideDefault: 'OPPOSING_SIDE' };
    const prisma = {
      participantRoleDefinition: {
        upsert: jest.fn().mockResolvedValue(upserted),
      },
    } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new AdminService(prisma, audit);

    const role = await service.createParticipantRole({
      organizationId: 'org-1',
      actorUserId: 'user-1',
      key: 'opposing_counsel',
      label: 'Opposing Counsel',
      sideDefault: 'OPPOSING_SIDE' as any,
    });

    expect(role).toEqual(upserted);
    expect(prisma.participantRoleDefinition.upsert).toHaveBeenCalled();
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        actorUserId: 'user-1',
        action: 'participant_role_definition.upserted',
      }),
    );
  });
});
