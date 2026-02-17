import { AdminService } from '../src/admin/admin.service';
import { AiService } from '../src/ai/ai.service';
import { AuditService } from '../src/audit/audit.service';
import { BillingService } from '../src/billing/billing.service';
import { CalendarService } from '../src/calendar/calendar.service';
import { CommunicationsService } from '../src/communications/communications.service';
import { ContactsService } from '../src/contacts/contacts.service';
import { DocumentsService } from '../src/documents/documents.service';
import { ExportsService } from '../src/exports/exports.service';
import { ImportsService } from '../src/imports/imports.service';
import { IntegrationsService } from '../src/integrations/integrations.service';
import { IntegrationTokenCryptoService } from '../src/integrations/integration-token-crypto.service';
import { MattersService } from '../src/matters/matters.service';
import { OrganizationsService } from '../src/organizations/organizations.service';
import { ReportingService } from '../src/reporting/reporting.service';
import { TasksService } from '../src/tasks/tasks.service';
import { WebhooksService } from '../src/webhooks/webhooks.service';

const baseUser = {
  id: 'user-1',
  email: 'user@example.com',
  organizationId: 'org-isolated',
  permissions: [],
  membership: { role: { name: 'Attorney', permissions: [] } },
} as any;

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
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([expect.objectContaining({ organizationId: 'org-isolated' })]),
        }),
      }),
    );
  });

  it('queries matters by organization', async () => {
    const prisma = {
      matter: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as any;
    const service = new MattersService(prisma, { appendEvent: jest.fn() } as any, { assertMatterAccess: jest.fn() } as any);

    await service.list('org-isolated');
    expect(prisma.matter.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org-isolated' } }));
  });

  it('queries tasks by organization and matter', async () => {
    const assertMatterAccess = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      task: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const service = new TasksService(prisma, { assertMatterAccess } as any, { appendEvent: jest.fn() } as any);

    await service.list(baseUser, 'matter-1');

    expect(assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter-1');
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-isolated', matterId: 'matter-1' }),
      }),
    );
  });

  it('queries calendar events by organization and matter', async () => {
    const assertMatterAccess = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      calendarEvent: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const service = new CalendarService(prisma, { assertMatterAccess } as any, { appendEvent: jest.fn() } as any);

    await service.list(baseUser, 'matter-1');

    expect(assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter-1');
    expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-isolated', matterId: 'matter-1' }),
      }),
    );
  });

  it('queries documents by organization and enforces matter access', async () => {
    const assertMatterAccess = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      document: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const service = new DocumentsService(
      prisma,
      { assertMatterAccess } as any,
      { upload: jest.fn(), signedDownloadUrl: jest.fn(), getObjectBuffer: jest.fn() } as any,
      { scan: jest.fn() } as any,
      { appendEvent: jest.fn() } as any,
    );

    await service.list(baseUser, 'matter-1');

    expect(assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter-1', 'read');
    expect(prisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-isolated', matterId: 'matter-1' }),
      }),
    );
  });

  it('queries communication threads by organization and matter', async () => {
    const assertMatterAccess = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      communicationThread: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const service = new CommunicationsService(
      prisma,
      { assertMatterAccess } as any,
      { appendEvent: jest.fn() } as any,
      { sendEmail: jest.fn(), sendSms: jest.fn() } as any,
    );

    await service.listThreads(baseUser, 'matter-1');

    expect(assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter-1', 'read');
    expect(prisma.communicationThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-isolated', matterId: 'matter-1' }),
      }),
    );
  });

  it('queries invoices and trust ledgers by organization', async () => {
    const assertMatterAccess = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      invoice: { findMany: jest.fn().mockResolvedValue([]) },
      matterTrustLedger: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const service = new BillingService(
      prisma,
      { assertMatterAccess } as any,
      { appendEvent: jest.fn() } as any,
      { upload: jest.fn() } as any,
    );

    await service.listInvoices(baseUser, 'matter-1');
    await service.trustReport(baseUser, 'trust-account-1');

    expect(assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter-1', 'read');
    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-isolated', matterId: 'matter-1' }),
      }),
    );
    expect(prisma.matterTrustLedger.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-isolated', trustAccountId: 'trust-account-1' }),
      }),
    );
  });

  it('queries ai jobs by organization and matter', async () => {
    const assertMatterAccess = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      aiJob: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const service = new AiService(
      prisma,
      { addJob: jest.fn(), createWorker: jest.fn() } as any,
      { assertMatterAccess } as any,
      { appendEvent: jest.fn() } as any,
    );

    await service.listJobs(baseUser, 'matter-1');

    expect(assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter-1', 'read');
    expect(prisma.aiJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-isolated', matterId: 'matter-1' }),
      }),
    );
  });

  it('queries import batches and mapping profiles by organization', async () => {
    const prisma = {
      importBatch: { findMany: jest.fn().mockResolvedValue([]) },
      mappingProfile: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const service = new ImportsService(prisma, { appendEvent: jest.fn() } as any);

    await service.listBatches('org-isolated');
    await service.listMappingProfiles('org-isolated', 'mycase_backup_zip');

    expect(prisma.importBatch.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org-isolated' } }));
    expect(prisma.mappingProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-isolated', sourceSystem: 'mycase_backup_zip' }),
      }),
    );
  });

  it('queries integration connections and export jobs by organization', async () => {
    const prisma = {
      integrationConnection: { findMany: jest.fn().mockResolvedValue([]) },
      exportJob: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const integrations = new IntegrationsService(
      prisma,
      { appendEvent: jest.fn() } as any,
      new IntegrationTokenCryptoService(),
    );
    const exportsService = new ExportsService(
      prisma,
      { upload: jest.fn(), signedDownloadUrl: jest.fn(), getObjectBuffer: jest.fn() } as any,
      { appendEvent: jest.fn() } as any,
    );

    await integrations.list(baseUser);
    await exportsService.listJobs('org-isolated');

    expect(prisma.integrationConnection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-isolated' }) }),
    );
    expect(prisma.exportJob.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org-isolated' } }));
  });

  it('queries admin, audit, and webhook data by organization', async () => {
    const prisma = {
      membership: { findMany: jest.fn().mockResolvedValue([]) },
      role: { findMany: jest.fn().mockResolvedValue([]) },
      matterStage: { findMany: jest.fn().mockResolvedValue([]) },
      auditLogEvent: { findMany: jest.fn().mockResolvedValue([]) },
      webhookEndpoint: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;

    const admin = new AdminService(prisma, { appendEvent: jest.fn() } as any);
    const audit = new AuditService(prisma);
    const webhooks = new WebhooksService(prisma);

    await admin.listUsers('org-isolated');
    await admin.listRoles('org-isolated');
    await admin.listStages('org-isolated', 'Construction Litigation');
    await audit.listByOrganization('org-isolated', 50);
    await webhooks.listEndpoints('org-isolated');

    expect(prisma.membership.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org-isolated' } }));
    expect(prisma.role.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org-isolated' } }));
    expect(prisma.matterStage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-isolated', practiceArea: 'Construction Litigation' }),
      }),
    );
    expect(prisma.auditLogEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org-isolated' } }));
    expect(prisma.webhookEndpoint.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org-isolated' } }));
  });

  it('queries organization-scoped custom fields/sections and reporting data', async () => {
    const prisma = {
      customFieldDefinition: { findMany: jest.fn().mockResolvedValue([]) },
      sectionDefinition: { findMany: jest.fn().mockResolvedValue([]) },
      sectionInstance: { findMany: jest.fn().mockResolvedValue([]) },
      matter: { groupBy: jest.fn().mockResolvedValue([]) },
      matterStage: { findMany: jest.fn().mockResolvedValue([]) },
      task: { findMany: jest.fn().mockResolvedValue([]) },
      timeEntry: { groupBy: jest.fn().mockResolvedValue([]) },
      invoice: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;

    const organizations = new OrganizationsService(prisma, { appendEvent: jest.fn() } as any);
    const reporting = new ReportingService(prisma);

    await organizations.listCustomFields(baseUser, 'matter');
    await organizations.listSectionDefinitions(baseUser, 'matter-type-1');
    await organizations.listSectionInstances(baseUser, 'matter-1');
    await reporting.mattersByStage('org-isolated');
    await reporting.upcomingDeadlines('org-isolated', 14);
    await reporting.wip('org-isolated');
    await reporting.arAging('org-isolated');

    expect(prisma.customFieldDefinition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-isolated', entityType: 'matter' }) }),
    );
    expect(prisma.sectionDefinition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-isolated', matterTypeId: 'matter-type-1' }) }),
    );
    expect(prisma.sectionInstance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-isolated', matterId: 'matter-1' }) }),
    );
    expect(prisma.matter.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org-isolated' } }));
    expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-isolated' }) }));
    expect(prisma.timeEntry.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org-isolated' } }));
    expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-isolated' }) }));
  });
});
