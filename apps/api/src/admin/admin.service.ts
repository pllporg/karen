import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { MatterParticipantSide, Prisma } from '@prisma/client';
import { toJsonValue } from '../common/utils/json.util';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

type ConflictRecommendation = 'CLEAR' | 'WARN' | 'BLOCK';
type ConflictResolutionDecision = 'CLEAR' | 'WAIVE' | 'BLOCK';

interface ConflictRuleWeights {
  name: number;
  email: number;
  phone: number;
  matter: number;
  relationship: number;
}

interface ConflictRuleThresholds {
  warn: number;
  block: number;
}

export interface ConflictRuleProfile {
  id: string;
  name: string;
  description?: string;
  practiceAreas: string[];
  matterTypeIds: string[];
  isDefault: boolean;
  isActive: boolean;
  weights: ConflictRuleWeights;
  thresholds: ConflictRuleThresholds;
  createdAt: string;
  updatedAt: string;
}

interface ConflictHit {
  entityType: 'contact' | 'matter';
  entityId: string;
  displayName: string;
  score: number;
  reasons: string[];
}

const DEFAULT_CONFLICT_WEIGHTS: ConflictRuleWeights = {
  name: 40,
  email: 35,
  phone: 30,
  matter: 30,
  relationship: 15,
};

