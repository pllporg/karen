import { LookupsController } from '../src/lookups/lookups.controller';

describe('LookupsController query forwarding', () => {
  const user = { id: 'user-1', organizationId: 'org-1' } as any;

  it('forwards matter lookup query params', async () => {
    const service = {
      matters: jest.fn().mockResolvedValue([]),
    } as any;
    const controller = new LookupsController(service);

    await controller.matters(user, 'builder', '50');
    expect(service.matters).toHaveBeenCalledWith(user, 'builder', '50');
  });

  it('forwards invoice lookup with matter filter', async () => {
    const service = {
      invoices: jest.fn().mockResolvedValue([]),
    } as any;
    const controller = new LookupsController(service);

    await controller.invoices(user, 'inv', '25', 'matter-1');
    expect(service.invoices).toHaveBeenCalledWith(user, 'inv', '25', 'matter-1');
  });
});
