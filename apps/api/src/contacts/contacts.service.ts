import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactKind } from '@prisma/client';
import { distance } from 'fastest-levenshtein';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(organizationId: string, search?: string, tag?: string) {
    return this.prisma.contact.findMany({
      where: {
        organizationId,
        ...(search
          ? {
              OR: [
                { displayName: { contains: search, mode: 'insensitive' } },
                { primaryEmail: { contains: search, mode: 'insensitive' } },
                { primaryPhone: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(tag ? { tags: { has: tag } } : {}),
      },
      include: {
        personProfile: true,
        organizationProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: {
    organizationId: string;
    actorUserId: string;
    kind: ContactKind;
    displayName: string;
    primaryEmail?: string;
    primaryPhone?: string;
    tags?: string[];
    firstName?: string;
    lastName?: string;
    barNumber?: string;
    licenseJurisdiction?: string;
    title?: string;
    legalName?: string;
    dba?: string;
    website?: string;
  }) {
    const contact = await this.prisma.contact.create({
      data: {
        organizationId: input.organizationId,
        kind: input.kind,
        displayName: input.displayName,
        primaryEmail: input.primaryEmail,
        primaryPhone: input.primaryPhone,
        tags: input.tags ?? [],
      },
    });

    if (input.kind === ContactKind.PERSON) {
      await this.prisma.personProfile.create({
        data: {
          contactId: contact.id,
          firstName: input.firstName,
          lastName: input.lastName,
          barNumber: input.barNumber,
          licenseJurisdiction: input.licenseJurisdiction,
          title: input.title,
        },
      });
    } else {
      await this.prisma.organizationProfile.create({
        data: {
          contactId: contact.id,
          legalName: input.legalName ?? input.displayName,
          dba: input.dba,
          website: input.website,
        },
      });
    }

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: 'contact.created',
      entityType: 'contact',
      entityId: contact.id,
      metadata: { kind: input.kind, displayName: input.displayName },
    });

    return this.prisma.contact.findUnique({
      where: { id: contact.id },
      include: {
        personProfile: true,
        organizationProfile: true,
      },
    });
  }

  async createRelationship(input: {
    organizationId: string;
    actorUserId: string;
    fromContactId: string;
    toContactId: string;
    relationshipType: string;
    notes?: string;
  }) {
    const relationship = await this.prisma.contactRelationship.create({
      data: {
        organizationId: input.organizationId,
        fromContactId: input.fromContactId,
        toContactId: input.toContactId,
        relationshipType: input.relationshipType,
        notes: input.notes,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: 'contact.relationship.created',
      entityType: 'contactRelationship',
      entityId: relationship.id,
      metadata: relationship,
    });

    return relationship;
  }

  async graph(organizationId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, organizationId },
      include: {
        outgoingRelationships: {
          include: {
            toContact: true,
          },
        },
        incomingRelationships: {
          include: {
            fromContact: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async dedupeSuggestions(organizationId: string) {
    const contacts = await this.prisma.contact.findMany({ where: { organizationId } });
    const suggestions: Array<{
      primaryId: string;
      duplicateId: string;
      score: number;
      reasons: string[];
    }> = [];

    for (let i = 0; i < contacts.length; i += 1) {
      for (let j = i + 1; j < contacts.length; j += 1) {
        const a = contacts[i];
        const b = contacts[j];
        const reasons: string[] = [];
        let score = 0;

        if (a.primaryEmail && b.primaryEmail && a.primaryEmail.toLowerCase() === b.primaryEmail.toLowerCase()) {
          score += 0.6;
          reasons.push('same email');
        }

        if (a.primaryPhone && b.primaryPhone && a.primaryPhone === b.primaryPhone) {
          score += 0.3;
          reasons.push('same phone');
        }

        const max = Math.max(a.displayName.length, b.displayName.length);
        const similarity = max === 0 ? 0 : 1 - distance(a.displayName.toLowerCase(), b.displayName.toLowerCase()) / max;
        if (similarity > 0.8) {
          score += 0.25;
          reasons.push('similar name');
        }

        if (score >= 0.6) {
          suggestions.push({
            primaryId: a.id,
            duplicateId: b.id,
            score: Math.min(1, score),
            reasons,
          });
        }
      }
    }

    return suggestions.sort((a, b) => b.score - a.score).slice(0, 100);
  }

  async mergeContacts(input: {
    organizationId: string;
    actorUserId: string;
    primaryId: string;
    duplicateId: string;
  }) {
    const primary = await this.prisma.contact.findFirst({ where: { id: input.primaryId, organizationId: input.organizationId } });
    const duplicate = await this.prisma.contact.findFirst({ where: { id: input.duplicateId, organizationId: input.organizationId } });

    if (!primary || !duplicate) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.matterParticipant.updateMany({
        where: { contactId: duplicate.id },
        data: { contactId: primary.id },
      });

      await tx.contactMethod.updateMany({
        where: { contactId: duplicate.id },
        data: { contactId: primary.id },
      });

      await tx.contactRelationship.updateMany({
        where: { fromContactId: duplicate.id },
        data: { fromContactId: primary.id },
      });

      await tx.contactRelationship.updateMany({
        where: { toContactId: duplicate.id },
        data: { toContactId: primary.id },
      });

      await tx.externalReference.updateMany({
        where: {
          organizationId: input.organizationId,
          entityType: 'contact',
          entityId: duplicate.id,
        },
        data: {
          entityId: primary.id,
        },
      });

      await tx.contact.delete({ where: { id: duplicate.id } });
    });

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: 'contact.merged',
      entityType: 'contact',
      entityId: primary.id,
      metadata: {
        duplicateId: duplicate.id,
      },
    });

    return this.prisma.contact.findUnique({ where: { id: primary.id } });
  }
}
