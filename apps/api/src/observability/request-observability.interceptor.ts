import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { ObservabilityService } from './observability.service';

@Injectable()
export class RequestObservabilityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestObservabilityInterceptor.name);

  constructor(private readonly observability: ObservabilityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();

    const requestId = this.readHeader(request, 'x-request-id') || randomUUID();
    const correlationId = this.readHeader(request, 'x-correlation-id') || requestId;
    response.setHeader('x-request-id', requestId);
    response.setHeader('x-correlation-id', correlationId);

    return next.handle().pipe(
      tap({
        next: () => this.logEvent(request, response, requestId, correlationId, startedAt),
        error: (error) => this.logEvent(request, response, requestId, correlationId, startedAt, error),
      }),
    );
  }

  private logEvent(
    request: Request,
    response: Response,
    requestId: string,
    correlationId: string,
    startedAt: number,
    error?: unknown,
  ) {
    const statusCode = response.statusCode || 500;
    this.observability.recordRequest(statusCode);
    const payload = {
      event: 'http.request.completed',
      requestId,
      correlationId,
      method: request.method,
      path: request.originalUrl || request.url,
      statusCode,
      durationMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : undefined,
      errorMessage: error instanceof Error ? error.message : undefined,
    };

    if (statusCode >= 500 || error) {
      this.logger.error(JSON.stringify(payload));
      return;
    }
    this.logger.log(JSON.stringify(payload));
  }

  private readHeader(request: Request, name: string): string | undefined {
    const value = request.headers[name];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return undefined;
  }
}
