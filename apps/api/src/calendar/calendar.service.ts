import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { createEvents } from 'ics';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuthenticatedUser } from '../common/types';
import { AuditService } from '../audit/audit.service';
import { toJsonValue } from '../common/utils/json.util';

export interface DeadlineRulePackRule {
  id: string;
  name: string;
  offsetDays: number;
  businessDaysOnly: boolean;
  eventType: string;
  description?: string;
}

export interface DeadlineRulePackMeta {
  key: string;
  jurisdiction: string;
  court?: string;
  procedure?: string;
  version: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
}

export interface DeadlinePreviewRow {
  ruleId: string;
  name: string;
  eventType: string;
  offsetDays: number;
  businessDaysOnly: boolean;
  computedDate: string;
  description?: string;
}

export interface DeadlineRulesPackRecord {
  id: string;
  name: string;
  pack: DeadlineRulePackMeta;
  rules: DeadlineRulePackRule[];
}

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthenticatedUser, matterId?: string) {
    if (matterId) {
      await this.access.assertMatterAccess(user, matterId);
    }
    return this.prisma.calendarEvent.findMany({
      where: {
        organizationId: user.organizationId,
        ...(matterId ? { matterId } : {}),
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async create(input: {
    user: AuthenticatedUser;
    matterId: string;
    type: string;
    startAt: string;
    endAt?: string;
    location?: string;
    description?: string;
  }) {
    await this.access.assertMatterAccess(input.user, input.matterId, 'write');

    const event = await this.prisma.calendarEvent.create({
      data: {
        organizationId: input.user.organizationId,
        matterId: input.matterId,
        type: input.type,
        startAt: new Date(input.startAt),
        endAt: input.endAt ? new Date(input.endAt) : null,
        location: input.location,
        description: input.description,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'calendar_event.created',
      entityType: 'calendarEvent',
      entityId: event.id,
      metadata: event,
    });

    return event;
  }

  async listRulesPacks(user: AuthenticatedUser) {
    const templates = await this.prisma.deadlineRuleTemplate.findMany({
      where: {
        organizationId: user.organizationId,
        triggerType: 'RULES_PACK',
      },
      orderBy: { updatedAt: 'desc' },
    });

    return templates
      .map((template) => this.mapRulesPack(template))
      .filter((pack): pack is DeadlineRulesPackRecord => pack !== null);
  }

  async createRulesPack(input: {
    user: AuthenticatedUser;
    name?: string;
    jurisdiction: string;
    court?: string;
    procedure?: string;
    version: string;
    effectiveFrom: string;
    effectiveTo?: string;
    isActive?: boolean;
    rules: Array<{
      name: string;
      offsetDays: number;
      businessDaysOnly?: boolean;
      eventType?: string;
      description?: string;
    }>;
  }) {
    if (input.rules.length === 0) {
      throw new UnprocessableEntityException('At least one deadline rule is required');
    }
    const packMeta: DeadlineRulePackMeta = {
      key: `${input.jurisdiction.trim().toLowerCase()}::${(input.court || 'general').trim().toLowerCase()}::${(input.procedure || 'general').trim().toLowerCase()}`,
      jurisdiction: input.jurisdiction.trim(),
      court: input.court?.trim() || undefined,
      procedure: input.procedure?.trim() || undefined,
      version: input.version.trim(),
      effectiveFrom: new Date(input.effectiveFrom).toISOString(),
      effectiveTo: input.effectiveTo ? new Date(input.effectiveTo).toISOString() : undefined,
      isActive: input.isActive ?? true,
    };

    const normalizedRules: DeadlineRulePackRule[] = input.rules.map((rule, index) => ({
      id: `rule-${index + 1}`,
      name: rule.name.trim(),
      offsetDays: Number(rule.offsetDays) || 0,
      businessDaysOnly: Boolean(rule.businessDaysOnly),
      eventType: rule.eventType?.trim() || rule.name.trim(),
      description: rule.description?.trim() || undefined,
    }));

    const template = await this.prisma.deadlineRuleTemplate.create({
      data: {
        organizationId: input.user.organizationId,
        name: input.name?.trim() || `${packMeta.jurisdiction} ${packMeta.court || 'General'} ${packMeta.procedure || 'General'} v${packMeta.version}`,
        triggerType: 'RULES_PACK',
        offsetDays: 0,
        businessDaysOnly: false,
        configJson: toJsonValue({
          pack: packMeta,
          rules: normalizedRules,
        }),
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'deadline_rules_pack.created',
      entityType: 'deadlineRuleTemplate',
      entityId: template.id,
      metadata: {
        key: packMeta.key,
        version: packMeta.version,
        ruleCount: normalizedRules.length,
      },
    });

    return this.mapRulesPack(template);
  }

  async previewDeadlines(input: {
    user: AuthenticatedUser;
    matterId: string;
    triggerDate: string;
    rulesPackId?: string;
  }) {
    await this.access.assertMatterAccess(input.user, input.matterId);

    const matter = await this.prisma.matter.findFirst({
      where: {
        id: input.matterId,
        organizationId: input.user.organizationId,
      },
      select: {
        id: true,
        jurisdiction: true,
        venue: true,
        practiceArea: true,
      },
    });
    if (!matter) {
      throw new NotFoundException('Matter not found');
    }

    const triggerDate = new Date(input.triggerDate);
    if (Number.isNaN(triggerDate.getTime())) {
      throw new UnprocessableEntityException('Invalid triggerDate');
    }

    const selectedPack = await this.resolveRulesPack({
      organizationId: input.user.organizationId,
      rulesPackId: input.rulesPackId,
      matterJurisdiction: matter.jurisdiction || '',
      matterCourt: matter.venue || '',
      matterProcedure: matter.practiceArea || '',
      triggerDate,
    });

    const previewRows: DeadlinePreviewRow[] = selectedPack.rules.map((rule) => ({
      ruleId: rule.id,
      name: rule.name,
      eventType: rule.eventType,
      offsetDays: rule.offsetDays,
      businessDaysOnly: rule.businessDaysOnly,
      computedDate: this.applyOffset(triggerDate, rule.offsetDays, rule.businessDaysOnly).toISOString(),
      description: rule.description,
    }));

    return {
      matterId: input.matterId,
      triggerDate: triggerDate.toISOString(),
      rulesPack: {
        id: selectedPack.id,
        name: selectedPack.name,
        ...selectedPack.pack,
      },
      previewRows,
    };
  }

  async applyDeadlinePreview(input: {
    user: AuthenticatedUser;
    matterId: string;
    triggerDate: string;
    rulesPackId?: string;
    selections?: Array<{
      ruleId: string;
      apply?: boolean;
      overrideDate?: string;
      overrideReason?: string;
    }>;
  }) {
    await this.access.assertMatterAccess(input.user, input.matterId, 'write');

    const preview = await this.previewDeadlines({
      user: input.user,
      matterId: input.matterId,
      triggerDate: input.triggerDate,
      rulesPackId: input.rulesPackId,
    });

    const selectionMap = new Map<string, NonNullable<typeof input.selections>[number]>();
    for (const selection of input.selections || []) {
      if (selectionMap.has(selection.ruleId)) {
        throw new UnprocessableEntityException(`Duplicate selection for rule ${selection.ruleId}`);
      }
      selectionMap.set(selection.ruleId, selection);
    }
    const previewRuleIds = new Set(preview.previewRows.map((row) => row.ruleId));
    for (const ruleId of selectionMap.keys()) {
      if (!previewRuleIds.has(ruleId)) {
        throw new UnprocessableEntityException(`Unknown ruleId in selections: ${ruleId}`);
      }
    }

    const created = [];
    const overrides: Array<{ ruleId: string; overrideDate: string; overrideReason: string }> = [];

    for (const row of preview.previewRows) {
      const selection = selectionMap.get(row.ruleId);
      if (selection && selection.apply === false) {
        continue;
      }
      let startAt = row.computedDate;
      let overrideReason: string | undefined;
      if (selection?.overrideDate) {
        const overrideDate = new Date(selection.overrideDate);
        if (Number.isNaN(overrideDate.getTime())) {
          throw new UnprocessableEntityException(`Invalid overrideDate for rule ${row.ruleId}`);
        }
        if (!selection.overrideReason?.trim()) {
          throw new UnprocessableEntityException(`overrideReason is required for rule ${row.ruleId}`);
        }
        startAt = overrideDate.toISOString();
        overrideReason = selection.overrideReason.trim();
        overrides.push({
          ruleId: row.ruleId,
          overrideDate: startAt,
          overrideReason,
        });
      }

      const event = await this.prisma.calendarEvent.create({
        data: {
          organizationId: input.user.organizationId,
          matterId: input.matterId,
          type: row.eventType,
          startAt: new Date(startAt),
          description: row.description || row.name,
          rawSourcePayload: toJsonValue({
            source: 'deadline_rules_pack',
            rulesPackId: preview.rulesPack.id,
            ruleId: row.ruleId,
            computedDate: row.computedDate,
            overrideDate: selection?.overrideDate || null,
            overrideReason: overrideReason || null,
          }),
        },
      });
      created.push(event);
    }

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'deadline_rules_pack.applied',
      entityType: 'matter',
      entityId: input.matterId,
      metadata: {
        rulesPackId: preview.rulesPack.id,
        createdCount: created.length,
        overrides,
      },
    });

    return {
      created,
      rulesPack: preview.rulesPack,
      overrides,
    };
  }

  async exportIcs(user: AuthenticatedUser, matterId: string): Promise<string> {
    await this.access.assertMatterAccess(user, matterId);
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        organizationId: user.organizationId,
        matterId,
      },
      orderBy: { startAt: 'asc' },
    });

    const icsEvents = events.map((event) => {
      const endAt = event.endAt ?? new Date(event.startAt.getTime() + 60 * 60 * 1000);
      return {
        title: event.type,
        description: event.description ?? '',
        location: event.location ?? '',
        start: [
          event.startAt.getUTCFullYear(),
          event.startAt.getUTCMonth() + 1,
          event.startAt.getUTCDate(),
          event.startAt.getUTCHours(),
          event.startAt.getUTCMinutes(),
        ] as [number, number, number, number, number],
        end: [
          endAt.getUTCFullYear(),
          endAt.getUTCMonth() + 1,
          endAt.getUTCDate(),
          endAt.getUTCHours(),
          endAt.getUTCMinutes(),
        ] as [number, number, number, number, number],
      };
    });

    const { error, value } = createEvents(icsEvents);
    if (error) {
      throw error;
    }

    return value ?? '';
  }

  private async resolveRulesPack(input: {
    organizationId: string;
    rulesPackId?: string;
    matterJurisdiction: string;
    matterCourt: string;
    matterProcedure: string;
    triggerDate: Date;
  }) {
    const templates = await this.prisma.deadlineRuleTemplate.findMany({
      where: {
        organizationId: input.organizationId,
        triggerType: 'RULES_PACK',
      },
      orderBy: { updatedAt: 'desc' },
    });
    const packs = templates
      .map((template) => this.mapRulesPack(template))
      .filter((pack): pack is DeadlineRulesPackRecord => pack !== null);
    if (packs.length === 0) {
      throw new UnprocessableEntityException('No deadline rules packs configured');
    }

    const triggerIso = input.triggerDate.toISOString();

    if (input.rulesPackId) {
      const byId = packs.find((pack) => pack.id === input.rulesPackId);
      if (!byId) {
        throw new NotFoundException('Rules pack not found');
      }
      if (!byId.pack.isActive) {
        throw new UnprocessableEntityException('Rules pack is inactive');
      }
      if (!this.isPackEffectiveForDate(byId.pack, triggerIso)) {
        throw new UnprocessableEntityException('Rules pack is not effective for triggerDate');
      }
      return byId;
    }

    const jurisdiction = input.matterJurisdiction.trim().toLowerCase();
    const court = input.matterCourt.trim().toLowerCase();
    const procedure = input.matterProcedure.trim().toLowerCase();

    const matching = packs.filter((pack) => {
      if (!pack.pack.isActive) {
        return false;
      }
      const jurisdictionMatches = !pack.pack.jurisdiction || pack.pack.jurisdiction.trim().toLowerCase() === jurisdiction;
      const courtMatches = !pack.pack.court || pack.pack.court.trim().toLowerCase() === court;
      const procedureMatches = !pack.pack.procedure || pack.pack.procedure.trim().toLowerCase() === procedure;
      return jurisdictionMatches && courtMatches && procedureMatches && this.isPackEffectiveForDate(pack.pack, triggerIso);
    });

    const selected = matching
      .map((pack) => ({
        pack,
        specificity: this.packSpecificity(pack.pack),
        effectiveFromEpoch: Date.parse(pack.pack.effectiveFrom),
      }))
      .sort((a, b) => {
        if (a.specificity !== b.specificity) {
          return b.specificity - a.specificity;
        }
        if (a.effectiveFromEpoch !== b.effectiveFromEpoch) {
          return b.effectiveFromEpoch - a.effectiveFromEpoch;
        }
        return a.pack.id.localeCompare(b.pack.id);
      })[0]?.pack;
    if (!selected) {
      throw new UnprocessableEntityException('Unable to select an active rules pack');
    }
    return selected;
  }

  private isPackEffectiveForDate(pack: DeadlineRulePackMeta, triggerIso: string): boolean {
    const startsBefore = pack.effectiveFrom <= triggerIso;
    const endsAfter = !pack.effectiveTo || pack.effectiveTo >= triggerIso;
    return startsBefore && endsAfter;
  }

  private packSpecificity(pack: DeadlineRulePackMeta): number {
    return [pack.jurisdiction, pack.court, pack.procedure].filter((value) => Boolean(value && value.trim())).length;
  }

  private mapRulesPack(template: {
    id: string;
    name: string;
    configJson: unknown;
  }): DeadlineRulesPackRecord | null {
    if (!template.configJson || typeof template.configJson !== 'object' || Array.isArray(template.configJson)) {
      return null;
    }
    const json = template.configJson as Record<string, unknown>;
    const pack = this.normalizePackMeta(json.pack);
    const rules = this.normalizePackRules(json.rules);
    return {
      id: template.id,
      name: template.name,
      pack,
      rules,
    };
  }

  private normalizePackMeta(raw: unknown): DeadlineRulePackMeta {
    const now = new Date().toISOString();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {
        key: 'default::default::default',
        jurisdiction: '',
        version: '1.0',
        effectiveFrom: now,
        isActive: true,
      };
    }
    const value = raw as Record<string, unknown>;
    return {
      key: typeof value.key === 'string' ? value.key : 'default::default::default',
      jurisdiction: typeof value.jurisdiction === 'string' ? value.jurisdiction : '',
      court: typeof value.court === 'string' ? value.court : undefined,
      procedure: typeof value.procedure === 'string' ? value.procedure : undefined,
      version: typeof value.version === 'string' ? value.version : '1.0',
      effectiveFrom: typeof value.effectiveFrom === 'string' ? value.effectiveFrom : now,
      effectiveTo: typeof value.effectiveTo === 'string' ? value.effectiveTo : undefined,
      isActive: typeof value.isActive === 'boolean' ? value.isActive : true,
    };
  }

  private normalizePackRules(raw: unknown): DeadlineRulePackRule[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw
      .filter((rule) => rule && typeof rule === 'object' && !Array.isArray(rule))
      .map((rule, index) => {
        const value = rule as Record<string, unknown>;
        return {
          id: typeof value.id === 'string' ? value.id : `rule-${index + 1}`,
          name: typeof value.name === 'string' ? value.name : `Rule ${index + 1}`,
          offsetDays: typeof value.offsetDays === 'number' ? value.offsetDays : 0,
          businessDaysOnly: Boolean(value.businessDaysOnly),
          eventType: typeof value.eventType === 'string' ? value.eventType : typeof value.name === 'string' ? value.name : `Rule ${index + 1}`,
          description: typeof value.description === 'string' ? value.description : undefined,
        };
      });
  }

  private applyOffset(baseDate: Date, offsetDays: number, businessDaysOnly: boolean): Date {
    const result = new Date(baseDate);
    if (!businessDaysOnly) {
      result.setUTCDate(result.getUTCDate() + offsetDays);
      return result;
    }

    const direction = offsetDays >= 0 ? 1 : -1;
    let remaining = Math.abs(offsetDays);
    while (remaining > 0) {
      result.setUTCDate(result.getUTCDate() + direction);
      const day = result.getUTCDay();
      if (day === 0 || day === 6) {
        continue;
      }
      remaining -= 1;
    }
    return result;
  }
}
