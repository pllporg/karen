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

  it('upserts conflict profile into organization settings', async () => {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'org-1',
          settingsJson: {},
        }),
        update: jest.fn().mockResolvedValue({
          id: 'org-1',
          settingsJson: {
            conflictRuleProfiles: [
              {
                id: 'profile-1',
                name: 'Default',
                isDefault: true,
                isActive: true,
                thresholds: { warn: 45, block: 70 },
                weights: { name: 40, email: 35, phone: 30, matter: 30, relationship: 15 },
              },
            ],
          },
        }),
      },
    } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new AdminService(prisma, audit);

    const result = await service.upsertConflictRuleProfile({
      organizationId: 'org-1',
      actorUserId: 'user-1',
      id: 'profile-1',
      name: 'Default',
      isDefault: true,
    });

    expect(prisma.organization.update).toHaveBeenCalled();
    expect(result.profile).toEqual(expect.objectContaining({ id: 'profile-1', name: 'Default' }));
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'conflict_rule_profile.created',
      }),
    );
  });

  it('runs conflict check with profile scoring and recommendation', async () => {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'org-1',
          settingsJson: {
            conflictRuleProfiles: [
              {
                id: 'profile-1',
                name: 'Default',
                isDefault: true,
                isActive: true,
                thresholds: { warn: 45, block: 70 },
                weights: { name: 40, email: 35, phone: 30, matter: 30, relationship: 15 },
              },
            ],
          },
        }),
      },
      contact: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'contact-1',
            displayName: 'Jane Doe',
            primaryEmail: 'jane@example.com',
            primaryPhone: '555-100-2000',
          },
        ]),
      },
      matter: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      contactRelationship: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      conflictCheckResult: {
        create: jest.fn().mockResolvedValue({
          id: 'check-1',
          queryText: 'Jane Doe',
          resultJson: {
            recommendation: 'WARN',
            score: 40,
          },
        }),
      },
    } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new AdminService(prisma, audit);

    const check = await service.runConflictCheck({
      organizationId: 'org-1',
      actorUserId: 'user-1',
      queryText: 'Jane Doe',
    });

    expect(prisma.conflictCheckResult.create).toHaveBeenCalled();
    expect(check).toEqual(expect.objectContaining({ id: 'check-1' }));
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'conflict_check.executed',
      }),
    );
  });

  it('resolves conflict check with rationale and history update', async () => {
    const prisma = {
      conflictCheckResult: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'check-1',
          organizationId: 'org-1',
          resultJson: {
            recommendation: 'WARN',
            resolutionHistory: [],
          },
        }),
        update: jest.fn().mockResolvedValue({
          id: 'check-1',
          resultJson: {
            resolution: {
              status: 'RESOLVED',
              decision: 'WAIVE',
            },
          },
        }),
      },
    } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new AdminService(prisma, audit);

    const resolved = await service.resolveConflictCheck({
      organizationId: 'org-1',
      actorUserId: 'user-1',
      conflictCheckId: 'check-1',
      decision: 'WAIVE',
      rationale: 'Approved after conflict committee review',
    });

    expect(prisma.conflictCheckResult.update).toHaveBeenCalled();
    expect(resolved).toEqual(expect.objectContaining({ id: 'check-1' }));
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'conflict_check.resolved',
      }),
    );
  });
});
