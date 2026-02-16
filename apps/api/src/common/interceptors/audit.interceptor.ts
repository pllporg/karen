import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../../audit/audit.service';
import { RequestWithUser } from '../types';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser & { method: string; originalUrl: string; body: unknown }>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(async () => {
        if (!request.user) {
          return;
        }
        await this.auditService.appendEvent({
          organizationId: request.user.organizationId,
          actorUserId: request.user.id,
          action: `${request.method} ${request.originalUrl}`,
          entityType: 'http.request',
          entityId: request.originalUrl,
          metadata: {
            durationMs: Date.now() - startedAt,
            body: request.body,
          },
        });
      }),
    );
  }
}
