import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PermissionGuard } from './permission.guard';
import { RateLimitGuard } from './rate-limit.guard';
import { SessionAuthGuard } from './session-auth.guard';

@Global()
@Module({
  imports: [AuthModule],
  providers: [SessionAuthGuard, PermissionGuard, RateLimitGuard],
  exports: [SessionAuthGuard, PermissionGuard, RateLimitGuard],
})
export class GuardsModule {}
