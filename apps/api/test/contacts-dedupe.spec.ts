import { ContactKind } from '@prisma/client';
import { ContactsService } from '../src/contacts/contacts.service';

describe('ContactsService dedupe workflow', () => {
  it('supports compound tag filters on contact listing', async () => {
    const prisma = {
      contact: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as any;

    const service = new ContactsService(prisma, { appendEvent: jest.fn() } as any);
    await service.list('org1', {
      search: 'jane',
      includeTags: ['client', 'vip'],
      excludeTags: ['blocked'],
      tagMode: 'all',
    });

    expect(prisma.contact.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { organizationId: 'org1' },
          {
            OR: [
              { displayName: { contains: 'jane', mode: 'insensitive' } },
              { primaryEmail: { contains: 'jane', mode: 'insensitive' } },
              { primaryPhone: { contains: 'jane', mode: 'insensitive' } },
            ],
          },
          { tags: { has: 'client' } },
          { tags: { has: 'vip' } },
          { NOT: { tags: { has: 'blocked' } } },
        ],
      },
      include: {
        personProfile: true,
        organizationProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns filtered relationship graph with nodes, edges, and available relationship types', async () => {
    const prisma = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'c1',
          organizationId: 'org1',
          kind: ContactKind.PERSON,
          displayName: 'Jane Doe',
          primaryEmail: 'jane@example.com',
          primaryPhone: '555-1000',
          tags: ['client'],
        }),
      },
      contactRelationship: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([
            {
              id: 'rel1',
              fromContactId: 'c1',
              toContactId: 'c2',
              relationshipType: 'opposing_counsel',
              notes: 'Primary defense counsel',
              fromContact: {
                id: 'c1',
                displayName: 'Jane Doe',
                kind: ContactKind.PERSON,
                primaryEmail: 'jane@example.com',
                primaryPhone: '555-1000',
                tags: ['client'],
              },
              toContact: {
                id: 'c2',
                displayName: 'Avery Defense',
                kind: ContactKind.PERSON,
                primaryEmail: 'avery@defense.test',
                primaryPhone: '555-2000',
                tags: ['opposing-counsel'],
              },
            },
          ])
          .mockResolvedValueOnce([
            { relationshipType: 'insurer' },
            { relationshipType: 'opposing_counsel' },
          ]),
      },
    } as any;

    const service = new ContactsService(prisma, { appendEvent: jest.fn() } as any);
    const graph = await service.graph('org1', 'c1', {
      search: 'defense',
      relationshipTypes: ['opposing_counsel'],
    });

    expect(prisma.contactRelationship.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org1',
        }),
      }),
    );
    expect(graph.summary).toEqual({ nodeCount: 2, edgeCount: 1 });
    expect(graph.availableRelationshipTypes).toEqual(['insurer', 'opposing_counsel']);
    expect(graph.edges[0]).toEqual(
      expect.objectContaining({
        relationshipType: 'opposing_counsel',
        direction: 'OUTGOING',
        relatedContact: expect.objectContaining({
          id: 'c2',
          displayName: 'Avery Defense',
        }),
      }),
    );
  });

  it('returns dedupe suggestions with confidence, decision state, and field diffs', async () => {
    const prisma = {
      contact: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'c1',
            organizationId: 'org1',
            kind: ContactKind.PERSON,
            displayName: 'Jane Doe',
            primaryEmail: 'jane@example.com',
            primaryPhone: '555-1000',
            tags: ['client'],
          },
          {
            id: 'c2',
            organizationId: 'org1',
            kind: ContactKind.PERSON,
            displayName: 'J. Doe',
            primaryEmail: 'jane@example.com',
            primaryPhone: '555-1000',
            tags: [],
          },
        ]),
      },
      auditLogEvent: {
        findMany: jest.fn().mockResolvedValue([
          {
            action: 'contact.dedupe.ignored',
            entityId: 'c1::c2',
            metadataJson: {},
            createdAt: new Date(),
          },
        ]),
      },
    } as any;

    const service = new ContactsService(prisma, { appendEvent: jest.fn() } as any);
    const suggestions = await service.dedupeSuggestions('org1');

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      primaryId: 'c1',
      duplicateId: 'c2',
      pairKey: 'c1::c2',
      decision: 'IGNORE',
      confidence: 'HIGH',
    });
    expect(suggestions[0].fieldDiffs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'displayName' }),
      ]),
    );
  });

  it('records explicit dedupe decisions with audit trail', async () => {
    const prisma = {
      contact: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: 'c1', organizationId: 'org1' })
          .mockResolvedValueOnce({ id: 'c2', organizationId: 'org1' }),
      },
    } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue({}) } as any;
    const service = new ContactsService(prisma, audit);

    const decision = await service.setDedupeDecision({
      organizationId: 'org1',
      actorUserId: 'u1',
      primaryId: 'c1',
      duplicateId: 'c2',
      decision: 'DEFER',
    });

    expect(decision).toEqual({
      pairKey: 'c1::c2',
      decision: 'DEFER',
      primaryId: 'c1',
      duplicateId: 'c2',
    });
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'contact.dedupe.deferred',
        entityType: 'contactDedupe',
        entityId: 'c1::c2',
      }),
    );
  });

  it('merges duplicate contacts and preserves referential integrity updates', async () => {
    const tx = {
      matterParticipant: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      contactMethod: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      contactRelationship: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      externalReference: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      communicationThread: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      communicationParticipant: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      lead: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      lienModel: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      insuranceClaim: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      expertEngagement: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      contact: { delete: jest.fn().mockResolvedValue({ id: 'c2' }) },
    };

    const prisma = {
      contact: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'c1',
            organizationId: 'org1',
            displayName: 'Jane Doe',
            kind: ContactKind.PERSON,
            primaryEmail: 'jane@example.com',
            primaryPhone: '555-1000',
            tags: ['client'],
          })
          .mockResolvedValueOnce({
            id: 'c2',
            organizationId: 'org1',
            displayName: 'J. Doe',
            kind: ContactKind.PERSON,
            primaryEmail: 'jane.alt@example.com',
            primaryPhone: '555-1000',
            tags: [],
          }),
        findUnique: jest.fn().mockResolvedValue({ id: 'c1', displayName: 'Jane Doe' }),
      },
      $transaction: jest.fn().mockImplementation(async (fn) => fn(tx)),
    } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue({}) } as any;
    const service = new ContactsService(prisma, audit);

    const merged = await service.mergeContacts({
      organizationId: 'org1',
      actorUserId: 'u1',
      primaryId: 'c1',
      duplicateId: 'c2',
    });

    expect(merged).toEqual({ id: 'c1', displayName: 'Jane Doe' });
    expect(tx.matterParticipant.updateMany).toHaveBeenCalledWith({
      where: { contactId: 'c2' },
      data: { contactId: 'c1' },
    });
    expect(tx.matterParticipant.updateMany).toHaveBeenCalledWith({
      where: { representedByContactId: 'c2' },
      data: { representedByContactId: 'c1' },
    });
    expect(tx.matterParticipant.updateMany).toHaveBeenCalledWith({
      where: { lawFirmContactId: 'c2' },
      data: { lawFirmContactId: 'c1' },
    });
    expect(tx.contactMethod.updateMany).toHaveBeenCalledWith({
      where: { contactId: 'c2' },
      data: { contactId: 'c1' },
    });
    expect(tx.contactRelationship.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.externalReference.updateMany).toHaveBeenCalledWith({
      where: { organizationId: 'org1', entityType: 'contact', entityId: 'c2' },
      data: { entityId: 'c1' },
    });
    expect(tx.communicationThread.updateMany).toHaveBeenCalledWith({
      where: { contactId: 'c2' },
      data: { contactId: 'c1' },
    });
    expect(tx.communicationParticipant.updateMany).toHaveBeenCalledWith({
      where: { contactId: 'c2' },
      data: { contactId: 'c1' },
    });
    expect(tx.lead.updateMany).toHaveBeenCalledWith({
      where: { referralContactId: 'c2' },
      data: { referralContactId: 'c1' },
    });
    expect(tx.lienModel.updateMany).toHaveBeenCalledWith({
      where: { claimantContactId: 'c2' },
      data: { claimantContactId: 'c1' },
    });
    expect(tx.insuranceClaim.updateMany).toHaveBeenCalledWith({
      where: { adjusterContactId: 'c2' },
      data: { adjusterContactId: 'c1' },
    });
    expect(tx.insuranceClaim.updateMany).toHaveBeenCalledWith({
      where: { insurerContactId: 'c2' },
      data: { insurerContactId: 'c1' },
    });
    expect(tx.expertEngagement.updateMany).toHaveBeenCalledWith({
      where: { expertContactId: 'c2' },
      data: { expertContactId: 'c1' },
    });
    expect(tx.contact.delete).toHaveBeenCalledWith({ where: { id: 'c2' } });
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'contact.merged',
        entityType: 'contact',
        entityId: 'c1',
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'contact.dedupe.merged',
        entityType: 'contactDedupe',
        entityId: 'c1::c2',
      }),
    );
  });

  it('rejects self-referential dedupe decisions and merges', async () => {
    const prisma = {
      contact: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue({}) } as any;
    const service = new ContactsService(prisma, audit);

    await expect(
      service.setDedupeDecision({
        organizationId: 'org1',
        actorUserId: 'u1',
        primaryId: 'c1',
        duplicateId: 'c1',
        decision: 'IGNORE',
      }),
    ).rejects.toThrow('Primary and duplicate contacts must be different');

    await expect(
      service.mergeContacts({
        organizationId: 'org1',
        actorUserId: 'u1',
        primaryId: 'c1',
        duplicateId: 'c1',
      }),
    ).rejects.toThrow('Primary and duplicate contacts must be different');

    expect(prisma.contact.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(audit.appendEvent).not.toHaveBeenCalled();
  });
});
