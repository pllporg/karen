import { Injectable } from '@nestjs/common';
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
}
