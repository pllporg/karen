import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types';
import { evaluateMatterAccessPolicy } from './matter-access-policy.evaluator';
import { AccessAction, AccessPolicyEvaluation } from './access-policy.types';

type MatterAccessContext = {
  id: string;
  ethicalWallEnabled: boolean;
  teamMembers: Array<{ userId: string; canWrite: boolean | null }>;
  denyUsers: Array<{ userId: string }>;
};

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateMatterAccess(
    user: AuthenticatedUser,
    matterId: string,
    action: AccessAction = 'read',
  ): Promise<AccessPolicyEvaluation> {
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
      return {
        allowed: false,
        decisiveReason: {
          code: 'MATTER_NOT_FOUND',
          policyKey: 'matter.scope.organization',
          message: 'Matter not found in your organization',
        },
        trail: [
          {
            code: 'MATTER_NOT_FOUND',
            policyKey: 'matter.scope.organization',
            message: 'Matter not found in your organization',
            metadata: { matterId },
          },
        ],
      };
    }

    return evaluateMatterAccessPolicy({
      user,
      action,
      matter: matter as MatterAccessContext,
    });
  }

  async assertMatterAccess(user: AuthenticatedUser, matterId: string, action: AccessAction = 'read'): Promise<void> {
    const evaluation = await this.evaluateMatterAccess(user, matterId, action);
    if (!evaluation.allowed) {
      throw new ForbiddenException(evaluation.decisiveReason.message);
    }
  }
}
