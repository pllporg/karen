import { AuthenticatedUser } from '../common/types';
import { evaluateAccessPolicies } from './access-policy.engine';
import {
  AccessAction,
  AccessPolicyEvaluation,
  AccessPolicyReason,
  AccessPolicyRule,
} from './access-policy.types';

type MatterAccessPolicyContext = {
  user: AuthenticatedUser;
  action: AccessAction;
  matter: {
    id: string;
    ethicalWallEnabled: boolean;
    teamMembers: Array<{ userId: string; canWrite: boolean | null }>;
    denyUsers: Array<{ userId: string }>;
  };
};

const DEFAULT_ALLOW_REASON: AccessPolicyReason = {
  code: 'MATTER_POLICY_DEFAULT_ALLOW',
  policyKey: 'matter.policy.default-allow',
  message: 'Matter access granted.',
};

const MATTER_ACCESS_RULES: AccessPolicyRule<MatterAccessPolicyContext>[] = [
  {
    key: 'matter.policy.admin-bypass',
    evaluate: ({ user }) => {
      if (user.membership.role?.name !== 'Admin') {
        return { decision: 'abstain' };
      }
      return {
        decision: 'allow',
        terminal: true,
        reason: {
          code: 'ROLE_ADMIN_BYPASS',
          policyKey: 'matter.policy.admin-bypass',
          message: 'Admin role bypass grants matter access.',
        },
      };
    },
  },
  {
    key: 'matter.policy.deny-list',
    evaluate: ({ user, matter }) => {
      const denied = matter.denyUsers.some((item) => item.userId === user.id);
      if (!denied) {
        return { decision: 'abstain' };
      }
      return {
        decision: 'deny',
        terminal: true,
        reason: {
          code: 'MATTER_DENY_LIST_MATCH',
          policyKey: 'matter.policy.deny-list',
          message: 'You are explicitly denied access to this matter',
        },
      };
    },
  },
  {
    key: 'matter.policy.ethical-wall-disabled',
    evaluate: ({ matter }) => {
      if (matter.ethicalWallEnabled) {
        return { decision: 'abstain' };
      }
      return {
        decision: 'allow',
        terminal: true,
        reason: {
          code: 'ETHICAL_WALL_DISABLED',
          policyKey: 'matter.policy.ethical-wall-disabled',
          message: 'Matter is not ethically restricted.',
        },
      };
    },
  },
  {
    key: 'matter.policy.ethical-wall-membership',
    evaluate: ({ user, action, matter }) => {
      const member = matter.teamMembers.find((item) => item.userId === user.id);
      if (!member) {
        return {
          decision: 'deny',
          terminal: true,
          reason: {
            code: 'ETHICAL_WALL_TEAM_REQUIRED',
            policyKey: 'matter.policy.ethical-wall-membership',
            message: 'Matter is ethically restricted to team members only',
          },
        };
      }

      if (action === 'write' && member.canWrite === false) {
        return {
          decision: 'deny',
          terminal: true,
          reason: {
            code: 'ETHICAL_WALL_WRITE_RESTRICTED',
            policyKey: 'matter.policy.ethical-wall-membership',
            message: 'You do not have write access for this matter',
            metadata: { canWrite: member.canWrite },
          },
        };
      }

      return {
        decision: 'allow',
        terminal: true,
        reason: {
          code: 'ETHICAL_WALL_TEAM_MEMBER',
          policyKey: 'matter.policy.ethical-wall-membership',
          message: 'Matter access granted to assigned team member.',
          metadata: { canWrite: member.canWrite, action },
        },
      };
    },
  },
];

export function evaluateMatterAccessPolicy(context: MatterAccessPolicyContext): AccessPolicyEvaluation {
  return evaluateAccessPolicies(context, MATTER_ACCESS_RULES, DEFAULT_ALLOW_REASON);
}

