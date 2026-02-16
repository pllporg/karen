import { Injectable, NotFoundException } from '@nestjs/common';
import { toJsonValue } from '../common/utils/json.util';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) throw new NotFoundException('Organization not found');
    return organization;
  }

  async updateSettings(organizationId: string, actorUserId: string, patch: object) {
    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        settingsJson: toJsonValue(patch),
      },
    });

    await this.audit.appendEvent({
      organizationId,
      actorUserId,
      action: 'organization.settings.updated',
      entityType: 'organization',
      entityId: organizationId,
      metadata: patch,
    });

    return updated;
  }

  async listUsers(organizationId: string) {
    return this.prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listRoles(organizationId: string) {
    return this.prisma.role.findMany({
      where: { organizationId },
      include: { permissions: true },
      orderBy: { name: 'asc' },
    });
  }

  async createRole(input: {
    organizationId: string;
    actorUserId: string;
    name: string;
    description?: string;
    permissionKeys?: string[];
  }) {
    const role = await this.prisma.role.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        description: input.description,
      },
    });

    if (input.permissionKeys && input.permissionKeys.length > 0) {
      const permissionIds: string[] = [];
      for (const key of input.permissionKeys) {
        const permission = await this.prisma.permission.upsert({
          where: {
            organizationId_key: {
              organizationId: input.organizationId,
              key,
            },
          },
          update: {},
          create: {
            organizationId: input.organizationId,
            key,
            label: key,
          },
        });
        permissionIds.push(permission.id);
      }

      await this.prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: {
            connect: permissionIds.map((id) => ({ id })),
          },
        },
      });
    }

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: 'role.created',
      entityType: 'role',
      entityId: role.id,
      metadata: { name: input.name, permissionKeys: input.permissionKeys ?? [] },
    });

    return this.prisma.role.findUnique({ where: { id: role.id }, include: { permissions: true } });
  }

  async createStage(input: {
    organizationId: string;
    actorUserId: string;
    name: string;
    practiceArea: string;
    orderIndex?: number;
  }) {
    const stage = await this.prisma.matterStage.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        practiceArea: input.practiceArea,
        orderIndex: input.orderIndex ?? 0,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: 'matter_stage.created',
      entityType: 'matterStage',
      entityId: stage.id,
      metadata: stage,
    });

    return stage;
  }

  async listStages(organizationId: string, practiceArea?: string) {
    return this.prisma.matterStage.findMany({
      where: {
        organizationId,
        ...(practiceArea ? { practiceArea } : {}),
      },
      orderBy: [{ practiceArea: 'asc' }, { orderIndex: 'asc' }],
    });
  }
}
