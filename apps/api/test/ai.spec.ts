import { AiService } from '../src/ai/ai.service';

describe('AiService', () => {
  it('creates queued AI job and enqueues worker job', async () => {
    const prisma = {
      aiJob: {
        create: jest.fn().mockResolvedValue({ id: 'job1', status: 'QUEUED' }),
      },
    } as any;

    const queue = {
      createWorker: jest.fn(),
      addJob: jest.fn().mockResolvedValue({ id: 'queue-job-1' }),
    } as any;

    const service = new AiService(
      prisma,
      queue,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn() } as any,
    );

    const job = await service.createJob({
      user: { id: 'u1', organizationId: 'org1' } as any,
      matterId: 'matter1',
      toolName: 'case_summary',
      payload: {},
    });

    expect(job.id).toBe('job1');
    expect(queue.addJob).toHaveBeenCalled();
  });
});
