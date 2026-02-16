import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertMatterAccess(user: AuthenticatedUser, matterId: string, action: 'read' | 'write' = 'read'): Promise<void> {
    const matter = await this.prisma.matter.findFirst({
      where: {
        id: matterId,
        organizationId: user.organizationId,
      },
      include: {
        teamMembers: true,
        denyUsers: true,
      },
    });

    if (!matter) {
      throw new ForbiddenException('Matter not found in your organization');
    }

    if (user.membership.role?.name === 'Admin') {
      return;
    }

    const denied = matter.denyUsers.some((item) => item.userId === user.id);
    if (denied) {
      throw new ForbiddenException('You are explicitly denied access to this matter');
    }

    if (matter.ethicalWallEnabled) {
      const member = matter.teamMembers.find((item) => item.userId === user.id);
      if (!member) {
        throw new ForbiddenException('Matter is ethically restricted to team members only');
      }
      if (action === 'write' && member.canWrite === false) {
        throw new ForbiddenException('You do not have write access for this matter');
      }
    }
  }
}
