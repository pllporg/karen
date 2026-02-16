import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const config = this.reflector.getAllAndOverride<{ limit: number; windowMs: number }>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { ip: string; path: string; headers: Record<string, string | string[] | undefined> }>();
    const ip = request.ip || (Array.isArray(request.headers['x-forwarded-for']) ? request.headers['x-forwarded-for'][0] : request.headers['x-forwarded-for']) || 'unknown';
    const key = `${ip}:${request.path}`;
    const now = Date.now();

    const bucket = this.buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + config.windowMs });
      return true;
    }

    if (bucket.count >= config.limit) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);
    return true;
  }
}
