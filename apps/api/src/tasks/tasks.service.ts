import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/types';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthenticatedUser, matterId?: string) {
    if (matterId) {
      await this.access.assertMatterAccess(user, matterId);
    }

    return this.prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        ...(matterId ? { matterId } : {}),
      },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(input: {
    user: AuthenticatedUser;
    matterId: string;
    title: string;
    description?: string;
    assigneeUserId?: string;
    dueAt?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
  }) {
    await this.access.assertMatterAccess(input.user, input.matterId, 'write');

    const task = await this.prisma.task.create({
      data: {
        organizationId: input.user.organizationId,
        matterId: input.matterId,
        title: input.title,
        description: input.description,
        assigneeUserId: input.assigneeUserId,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        priority: input.priority ?? TaskPriority.MEDIUM,
        status: input.status ?? TaskStatus.TODO,
        createdByUserId: input.user.id,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'task.created',
      entityType: 'task',
      entityId: task.id,
      metadata: task,
    });

    return task;
  }

  async update(input: {
    user: AuthenticatedUser;
    taskId: string;
    title?: string;
    description?: string;
    assigneeUserId?: string;
    dueAt?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
  }) {
    const existing = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        organizationId: input.user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    await this.access.assertMatterAccess(input.user, existing.matterId, 'write');

    const task = await this.prisma.task.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        description: input.description,
        assigneeUserId: input.assigneeUserId,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
        priority: input.priority,
        status: input.status,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'task.updated',
      entityType: 'task',
      entityId: task.id,
      metadata: {
        taskId: task.id,
        matterId: task.matterId,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt?.toISOString() || null,
      },
    });

    return task;
  }
}
