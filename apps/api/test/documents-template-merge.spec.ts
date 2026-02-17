import PizZip from 'pizzip';
import { DocumentsService } from '../src/documents/documents.service';

function createDocxTemplateBuffer(tags: string[]) {
  const zip = new PizZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>',
  );
  zip.folder('_rels')?.file(
    '.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>',
  );
  const body = tags.map((tag) => `<w:p><w:r><w:t>${tag}</w:t></w:r></w:p>`).join('');
  zip.folder('word')?.file(
    'document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      `<w:body>${body}</w:body>` +
      '</w:document>',
  );
  return zip.generate({ type: 'nodebuffer' });
}

function buildMatterFixture() {
  return {
    id: 'matter-1',
    organizationId: 'org-1',
    matterNumber: 'M-001',
    name: 'Kitchen Remodel Dispute',
    practiceArea: 'Construction Litigation',
    jurisdiction: 'CA',
    venue: 'Los Angeles Superior Court',
    status: 'OPEN',
    openedAt: new Date('2026-01-10T00:00:00.000Z'),
    closedAt: null,
    stage: {
      id: 'stage-1',
      name: 'Pleadings',
      practiceArea: 'Construction Litigation',
    },
    matterType: {
      id: 'type-1',
      name: 'Residential Construction Defect',
    },
    participants: [
      {
        id: 'participant-client',
        contactId: 'contact-client',
        participantRoleKey: 'client',
        participantRoleDefinition: { label: 'Client' },
        side: 'CLIENT_SIDE',
        isPrimary: true,
        notes: null,
        representedByContactId: null,
        lawFirmContactId: null,
        contact: {
          id: 'contact-client',
          kind: 'PERSON',
          displayName: 'Chris Homeowner',
          primaryEmail: 'chris@example.com',
          primaryPhone: '555-0100',
          tags: ['client'],
          personProfile: {
            firstName: 'Chris',
            lastName: 'Homeowner',
            title: null,
            barNumber: null,
            licenseJurisdiction: null,
          },
          organizationProfile: null,
        },
        representedByContact: null,
        lawFirmContact: null,
      },
      {
        id: 'participant-opposing-counsel',
        contactId: 'contact-opposing-counsel',
        participantRoleKey: 'opposing_counsel',
        participantRoleDefinition: { label: 'Opposing Counsel' },
        side: 'OPPOSING_SIDE',
        isPrimary: true,
        notes: null,
        representedByContactId: null,
        lawFirmContactId: 'contact-opposing-firm',
        contact: {
          id: 'contact-opposing-counsel',
          kind: 'PERSON',
          displayName: 'Avery Defense',
          primaryEmail: 'avery@defensefirm.test',
          primaryPhone: '555-0200',
          tags: ['opposing-counsel'],
          personProfile: {
            firstName: 'Avery',
            lastName: 'Defense',
            title: 'Attorney',
            barNumber: 'BAR123',
            licenseJurisdiction: 'CA',
          },
          organizationProfile: null,
        },
        representedByContact: null,
        lawFirmContact: {
          id: 'contact-opposing-firm',
          kind: 'ORGANIZATION',
          displayName: 'Defense Firm LLP',
          primaryEmail: 'intake@defensefirm.test',
          primaryPhone: '555-0300',
          tags: ['opposing-firm'],
          personProfile: null,
          organizationProfile: {
            legalName: 'Defense Firm LLP',
            dba: null,
            website: 'https://defensefirm.test',
          },
        },
      },
    ],
  };
}

