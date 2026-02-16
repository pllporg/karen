import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { RateLimit } from '../common/decorators/rate-limit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60_000)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const session = await this.authService.register(dto);
    this.setSessionCookie(res, session.token, session.expiresAt);
    return {
      token: session.token,
      expiresAt: session.expiresAt,
      user: session.user,
    };
  }

  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60_000)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const session = await this.authService.login(dto);
    this.setSessionCookie(res, session.token, session.expiresAt);
    return {
      token: session.token,
      expiresAt: session.expiresAt,
      user: session.user,
    };
  }

  @Post('logout')
  @UseGuards(SessionAuthGuard)
  async logout(@Req() req: Request & { headers: Record<string, string | string[] | undefined>; cookies?: Record<string, string> }, @Res({ passthrough: true }) res: Response) {
    const headerToken = req.headers['x-session-token'];
    const token = (Array.isArray(headerToken) ? headerToken[0] : headerToken) || req.cookies?.session_token;
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie('session_token');
    return { ok: true };
  }

  @Post('mfa/setup')
  @UseGuards(SessionAuthGuard)
  setupMfa(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.setupMfa(user.id);
  }

  @Post('mfa/disable')
  @UseGuards(SessionAuthGuard)
  async disableMfa(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.disableMfa(user.id);
    return { ok: true };
  }

  private setSessionCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie('session_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
    });
  }
}
