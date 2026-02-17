import { BillingService } from '../src/billing/billing.service';

describe('BillingService Stripe lifecycle + reconciliation', () => {
  beforeEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it('creates checkout session with invoice metadata for payment intent reconciliation', async () => {
    const prisma = {
      invoice: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'inv-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
          invoiceNumber: 'INV-00001',
          balanceDue: 150,
          status: 'DRAFT',
          stripeCheckoutUrl: null,
          matter: { id: 'matter-1', name: 'Kitchen Defect Matter' },
        }),
        update: jest.fn().mockResolvedValue({ id: 'inv-1' }),
      },
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn() } as any,
      { upload: jest.fn() } as any,
    );

    const createSession = jest.fn().mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.test/cs_1' });
    (service as any).stripe = {
      checkout: {
        sessions: {
          create: createSession,
        },
      },
    };

    const result = await service.createCheckoutLink({ id: 'u1', organizationId: 'org-1' } as any, 'inv-1');

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        client_reference_id: 'inv-1',
        metadata: {
          invoiceId: 'inv-1',
          organizationId: 'org-1',
        },
        payment_intent_data: {
          metadata: {
            invoiceId: 'inv-1',
            organizationId: 'org-1',
          },
        },
      }),
    );
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1' },
        data: expect.objectContaining({
          status: 'SENT',
          stripeCheckoutUrl: 'https://checkout.stripe.test/cs_1',
        }),
      }),
    );
    expect(result).toEqual({ url: 'https://checkout.stripe.test/cs_1' });
  });

  it('records webhook payment once and treats duplicate webhook as idempotent', async () => {
    const prisma = {
      invoice: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'inv-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
          balanceDue: 200,
          status: 'SENT',
        }),
        update: jest.fn().mockResolvedValue({ id: 'inv-1' }),
      },
      payment: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 'pay-existing',
            organizationId: 'org-1',
            invoiceId: 'inv-1',
            stripePaymentIntentId: 'pi_1',
          }),
        create: jest.fn().mockResolvedValue({ id: 'pay-1' }),
      },
    } as any;

    const audit = {
      appendEvent: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      audit,
      { upload: jest.fn() } as any,
    );

    (service as any).stripe = null;

    const eventPayload = {
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          payment_intent: 'pi_1',
          amount_total: 15000,
          metadata: {
            invoiceId: 'inv-1',
            organizationId: 'org-1',
          },
        },
      },
    };

    const firstResult = await service.handleStripeWebhook({ payload: eventPayload });
    const secondResult = await service.handleStripeWebhook({ payload: eventPayload });

    expect(firstResult).toEqual(
      expect.objectContaining({
        received: true,
        eventId: 'evt_1',
        type: 'checkout.session.completed',
        status: 'recorded',
        paymentId: 'pay-1',
      }),
    );
    expect(secondResult).toEqual(
      expect.objectContaining({
        received: true,
        eventId: 'evt_1',
        type: 'checkout.session.completed',
        status: 'duplicate',
        paymentId: 'pay-existing',
      }),
    );

    expect(prisma.payment.create).toHaveBeenCalledTimes(1);
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1' },
        data: expect.objectContaining({
          balanceDue: 50,
          status: 'PARTIAL',
        }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'invoice.payment.reconciled',
        entityType: 'invoice',
        entityId: 'inv-1',
      }),
    );
  });

  it('ignores payment-intent webhook without required metadata', async () => {
    const service = new BillingService(
      {
        invoice: {
          findFirst: jest.fn(),
          update: jest.fn(),
        },
        payment: {
          findFirst: jest.fn(),
          create: jest.fn(),
        },
      } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn() } as any,
      { upload: jest.fn() } as any,
    );

    (service as any).stripe = null;

    const result = await service.handleStripeWebhook({
      payload: {
        id: 'evt_2',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_2',
            amount: 10000,
            amount_received: 10000,
            metadata: {},
          },
        },
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        received: true,
        eventId: 'evt_2',
        type: 'payment_intent.succeeded',
        status: 'ignored',
        reason: 'missing_required_metadata',
      }),
    );
  });
});

