import { TaskStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from '../src/tasks/tasks.service';

describe('TasksService', () => {
  const baseUser = {
    id: 'user-1',
    email: 'user@example.com',
    organizationId: 'org-1',
    permissions: [],
    membership: { role: { name: 'Attorney' } },
  } as any;

  it('updates task status and emits audit event', async () => {
    const prisma = {
      task: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'task-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
          status: TaskStatus.TODO,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'task-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
          status: TaskStatus.DONE,
          priority: 'MEDIUM',
          dueAt: null,
        }),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new TasksService(prisma, access, audit);

    const updated = await service.update({
      user: baseUser,
      taskId: 'task-1',
      status: TaskStatus.DONE,
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter-1', 'write');
    expect(prisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1' },
        data: expect.objectContaining({ status: TaskStatus.DONE }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'task.updated',
        entityType: 'task',
        entityId: 'task-1',
      }),
    );
    expect(updated.status).toBe(TaskStatus.DONE);
  });

  it('throws NotFoundException when updating unknown task', async () => {
    const prisma = {
      task: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const service = new TasksService(
      prisma,
      { assertMatterAccess: jest.fn() } as any,
      { appendEvent: jest.fn() } as any,
    );

    await expect(
      service.update({
        user: baseUser,
        taskId: 'missing-task',
        status: TaskStatus.DONE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a task and emits audit event', async () => {
    const prisma = {
      task: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'task-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
        }),
        delete: jest.fn().mockResolvedValue(undefined),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new TasksService(prisma, access, audit);

    const removed = await service.remove({
      user: baseUser,
      taskId: 'task-1',
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter-1', 'write');
    expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'task.deleted',
        entityType: 'task',
        entityId: 'task-1',
      }),
    );
    expect(removed).toEqual({ id: 'task-1', removed: true });
  });

  it('throws NotFoundException when deleting unknown task', async () => {
    const prisma = {
      task: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const service = new TasksService(
      prisma,
      { assertMatterAccess: jest.fn() } as any,
      { appendEvent: jest.fn() } as any,
    );

    await expect(
      service.remove({
        user: baseUser,
        taskId: 'missing-task',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
