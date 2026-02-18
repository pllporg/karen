import { ContactsController } from '../src/contacts/contacts.controller';

describe('ContactsController query parsing', () => {
  const user = { id: 'user-1', organizationId: 'org-1' } as any;

  it('parses include/exclude tags from repeated query params and csv values', async () => {
    const contactsService = {
      list: jest.fn().mockResolvedValue([]),
    } as any;
    const controller = new ContactsController(contactsService);

    await controller.list(
      user,
      'jane',
      ['client,vip', ' priority '],
      ['blocked', ' archived,closed '],
      'all',
    );

    expect(contactsService.list).toHaveBeenCalledWith('org-1', {
      search: 'jane',
      includeTags: ['client', 'vip', 'priority'],
      excludeTags: ['blocked', 'archived', 'closed'],
      tagMode: 'all',
    });
  });

  it('defaults tagMode to any when query value is invalid', async () => {
    const contactsService = {
      list: jest.fn().mockResolvedValue([]),
    } as any;
    const controller = new ContactsController(contactsService);

    await controller.list(user, undefined, 'client', undefined, 'invalid' as any);

    expect(contactsService.list).toHaveBeenCalledWith('org-1', {
      search: undefined,
      includeTags: ['client'],
      excludeTags: [],
      tagMode: 'any',
    });
  });

  it('parses graph relationshipTypes from repeated query params and csv values', async () => {
    const contactsService = {
      graph: jest.fn().mockResolvedValue({}),
    } as any;
    const controller = new ContactsController(contactsService);

    await controller.graph(user, 'contact-1', 'defense', ['opposing_counsel,insurer', ' expert ']);

    expect(contactsService.graph).toHaveBeenCalledWith('org-1', 'contact-1', {
      search: 'defense',
      relationshipTypes: ['opposing_counsel', 'insurer', 'expert'],
    });
  });
});
