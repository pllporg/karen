import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, expect } from 'playwright/test';

const webBaseUrl = process.env.KAR_130_WEB_BASE_URL || 'http://127.0.0.1:3000';
const apiPort = Number(process.env.KAR_130_API_PORT || '4000');
const screenshotDir = resolve(process.env.KAR_130_SCREENSHOT_DIR || 'artifacts/ui/kar-130/screenshots');
const consoleSummaryJson = resolve(screenshotDir, 'kar-130-console-summary.json');
const consoleSummaryMd = resolve(screenshotDir, 'kar-130-console-summary.md');
const sessionToken = 'session-token-demo';
const consoleEntries: Array<{ route: string; type: string; text: string }> = [];
const pageErrors: Array<{ route: string; message: string }> = [];

type PortalState = {
  messageSent: boolean;
  intakeSubmitted: boolean;
  envelopeStatus: string;
};

type ContactsState = {
  suggestionDecision: 'OPEN' | 'IGNORE';
};

const portalState: PortalState = {
  messageSent: false,
  intakeSubmitted: false,
  envelopeStatus: 'SENT',
};

const contactsState: ContactsState = {
  suggestionDecision: 'OPEN',
};

const auditorSignals = [
  {
    id: 'sig-1',
    severity: 'CRITICAL',
    signalType: 'DEADLINE RISK',
    matterLabel: 'Acme v. Dawson',
    status: 'IN REVIEW',
    updatedAt: '2026-03-08T12:00:00.000Z',
    summary: 'Critical deadline risk requires review.',
    detail: 'Pleading deadline is overdue by 2 days.',
  },
];

const portalMatters = [
  {
    id: 'matter-1',
    matterNumber: 'M-001',
    name: 'Portal Matter',
  },
];

const portalSnapshotBase = {
  matters: portalMatters,
  keyDates: [{ id: 'date-1' }],
  invoices: [{ id: 'invoice-1' }],
  documents: [
    {
      id: 'doc-1',
      matterId: 'matter-1',
      title: 'Uploaded Portal Photo',
      sharedAt: '2026-03-08T12:00:00.000Z',
      latestVersion: { id: 'ver-1' },
    },
  ],
};

const intakeFormOptions = [{ id: 'intake-1', name: 'Client Intake Form' }];
const engagementTemplateOptions = [{ id: 'tmpl-1', name: 'Standard Engagement Letter' }];

function currentPortalSnapshot() {
  return {
    ...portalSnapshotBase,
    messages:
      portalState.messageSent ?
        [
          {
            id: 'msg-1',
            subject: 'Portal message',
            body: 'Can you share the latest mediation timeline?',
            attachments: [{ documentVersionId: 'ver-1', title: 'Uploaded Portal Photo' }],
          },
        ]
      : [],
    eSignEnvelopes: [
      {
        id: 'env-1',
        status: portalState.envelopeStatus,
        provider: 'sandbox',
        engagementLetterTemplate: { id: 'tmpl-1', name: 'Standard Engagement Letter' },
      },
    ],
  };
}

function currentContacts() {
  return [
    {
      id: 'c1',
      kind: 'PERSON',
      displayName: 'Jane Doe',
      primaryEmail: 'jane@example.com',
      primaryPhone: '555-000-1111',
      tags: ['client', 'vip'],
    },
    {
      id: 'c2',
      kind: 'PERSON',
      displayName: 'J. Doe',
      primaryEmail: 'jane.alt@example.com',
      primaryPhone: '555-000-1111',
      tags: ['client'],
    },
  ];
}

function currentDedupeSuggestions() {
  return [
    {
      primaryId: 'c1',
      duplicateId: 'c2',
      pairKey: 'c1::c2',
      score: 0.9,
      confidence: 'HIGH',
      decision: contactsState.suggestionDecision,
      reasons: ['same phone', 'similar name'],
      primary: {
        id: 'c1',
        displayName: 'Jane Doe',
        kind: 'PERSON',
        primaryEmail: 'jane@example.com',
        primaryPhone: '555-000-1111',
        tags: [],
      },
      duplicate: {
        id: 'c2',
        displayName: 'J. Doe',
        kind: 'PERSON',
        primaryEmail: 'jane.alt@example.com',
        primaryPhone: '555-000-1111',
        tags: [],
      },
      fieldDiffs: [
        { field: 'displayName', primaryValue: 'Jane Doe', duplicateValue: 'J. Doe' },
        { field: 'primaryEmail', primaryValue: 'jane@example.com', duplicateValue: 'jane.alt@example.com' },
      ],
    },
  ];
}

