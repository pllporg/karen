import * as bcrypt from 'bcryptjs';
import { AuthService } from '../src/auth/auth.service';
import { MattersService } from '../src/matters/matters.service';
import { DocumentsService } from '../src/documents/documents.service';
import { BillingService } from '../src/billing/billing.service';

type Store = {
  users: Array<any>;
  roles: Array<any>;
  memberships: Array<any>;
  sessions: Array<any>;
  matters: Array<any>;
  matterTeamMembers: Array<any>;
  contacts: Array<any>;
  participantRoleDefinitions: Array<any>;
  matterParticipants: Array<any>;
  documents: Array<any>;
  documentVersions: Array<any>;
  timeEntries: Array<any>;
  invoices: Array<any>;
  payments: Array<any>;
};

describe('Core workflow e2e hardening', () => {
  it('executes login -> matter lifecycle -> document upload -> billing workflow', async () => {
    const organizationId = 'org-1';
    const userId = 'user-1';
    const roleId = 'role-1';
    const membershipId = 'membership-1';
    const password = 'ChangeMe123!';
    const passwordHash = await bcrypt.hash(password, 12);

    const counters: Record<string, number> = {
      matter: 0,
      participant: 0,
      document: 0,
      version: 0,
      time: 0,
      invoice: 0,
      line: 0,
      payment: 0,
      team: 0,
      s3: 0,
    };

    const nextId = (key: string) => {
      counters[key] = (counters[key] ?? 0) + 1;
      return `${key}-${counters[key]}`;
    };

    const store: Store = {
      users: [
        {
          id: userId,
          email: 'attorney@lic-demo.local',
          passwordHash,
          fullName: 'Attorney User',
          mfaSecret: null,
        },
      ],
      roles: [
        {
          id: roleId,
          organizationId,
          name: 'Attorney',
          permissions: [{ key: 'matters:write' }, { key: 'documents:write' }, { key: 'billing:write' }],
        },
      ],
      memberships: [
        {
          id: membershipId,
          organizationId,
          userId,
          roleId,
          status: 'ACTIVE',
        },
      ],
      sessions: [],
      matters: [],
      matterTeamMembers: [],
      contacts: [
        {
          id: 'contact-opp-party',
          organizationId,
          displayName: 'Opposing Homeowner',
          kind: 'PERSON',
        },
      ],
      participantRoleDefinitions: [
        {
          id: 'role-def-opposing-party',
          organizationId,
          key: 'opposing_party',
          label: 'Opposing Party',
          sideDefault: 'OPPOSING_SIDE',
        },
      ],
      matterParticipants: [],
      documents: [],
      documentVersions: [],
      timeEntries: [],
      invoices: [],
      payments: [],
    };

    const resolveRole = (roleIdValue: string) => store.roles.find((role) => role.id === roleIdValue) ?? null;
    const resolveMembership = (id: string) => {
      const membership = store.memberships.find((item) => item.id === id) ?? null;
      if (!membership) return null;
      return {
        ...membership,
        role: resolveRole(membership.roleId),
      };
    };

    const resolveUserWithMemberships = (email: string) => {
      const user = store.users.find((item) => item.email === email) ?? null;
      if (!user) return null;
      const memberships = store.memberships
        .filter((item) => item.userId === user.id && item.status === 'ACTIVE')
        .map((item) => ({
          ...item,
          role: resolveRole(item.roleId),
        }));
      return {
        ...user,
        memberships,
      };
    };

    const findInvoiceById = (invoiceId: string) => store.invoices.find((invoice) => invoice.id === invoiceId) ?? null;
    const resolveInvoice = (invoiceId: string, include?: Record<string, boolean>) => {
      const invoice = findInvoiceById(invoiceId);
      if (!invoice) return null;
      return {
        ...invoice,
        lineItems: include?.lineItems ? invoice.lineItems : undefined,
        payments: include?.payments ? store.payments.filter((payment) => payment.invoiceId === invoice.id) : undefined,
        matter: include?.matter
          ? store.matters.find((matter) => matter.id === invoice.matterId) ?? { id: invoice.matterId, name: 'Unknown Matter' }
          : undefined,
      };
    };

    const prisma = {
      user: {
        findUnique: jest.fn(async ({ where, include }: any) => {
          if (where?.email) {
            const user = resolveUserWithMemberships(where.email);
            if (!user) return null;
            return include?.memberships ? user : { ...user, memberships: undefined };
          }
          if (where?.id) {
            return store.users.find((item) => item.id === where.id) ?? null;
          }
          return null;
        }),
      },
      membership: {
        findUnique: jest.fn(async ({ where, include }: any) => {
          const membership = resolveMembership(where?.id);
          if (!membership) return null;
          return include?.role ? membership : { ...membership, role: undefined };
        }),
      },
      session: {
        create: jest.fn(async ({ data }: any) => {
          const session = {
            id: `session-${store.sessions.length + 1}`,
            userId: data.userId,
            organizationId: data.organizationId,
            membershipId: data.membershipId,
            tokenHash: data.tokenHash,
            expiresAt: data.expiresAt,
            revokedAt: null,
          };
          store.sessions.push(session);
          return session;
        }),
        findFirst: jest.fn(async ({ where, include }: any) => {
          const session = store.sessions.find(
            (item) =>
              item.tokenHash === where?.tokenHash &&
              item.revokedAt === null &&
              item.expiresAt.getTime() > Date.now(),
          );
          if (!session) return null;

          const user = store.users.find((item) => item.id === session.userId);
          const membership = resolveMembership(session.membershipId);
          if (!user || !membership) return null;

          return {
            ...session,
            user: include?.user ? user : undefined,
            membership: include?.membership ? membership : undefined,
          };
        }),
        deleteMany: jest.fn(async () => ({ count: 1 })),
      },
      matter: {
        create: jest.fn(async ({ data }: any) => {
          const matter = {
            id: nextId('matter'),
            organizationId: data.organizationId,
            name: data.name,
            matterNumber: data.matterNumber,
            practiceArea: data.practiceArea,
            jurisdiction: data.jurisdiction ?? null,
            venue: data.venue ?? null,
            matterTypeId: data.matterTypeId ?? null,
            stageId: data.stageId ?? null,
            openedAt: data.openedAt ?? new Date(),
            status: data.status,
            ethicalWallEnabled: data.ethicalWallEnabled ?? false,
            createdAt: new Date(),
            closedAt: null,
          };
          store.matters.push(matter);
          return matter;
        }),
      },
      matterTeamMember: {
        create: jest.fn(async ({ data }: any) => {
          const member = { id: nextId('team'), ...data };
          store.matterTeamMembers.push(member);
          return member;
        }),
      },
      contact: {
        findFirst: jest.fn(async ({ where }: any) => {
          return (
            store.contacts.find((contact) => contact.id === where?.id && contact.organizationId === where?.organizationId) ?? null
          );
        }),
      },
      participantRoleDefinition: {
        findFirst: jest.fn(async ({ where }: any) => {
          return (
            store.participantRoleDefinitions.find(
              (roleDefinition) =>
                roleDefinition.organizationId === where?.organizationId && roleDefinition.key === where?.key,
            ) ?? null
          );
        }),
      },
      matterParticipant: {
        create: jest.fn(async ({ data, include }: any) => {
          const participant = {
            id: nextId('participant'),
            organizationId: data.organizationId,
            matterId: data.matterId,
            contactId: data.contactId,
            participantRoleKey: data.participantRoleKey,
            participantRoleDefinitionId: data.participantRoleDefinitionId,
            side: data.side ?? null,
            isPrimary: data.isPrimary ?? false,
            representedByContactId: data.representedByContactId ?? null,
            lawFirmContactId: data.lawFirmContactId ?? null,
            notes: data.notes ?? null,
          };
          store.matterParticipants.push(participant);
          return {
            ...participant,
            contact: include?.contact
              ? store.contacts.find((contact) => contact.id === participant.contactId) ?? null
              : undefined,
          };
        }),
        findFirst: jest.fn(async ({ where, include }: any) => {
          const participant =
            store.matterParticipants.find(
              (item) =>
                item.id === where?.id &&
                item.matterId === where?.matterId &&
                item.organizationId === where?.organizationId,
            ) ?? null;
          if (!participant) return null;
          const roleDefinition = store.participantRoleDefinitions.find(
            (role) => role.id === participant.participantRoleDefinitionId,
          );
          return {
            ...participant,
            participantRoleDefinition: include?.participantRoleDefinition ? roleDefinition ?? null : undefined,
            contact: include?.contact ? store.contacts.find((contact) => contact.id === participant.contactId) ?? null : undefined,
            representedByContact: include?.representedByContact
              ? store.contacts.find((contact) => contact.id === participant.representedByContactId) ?? null
              : undefined,
            lawFirmContact: include?.lawFirmContact
              ? store.contacts.find((contact) => contact.id === participant.lawFirmContactId) ?? null
              : undefined,
          };
        }),
        update: jest.fn(async ({ where, data, include }: any) => {
          const index = store.matterParticipants.findIndex((item) => item.id === where?.id);
          if (index < 0) throw new Error('participant not found');
          const updated = { ...store.matterParticipants[index], ...data };
          store.matterParticipants[index] = updated;
          const roleDefinition = store.participantRoleDefinitions.find(
            (role) => role.id === updated.participantRoleDefinitionId,
          );
          return {
            ...updated,
            participantRoleDefinition: include?.participantRoleDefinition ? roleDefinition ?? null : undefined,
            contact: include?.contact ? store.contacts.find((contact) => contact.id === updated.contactId) ?? null : undefined,
            representedByContact: include?.representedByContact
              ? store.contacts.find((contact) => contact.id === updated.representedByContactId) ?? null
              : undefined,
            lawFirmContact: include?.lawFirmContact
              ? store.contacts.find((contact) => contact.id === updated.lawFirmContactId) ?? null
              : undefined,
          };
        }),
      },
      document: {
        create: jest.fn(async ({ data }: any) => {
          const document = {
            id: nextId('document'),
            organizationId: data.organizationId,
            matterId: data.matterId,
            title: data.title,
            category: data.category ?? null,
            tags: data.tags ?? [],
            sharedWithClient: data.sharedWithClient ?? false,
            confidentialityLevel: data.confidentialityLevel ?? null,
            createdByUserId: data.createdByUserId,
            createdAt: new Date(),
            dispositionStatus: 'ACTIVE',
          };
          store.documents.push(document);
          return document;
        }),
      },
      documentVersion: {
        create: jest.fn(async ({ data }: any) => {
          const version = {
            id: nextId('version'),
            organizationId: data.organizationId,
            documentId: data.documentId,
            storageKey: data.storageKey,
            sha256: data.sha256,
            mimeType: data.mimeType,
            size: data.size,
            uploadedByUserId: data.uploadedByUserId,
            uploadedAt: new Date(),
          };
          store.documentVersions.push(version);
          return version;
        }),
      },
      timeEntry: {
        create: jest.fn(async ({ data }: any) => {
          const timeEntry = {
            id: nextId('time'),
            organizationId: data.organizationId,
            matterId: data.matterId,
            userId: data.userId,
            description: data.description ?? null,
            startedAt: data.startedAt,
            endedAt: data.endedAt,
            durationMinutes: data.durationMinutes,
            billableRate: data.billableRate,
            amount: data.amount,
            utbmsPhaseCode: data.utbmsPhaseCode ?? null,
            utbmsTaskCode: data.utbmsTaskCode ?? null,
          };
          store.timeEntries.push(timeEntry);
          return timeEntry;
        }),
      },
      invoice: {
        count: jest.fn(async ({ where }: any) => {
          return store.invoices.filter((invoice) => invoice.organizationId === where?.organizationId).length;
        }),
        create: jest.fn(async ({ data, include }: any) => {
          const id = nextId('invoice');
          const lineItems = (data.lineItems?.create ?? []).map((item: any) => ({
            id: nextId('line'),
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            timeEntryId: item.timeEntryId ?? null,
            expenseId: item.expenseId ?? null,
            utbmsPhaseCode: item.utbmsPhaseCode ?? null,
            utbmsTaskCode: item.utbmsTaskCode ?? null,
          }));
          const invoice = {
            id,
            organizationId: data.organizationId,
            matterId: data.matterId,
            invoiceNumber: data.invoiceNumber,
            status: data.status,
            issuedAt: data.issuedAt,
            dueAt: data.dueAt,
            subtotal: data.subtotal,
            tax: data.tax,
            total: data.total,
            balanceDue: data.balanceDue,
            notes: data.notes ?? null,
            jurisdictionDisclaimer: data.jurisdictionDisclaimer ?? null,
            lineItems,
            pdfStorageKey: null as string | null,
          };
          store.invoices.push(invoice);
          return include?.lineItems ? { ...invoice, lineItems } : invoice;
        }),
        findUnique: jest.fn(async ({ where, include }: any) => resolveInvoice(where?.id, include)),
        findFirst: jest.fn(async ({ where }: any) => {
          return (
            store.invoices.find(
              (invoice) => invoice.id === where?.id && invoice.organizationId === where?.organizationId,
            ) ?? null
          );
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const invoice = findInvoiceById(where?.id);
          if (!invoice) throw new Error('invoice not found');
          Object.assign(invoice, data);
          return invoice;
        }),
      },
      payment: {
        findFirst: jest.fn(async ({ where }: any) => {
          return (
            store.payments.find(
              (payment) =>
                payment.organizationId === where?.organizationId &&
                payment.invoiceId === where?.invoiceId &&
                (where?.stripePaymentIntentId ? payment.stripePaymentIntentId === where?.stripePaymentIntentId : true) &&
                (where?.reference ? payment.reference === where?.reference : true),
            ) ?? null
          );
        }),
        create: jest.fn(async ({ data }: any) => {
          const payment = {
            id: nextId('payment'),
            organizationId: data.organizationId,
            invoiceId: data.invoiceId,
            amount: data.amount,
            method: data.method,
            stripePaymentIntentId: data.stripePaymentIntentId ?? null,
            reference: data.reference ?? null,
          };
          store.payments.push(payment);
          return payment;
        }),
      },
    } as any;

    const access = {
      assertMatterAccess: jest.fn().mockResolvedValue(undefined),
    } as any;
    const audit = {
      appendEvent: jest.fn().mockResolvedValue(undefined),
    } as any;
    const s3 = {
      upload: jest.fn().mockImplementation(async (_buffer: Buffer, _mime: string, prefix: string) => ({
        key: `${prefix}/artifact-${nextId('s3')}`,
      })),
    } as any;
    const malwareScan = {
      scan: jest.fn().mockResolvedValue({ clean: true }),
    } as any;

    const authService = new AuthService(prisma);
    const mattersService = new MattersService(prisma, audit, access);
    const documentsService = new DocumentsService(prisma, access, s3, malwareScan, audit);
    const billingService = new BillingService(prisma, access, audit, s3);

    const login = await authService.login({
      email: 'attorney@lic-demo.local',
      password,
    });
    const authenticated = await authService.validateSession(login.token);
    expect(authenticated).toEqual(
      expect.objectContaining({
        id: userId,
        organizationId,
      }),
    );

    const matter = await mattersService.create({
      organizationId,
      actorUserId: userId,
      name: 'RC-1 Matter',
      matterNumber: 'RC1-0001',
      practiceArea: 'Construction Litigation',
      jurisdiction: 'California',
      venue: 'Orange County Superior Court',
    });
    expect(matter.name).toBe('RC-1 Matter');

    const participant = await mattersService.addParticipant({
      user: authenticated as any,
      matterId: matter.id,
      contactId: 'contact-opp-party',
      participantRoleKey: 'opposing_party',
      notes: 'Initial opposing party record',
    });
    expect(participant.participantRoleKey).toBe('opposing_party');

    const updatedParticipant = await mattersService.updateParticipant({
      user: authenticated as any,
      matterId: matter.id,
      participantId: participant.id,
      notes: 'Updated after intake call',
      isPrimary: true,
    });
    expect(updatedParticipant).not.toBeNull();
    expect(updatedParticipant!.notes).toBe('Updated after intake call');
    expect(updatedParticipant!.isPrimary).toBe(true);

    const upload = await documentsService.uploadNew({
      user: authenticated as any,
      matterId: matter.id,
      title: 'Initial defect photo log',
      category: 'EVIDENCE',
      tags: ['defect', 'photo'],
      file: {
        buffer: Buffer.from('photo-bytes'),
        originalname: 'defect.jpg',
        mimetype: 'image/jpeg',
        size: 11,
      } as any,
    });
    expect(upload.document.title).toBe('Initial defect photo log');
    expect(upload.version.storageKey).toContain(`org/${organizationId}/matter/${matter.id}`);

    const timeEntry = await billingService.createTimeEntry({
      user: authenticated as any,
      matterId: matter.id,
      description: 'Prepare initial demand package',
      startedAt: '2026-02-24T10:00:00.000Z',
      endedAt: '2026-02-24T11:30:00.000Z',
      billableRate: 400,
      utbmsPhaseCode: 'L100',
      utbmsTaskCode: 'L110',
    });
    expect(timeEntry.durationMinutes).toBe(90);
    expect(timeEntry.amount).toBe(600);

    const invoice = await billingService.createInvoice({
      user: authenticated as any,
      matterId: matter.id,
      notes: 'RC-1 invoice smoke path',
      lineItems: [
        {
          description: 'Initial case assessment',
          quantity: 1,
          unitPrice: 600,
          timeEntryId: timeEntry.id,
          utbmsPhaseCode: 'L100',
          utbmsTaskCode: 'L110',
        },
      ],
    });
    expect(invoice?.invoiceNumber).toBe('INV-00001');
    expect(invoice?.pdfStorageKey).toContain(`org/${organizationId}/invoices`);

    const payment = await billingService.recordPayment({
      user: authenticated as any,
      invoiceId: invoice!.id,
      amount: invoice!.total,
      method: 'MANUAL' as any,
      reference: 'rc1-smoke-manual-payment',
    });
    expect(payment.amount).toBe(invoice!.total);

    const paidInvoice = store.invoices.find((item) => item.id === invoice!.id);
    expect(paidInvoice?.balanceDue).toBe(0);
    expect(paidInvoice?.status).toBe('PAID');

    const auditActions = (audit.appendEvent as jest.Mock).mock.calls.map((call) => call[0]?.action);
    expect(auditActions).toEqual(
      expect.arrayContaining([
        'matter.created',
        'matter.participant.added',
        'matter.participant.updated',
        'document.uploaded',
        'invoice.created',
      ]),
    );
    expect(access.assertMatterAccess).toHaveBeenCalledWith(expect.objectContaining({ id: userId }), matter.id, 'write');
    expect(malwareScan.scan).toHaveBeenCalledTimes(1);
  });
});
