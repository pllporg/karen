import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LookupsService } from './lookups.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';

@Controller('lookups')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class LookupsController {
  constructor(private readonly lookupsService: LookupsService) {}

  @Get('matters')
  @RequirePermissions('matters:read')
  matters(@CurrentUser() user: AuthenticatedUser, @Query('q') query?: string, @Query('limit') limit?: string) {
    return this.lookupsService.matters(user, query, limit);
  }

  @Get('contacts')
  @RequirePermissions('contacts:read')
  contacts(@CurrentUser() user: AuthenticatedUser, @Query('q') query?: string, @Query('limit') limit?: string) {
    return this.lookupsService.contacts(user, query, limit);
  }

  @Get('trust-accounts')
  @RequirePermissions('billing:read')
  trustAccounts(@CurrentUser() user: AuthenticatedUser, @Query('q') query?: string, @Query('limit') limit?: string) {
    return this.lookupsService.trustAccounts(user, query, limit);
  }

  @Get('invoices')
  @RequirePermissions('billing:read')
  invoices(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') query?: string,
    @Query('limit') limit?: string,
    @Query('matterId') matterId?: string,
  ) {
    return this.lookupsService.invoices(user, query, limit, matterId);
  }

  @Get('document-versions')
  @RequirePermissions('documents:read')
  documentVersions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') query?: string,
    @Query('limit') limit?: string,
    @Query('matterId') matterId?: string,
  ) {
    return this.lookupsService.documentVersions(user, query, limit, matterId);
  }
}
