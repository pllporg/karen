import { NotFoundException } from '@nestjs/common';
import { AdminService } from '../src/admin/admin.service';

describe('AdminService conflict profile verification hardening', () => {
  it('preserves existing profile fields when applying partial updates', async () => {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'org-1',
          settingsJson: {
            conflictRuleProfiles: [
              {
                id: 'profile-1',
                name: 'Construction Conflicts',
                description: 'Construction only',
                practiceAreas: ['Construction Litigation'],
                matterTypeIds: ['matter-type-1'],
                isDefault: true,
                isActive: true,
                thresholds: { warn: 25, block: 50 },
                weights: { name: 60, email: 50, phone: 40, matter: 30, relationship: 20 },
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            ],
          },
        }),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: 'org-1',
          settingsJson: data.settingsJson,
        })),
      },
    } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new AdminService(prisma, audit);

    const result = await service.upsertConflictRuleProfile({
      organizationId: 'org-1',
      actorUserId: 'user-1',
      id: 'profile-1',
      name: 'Construction Conflicts v2',
    });

    const updatedProfiles = prisma.organization.update.mock.calls[0][0].data.settingsJson.conflictRuleProfiles;
    expect(updatedProfiles).toHaveLength(1);
    expect(updatedProfiles[0]).toEqual(
      expect.objectContaining({
        id: 'profile-1',
        name: 'Construction Conflicts v2',
        description: 'Construction only',
        practiceAreas: ['Construction Litigation'],
        matterTypeIds: ['matter-type-1'],
        isDefault: true,
        isActive: true,
        thresholds: { warn: 25, block: 50 },
        weights: { name: 60, email: 50, phone: 40, matter: 30, relationship: 20 },
      }),
    );
    expect(result.profile).toEqual(expect.objectContaining({ id: 'profile-1', isDefault: true, isActive: true }));
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'conflict_rule_profile.updated',
      }),
    );
  });

  it('reassigns default profile when previous default is deactivated', async () => {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'org-1',
          settingsJson: {
            conflictRuleProfiles: [
              {
                id: 'profile-default',
                name: 'Default Profile',
                isDefault: true,
                isActive: true,
                thresholds: { warn: 45, block: 70 },
                weights: { name: 40, email: 35, phone: 30, matter: 30, relationship: 15 },
              },
              {
                id: 'profile-secondary',
                name: 'Secondary Profile',
                isDefault: false,
                isActive: true,
                thresholds: { warn: 45, block: 70 },
                weights: { name: 40, email: 35, phone: 30, matter: 30, relationship: 15 },
              },
            ],
          },
        }),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: 'org-1',
          settingsJson: data.settingsJson,
        })),
      },
    } as any;
    const service = new AdminService(prisma, { appendEvent: jest.fn().mockResolvedValue(undefined) } as any);

    await service.upsertConflictRuleProfile({
      organizationId: 'org-1',
      actorUserId: 'user-1',
      id: 'profile-default',
      isActive: false,
    });

    const updatedProfiles = prisma.organization.update.mock.calls[0][0].data.settingsJson.conflictRuleProfiles;
    const defaultProfile = updatedProfiles.find((profile: any) => profile.id === 'profile-default');
    const secondaryProfile = updatedProfiles.find((profile: any) => profile.id === 'profile-secondary');
    expect(defaultProfile).toEqual(expect.objectContaining({ isActive: false, isDefault: false }));
    expect(secondaryProfile).toEqual(expect.objectContaining({ isActive: true, isDefault: true }));
  });

  it('selects scoped active profile for conflict checks when practice area and matter type match', async () => {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'org-1',
          settingsJson: {
            conflictRuleProfiles: [
              {
                id: 'profile-default',
                name: 'Default Profile',
                isDefault: true,
                isActive: true,
                practiceAreas: [],
                matterTypeIds: [],
                thresholds: { warn: 60, block: 90 },
                weights: { name: 20, email: 10, phone: 10, matter: 15, relationship: 5 },
              },
              {
                id: 'profile-construction',
                name: 'Construction Profile',
                isDefault: false,
                isActive: true,
                practiceAreas: ['Construction Litigation'],
                matterTypeIds: ['mt-1'],
                thresholds: { warn: 20, block: 35 },
                weights: { name: 40, email: 20, phone: 10, matter: 20, relationship: 5 },
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
            primaryPhone: '555-101-0000',
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
        create: jest.fn().mockImplementation(async ({ data }) => ({ id: 'check-1', ...data })),
      },
    } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new AdminService(prisma, audit);

    const check = await service.runConflictCheck({
      organizationId: 'org-1',
      actorUserId: 'user-1',
      queryText: 'Jane Doe',
      practiceArea: 'Construction Litigation',
      matterTypeId: 'mt-1',
    });

    expect(prisma.conflictCheckResult.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resultJson: expect.objectContaining({
            profile: expect.objectContaining({ id: 'profile-construction' }),
            recommendation: 'BLOCK',
          }),
        }),
      }),
    );
    expect(check).toEqual(expect.objectContaining({ id: 'check-1' }));
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'conflict_check.executed',
        metadata: expect.objectContaining({
          profileId: 'profile-construction',
          recommendation: 'BLOCK',
        }),
      }),
    );
  });

  it('rejects explicit selection of inactive conflict profile', async () => {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'org-1',
          settingsJson: {
            conflictRuleProfiles: [
              {
                id: 'profile-inactive',
                name: 'Inactive Profile',
                isDefault: true,
                isActive: false,
                thresholds: { warn: 45, block: 70 },
                weights: { name: 40, email: 35, phone: 30, matter: 30, relationship: 15 },
              },
            ],
          },
        }),
      },
    } as any;
    const service = new AdminService(prisma, { appendEvent: jest.fn().mockResolvedValue(undefined) } as any);

    await expect(
      service.runConflictCheck({
        organizationId: 'org-1',
        actorUserId: 'user-1',
        queryText: 'Jane Doe',
        profileId: 'profile-inactive',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
