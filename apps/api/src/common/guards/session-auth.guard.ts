import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { RequestWithUser } from '../types';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser & { cookies?: Record<string, string>; headers: Record<string, string | string[] | undefined> }>();
    const headerToken = request.headers['x-session-token'];
    const token = (Array.isArray(headerToken) ? headerToken[0] : headerToken) || request.cookies?.session_token;

    if (!token) {
      throw new UnauthorizedException('Missing session token');
    }

    const user = await this.authService.validateSession(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.user = user;
    return true;
  }
}