function setCorsHeaders(request: IncomingMessage, response: ServerResponse) {
  const origin = request.headers.origin;
  if (origin === 'http://127.0.0.1:3000' || origin === 'http://localhost:3000') {
    response.setHeader('Access-Control-Allow-Origin', origin);
  }
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Headers', 'content-type,x-session-token');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
}

function sendJson(request: IncomingMessage, response: ServerResponse, payload: unknown, statusCode = 200) {
  setCorsHeaders(request, response);
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function collectBody(request: IncomingMessage) {
  return new Promise<string>((resolveBody) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    request.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
  });
}

let server: ReturnType<typeof createServer> | null = null;

test.beforeAll(async () => {
  mkdirSync(screenshotDir, { recursive: true });
  server = createServer(async (request, response) => {
    const method = request.method || 'GET';
    const url = new URL(request.url || '/', `http://127.0.0.1:${apiPort}`);

    if (method === 'OPTIONS') {
      setCorsHeaders(request, response);
      response.statusCode = 204;
      response.end();
      return;
    }

    if (url.pathname === '/auth/session' && method === 'GET') {
      sendJson(request, response, {
        token: sessionToken,
        user: {
          id: 'user-1',
          email: 'admin@lic-demo.local',
          fullName: 'Avery Admin',
        },
      });
      return;
    }

    if (url.pathname === '/auditor/signals' && method === 'GET') {
      sendJson(request, response, auditorSignals);
      return;
    }

    if (url.pathname.startsWith('/auditor/signals/') && method === 'POST') {
      await collectBody(request);
      sendJson(request, response, { ok: true });
      return;
    }

    if (url.pathname === '/portal/snapshot' && method === 'GET') {
      sendJson(request, response, currentPortalSnapshot());
      return;
    }

    if (url.pathname === '/portal/intake-form-definitions' && method === 'GET') {
      sendJson(request, response, intakeFormOptions);
      return;
    }

    if (url.pathname === '/portal/engagement-letter-templates' && method === 'GET') {
      sendJson(request, response, engagementTemplateOptions);
      return;
    }

    if (url.pathname === '/portal/messages' && method === 'POST') {
      portalState.messageSent = true;
      sendJson(request, response, { id: 'msg-1' });
      return;
    }

    if (url.pathname === '/portal/intake-submissions' && method === 'POST') {
      portalState.intakeSubmitted = true;
      sendJson(request, response, { id: 'intake-sub-1' });
      return;
    }

    if (url.pathname === '/portal/esign' && method === 'POST') {
      portalState.envelopeStatus = 'SENT';
      sendJson(request, response, { id: 'env-1' });
      return;
    }

    if (url.pathname === '/portal/esign/env-1/refresh' && method === 'POST') {
      portalState.envelopeStatus = 'SIGNED';
      sendJson(request, response, { id: 'env-1', status: 'SIGNED' });
      return;
    }

    if (url.pathname === '/contacts' && method === 'GET') {
      sendJson(request, response, currentContacts());
      return;
    }

    if (url.pathname === '/contacts/dedupe/suggestions' && method === 'GET') {
      sendJson(request, response, currentDedupeSuggestions());
      return;
    }

    if (url.pathname === '/contacts/dedupe/merge' && method === 'POST') {
      contactsState.suggestionDecision = 'IGNORE';
      sendJson(request, response, { id: 'c1', displayName: 'Jane Doe' });
      return;
    }

    if (url.pathname === '/contacts/dedupe/decisions' && method === 'POST') {
      contactsState.suggestionDecision = 'IGNORE';
      sendJson(request, response, { pairKey: 'c1::c2', decision: 'IGNORE' });
      return;
    }

    if (url.pathname === '/contacts/c1/graph' && method === 'GET') {
      sendJson(request, response, {
        contact: currentContacts()[0],
        nodes: currentContacts(),
        edges: [],
        availableRelationshipTypes: ['opposing_counsel'],
        summary: { nodeCount: 2, edgeCount: 0 },
        filters: { relationshipTypes: [], search: '' },
      });
      return;
    }

    sendJson(request, response, { error: `Unhandled route: ${method} ${url.pathname}` }, 404);
  });

  await new Promise<void>((resolveServer) => {
    server?.listen(apiPort, '127.0.0.1', () => resolveServer());
  });
});

