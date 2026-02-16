import { AuthService } from '../src/auth/auth.service';

describe('AuthService', () => {
  it('validates an active session and maps permissions', async () => {
    const prisma = {
      session: {
        findFirst: jest.fn().mockResolvedValue({
          user: { id: 'u1', email: 'user@example.com' },
          membership: {
            id: 'm1',
            organizationId: 'org1',
            role: { name: 'Attorney', permissions: [{ key: 'matters:read' }] },
          },
        }),
      },
    } as any;

    const service = new AuthService(prisma);
    const user = await service.validateSession('token');

    expect(user?.id).toBe('u1');
    expect(user?.organizationId).toBe('org1');
    expect(user?.permissions).toContain('matters:read');
  });

  it('returns null for missing session', async () => {
    const prisma = {
      session: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const service = new AuthService(prisma);
    await expect(service.validateSession('token')).resolves.toBeNull();
  });
});
