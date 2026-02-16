import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('communications')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Get('threads')
  @RequirePermissions('communications:read')
  threads(@CurrentUser() user: AuthenticatedUser, @Query('matterId') matterId?: string) {
    return this.communicationsService.listThreads(user, matterId);
  }

  @Post('threads')
  @RequirePermissions('communications:write')
  createThread(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateThreadDto) {
    return this.communicationsService.createThread({ user, ...dto });
  }

  @Post('messages')
  @RequirePermissions('communications:write')
  createMessage(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMessageDto) {
    return this.communicationsService.createMessage({
      user,
      ...dto,
    });
  }

  @Get('search')
  @RequirePermissions('communications:read')
  search(@CurrentUser() user: AuthenticatedUser, @Query('q') q: string, @Query('matterId') matterId?: string) {
    return this.communicationsService.search(user, q, matterId);
  }
}