test.afterAll(async () => {
  await new Promise<void>((resolveServer) => {
    server?.close(() => resolveServer());
  });

  const consoleErrors = consoleEntries.filter((entry) => entry.type === 'error');
  const summary = {
    capturedAt: new Date().toISOString(),
    webBaseUrl,
    apiPort,
    consoleErrorsObserved: consoleErrors.length,
    pageErrorsObserved: pageErrors.length,
    consoleEntries,
    pageErrors,
  };

  writeFileSync(consoleSummaryJson, JSON.stringify(summary, null, 2));
  writeFileSync(
    consoleSummaryMd,
    [
      '# KAR-130 Console Summary',
      '',
      `- Captured at: ${summary.capturedAt}`,
      `- Web base URL: ${webBaseUrl}`,
      `- Mock API port: ${apiPort}`,
      `- Console error entries: ${summary.consoleErrorsObserved}`,
      `- Page error entries: ${summary.pageErrorsObserved}`,
      '',
      '## Captured Console Entries',
      ...consoleEntries.map((entry) => `- [${entry.route}] ${entry.type}: ${entry.text}`),
      '',
      '## Captured Page Errors',
      ...(pageErrors.length > 0 ? pageErrors.map((entry) => `- [${entry.route}] ${entry.message}`) : ['- none']),
    ].join('\n'),
  );
});

test.beforeEach(async ({ page }) => {
  page.on('console', (message) => {
    consoleEntries.push({
      route: page.url(),
      type: message.type(),
      text: message.text(),
    });
  });

  page.on('pageerror', (error) => {
    pageErrors.push({
      route: page.url(),
      message: error.message,
    });
  });

  await page.addInitScript((token) => {
    window.localStorage.setItem('session_token', token);
  }, sessionToken);
});

test('captures auditor drawer, confirm dialog, and success state', async ({ page }) => {
  await page.goto(`${webBaseUrl}/auditor`);
  await page.getByRole('button', { name: 'Review sig-1' }).click();
  await expect(page.getByText('Signal ID: sig-1')).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'auditor-drawer-open.png'), fullPage: true });

  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByRole('dialog', { name: 'Confirm Signal Approval' })).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'auditor-confirm-dialog.png'), fullPage: true });

  await page.getByRole('button', { name: 'Approve Signal' }).click();
  await expect(page.getByText(/APPROVE recorded for sig-1/i)).toBeVisible();
  await expect(page.getByText('APPROVE Recorded', { exact: true })).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'auditor-success-feedback.png'), fullPage: true });
});

test('captures portal confirm and toast states', async ({ page }) => {
  await page.goto(`${webBaseUrl}/portal`);
  await expect(page.getByText('1 visible matters')).toBeVisible();

  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('dialog', { name: 'Confirm Client Message Send' })).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'portal-message-confirm.png'), fullPage: true });

  await page.getByRole('button', { name: 'Approve Send' }).click();
  await expect(page.getByText('Portal Message Sent')).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'portal-message-toast.png'), fullPage: true });

  await page.getByRole('button', { name: 'Create E-Sign Envelope' }).click();
  await expect(page.getByRole('dialog', { name: 'Confirm E-Sign Envelope Dispatch' })).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'portal-esign-confirm.png'), fullPage: true });

  await page.getByRole('button', { name: 'Approve Dispatch' }).click();
  await expect(page.getByText('E-Sign Envelope Dispatched')).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'portal-esign-toast.png'), fullPage: true });
});

test('captures contacts confirm and toast states', async ({ page }) => {
  contactsState.suggestionDecision = 'OPEN';
  await page.goto(`${webBaseUrl}/contacts`);
  await expect(page.getByRole('button', { name: 'Merge' })).toBeVisible();

  await page.getByRole('button', { name: 'Merge' }).click();
  await expect(page.getByRole('dialog', { name: 'Confirm Dedupe Merge' })).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'contacts-merge-confirm.png'), fullPage: true });

  await page.getByRole('button', { name: 'Approve Merge' }).click();
  await expect(page.getByText('Dedupe Merge Completed')).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'contacts-merge-toast.png'), fullPage: true });

  contactsState.suggestionDecision = 'OPEN';
  await page.goto(`${webBaseUrl}/contacts`);
  await page.getByRole('button', { name: 'Ignore' }).click();
  await expect(page.getByRole('dialog', { name: 'Confirm Dedupe Decision' })).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'contacts-decision-confirm.png'), fullPage: true });

  await page.getByRole('button', { name: 'Record Decision' }).click();
  await expect(page.getByText('Dedupe Decision Recorded')).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'contacts-decision-toast.png'), fullPage: true });
});
