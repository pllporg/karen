import { ContactKind } from '@prisma/client';
import { ContactsService } from '../src/contacts/contacts.service';

describe('ContactsService dedupe workflow', () => {
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
    expect(tx.contactMethod.updateMany).toHaveBeenCalledWith({
      where: { contactId: 'c2' },
      data: { contactId: 'c1' },
    });
    expect(tx.contactRelationship.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.externalReference.updateMany).toHaveBeenCalledWith({
      where: { organizationId: 'org1', entityType: 'contact', entityId: 'c2' },
      data: { entityId: 'c1' },
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
});
