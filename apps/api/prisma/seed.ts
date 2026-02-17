import { PrismaClient, CommunicationDirection, CommunicationMessageType, InvoiceStatus, MatterParticipantSide, MatterStatus, TaskPriority, TaskStatus, TrustTransactionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.webhookDelivery.deleteMany(),
    prisma.webhookEndpoint.deleteMany(),
    prisma.integrationWebhookSubscription.deleteMany(),
    prisma.integrationSyncRun.deleteMany(),
    prisma.integrationConnection.deleteMany(),
    prisma.exportJob.deleteMany(),
    prisma.externalReference.deleteMany(),
    prisma.importItem.deleteMany(),
    prisma.importBatch.deleteMany(),
    prisma.mappingProfile.deleteMany(),
    prisma.aiExecutionLog.deleteMany(),
    prisma.aiArtifact.deleteMany(),
    prisma.aiJob.deleteMany(),
    prisma.aiSourceChunk.deleteMany(),
    prisma.stylePackSourceDoc.deleteMany(),
    prisma.stylePack.deleteMany(),
    prisma.eSignEnvelope.deleteMany(),
    prisma.documentDispositionItem.deleteMany(),
    prisma.documentDispositionRun.deleteMany(),
    prisma.documentLegalHold.deleteMany(),
    prisma.documentRetentionPolicy.deleteMany(),
    prisma.engagementLetterTemplate.deleteMany(),
    prisma.conflictCheckResult.deleteMany(),
    prisma.intakeSubmission.deleteMany(),
    prisma.intakeFormDefinition.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.trustReconciliationDiscrepancy.deleteMany(),
    prisma.trustReconciliationRun.deleteMany(),
    prisma.matterTrustLedger.deleteMany(),
    prisma.trustTransaction.deleteMany(),
    prisma.trustAccount.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoiceLineItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.timeEntry.deleteMany(),
    prisma.evidenceItem.deleteMany(),
    prisma.documentShareLink.deleteMany(),
    prisma.communicationAttachment.deleteMany(),
    prisma.communicationParticipant.deleteMany(),
    prisma.communicationMessage.deleteMany(),
    prisma.communicationThread.deleteMany(),
    prisma.documentVersion.deleteMany(),
    prisma.document.deleteMany(),
    prisma.documentFolder.deleteMany(),
    prisma.docketEntry.deleteMany(),
    prisma.serviceEvent.deleteMany(),
    prisma.deadlineRuleTemplate.deleteMany(),
    prisma.calendarEvent.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.reminder.deleteMany(),
    prisma.task.deleteMany(),
    prisma.stageAutomation.deleteMany(),
    prisma.matterTemplate.deleteMany(),
    prisma.taskTemplate.deleteMany(),
    prisma.sectionInstance.deleteMany(),
    prisma.sectionDefinition.deleteMany(),
    prisma.customFieldValue.deleteMany(),
    prisma.customFieldDefinition.deleteMany(),
    prisma.matterRelationship.deleteMany(),
    prisma.matterParticipant.deleteMany(),
    prisma.participantRoleDefinition.deleteMany(),
    prisma.matterAccessDeny.deleteMany(),
    prisma.matterTeamMember.deleteMany(),
    prisma.matterTeam.deleteMany(),
    prisma.expertEngagement.deleteMany(),
    prisma.insuranceClaim.deleteMany(),
    prisma.lienModel.deleteMany(),
    prisma.damagesItem.deleteMany(),
    prisma.defectIssue.deleteMany(),
    prisma.projectMilestone.deleteMany(),
    prisma.contractProfile.deleteMany(),
    prisma.propertyProfile.deleteMany(),
    prisma.matter.deleteMany(),
    prisma.matterStage.deleteMany(),
    prisma.matterType.deleteMany(),
    prisma.contactRelationship.deleteMany(),
    prisma.contactMethod.deleteMany(),
    prisma.organizationProfile.deleteMany(),
    prisma.personProfile.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.session.deleteMany(),
    prisma.auditLogEvent.deleteMany(),
    prisma.accessPolicy.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.role.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organization.deleteMany(),
  ]);

  const org = await prisma.organization.create({
    data: {
      name: 'Stonebridge Construction Law',
      slug: 'stonebridge-construction-law',
      settingsJson: {
        letterhead: 'Stonebridge Construction Law, APC',
        defaults: { timezone: 'America/Los_Angeles' },
      },
    },
  });

  const permissionKeys = [
    'organization:read',
    'organization:write',
    'users:read',
    'roles:read',
    'roles:write',
    'matter_stage:read',
    'matter_stage:write',
    'config:read',
    'config:write',
    'contacts:read',
    'contacts:write',
    'matters:read',
    'matters:write',
    'tasks:read',
    'tasks:write',
    'calendar:read',
    'calendar:write',
    'documents:read',
    'documents:write',
    'communications:read',
    'communications:write',
    'billing:read',
    'billing:write',
    'imports:read',
    'imports:write',
    'exports:read',
    'exports:write',
    'ai:read',
    'ai:write',
    'reporting:read',
    'audit:read',
    'integrations:read',
    'integrations:write',
    'webhooks:read',
    'webhooks:write',
  ];

  const permissions = await Promise.all(
    permissionKeys.map((key) =>
      prisma.permission.create({
        data: {
          organizationId: org.id,
          key,
          label: key,
        },
      }),
    ),
  );

  const adminRole = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'Admin',
      permissions: {
        connect: permissions.map((permission) => ({ id: permission.id })),
      },
    },
  });

  const attorneyRole = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'Attorney',
      permissions: {
        connect: permissions
          .filter((permission) => !permission.key.startsWith('organization:write'))
          .map((permission) => ({ id: permission.id })),
      },
    },
  });

  const paralegalRole = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'Paralegal',
      permissions: {
        connect: permissions
          .filter((permission) =>
            ['contacts:read', 'contacts:write', 'matters:read', 'matters:write', 'tasks:read', 'tasks:write', 'calendar:read', 'calendar:write', 'documents:read', 'documents:write', 'communications:read', 'communications:write', 'ai:read', 'ai:write', 'reporting:read'].includes(permission.key),
          )
          .map((permission) => ({ id: permission.id })),
      },
    },
  });

  const intakeRole = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'Intake Specialist',
      permissions: {
        connect: permissions
          .filter((permission) => ['contacts:read', 'contacts:write', 'matters:read', 'matters:write', 'communications:read', 'communications:write'].includes(permission.key))
          .map((permission) => ({ id: permission.id })),
      },
    },
  });

  const billingRole = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'Billing/Accounting',
      permissions: {
        connect: permissions
          .filter((permission) => ['billing:read', 'billing:write', 'reporting:read', 'documents:read'].includes(permission.key))
          .map((permission) => ({ id: permission.id })),
      },
    },
  });

  const clientRole = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'Client',
      permissions: {
        connect: permissions
          .filter((permission) => ['documents:read', 'communications:read', 'communications:write', 'billing:read'].includes(permission.key))
          .map((permission) => ({ id: permission.id })),
      },
    },
  });

  const vendorRole = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'Vendor/Expert',
      permissions: {
        connect: permissions
          .filter((permission) => ['documents:read', 'communications:read'].includes(permission.key))
          .map((permission) => ({ id: permission.id })),
      },
    },
  });

  const hashed = await bcrypt.hash('ChangeMe123!', 12);

  const [adminUser, attorneyUser, paralegalUser, intakeUser, billingUser, clientUser1, clientUser2, vendorUser] =
    await Promise.all([
      prisma.user.create({ data: { email: 'admin@karen-demo.local', passwordHash: hashed, fullName: 'Avery Admin' } }),
      prisma.user.create({ data: { email: 'attorney@karen-demo.local', passwordHash: hashed, fullName: 'Jordan Attorney' } }),
      prisma.user.create({ data: { email: 'paralegal@karen-demo.local', passwordHash: hashed, fullName: 'Casey Paralegal' } }),
      prisma.user.create({ data: { email: 'intake@karen-demo.local', passwordHash: hashed, fullName: 'Riley Intake' } }),
      prisma.user.create({ data: { email: 'billing@karen-demo.local', passwordHash: hashed, fullName: 'Morgan Billing' } }),
      prisma.user.create({ data: { email: 'elena.client@karen-demo.local', passwordHash: hashed, fullName: 'Elena Ortega' } }),
      prisma.user.create({ data: { email: 'sam.client@karen-demo.local', passwordHash: hashed, fullName: 'Sam Patel' } }),
      prisma.user.create({ data: { email: 'expert.vendor@karen-demo.local', passwordHash: hashed, fullName: 'Dr. Maya Expert' } }),
    ]);

  const clientContact1 = await prisma.contact.create({
    data: {
      organizationId: org.id,
      kind: 'PERSON',
      displayName: 'Elena Ortega',
      primaryEmail: 'elena.client@karen-demo.local',
      primaryPhone: '555-100-1101',
      tags: ['client'],
      personProfile: { create: { firstName: 'Elena', lastName: 'Ortega' } },
    },
  });

  const clientContact2 = await prisma.contact.create({
    data: {
      organizationId: org.id,
      kind: 'PERSON',
      displayName: 'Sam Patel',
      primaryEmail: 'sam.client@karen-demo.local',
      primaryPhone: '555-100-1102',
      tags: ['client'],
      personProfile: { create: { firstName: 'Sam', lastName: 'Patel' } },
    },
  });

  const opposingCounsel = await prisma.contact.create({
    data: {
      organizationId: org.id,
      kind: 'PERSON',
      displayName: 'Dana Cross, Esq.',
      primaryEmail: 'dcross@defensefirm.example',
      tags: ['opposing-counsel'],
      personProfile: {
        create: {
          firstName: 'Dana',
          lastName: 'Cross',
          barNumber: 'CA-998811',
          licenseJurisdiction: 'CA',
          title: 'Partner',
        },
      },
    },
  });

  const expertContact = await prisma.contact.create({
    data: {
      organizationId: org.id,
      kind: 'PERSON',
      displayName: 'Dr. Maya Expert',
      primaryEmail: 'expert.vendor@karen-demo.local',
      tags: ['expert'],
      personProfile: {
        create: {
          firstName: 'Maya',
          lastName: 'Expert',
          title: 'Construction Defect Analyst',
        },
      },
    },
  });

  const inspectorContact = await prisma.contact.create({
    data: {
      organizationId: org.id,
      kind: 'PERSON',
      displayName: 'Victor Inspector',
      tags: ['inspector'],
      personProfile: { create: { firstName: 'Victor', lastName: 'Inspector' } },
    },
  });

  const adjusterContact = await prisma.contact.create({
    data: {
      organizationId: org.id,
      kind: 'PERSON',
      displayName: 'Alicia Adjuster',
      tags: ['adjuster'],
      personProfile: { create: { firstName: 'Alicia', lastName: 'Adjuster' } },
    },
  });

  const judgeContact = await prisma.contact.create({
    data: {
      organizationId: org.id,
      kind: 'PERSON',
      displayName: 'Hon. Patricia Kim',
      tags: ['judge'],
      personProfile: { create: { firstName: 'Patricia', lastName: 'Kim', title: 'Judge' } },
    },
  });

  await Promise.all([
    prisma.membership.create({ data: { organizationId: org.id, userId: adminUser.id, roleId: adminRole.id, status: 'ACTIVE' } }),
    prisma.membership.create({ data: { organizationId: org.id, userId: attorneyUser.id, roleId: attorneyRole.id, status: 'ACTIVE' } }),
    prisma.membership.create({ data: { organizationId: org.id, userId: paralegalUser.id, roleId: paralegalRole.id, status: 'ACTIVE' } }),
    prisma.membership.create({ data: { organizationId: org.id, userId: intakeUser.id, roleId: intakeRole.id, status: 'ACTIVE' } }),
    prisma.membership.create({ data: { organizationId: org.id, userId: billingUser.id, roleId: billingRole.id, status: 'ACTIVE' } }),
    prisma.membership.create({ data: { organizationId: org.id, userId: clientUser1.id, roleId: clientRole.id, contactId: clientContact1.id, status: 'ACTIVE' } }),
    prisma.membership.create({ data: { organizationId: org.id, userId: clientUser2.id, roleId: clientRole.id, contactId: clientContact2.id, status: 'ACTIVE' } }),
    prisma.membership.create({ data: { organizationId: org.id, userId: vendorUser.id, roleId: vendorRole.id, contactId: expertContact.id, status: 'ACTIVE' } }),
  ]);

  const [stageIntake, stagePleadings, stageDiscovery] = await Promise.all([
    prisma.matterStage.create({ data: { organizationId: org.id, practiceArea: 'Construction Litigation', name: 'Intake', orderIndex: 1 } }),
    prisma.matterStage.create({ data: { organizationId: org.id, practiceArea: 'Construction Litigation', name: 'Pleadings', orderIndex: 2 } }),
    prisma.matterStage.create({ data: { organizationId: org.id, practiceArea: 'Construction Litigation', name: 'Discovery', orderIndex: 3 } }),
  ]);

  const constructionType = await prisma.matterType.create({
    data: { organizationId: org.id, name: 'Residential Construction Defect', description: 'Home improvement dispute matters' },
  });

  const matter1 = await prisma.matter.create({
    data: {
      organizationId: org.id,
      matterNumber: 'SCL-2026-001',
      name: 'Ortega v. BrightBuild Renovations',
      practiceArea: 'Construction Litigation',
      jurisdiction: 'CA',
      venue: 'Los Angeles County Superior Court',
      stageId: stageDiscovery.id,
      matterTypeId: constructionType.id,
      status: MatterStatus.OPEN,
      ethicalWallEnabled: true,
    },
  });

  const matter2 = await prisma.matter.create({
    data: {
      organizationId: org.id,
      matterNumber: 'SCL-2026-002',
      name: 'Patel Home Foundation Settlement',
      practiceArea: 'Construction Litigation',
      jurisdiction: 'CA',
      venue: 'Orange County Superior Court',
      stageId: stagePleadings.id,
      matterTypeId: constructionType.id,
      status: MatterStatus.OPEN,
    },
  });

  const matter3 = await prisma.matter.create({
    data: {
      organizationId: org.id,
      matterNumber: 'SCL-2026-003',
      name: 'Sunset Deck Lien Action',
      practiceArea: 'Construction Litigation',
      stageId: stageIntake.id,
      matterTypeId: constructionType.id,
      status: MatterStatus.OPEN,
    },
  });

  await prisma.participantRoleDefinition.createMany({
    data: [
      { organizationId: org.id, key: 'client', label: 'Client', sideDefault: MatterParticipantSide.CLIENT_SIDE },
      { organizationId: org.id, key: 'opposing_counsel', label: 'Opposing Counsel', sideDefault: MatterParticipantSide.OPPOSING_SIDE },
      { organizationId: org.id, key: 'opposing_party', label: 'Opposing Party', sideDefault: MatterParticipantSide.OPPOSING_SIDE },
      { organizationId: org.id, key: 'co_counsel', label: 'Co-Counsel', sideDefault: MatterParticipantSide.CLIENT_SIDE },
      { organizationId: org.id, key: 'local_counsel', label: 'Local Counsel', sideDefault: MatterParticipantSide.CLIENT_SIDE },
      { organizationId: org.id, key: 'expert', label: 'Expert', sideDefault: MatterParticipantSide.NEUTRAL },
      { organizationId: org.id, key: 'inspector', label: 'Inspector', sideDefault: MatterParticipantSide.NEUTRAL },
      { organizationId: org.id, key: 'mediator', label: 'Mediator', sideDefault: MatterParticipantSide.NEUTRAL },
      { organizationId: org.id, key: 'arbitrator', label: 'Arbitrator', sideDefault: MatterParticipantSide.NEUTRAL },
      { organizationId: org.id, key: 'witness', label: 'Witness', sideDefault: MatterParticipantSide.NEUTRAL },
      { organizationId: org.id, key: 'process_server', label: 'Process Server', sideDefault: MatterParticipantSide.NEUTRAL },
      { organizationId: org.id, key: 'adjuster', label: 'Adjuster', sideDefault: MatterParticipantSide.OPPOSING_SIDE },
      { organizationId: org.id, key: 'insurer', label: 'Insurer', sideDefault: MatterParticipantSide.OPPOSING_SIDE },
      { organizationId: org.id, key: 'lien_claimant', label: 'Lien Claimant', sideDefault: MatterParticipantSide.OPPOSING_SIDE },
      { organizationId: org.id, key: 'subcontractor', label: 'Subcontractor', sideDefault: MatterParticipantSide.OPPOSING_SIDE },
      { organizationId: org.id, key: 'supplier', label: 'Supplier', sideDefault: MatterParticipantSide.OPPOSING_SIDE },
      { organizationId: org.id, key: 'judge', label: 'Judge', sideDefault: MatterParticipantSide.COURT },
      { organizationId: org.id, key: 'court_staff', label: 'Court Staff', sideDefault: MatterParticipantSide.COURT },
    ],
  });

  await prisma.matterParticipant.createMany({
    data: [
      { organizationId: org.id, matterId: matter1.id, contactId: clientContact1.id, participantRoleKey: 'client', side: MatterParticipantSide.CLIENT_SIDE, isPrimary: true },
      { organizationId: org.id, matterId: matter1.id, contactId: opposingCounsel.id, participantRoleKey: 'opposing_counsel', side: MatterParticipantSide.OPPOSING_SIDE },
      { organizationId: org.id, matterId: matter1.id, contactId: expertContact.id, participantRoleKey: 'expert', side: MatterParticipantSide.NEUTRAL },
      { organizationId: org.id, matterId: matter1.id, contactId: inspectorContact.id, participantRoleKey: 'inspector', side: MatterParticipantSide.NEUTRAL },
      { organizationId: org.id, matterId: matter1.id, contactId: adjusterContact.id, participantRoleKey: 'adjuster', side: MatterParticipantSide.OPPOSING_SIDE },
      { organizationId: org.id, matterId: matter1.id, contactId: judgeContact.id, participantRoleKey: 'judge', side: MatterParticipantSide.COURT },
      { organizationId: org.id, matterId: matter2.id, contactId: clientContact2.id, participantRoleKey: 'client', side: MatterParticipantSide.CLIENT_SIDE, isPrimary: true },
    ],
  });

  await prisma.matterTeamMember.createMany({
    data: [
      { matterId: matter1.id, userId: attorneyUser.id, canWrite: true },
      { matterId: matter1.id, userId: paralegalUser.id, canWrite: true },
      { matterId: matter2.id, userId: attorneyUser.id, canWrite: true },
      { matterId: matter3.id, userId: intakeUser.id, canWrite: true },
    ],
  });

  await prisma.matterAccessDeny.create({ data: { matterId: matter1.id, userId: billingUser.id, reason: 'Ethical wall billing deny-list demo' } });

  await prisma.propertyProfile.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      addressLine1: '1234 Orchard Lane',
      city: 'Pasadena',
      state: 'CA',
      postalCode: '91101',
      parcelNumber: 'APN-456-782-10',
      permitsJson: { permitNo: 'BLD-2024-00981' },
      inspectionsJson: [{ date: '2025-12-15', inspector: 'Victor Inspector' }],
    },
  });

  await prisma.contractProfile.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      contractDate: new Date('2025-05-15'),
      contractPrice: 128500,
      paymentScheduleJson: [{ milestone: 'Demolition', amount: 20000 }, { milestone: 'Cabinets', amount: 35000 }],
      changeOrdersJson: [{ no: 3, amount: 8700 }],
      warrantiesJson: { workmanshipMonths: 24 },
    },
  });

  await prisma.projectMilestone.createMany({
    data: [
      { organizationId: org.id, matterId: matter1.id, name: 'Demolition complete', plannedDate: new Date('2025-06-01'), actualDate: new Date('2025-06-03'), status: 'DONE' },
      { organizationId: org.id, matterId: matter1.id, name: 'Final inspection', plannedDate: new Date('2025-09-15'), status: 'DELAYED' },
    ],
  });

  await prisma.defectIssue.createMany({
    data: [
      {
        organizationId: org.id,
        matterId: matter1.id,
        category: 'Water Intrusion',
        locationInHome: 'Kitchen backsplash wall',
        severity: 'High',
        description: 'Moisture behind tile due to improper membrane installation',
      },
      {
        organizationId: org.id,
        matterId: matter1.id,
        category: 'Subfloor',
        locationInHome: 'Kitchen island zone',
        severity: 'Medium',
        description: 'Uneven leveling causing tile cracking',
      },
    ],
  });

  await prisma.damagesItem.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      category: 'Repair Estimate',
      repairEstimate: 45200,
      paidAmount: 128500,
      completionCost: 53800,
      consequentialAmount: 7200,
      notes: 'Temporary relocation cost included',
    },
  });

  const trustAccount = await prisma.trustAccount.create({
    data: {
      organizationId: org.id,
      name: 'Client Trust Account',
      bankName: 'Pacific National Bank',
      accountNumberMasked: '****1188',
    },
  });

  const invoice1 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      invoiceNumber: 'INV-2026-0001',
      status: InvoiceStatus.SENT,
      issuedAt: new Date('2026-01-10'),
      dueAt: new Date('2026-01-31'),
      subtotal: 2200,
      tax: 0,
      total: 2200,
      balanceDue: 1200,
      jurisdictionDisclaimer: 'Jurisdictional compliance required for trust and billing rules.',
      lineItems: {
        create: [
          { description: 'Initial complaint draft', quantity: 4, unitPrice: 425, amount: 1700 },
          { description: 'Court filing and courier', quantity: 1, unitPrice: 500, amount: 500 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      organizationId: org.id,
      invoiceId: invoice1.id,
      amount: 1000,
      method: 'MANUAL',
      reference: 'CHK-1002',
    },
  });

  await prisma.timeEntry.createMany({
    data: [
      {
        organizationId: org.id,
        matterId: matter1.id,
        userId: attorneyUser.id,
        description: 'Drafted demand package',
        startedAt: new Date('2026-01-08T09:00:00Z'),
        endedAt: new Date('2026-01-08T11:00:00Z'),
        durationMinutes: 120,
        billableRate: 425,
        amount: 850,
      },
      {
        organizationId: org.id,
        matterId: matter2.id,
        userId: paralegalUser.id,
        description: 'Organized exhibits and timeline',
        startedAt: new Date('2026-01-09T15:00:00Z'),
        endedAt: new Date('2026-01-09T16:30:00Z'),
        durationMinutes: 90,
        billableRate: 210,
        amount: 315,
      },
    ],
  });

  await prisma.trustTransaction.createMany({
    data: [
      {
        organizationId: org.id,
        trustAccountId: trustAccount.id,
        matterId: matter1.id,
        type: TrustTransactionType.DEPOSIT,
        amount: 5000,
        description: 'Initial retainer',
      },
      {
        organizationId: org.id,
        trustAccountId: trustAccount.id,
        matterId: matter1.id,
        type: TrustTransactionType.WITHDRAWAL,
        amount: 1200,
        description: 'Applied to invoice INV-2026-0001',
      },
    ],
  });

  await prisma.matterTrustLedger.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      trustAccountId: trustAccount.id,
      balance: 3800,
    },
  });

  const seededReconciliationRun = await prisma.trustReconciliationRun.create({
    data: {
      organizationId: org.id,
      trustAccountId: trustAccount.id,
      statementStartAt: new Date('2026-01-01T00:00:00.000Z'),
      statementEndAt: new Date('2026-01-31T23:59:59.999Z'),
      status: 'IN_REVIEW',
      createdByUserId: billingUser.id,
      summaryJson: {
        checkedLedgers: 1,
        checkedTransactions: 2,
        discrepancyCount: 1,
      },
      notes: 'Seeded monthly reconciliation run',
    },
  });

  await prisma.trustReconciliationDiscrepancy.create({
    data: {
      organizationId: org.id,
      runId: seededReconciliationRun.id,
      trustAccountId: trustAccount.id,
      matterId: matter1.id,
      reasonCode: 'BALANCE_MISMATCH',
      expectedBalance: 3850,
      ledgerBalance: 3800,
      difference: -50,
      status: 'OPEN',
    },
  });

  const contractDoc = await prisma.document.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      title: 'Residential Contract',
      category: 'Contract',
      tags: ['contract'],
      createdByUserId: attorneyUser.id,
      sharedWithClient: true,
    },
  });

  const changeOrderDoc = await prisma.document.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      title: 'Change Order #3',
      category: 'Contract',
      tags: ['change-order'],
      createdByUserId: paralegalUser.id,
    },
  });

  const inspectionDoc = await prisma.document.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      title: 'Inspection Report',
      category: 'Evidence',
      tags: ['inspection'],
      createdByUserId: paralegalUser.id,
    },
  });

  const schedulingOrderDoc = await prisma.document.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      title: 'Scheduling Order',
      category: 'Court',
      tags: ['scheduling-order'],
      createdByUserId: attorneyUser.id,
      sharedWithClient: true,
    },
  });

  const [contractVersion, inspectionVersion] = await Promise.all([
    prisma.documentVersion.create({
      data: {
        organizationId: org.id,
        documentId: contractDoc.id,
        storageKey: `seed/${contractDoc.id}/contract.txt`,
        sha256: 'seed-contract-hash',
        mimeType: 'text/plain',
        size: 200,
        uploadedByUserId: attorneyUser.id,
      },
    }),
    prisma.documentVersion.create({
      data: {
        organizationId: org.id,
        documentId: inspectionDoc.id,
        storageKey: `seed/${inspectionDoc.id}/inspection-report.txt`,
        sha256: 'seed-inspection-hash',
        mimeType: 'text/plain',
        size: 160,
        uploadedByUserId: paralegalUser.id,
      },
    }),
  ]);

  await prisma.documentVersion.createMany({
    data: [
      {
        organizationId: org.id,
        documentId: changeOrderDoc.id,
        storageKey: `seed/${changeOrderDoc.id}/change-order.txt`,
        sha256: 'seed-change-order-hash',
        mimeType: 'text/plain',
        size: 120,
        uploadedByUserId: paralegalUser.id,
      },
      {
        organizationId: org.id,
        documentId: schedulingOrderDoc.id,
        storageKey: `seed/${schedulingOrderDoc.id}/scheduling-order.txt`,
        sha256: 'seed-scheduling-order-hash',
        mimeType: 'text/plain',
        size: 140,
        uploadedByUserId: attorneyUser.id,
      },
      {
        organizationId: org.id,
        documentId: inspectionDoc.id,
        storageKey: `seed/${inspectionDoc.id}/photo-1.txt`,
        sha256: 'seed-photo-1-hash',
        mimeType: 'text/plain',
        size: 50,
        uploadedByUserId: paralegalUser.id,
      },
      {
        organizationId: org.id,
        documentId: inspectionDoc.id,
        storageKey: `seed/${inspectionDoc.id}/photo-2.txt`,
        sha256: 'seed-photo-2-hash',
        mimeType: 'text/plain',
        size: 50,
        uploadedByUserId: paralegalUser.id,
      },
    ],
  });

  const retentionPolicy = await prisma.documentRetentionPolicy.create({
    data: {
      organizationId: org.id,
      name: 'Construction Litigation Standard - 7 Year',
      description: 'Retain client matter documents for 7 years from upload unless legal hold is active.',
      scope: 'ALL_DOCUMENTS',
      retentionDays: 365 * 7,
      trigger: 'DOCUMENT_UPLOADED',
      requireApproval: true,
      createdByUserId: adminUser.id,
    },
  });

  await prisma.document.updateMany({
    where: {
      id: {
        in: [contractDoc.id, changeOrderDoc.id, inspectionDoc.id, schedulingOrderDoc.id],
      },
    },
    data: {
      retentionPolicyId: retentionPolicy.id,
      retentionEligibleAt: new Date('2033-01-01T00:00:00Z'),
    },
  });

  await prisma.documentLegalHold.create({
    data: {
      organizationId: org.id,
      documentId: inspectionDoc.id,
      matterId: matter1.id,
      reason: 'Preserve inspection media for pending mediation and potential trial exhibits.',
      placedByUserId: attorneyUser.id,
      status: 'ACTIVE',
    },
  });

  await prisma.document.update({
    where: { id: inspectionDoc.id },
    data: {
      legalHoldActive: true,
    },
  });

  await prisma.calendarEvent.createMany({
    data: [
      {
        organizationId: org.id,
        matterId: matter1.id,
        type: 'Case Management Conference',
        startAt: new Date('2026-03-04T17:30:00Z'),
        location: 'Dept 53 - LA Superior Court',
      },
      {
        organizationId: org.id,
        matterId: matter1.id,
        type: 'Mediation Deadline',
        startAt: new Date('2026-09-15T17:00:00Z'),
      },
    ],
  });

  await prisma.docketEntry.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      filedAt: new Date('2026-01-12'),
      description: 'Complaint filed for breach of contract and negligence',
      sourceDocumentId: schedulingOrderDoc.id,
    },
  });

  const thread = await prisma.communicationThread.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      subject: 'Initial client updates',
    },
  });

  await prisma.communicationMessage.createMany({
    data: [
      {
        organizationId: org.id,
        threadId: thread.id,
        type: CommunicationMessageType.PORTAL_MESSAGE,
        direction: CommunicationDirection.OUTBOUND,
        subject: 'Welcome to your portal',
        body: 'We have opened your case and uploaded your contract documents.',
        createdByUserId: attorneyUser.id,
      },
      {
        organizationId: org.id,
        threadId: thread.id,
        type: CommunicationMessageType.CALL_LOG,
        direction: CommunicationDirection.OUTBOUND,
        body: 'Call with opposing counsel re scheduling and document exchange.',
        createdByUserId: attorneyUser.id,
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        organizationId: org.id,
        matterId: matter1.id,
        title: 'Finalize discovery requests',
        description: 'ROGs/RFPs/RFAs for defect scope and subcontractors',
        assigneeUserId: attorneyUser.id,
        dueAt: new Date('2026-02-20'),
        priority: TaskPriority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        createdByUserId: attorneyUser.id,
      },
      {
        organizationId: org.id,
        matterId: matter1.id,
        title: 'Collect repair estimates',
        assigneeUserId: paralegalUser.id,
        dueAt: new Date('2026-02-18'),
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        createdByUserId: attorneyUser.id,
      },
    ],
  });

  await prisma.customFieldDefinition.createMany({
    data: [
      {
        organizationId: org.id,
        entityType: 'matter',
        key: 'insurer_claim_number',
        label: 'Insurer Claim #',
        fieldType: 'text',
      },
      {
        organizationId: org.id,
        entityType: 'matter',
        key: 'permit_required',
        label: 'Permit Required',
        fieldType: 'boolean',
      },
    ],
  });

  const intakeSection = await prisma.sectionDefinition.create({
    data: {
      organizationId: org.id,
      name: 'Construction Intake',
      matterTypeId: constructionType.id,
      schemaJson: {
        type: 'object',
        properties: {
          property: { type: 'string' },
          defects: { type: 'array' },
          changeOrders: { type: 'array' },
        },
      },
    },
  });

  await prisma.sectionInstance.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      sectionDefinitionId: intakeSection.id,
      dataJson: {
        property: '1234 Orchard Lane',
        defects: ['Water intrusion', 'Subfloor leveling'],
      },
      updatedByUserId: attorneyUser.id,
    },
  });

  await prisma.insuranceClaim.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      policyNumber: 'HMP-9981-55',
      claimNumber: 'CLM-2026-1881',
      adjusterContactId: adjusterContact.id,
      coverageNotes: 'Carrier disputing scope of water intrusion damages',
      status: 'OPEN',
    },
  });

  await prisma.expertEngagement.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      expertContactId: expertContact.id,
      scope: 'Construction defect causation and standard of care',
      feeArrangement: '$450/hr plus site inspection expenses',
      reportDocumentId: inspectionDoc.id,
      status: 'ENGAGED',
    },
  });

  const aiJob = await prisma.aiJob.create({
    data: {
      organizationId: org.id,
      matterId: matter1.id,
      toolName: 'case_summary',
      status: 'COMPLETED',
      createdByUserId: attorneyUser.id,
      startedAt: new Date(),
      finishedAt: new Date(),
      model: 'gpt-4.1-mini',
    },
  });

  await prisma.aiArtifact.create({
    data: {
      organizationId: org.id,
      jobId: aiJob.id,
      type: 'case_summary',
      content: 'ATTORNEY REVIEW REQUIRED. Draft summary with citations [chunk:seed-1].',
      reviewedStatus: 'DRAFT',
      metadataJson: {
        attorneyReviewRequired: true,
        citations: [{ chunkId: 'seed-1' }],
      },
    },
  });

  await prisma.aiSourceChunk.createMany({
    data: [
      {
        organizationId: org.id,
        documentVersionId: contractVersion.id,
        chunkText: 'Owner contracted BrightBuild for kitchen remodel at $128,500 with staged payments.',
        metadataJson: { source: 'contract' },
      },
      {
        organizationId: org.id,
        documentVersionId: inspectionVersion.id,
        chunkText: 'Inspector identified moisture intrusion behind tile and uneven subfloor installation.',
        metadataJson: { source: 'inspection' },
      },
    ],
  });

  await prisma.mappingProfile.create({
    data: {
      organizationId: org.id,
      name: 'MyCase Default Mapping',
      sourceSystem: 'mycase_backup_zip',
      fieldMappingsJson: {
        contact: { display_name: 'name', primary_email: 'email' },
      },
      transformsJson: {
        trim: ['name', 'email'],
      },
      dedupeRulesJson: {
        keys: ['email', 'phone', 'name'],
      },
      conflictRulesJson: {
        strategy: 'prefer_latest',
      },
    },
  });

  console.log('Seed complete');
  console.log('Demo credentials:');
  console.log('admin@karen-demo.local / ChangeMe123!');
  console.log('attorney@karen-demo.local / ChangeMe123!');
  console.log('elena.client@karen-demo.local / ChangeMe123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
