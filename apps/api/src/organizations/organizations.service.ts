import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/types';
import { toJsonValue, toJsonValueOrUndefined } from '../common/utils/json.util';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createCustomField(
    user: AuthenticatedUser,
    dto: {
      entityType: string;
      key: string;
      label: string;
      fieldType: string;
      optionsJson?: Record<string, unknown>;
      validationsJson?: Record<string, unknown>;
    },
  ) {
    const field = await this.prisma.customFieldDefinition.create({
      data: {
        organizationId: user.organizationId,
        entityType: dto.entityType,
        key: dto.key,
        label: dto.label,
        fieldType: dto.fieldType,
        optionsJson: toJsonValueOrUndefined(dto.optionsJson),
        validationsJson: toJsonValueOrUndefined(dto.validationsJson),
      },
    });

    await this.audit.appendEvent({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: 'custom_field.created',
      entityType: 'customFieldDefinition',
      entityId: field.id,
      metadata: field,
    });

    return field;
  }

  async listCustomFields(user: AuthenticatedUser, entityType?: string) {
    return this.prisma.customFieldDefinition.findMany({
      where: {
        organizationId: user.organizationId,
        ...(entityType ? { entityType } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setCustomFieldValue(
    user: AuthenticatedUser,
    body: {
      entityType: string;
      entityId: string;
      fieldDefinitionId: string;
      valueJson: Record<string, unknown>;
    },
  ) {
    return this.prisma.customFieldValue.upsert({
      where: {
        organizationId_entityType_entityId_fieldDefinitionId: {
          organizationId: user.organizationId,
          entityType: body.entityType,
          entityId: body.entityId,
          fieldDefinitionId: body.fieldDefinitionId,
        },
      },
      update: {
        valueJson: toJsonValue(body.valueJson),
      },
      create: {
        organizationId: user.organizationId,
        entityType: body.entityType,
        entityId: body.entityId,
        fieldDefinitionId: body.fieldDefinitionId,
        valueJson: toJsonValue(body.valueJson),
      },
    });
  }

  async createSectionDefinition(user: AuthenticatedUser, dto: { name: string; matterTypeId?: string; schemaJson: Record<string, unknown> }) {
    return this.prisma.sectionDefinition.create({
      data: {
        organizationId: user.organizationId,
        name: dto.name,
        matterTypeId: dto.matterTypeId,
        schemaJson: toJsonValue(dto.schemaJson),
      },
    });
  }

  async listSectionDefinitions(user: AuthenticatedUser, matterTypeId?: string) {
    return this.prisma.sectionDefinition.findMany({
      where: {
        organizationId: user.organizationId,
        ...(matterTypeId ? { matterTypeId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertSectionInstance(
    user: AuthenticatedUser,
    body: { matterId: string; sectionDefinitionId: string; dataJson: Record<string, unknown> },
  ) {
    const existing = await this.prisma.sectionInstance.findFirst({
      where: {
        matterId: body.matterId,
        sectionDefinitionId: body.sectionDefinitionId,
      },
    });

    if (!existing) {
      return this.prisma.sectionInstance.create({
        data: {
          organizationId: user.organizationId,
          matterId: body.matterId,
          sectionDefinitionId: body.sectionDefinitionId,
          dataJson: toJsonValue(body.dataJson),
          updatedByUserId: user.id,
        },
      });
    }

    return this.prisma.sectionInstance.update({
      where: { id: existing.id },
      data: {
        dataJson: toJsonValue(body.dataJson),
        updatedByUserId: user.id,
      },
    });
  }

  async listSectionInstances(user: AuthenticatedUser, matterId: string) {
    return this.prisma.sectionInstance.findMany({
      where: {
        organizationId: user.organizationId,
        matterId,
      },
      include: {
        sectionDefinition: true,
      },
    });
  }
}
