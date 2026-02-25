import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Membership } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';
import { sha256 } from '../common/utils/hash.util';
import { AuthenticatedUser } from '../common/types';

type SessionPayload = {
  token: string;
  expiresAt: Date;
  user: AuthenticatedUser;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: {
    organizationName: string;
    email: string;
    password: string;
    fullName?: string;
  }): Promise<SessionPayload> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.organizationName,
          slug: input.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48) || `org-${Date.now()}`,
        },
      });

      const adminRole = await tx.role.findFirst({
        where: {
          organizationId: organization.id,
          name: 'Admin',
        },
      });

      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          fullName: input.fullName ?? input.email,
        },
      });

      const role =
        adminRole ||
        (await tx.role.create({
          data: {
            organizationId: organization.id,
            name: 'Admin',
            description: 'Organization administrator',
          },
        }));

      const membership = await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          roleId: role.id,
          status: 'ACTIVE',
        },
      });

      return { organization, user, membership };
    });

    return this.createSession(result.user.id, result.organization.id, result.membership.id);
  }

  async login(input: {
    email: string;
    password: string;
    totpCode?: string;
    organizationId?: string;
  }): Promise<SessionPayload> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.mfaSecret) {
      if (!input.totpCode || !authenticator.check(input.totpCode, user.mfaSecret)) {
        throw new UnauthorizedException('MFA code is invalid');
      }
    }

    const membership = this.pickMembership(user.memberships, input.organizationId);
    return this.createSession(user.id, membership.organizationId, membership.id);
  }

  async logout(token: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { tokenHash: sha256(token) },
    });
  }

  async validateSession(token: string): Promise<AuthenticatedUser | null> {
    const session = await this.prisma.session.findFirst({
      where: {
        tokenHash: sha256(token),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
        membership: {
          include: {
            role: {
              include: { permissions: true },
            },
          },
        },
      },
    });

    if (!session || !session.membership) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      organizationId: session.membership.organizationId,
      membership: session.membership,
      permissions: session.membership.role?.permissions.map((p) => p.key) ?? [],
    };
  }

  async setupMfa(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return {
      secret,
      otpauthUrl: authenticator.keyuri(userId, 'LIC Legal Suite', secret),
    };
  }

  async disableMfa(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: null },
    });
  }

  private pickMembership(
    memberships: (Membership & { role: { permissions: { key: string }[] } | null })[],
    organizationId?: string,
  ): Membership {
    const membership = organizationId
      ? memberships.find((item) => item.organizationId === organizationId)
      : memberships[0];

    if (!membership) {
      throw new UnauthorizedException('No active organization membership');
    }

    return membership;
  }

  private async createSession(userId: string, organizationId: string, membershipId: string): Promise<SessionPayload> {
    const token = randomBytes(48).toString('hex');
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await this.prisma.session.create({
      data: {
        userId,
        organizationId,
        membershipId,
        tokenHash,
        expiresAt,
      },
    });

    const user = await this.getSessionUser(userId, organizationId, membershipId);

    return { token, expiresAt, user };
  }

  private async getSessionUser(userId: string, organizationId: string, membershipId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
      include: { role: { include: { permissions: true } } },
    });

    if (!user || !membership) {
      throw new UnauthorizedException('Invalid session user');
    }

    return {
      id: user.id,
      email: user.email,
      organizationId,
      membership,
      permissions: membership.role?.permissions.map((p) => p.key) ?? [],
    };
  }
}
