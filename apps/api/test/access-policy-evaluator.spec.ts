import { evaluateMatterAccessPolicy } from '../src/access/matter-access-policy.evaluator';
import { AuthenticatedUser } from '../src/common/types';

function buildUser(input?: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    organizationId: 'org-1',
    permissions: [],
    membership: {
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      roleId: 'role-1',
      contactId: null,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      role: {
        id: 'role-1',
        organizationId: 'org-1',
        name: 'Attorney',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [],
      },
    },
    ...input,
  };
}

describe('evaluateMatterAccessPolicy', () => {
  it('returns admin bypass reason for admin role', () => {
    const evaluation = evaluateMatterAccessPolicy({
      user: buildUser({
        membership: {
          ...buildUser().membership,
          role: {
            ...buildUser().membership.role!,
            name: 'Admin',
          },
        },
      }),
      action: 'write',
      matter: {
        id: 'matter-1',
        ethicalWallEnabled: true,
        denyUsers: [{ userId: 'user-1' }],
        teamMembers: [],
      },
    });

    expect(evaluation.allowed).toBe(true);
    expect(evaluation.decisiveReason.code).toBe('ROLE_ADMIN_BYPASS');
  });

  it('denies when user appears in matter deny list', () => {
    const evaluation = evaluateMatterAccessPolicy({
      user: buildUser(),
      action: 'read',
      matter: {
        id: 'matter-1',
        ethicalWallEnabled: false,
        denyUsers: [{ userId: 'user-1' }],
        teamMembers: [{ userId: 'user-1', canWrite: true }],
      },
    });

    expect(evaluation.allowed).toBe(false);
    expect(evaluation.decisiveReason.code).toBe('MATTER_DENY_LIST_MATCH');
  });

  it('denies non-team members when ethical wall is enabled', () => {
    const evaluation = evaluateMatterAccessPolicy({
      user: buildUser(),
      action: 'read',
      matter: {
        id: 'matter-1',
        ethicalWallEnabled: true,
        denyUsers: [],
        teamMembers: [{ userId: 'user-2', canWrite: true }],
      },
    });

    expect(evaluation.allowed).toBe(false);
    expect(evaluation.decisiveReason.code).toBe('ETHICAL_WALL_TEAM_REQUIRED');
  });

  it('denies write when team member lacks write access', () => {
    const evaluation = evaluateMatterAccessPolicy({
      user: buildUser(),
      action: 'write',
      matter: {
        id: 'matter-1',
        ethicalWallEnabled: true,
        denyUsers: [],
        teamMembers: [{ userId: 'user-1', canWrite: false }],
      },
    });

    expect(evaluation.allowed).toBe(false);
    expect(evaluation.decisiveReason.code).toBe('ETHICAL_WALL_WRITE_RESTRICTED');
  });

  it('allows team member read access on ethical wall matters', () => {
    const evaluation = evaluateMatterAccessPolicy({
      user: buildUser(),
      action: 'read',
      matter: {
        id: 'matter-1',
        ethicalWallEnabled: true,
        denyUsers: [],
        teamMembers: [{ userId: 'user-1', canWrite: false }],
      },
    });

    expect(evaluation.allowed).toBe(true);
    expect(evaluation.decisiveReason.code).toBe('ETHICAL_WALL_TEAM_MEMBER');
  });

  it('allows non-restricted matter access for non-admin users', () => {
    const evaluation = evaluateMatterAccessPolicy({
      user: buildUser(),
      action: 'read',
      matter: {
        id: 'matter-1',
        ethicalWallEnabled: false,
        denyUsers: [],
        teamMembers: [],
      },
    });

    expect(evaluation.allowed).toBe(true);
    expect(evaluation.decisiveReason.code).toBe('ETHICAL_WALL_DISABLED');
  });
});
