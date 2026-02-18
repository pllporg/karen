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
    expect(prisma.payment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          reference: 'stripe_event:evt_1',
        }),
      }),
    );
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

  it('dedupes duplicate checkout webhook by stripe event id when payment intent is absent', async () => {
    const prisma = {
      invoice: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'inv-2',
          organizationId: 'org-1',
          matterId: 'matter-1',
          balanceDue: 175,
          status: 'SENT',
        }),
        update: jest.fn().mockResolvedValue({ id: 'inv-2' }),
      },
      payment: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 'pay-evt-existing',
            organizationId: 'org-1',
            invoiceId: 'inv-2',
            reference: 'stripe_event:evt_no_pi',
          }),
        create: jest.fn().mockResolvedValue({ id: 'pay-evt-created' }),
      },
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { upload: jest.fn() } as any,
    );

    (service as any).stripe = null;

    const eventPayload = {
      id: 'evt_no_pi',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_no_pi',
          payment_intent: null,
          amount_total: 17500,
          metadata: {
            invoiceId: 'inv-2',
            organizationId: 'org-1',
          },
        },
      },
    };

    const first = await service.handleStripeWebhook({ payload: eventPayload });
    const second = await service.handleStripeWebhook({ payload: eventPayload });

    expect(first).toEqual(
      expect.objectContaining({
        eventId: 'evt_no_pi',
        status: 'recorded',
        paymentId: 'pay-evt-created',
      }),
    );
    expect(second).toEqual(
      expect.objectContaining({
        eventId: 'evt_no_pi',
        status: 'duplicate',
        paymentId: 'pay-evt-existing',
      }),
    );
    expect(prisma.payment.create).toHaveBeenCalledTimes(1);
  });

  it('reconciles payment_intent.succeeded to PAID status when amount satisfies remaining balance', async () => {
    const prisma = {
      invoice: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'inv-3',
          organizationId: 'org-1',
          matterId: 'matter-1',
          balanceDue: 100,
          status: 'SENT',
        }),
        update: jest.fn().mockResolvedValue({ id: 'inv-3' }),
      },
      payment: {
        findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
        create: jest.fn().mockResolvedValue({ id: 'pay-3' }),
      },
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { upload: jest.fn() } as any,
    );

    (service as any).stripe = null;

    const result = await service.handleStripeWebhook({
      payload: {
        id: 'evt_pi_paid',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_paid',
            amount: 10000,
            amount_received: 10000,
            metadata: {
              invoiceId: 'inv-3',
              organizationId: 'org-1',
            },
          },
        },
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        received: true,
        eventId: 'evt_pi_paid',
        type: 'payment_intent.succeeded',
        status: 'recorded',
        paymentId: 'pay-3',
      }),
    );
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-3' },
        data: expect.objectContaining({
          balanceDue: 0,
          status: 'PAID',
        }),
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

  it('verifies webhook signature when STRIPE_WEBHOOK_SECRET is configured', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

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
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { upload: jest.fn() } as any,
    );

    const constructEvent = jest.fn().mockReturnValue({
      id: 'evt_sig',
      type: 'customer.created',
      data: { object: {} },
    });
    (service as any).stripe = {
      webhooks: {
        constructEvent,
      },
    };

    await expect(
      service.handleStripeWebhook({
        payload: { any: 'payload' },
      }),
    ).rejects.toThrow('Stripe webhook signature verification failed');

    const result = await service.handleStripeWebhook({
      payload: { any: 'payload' },
      signature: 'sig_test',
      rawBody: Buffer.from('{}'),
    });

    expect(constructEvent).toHaveBeenCalledWith(Buffer.from('{}'), 'sig_test', 'whsec_test');
    expect(result).toEqual(
      expect.objectContaining({
        received: true,
        eventId: 'evt_sig',
        type: 'customer.created',
        status: 'ignored',
        reason: 'event_type_not_handled',
      }),
    );
  });
});
