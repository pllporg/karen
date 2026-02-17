import { Injectable } from '@nestjs/common';
import { InvoiceStatus, PaymentMethod, TrustTransactionType } from '@prisma/client';
import Stripe from 'stripe';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuthenticatedUser } from '../common/types';
import { AuditService } from '../audit/audit.service';
import { S3Service } from '../files/s3.service';
import { toJsonValue } from '../common/utils/json.util';

@Injectable()
export class BillingService {
  private readonly stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
    private readonly s3: S3Service,
  ) {}

  async createTimeEntry(input: {
    user: AuthenticatedUser;
    matterId: string;
    description?: string;
    startedAt: string;
    endedAt: string;
    billableRate?: number;
    utbmsPhaseCode?: string;
    utbmsTaskCode?: string;
  }) {
    await this.access.assertMatterAccess(input.user, input.matterId, 'write');

    const startedAt = new Date(input.startedAt);
    const endedAt = new Date(input.endedAt);
    const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
    const rate = input.billableRate ?? 350;
    const amount = Number(((durationMinutes / 60) * rate).toFixed(2));

    return this.prisma.timeEntry.create({
      data: {
        organizationId: input.user.organizationId,
        matterId: input.matterId,
        userId: input.user.id,
        description: input.description,
        startedAt,
        endedAt,
        durationMinutes,
        billableRate: rate,
        amount,
        utbmsPhaseCode: input.utbmsPhaseCode,
        utbmsTaskCode: input.utbmsTaskCode,
      },
    });
  }

  async createExpense(input: {
    user: AuthenticatedUser;
    matterId: string;
    description: string;
    amount: number;
    incurredAt: string;
    receiptDocumentVersionId?: string;
  }) {
    await this.access.assertMatterAccess(input.user, input.matterId, 'write');

    return this.prisma.expense.create({
      data: {
        organizationId: input.user.organizationId,
        matterId: input.matterId,
        description: input.description,
        amount: input.amount,
        incurredAt: new Date(input.incurredAt),
        receiptDocumentVersionId: input.receiptDocumentVersionId,
        createdByUserId: input.user.id,
      },
    });
  }

  async createInvoice(input: {
    user: AuthenticatedUser;
    matterId: string;
    dueAt?: string;
    notes?: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      timeEntryId?: string;
      expenseId?: string;
      utbmsPhaseCode?: string;
      utbmsTaskCode?: string;
    }>;
  }) {
    await this.access.assertMatterAccess(input.user, input.matterId, 'write');

    const count = await this.prisma.invoice.count({ where: { organizationId: input.user.organizationId } });
    const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;

    const subtotal = input.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const total = Number(subtotal.toFixed(2));

    const invoice = await this.prisma.invoice.create({
      data: {
        organizationId: input.user.organizationId,
        matterId: input.matterId,
        invoiceNumber,
        status: InvoiceStatus.DRAFT,
        issuedAt: new Date(),
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        subtotal,
        tax: 0,
        total,
        balanceDue: total,
        notes: input.notes,
        jurisdictionDisclaimer:
          'Billing/trust requirements vary by jurisdiction. Attorney is responsible for compliance with applicable rules.',
        lineItems: {
          create: input.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: Number((item.quantity * item.unitPrice).toFixed(2)),
            timeEntryId: item.timeEntryId,
            expenseId: item.expenseId,
            utbmsPhaseCode: item.utbmsPhaseCode,
            utbmsTaskCode: item.utbmsTaskCode,
          })),
        },
      },
      include: {
        lineItems: true,
      },
    });

    const pdfStorageKey = await this.generateInvoicePdf(invoice.id);
    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfStorageKey },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'invoice.created',
      entityType: 'invoice',
      entityId: invoice.id,
      metadata: { invoiceNumber, total },
    });

    return this.prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { lineItems: true, payments: true },
    });
  }

  async createCheckoutLink(user: AuthenticatedUser, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId: user.organizationId,
      },
      include: {
        matter: true,
      },
    });

    if (!invoice) throw new Error('Invoice not found');
    await this.access.assertMatterAccess(user, invoice.matterId, 'read');
    if (invoice.balanceDue <= 0) {
      return { url: null, warning: 'Invoice balance is zero. Checkout link not created.' };
    }

    if (!this.stripe) {
      return { url: null, warning: 'Stripe is not configured (STRIPE_SECRET_KEY missing).' };
    }

    const checkoutMetadata = {
      invoiceId: invoice.id,
      organizationId: user.organizationId,
    };

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: invoice.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: `Matter: ${invoice.matter.name}`,
            },
            unit_amount: Math.round(invoice.balanceDue * 100),
          },
        },
      ],
      payment_intent_data: {
        metadata: checkoutMetadata,
      },
      success_url: `${process.env.WEB_BASE_URL || 'http://localhost:3000'}/billing/success?invoiceId=${invoice.id}`,
      cancel_url: `${process.env.WEB_BASE_URL || 'http://localhost:3000'}/billing/cancel?invoiceId=${invoice.id}`,
      metadata: checkoutMetadata,
    });

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        stripeCheckoutUrl: session.url,
        status: InvoiceStatus.SENT,
      },
    });

    return { url: session.url };
  }

  async recordPayment(input: {
    user: AuthenticatedUser;
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    stripePaymentIntentId?: string;
    reference?: string;
  }) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: input.invoiceId, organizationId: input.user.organizationId },
    });

    if (!invoice) throw new Error('Invoice not found');
    await this.access.assertMatterAccess(input.user, invoice.matterId, 'write');

    if (input.stripePaymentIntentId) {
      const existing = await this.prisma.payment.findFirst({
        where: {
          organizationId: input.user.organizationId,
          invoiceId: invoice.id,
          stripePaymentIntentId: input.stripePaymentIntentId,
        },
      });
      if (existing) return existing;
    }

    const amount = Number(Math.min(invoice.balanceDue, Math.max(0, input.amount)).toFixed(2));
    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero and invoice must have remaining balance');
    }

    const payment = await this.prisma.payment.create({
      data: {
        organizationId: input.user.organizationId,
        invoiceId: invoice.id,
        amount,
        method: input.method,
        stripePaymentIntentId: input.stripePaymentIntentId,
        reference: input.reference,
      },
    });

    const balanceDue = Number(Math.max(0, invoice.balanceDue - amount).toFixed(2));
    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        balanceDue,
        status: balanceDue === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL,
      },
    });

    return payment;
  }

  async handleStripeWebhook(input: { payload: unknown; signature?: string; rawBody?: Buffer }) {
    const event = this.parseStripeWebhookEvent(input);

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = this.readMetadataValue(session.metadata, 'invoiceId');
      const organizationId = this.readMetadataValue(session.metadata, 'organizationId');

      if (!invoiceId || !organizationId) {
        return {
          received: true,
          eventId: event.id,
          type: event.type,
          status: 'ignored',
          reason: 'missing_required_metadata',
        };
      }

      return {
        received: true,
        eventId: event.id,
        type: event.type,
        ...(await this.reconcileStripePayment({
          organizationId,
          invoiceId,
          stripeEventId: event.id,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
          amount: typeof session.amount_total === 'number' ? Number((session.amount_total / 100).toFixed(2)) : undefined,
        })),
      };
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const invoiceId = this.readMetadataValue(paymentIntent.metadata, 'invoiceId');
      const organizationId = this.readMetadataValue(paymentIntent.metadata, 'organizationId');

      if (!invoiceId || !organizationId) {
        return {
          received: true,
          eventId: event.id,
          type: event.type,
          status: 'ignored',
          reason: 'missing_required_metadata',
        };
      }

      const amountInCents =
        typeof paymentIntent.amount_received === 'number' && paymentIntent.amount_received > 0
          ? paymentIntent.amount_received
          : paymentIntent.amount;

      return {
        received: true,
        eventId: event.id,
        type: event.type,
        ...(await this.reconcileStripePayment({
          organizationId,
          invoiceId,
          stripeEventId: event.id,
          stripePaymentIntentId: paymentIntent.id,
          amount: Number((amountInCents / 100).toFixed(2)),
        })),
      };
    }

    return {
      received: true,
      eventId: event.id,
      type: event.type,
      status: 'ignored',
      reason: 'event_type_not_handled',
    };
  }

  async listInvoices(user: AuthenticatedUser, matterId?: string) {
    if (matterId) {
      await this.access.assertMatterAccess(user, matterId, 'read');
    }

    return this.prisma.invoice.findMany({
      where: {
        organizationId: user.organizationId,
        ...(matterId ? { matterId } : {}),
      },
      include: {
        lineItems: true,
        payments: true,
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async trustTransaction(input: {
    user: AuthenticatedUser;
    matterId: string;
    trustAccountId: string;
    type: TrustTransactionType;
    amount: number;
    description?: string;
  }) {
    await this.access.assertMatterAccess(input.user, input.matterId, 'write');

    const tx = await this.prisma.trustTransaction.create({
      data: {
        organizationId: input.user.organizationId,
        matterId: input.matterId,
        trustAccountId: input.trustAccountId,
        type: input.type,
        amount: input.amount,
        description: input.description,
      },
    });

    const current = await this.prisma.matterTrustLedger.findFirst({
      where: {
        organizationId: input.user.organizationId,
        matterId: input.matterId,
        trustAccountId: input.trustAccountId,
      },
    });

    const delta = input.type === TrustTransactionType.WITHDRAWAL ? -input.amount : input.amount;

    if (!current) {
      await this.prisma.matterTrustLedger.create({
        data: {
          organizationId: input.user.organizationId,
          matterId: input.matterId,
          trustAccountId: input.trustAccountId,
          balance: delta,
        },
      });
    } else {
      await this.prisma.matterTrustLedger.update({
        where: { id: current.id },
        data: { balance: Number((current.balance + delta).toFixed(2)) },
      });
    }

    return tx;
  }

  async trustReport(user: AuthenticatedUser, trustAccountId?: string) {
    return this.prisma.matterTrustLedger.findMany({
      where: {
        organizationId: user.organizationId,
        ...(trustAccountId ? { trustAccountId } : {}),
      },
      include: {
        matter: {
          select: {
            id: true,
            name: true,
            matterNumber: true,
          },
        },
        trustAccount: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private async generateInvoicePdf(invoiceId: string): Promise<string> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        lineItems: true,
        matter: true,
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);

    const lines = [
      `Invoice ${invoice.invoiceNumber}`,
      `Matter: ${invoice.matter.name}`,
      `Issued: ${invoice.issuedAt.toISOString().slice(0, 10)}`,
      `Due: ${invoice.dueAt ? invoice.dueAt.toISOString().slice(0, 10) : 'N/A'}`,
      '',
      ...invoice.lineItems.map(
        (line) => `${line.description} | qty ${line.quantity} x ${line.unitPrice.toFixed(2)} = ${line.amount.toFixed(2)}`,
      ),
      '',
      `Total: ${invoice.total.toFixed(2)}`,
      `Balance Due: ${invoice.balanceDue.toFixed(2)}`,
      '',
      invoice.jurisdictionDisclaimer ?? '',
    ];

    let y = 800;
    for (const line of lines) {
      page.drawText(line, { x: 40, y, font, size: 11 });
      y -= 16;
    }

    const bytes = await doc.save();
    const uploaded = await this.s3.upload(Buffer.from(bytes), 'application/pdf', `org/${invoice.organizationId}/invoices`);
    return uploaded.key;
  }

  private parseStripeWebhookEvent(input: { payload: unknown; signature?: string; rawBody?: Buffer }): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (this.stripe && webhookSecret) {
      if (!input.signature || !input.rawBody) {
        throw new Error('Stripe webhook signature verification failed: missing stripe-signature header or raw body');
      }
      return this.stripe.webhooks.constructEvent(input.rawBody, input.signature, webhookSecret);
    }

    const payload = input.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Invalid Stripe webhook payload');
    }

    const event = payload as Partial<Stripe.Event>;
    if (!event.id || !event.type || !event.data) {
      throw new Error('Malformed Stripe webhook event payload');
    }
    return event as Stripe.Event;
  }

  private readMetadataValue(metadata: Stripe.Metadata | null | undefined, key: string): string | undefined {
    const rawValue = metadata?.[key];
    if (typeof rawValue !== 'string') return undefined;
    const value = rawValue.trim();
    return value ? value : undefined;
  }

  private async reconcileStripePayment(input: {
    organizationId: string;
    invoiceId: string;
    stripeEventId: string;
    amount?: number;
    stripePaymentIntentId?: string;
    stripeCheckoutSessionId?: string;
  }): Promise<{ status: 'recorded' | 'duplicate' | 'ignored'; paymentId?: string; reason?: string }> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: input.invoiceId,
        organizationId: input.organizationId,
      },
    });
    if (!invoice) {
      return { status: 'ignored', reason: 'invoice_not_found' };
    }

    if (input.stripePaymentIntentId) {
      const existing = await this.prisma.payment.findFirst({
        where: {
          organizationId: input.organizationId,
          invoiceId: invoice.id,
          stripePaymentIntentId: input.stripePaymentIntentId,
        },
      });
      if (existing) return { status: 'duplicate', paymentId: existing.id };
    }

    const amount = Number(
      Math.min(invoice.balanceDue, Math.max(0, input.amount ?? invoice.balanceDue)).toFixed(2),
    );
    if (amount <= 0) {
      return { status: 'ignored', reason: 'invoice_balance_zero' };
    }

    const payment = await this.prisma.payment.create({
      data: {
        organizationId: input.organizationId,
        invoiceId: invoice.id,
        amount,
        method: PaymentMethod.STRIPE,
        stripePaymentIntentId: input.stripePaymentIntentId,
        reference: `stripe_event:${input.stripeEventId}`,
        rawSourcePayload: toJsonValue({
          stripeEventId: input.stripeEventId,
          stripeCheckoutSessionId: input.stripeCheckoutSessionId,
        }),
      },
    });

    const balanceDue = Number(Math.max(0, invoice.balanceDue - amount).toFixed(2));
    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        balanceDue,
        status: balanceDue === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      action: 'invoice.payment.reconciled',
      entityType: 'invoice',
      entityId: invoice.id,
      metadata: {
        paymentId: payment.id,
        stripeEventId: input.stripeEventId,
        amount,
        balanceDue,
      },
    });

    return { status: 'recorded', paymentId: payment.id };
  }
}
