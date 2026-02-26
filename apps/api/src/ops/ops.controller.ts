import { Controller, Get, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { OpsService } from './ops.service';

@Controller('ops')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  @Get('provider-status')
  @RequirePermissions('organizations:read')
  providerStatus() {
    return this.opsService.providerStatus();
  }

  @Get('alerts/baseline')
  @RequirePermissions('organizations:read')
  alertBaseline() {
    return this.opsService.alertBaseline();
  }

  @Get('launch-blockers')
  @RequirePermissions('organizations:read')
  launchBlockers() {
    return this.opsService.launchBlockers();
  }
}
