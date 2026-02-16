import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller('tasks')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @RequirePermissions('tasks:read')
  list(@CurrentUser() user: AuthenticatedUser, @Query('matterId') matterId?: string) {
    return this.tasksService.list(user, matterId);
  }

  @Post()
  @RequirePermissions('tasks:write')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaskDto) {
    return this.tasksService.create({ user, ...dto });
  }
}