const DEFAULT_CONFLICT_THRESHOLDS: ConflictRuleThresholds = {
  warn: 45,
  block: 70,
};

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

  async listParticipantRoles(organizationId: string) {
    return this.prisma.participantRoleDefinition.findMany({
      where: { organizationId },
      orderBy: [{ label: 'asc' }, { key: 'asc' }],
    });
  }

  async createParticipantRole(input: {
    organizationId: string;
    actorUserId: string;
    key: string;
    label: string;
    description?: string;
    sideDefault?: MatterParticipantSide;
  }) {
    const role = await this.prisma.participantRoleDefinition.upsert({
      where: {
        organizationId_key: {
          organizationId: input.organizationId,
          key: input.key,
        },
      },
      update: {
        label: input.label,
        description: input.description,
        sideDefault: input.sideDefault,
      },
      create: {
        organizationId: input.organizationId,
        key: input.key,
        label: input.label,
        description: input.description,
        sideDefault: input.sideDefault,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: 'participant_role_definition.upserted',
      entityType: 'participantRoleDefinition',
      entityId: role.id,
      metadata: role,
    });

    return role;
  }

  async listConflictRuleProfiles(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settingsJson: true },
    });
    return this.readConflictProfiles(organization?.settingsJson ?? null);
  }

  async upsertConflictRuleProfile(input: {
    organizationId: string;
    actorUserId: string;
    id?: string;
    name?: string;
    description?: string;
    practiceAreas?: string[];
    matterTypeIds?: string[];
    isDefault?: boolean;
    isActive?: boolean;
    thresholds?: Partial<ConflictRuleThresholds>;
    weights?: Partial<ConflictRuleWeights>;
  }) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: { settingsJson: true },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const settings = this.readSettingsObject(organization.settingsJson);
    const profiles = this.readConflictProfiles(organization.settingsJson);
    const now = new Date().toISOString();
    const targetId = input.id || randomUUID();
    const existing = profiles.find((profile) => profile.id === targetId);
    if (!existing && !input.name) {
      throw new UnprocessableEntityException('Profile name is required');
    }
    const nextProfile = this.normalizeConflictProfile({
      id: targetId,
      name: input.name ?? existing?.name ?? 'Conflict Profile',
      description: input.description,
      practiceAreas: input.practiceAreas,
      matterTypeIds: input.matterTypeIds,
      isDefault: input.isDefault,
      isActive: input.isActive,
      thresholds: input.thresholds,
      weights: input.weights,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    });

    const nextProfiles = profiles.filter((profile) => profile.id !== targetId);
    if (nextProfile.isDefault) {
      for (const profile of nextProfiles) {
        profile.isDefault = false;
      }
    } else if (nextProfiles.length === 0 && !existing) {
      nextProfile.isDefault = true;
    }
    nextProfiles.push(nextProfile);
    nextProfiles.sort((a, b) => a.name.localeCompare(b.name));

    const updated = await this.prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        settingsJson: toJsonValue({
          ...settings,
          conflictRuleProfiles: nextProfiles,
        }),
      },
    });

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: existing ? 'conflict_rule_profile.updated' : 'conflict_rule_profile.created',
      entityType: 'organization',
      entityId: input.organizationId,
      metadata: {
        profileId: targetId,
        name: nextProfile.name,
      },
    });

    return {
      profile: nextProfile,
      profiles: this.readConflictProfiles(updated.settingsJson),
    };
  }

  async runConflictCheck(input: {
    organizationId: string;
    actorUserId: string;
    queryText: string;
    profileId?: string;
    practiceArea?: string;
    matterTypeId?: string;
  }) {
    const queryText = input.queryText.trim();
    if (!queryText) {
      throw new UnprocessableEntityException('queryText is required');
    }

    const profiles = await this.listConflictRuleProfiles(input.organizationId);
    if (profiles.length === 0) {
      throw new UnprocessableEntityException('Create at least one conflict rule profile before running a check');
    }
    const profile = this.selectConflictProfile({
      profiles,
      profileId: input.profileId,
      practiceArea: input.practiceArea,
      matterTypeId: input.matterTypeId,
    });

    const terms = this.tokenizeQueryText(queryText);
    const digitQuery = queryText.replace(/\D/g, '');

    const [contacts, matters, relationships] = await Promise.all([
      this.prisma.contact.findMany({
        where: {
          organizationId: input.organizationId,
          OR: [
            { displayName: { contains: queryText, mode: 'insensitive' } },
            { primaryEmail: { contains: queryText, mode: 'insensitive' } },
            { primaryPhone: { contains: queryText, mode: 'insensitive' } },
          ],
        },
        take: 100,
      }),
      this.prisma.matter.findMany({
        where: {
          organizationId: input.organizationId,
          OR: [{ name: { contains: queryText, mode: 'insensitive' } }, { matterNumber: { contains: queryText, mode: 'insensitive' } }],
        },
        take: 100,
      }),
      this.prisma.contactRelationship.findMany({
        where: {
          organizationId: input.organizationId,
        },
        take: 300,
      }),
    ]);

    const relationshipCountByContactId = new Map<string, number>();
    for (const relationship of relationships) {
      relationshipCountByContactId.set(
        relationship.fromContactId,
        (relationshipCountByContactId.get(relationship.fromContactId) || 0) + 1,
      );
      relationshipCountByContactId.set(
        relationship.toContactId,
        (relationshipCountByContactId.get(relationship.toContactId) || 0) + 1,
      );
    }

    const hits: ConflictHit[] = [];

    for (const contact of contacts) {
      const reasons: string[] = [];
      let score = 0;
      const displayName = (contact.displayName || '').toLowerCase();
      if (terms.some((term) => displayName.includes(term))) {
        score += profile.weights.name;
        reasons.push('name match');
      }
      const email = (contact.primaryEmail || '').toLowerCase();
      if (queryText.includes('@') && email.includes(queryText.toLowerCase())) {
        score += profile.weights.email;
        reasons.push('email match');
      }
      const phoneDigits = (contact.primaryPhone || '').replace(/\D/g, '');
      if (digitQuery.length >= 7 && phoneDigits.includes(digitQuery)) {
        score += profile.weights.phone;
        reasons.push('phone match');
      }
      const relationCount = relationshipCountByContactId.get(contact.id) || 0;
      if (relationCount > 0) {
        score += profile.weights.relationship;
        reasons.push(`relationship graph (${relationCount})`);
      }
      if (score > 0) {
        hits.push({
          entityType: 'contact',
          entityId: contact.id,
          displayName: contact.displayName,
          score,
          reasons,
        });
      }
    }

    for (const matter of matters) {
      const reasons: string[] = [];
      let score = 0;
      const matterName = (matter.name || '').toLowerCase();
      if (terms.some((term) => matterName.includes(term))) {
        score += profile.weights.matter;
        reasons.push('matter name match');
      }
      if (matter.matterNumber && matter.matterNumber.toLowerCase().includes(queryText.toLowerCase())) {
        score += profile.weights.matter;
        reasons.push('matter number match');
      }
      if (score > 0) {
        hits.push({
          entityType: 'matter',
          entityId: matter.id,
          displayName: matter.name,
          score,
          reasons,
        });
      }
    }

    hits.sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName));
    const topScore = hits.length ? hits[0].score : 0;
    const recommendation = this.buildConflictRecommendation(topScore, profile.thresholds);

    const resultJson: Record<string, unknown> = {
      profile: {
        id: profile.id,
        name: profile.name,
        weights: profile.weights,
        thresholds: profile.thresholds,
      },
      query: {
        text: queryText,
        practiceArea: input.practiceArea || null,
        matterTypeId: input.matterTypeId || null,
      },
      score: topScore,
      recommendation,
      hits,
      resolution: {
        status: 'UNRESOLVED',
        decision: null,
        rationale: null,
        resolvedByUserId: null,
        resolvedAt: null,
      },
      resolutionHistory: [],
    };

    const created = await this.prisma.conflictCheckResult.create({
      data: {
        organizationId: input.organizationId,
        queryText,
        resultJson: toJsonValue(resultJson),
        searchedByUserId: input.actorUserId,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: 'conflict_check.executed',
      entityType: 'conflictCheckResult',
      entityId: created.id,
      metadata: {
        profileId: profile.id,
        recommendation,
        score: topScore,
        hitCount: hits.length,
      },
    });

    return created;
  }

  async listConflictChecks(organizationId: string, limit = 25) {
    return this.prisma.conflictCheckResult.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      include: {
        searchedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async resolveConflictCheck(input: {
    organizationId: string;
    actorUserId: string;
    conflictCheckId: string;
    decision: ConflictResolutionDecision;
    rationale: string;
  }) {
    const check = await this.prisma.conflictCheckResult.findFirst({
      where: {
        id: input.conflictCheckId,
        organizationId: input.organizationId,
      },
    });
    if (!check) {
      throw new NotFoundException('Conflict check not found');
    }
    const rationale = input.rationale.trim();
    if (!rationale) {
      throw new UnprocessableEntityException('Resolution rationale is required');
    }

    const result = this.readSettingsObject(check.resultJson);
    const history = Array.isArray(result.resolutionHistory)
      ? [...result.resolutionHistory.filter((entry) => entry && typeof entry === 'object')]
      : [];
    history.push({
      decision: input.decision,
      rationale,
      resolvedByUserId: input.actorUserId,
      resolvedAt: new Date().toISOString(),
    });

    const updated = await this.prisma.conflictCheckResult.update({
      where: { id: check.id },
      data: {
        resultJson: toJsonValue({
          ...result,
          resolution: {
            status: 'RESOLVED',
            decision: input.decision,
            rationale,
            resolvedByUserId: input.actorUserId,
            resolvedAt: new Date().toISOString(),
          },
          resolutionHistory: history,
        }),
      },
    });

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: 'conflict_check.resolved',
      entityType: 'conflictCheckResult',
      entityId: check.id,
      metadata: {
        decision: input.decision,
      },
    });

    return updated;
  }

  private selectConflictProfile(input: {
    profiles: ConflictRuleProfile[];
    profileId?: string;
    practiceArea?: string;
    matterTypeId?: string;
  }): ConflictRuleProfile {
    if (input.profileId) {
      const byId = input.profiles.find((profile) => profile.id === input.profileId && profile.isActive);
      if (!byId) {
        throw new NotFoundException('Conflict rule profile not found');
      }
      return byId;
    }

    const practiceArea = (input.practiceArea || '').trim().toLowerCase();
    const matterTypeId = (input.matterTypeId || '').trim().toLowerCase();
    const scoped = input.profiles.filter((profile) => {
      if (!profile.isActive) {
        return false;
      }
      const practiceMatch =
        profile.practiceAreas.length === 0 ||
        profile.practiceAreas.some((value) => value.toLowerCase() === practiceArea);
      const matterTypeMatch =
        profile.matterTypeIds.length === 0 ||
        profile.matterTypeIds.some((value) => value.toLowerCase() === matterTypeId);
      return practiceMatch && matterTypeMatch;
    });

    const defaultProfile = scoped.find((profile) => profile.isDefault) || scoped[0];
    if (!defaultProfile) {
      throw new UnprocessableEntityException('No active conflict rule profile available');
    }
    return defaultProfile;
  }

  private buildConflictRecommendation(score: number, thresholds: ConflictRuleThresholds): ConflictRecommendation {
    if (score >= thresholds.block) {
      return 'BLOCK';
    }
    if (score >= thresholds.warn) {
      return 'WARN';
    }
    return 'CLEAR';
  }

  private tokenizeQueryText(queryText: string): string[] {
    return queryText
      .toLowerCase()
      .split(/\s+/)
      .map((value) => value.trim())
      .filter((value) => value.length >= 2);
  }

  private readConflictProfiles(settingsJson: Prisma.JsonValue | null): ConflictRuleProfile[] {
    const settings = this.readSettingsObject(settingsJson);
    const rawProfiles = Array.isArray(settings.conflictRuleProfiles) ? settings.conflictRuleProfiles : [];
    return rawProfiles
      .filter((profile) => profile && typeof profile === 'object')
      .map((profile) => this.normalizeConflictProfile(profile as Record<string, unknown>))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private normalizeConflictProfile(raw: Record<string, unknown>): ConflictRuleProfile {
    const weightsRaw = raw.weights && typeof raw.weights === 'object' ? (raw.weights as Record<string, unknown>) : {};
    const thresholdsRaw =
      raw.thresholds && typeof raw.thresholds === 'object' ? (raw.thresholds as Record<string, unknown>) : {};
    const now = new Date().toISOString();
    return {
      id: this.stringOr(raw.id, randomUUID()),
      name: this.stringOr(raw.name, 'Default Conflict Profile'),
      description: this.optionalString(raw.description),
      practiceAreas: this.stringArray(raw.practiceAreas),
      matterTypeIds: this.stringArray(raw.matterTypeIds),
      isDefault: this.booleanOr(raw.isDefault, false),
      isActive: this.booleanOr(raw.isActive, true),
      weights: {
        name: this.numberOr(weightsRaw.name, DEFAULT_CONFLICT_WEIGHTS.name),
        email: this.numberOr(weightsRaw.email, DEFAULT_CONFLICT_WEIGHTS.email),
        phone: this.numberOr(weightsRaw.phone, DEFAULT_CONFLICT_WEIGHTS.phone),
        matter: this.numberOr(weightsRaw.matter, DEFAULT_CONFLICT_WEIGHTS.matter),
        relationship: this.numberOr(weightsRaw.relationship, DEFAULT_CONFLICT_WEIGHTS.relationship),
      },
      thresholds: {
        warn: this.numberOr(thresholdsRaw.warn, DEFAULT_CONFLICT_THRESHOLDS.warn),
        block: this.numberOr(thresholdsRaw.block, DEFAULT_CONFLICT_THRESHOLDS.block),
      },
      createdAt: this.stringOr(raw.createdAt, now),
      updatedAt: this.stringOr(raw.updatedAt, now),
    };
  }

  private readSettingsObject(value: Prisma.JsonValue | null): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private stringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return [...new Set(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean))];
  }

  private stringOr(value: unknown, fallback: string): string {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return fallback;
  }

  private optionalString(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return undefined;
  }

  private booleanOr(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    return fallback;
  }

  private numberOr(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return value;
    }
    return fallback;
  }
}