describe('DocumentsService mergeDocxTemplate', () => {
  it('builds matter/contact/custom-field context, supports override merge data, and logs provenance', async () => {
    const templateBuffer = createDocxTemplateBuffer([
      '{matter.name}',
      '{matter.matterNumber}',
      '{contacts.primaryClient.displayName}',
      '{customFields.matter.claimNumber}',
    ]);

    const prisma = {
      documentVersion: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'template-version-1',
          storageKey: 'templates/1.docx',
          document: {
            id: 'template-document-1',
            sharedWithClient: true,
            confidentialityLevel: 'ATTORNEY_EYES_ONLY',
          },
        }),
        create: jest.fn().mockResolvedValue({ id: 'generated-version-1' }),
      },
      matter: {
        findFirst: jest.fn().mockResolvedValue(buildMatterFixture()),
      },
      customFieldValue: {
        findMany: jest.fn().mockResolvedValue([
          {
            entityType: 'matter',
            entityId: 'matter-1',
            valueJson: 'CLM-991',
            fieldDefinition: { key: 'claimNumber' },
          },
          {
            entityType: 'contact',
            entityId: 'contact-client',
            valueJson: 'Chris',
            fieldDefinition: { key: 'preferredName' },
          },
        ]),
      },
      document: {
        create: jest.fn().mockResolvedValue({ id: 'generated-document-1' }),
      },
    } as any;

    const appendEvent = jest.fn();
    const service = new DocumentsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      {
        getObjectBuffer: jest.fn().mockResolvedValue(templateBuffer),
        upload: jest.fn().mockResolvedValue({ key: 'org/org-1/matter/matter-1/generated.docx' }),
      } as any,
      { scan: jest.fn().mockResolvedValue({ clean: true }) } as any,
      { appendEvent } as any,
    );

    const result = await service.mergeDocxTemplate({
      user: { id: 'user-1', organizationId: 'org-1' } as any,
      templateVersionId: 'template-version-1',
      matterId: 'matter-1',
      title: 'Demand Letter Draft',
      mergeData: {
        matter: {
          name: 'Override Matter Name',
        },
      },
    });

    expect(prisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          confidentialityLevel: 'ATTORNEY_EYES_ONLY',
          sharedWithClient: true,
          rawSourcePayload: expect.objectContaining({
            source: 'template-merge',
            template: expect.objectContaining({
              versionId: 'template-version-1',
            }),
          }),
        }),
      }),
    );
    expect(prisma.documentVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
      }),
    );

    expect(result.mergeSummary).toEqual(
      expect.objectContaining({
        strictValidation: true,
        unresolvedMergeFields: [],
        mergeContextSummary: expect.objectContaining({
          participantCount: 2,
          matterCustomFieldCount: 1,
          contactCustomFieldContactCount: 1,
        }),
      }),
    );

    expect(appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'document.template.generated',
        entityType: 'document',
        entityId: 'generated-document-1',
      }),
    );
  });

  it('fails strict template validation when merge placeholders are missing', async () => {
    const templateBuffer = createDocxTemplateBuffer(['{matter.name}', '{customFields.matter.missingField}']);
    const prisma = {
      documentVersion: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'template-version-1',
          storageKey: 'templates/1.docx',
          document: {
            id: 'template-document-1',
            sharedWithClient: false,
            confidentialityLevel: 'CONFIDENTIAL',
          },
        }),
      },
      matter: {
        findFirst: jest.fn().mockResolvedValue(buildMatterFixture()),
      },
      customFieldValue: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      document: {
        create: jest.fn(),
      },
    } as any;

    const service = new DocumentsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      {
        getObjectBuffer: jest.fn().mockResolvedValue(templateBuffer),
        upload: jest.fn(),
      } as any,
      { scan: jest.fn().mockResolvedValue({ clean: true }) } as any,
      { appendEvent: jest.fn() } as any,
    );

    await expect(
      service.mergeDocxTemplate({
        user: { id: 'user-1', organizationId: 'org-1' } as any,
        templateVersionId: 'template-version-1',
        matterId: 'matter-1',
        title: 'Demand Letter Draft',
      }),
    ).rejects.toThrow('Template merge validation failed');

    expect(prisma.document.create).not.toHaveBeenCalled();
  });

  it('allows unresolved placeholders when strictValidation is false and records them', async () => {
    const templateBuffer = createDocxTemplateBuffer(['{matter.name}', '{customFields.matter.optionalField}']);
    const prisma = {
      documentVersion: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'template-version-1',
          storageKey: 'templates/1.docx',
          document: {
            id: 'template-document-1',
            sharedWithClient: false,
            confidentialityLevel: 'CONFIDENTIAL',
          },
        }),
        create: jest.fn().mockResolvedValue({ id: 'generated-version-1' }),
      },
      matter: {
        findFirst: jest.fn().mockResolvedValue(buildMatterFixture()),
      },
      customFieldValue: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      document: {
        create: jest.fn().mockResolvedValue({ id: 'generated-document-1' }),
      },
    } as any;

    const service = new DocumentsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      {
        getObjectBuffer: jest.fn().mockResolvedValue(templateBuffer),
        upload: jest.fn().mockResolvedValue({ key: 'org/org-1/matter/matter-1/generated.docx' }),
      } as any,
      { scan: jest.fn().mockResolvedValue({ clean: true }) } as any,
      { appendEvent: jest.fn() } as any,
    );

    const result = await service.mergeDocxTemplate({
      user: { id: 'user-1', organizationId: 'org-1' } as any,
      templateVersionId: 'template-version-1',
      matterId: 'matter-1',
      title: 'Demand Letter Draft',
      strictValidation: false,
    });

    expect(result.mergeSummary.unresolvedMergeFields).toContain('customFields.matter.optionalField');
    expect(prisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rawSourcePayload: expect.objectContaining({
            provenance: expect.objectContaining({
              unresolvedMergeFields: expect.arrayContaining(['customFields.matter.optionalField']),
            }),
          }),
        }),
      }),
    );
  });
});
