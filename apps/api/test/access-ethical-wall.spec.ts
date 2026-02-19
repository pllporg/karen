import { ForbiddenException } from '@nestjs/common';
import { AccessService } from '../src/access/access.service';

function buildUser(input?: {
  id?: string;
  roleName?: string;
  organizationId?: string;
}) {
  return {
    id: input?.id ?? 'user1',
    email: 'u@example.com',
    organizationId: input?.organizationId ?? 'org1',
    permissions: [],
    membership: {
      role: {
        name: input?.roleName ?? 'Attorney',
      },
    },
  } as any;
}

describe('AccessService ethical wall', () => {
  it('blocks denied user even if matter exists', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'matter1',
          organizationId: 'org1',
          ethicalWallEnabled: false,
          teamMembers: [],
          denyUsers: [{ userId: 'user1' }],
        }),
      },
    } as any;

    const service = new AccessService(prisma);

    await expect(service.assertMatterAccess(buildUser(), 'matter1')).rejects.toBeInstanceOf(ForbiddenException);
    const evaluation = await service.evaluateMatterAccess(buildUser(), 'matter1');
    expect(evaluation.allowed).toBe(false);
    expect(evaluation.decisiveReason.code).toBe('MATTER_DENY_LIST_MATCH');
  });

  it('allows team member on ethical wall matter', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'matter1',
          organizationId: 'org1',
          ethicalWallEnabled: true,
          teamMembers: [{ userId: 'user1', canWrite: true }],
          denyUsers: [],
        }),
      },
    } as any;

    const service = new AccessService(prisma);

    await expect(service.assertMatterAccess(buildUser(), 'matter1')).resolves.toBeUndefined();
    const evaluation = await service.evaluateMatterAccess(buildUser(), 'matter1');
    expect(evaluation.allowed).toBe(true);
    expect(evaluation.decisiveReason.code).toBe('ETHICAL_WALL_TEAM_MEMBER');
  });

  it('blocks write when team member has read-only ethical wall access', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'matter1',
          organizationId: 'org1',
          ethicalWallEnabled: true,
          teamMembers: [{ userId: 'user1', canWrite: false }],
          denyUsers: [],
        }),
      },
    } as any;

    const service = new AccessService(prisma);

    await expect(service.assertMatterAccess(buildUser(), 'matter1', 'write')).rejects.toThrow(
      'You do not have write access for this matter',
    );
    const evaluation = await service.evaluateMatterAccess(buildUser(), 'matter1', 'write');
    expect(evaluation.allowed).toBe(false);
    expect(evaluation.decisiveReason.code).toBe('ETHICAL_WALL_WRITE_RESTRICTED');
  });

  it('allows admin bypass even when deny list entry exists', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'matter1',
          organizationId: 'org1',
          ethicalWallEnabled: true,
          teamMembers: [],
          denyUsers: [{ userId: 'admin1' }],
        }),
      },
    } as any;

    const service = new AccessService(prisma);
    const adminUser = buildUser({ id: 'admin1', roleName: 'Admin' });

    await expect(service.assertMatterAccess(adminUser, 'matter1', 'write')).resolves.toBeUndefined();
    const evaluation = await service.evaluateMatterAccess(adminUser, 'matter1', 'write');
    expect(evaluation.allowed).toBe(true);
    expect(evaluation.decisiveReason.code).toBe('ROLE_ADMIN_BYPASS');
  });

  it('returns MATTER_NOT_FOUND reason when matter is outside organization scope', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const service = new AccessService(prisma);

    await expect(service.assertMatterAccess(buildUser(), 'missing')).rejects.toThrow('Matter not found in your organization');
    const evaluation = await service.evaluateMatterAccess(buildUser(), 'missing');
    expect(evaluation.allowed).toBe(false);
    expect(evaluation.decisiveReason.code).toBe('MATTER_NOT_FOUND');
  });
});

