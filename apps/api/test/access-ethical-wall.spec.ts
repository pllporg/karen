import { ForbiddenException } from '@nestjs/common';
import { AccessService } from '../src/access/access.service';

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

    await expect(
      service.assertMatterAccess(
        {
          id: 'user1',
          email: 'u@example.com',
          organizationId: 'org1',
          permissions: [],
          membership: { role: { name: 'Attorney' } },
        } as any,
        'matter1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
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

    await expect(
      service.assertMatterAccess(
        {
          id: 'user1',
          email: 'u@example.com',
          organizationId: 'org1',
          permissions: [],
          membership: { role: { name: 'Attorney' } },
        } as any,
        'matter1',
      ),
    ).resolves.toBeUndefined();
  });
});
