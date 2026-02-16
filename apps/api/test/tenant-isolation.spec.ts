import { ContactsService } from '../src/contacts/contacts.service';

describe('Tenant isolation', () => {
  it('queries contacts only within caller organization', async () => {
    const prisma = {
      contact: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as any;

    const service = new ContactsService(prisma, { appendEvent: jest.fn() } as any);
    await service.list('org-isolated');

    expect(prisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-isolated' }) }),
    );
  });
});
