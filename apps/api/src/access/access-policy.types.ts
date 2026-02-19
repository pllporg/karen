export type AccessAction = 'read' | 'write';

export type AccessPolicyDecision = 'allow' | 'deny' | 'abstain';

export type AccessPolicyReasonCode =
  | 'MATTER_NOT_FOUND'
  | 'ROLE_ADMIN_BYPASS'
  | 'MATTER_DENY_LIST_MATCH'
  | 'ETHICAL_WALL_DISABLED'
  | 'ETHICAL_WALL_TEAM_MEMBER'
  | 'ETHICAL_WALL_TEAM_REQUIRED'
  | 'ETHICAL_WALL_WRITE_RESTRICTED'
  | 'MATTER_POLICY_DEFAULT_DENY'
  | 'MATTER_POLICY_DEFAULT_ALLOW';

export type AccessPolicyReason = {
  code: AccessPolicyReasonCode;
  policyKey: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export type AccessPolicyRuleResult = {
  decision: AccessPolicyDecision;
  reason?: AccessPolicyReason;
  terminal?: boolean;
};

export type AccessPolicyEvaluation = {
  allowed: boolean;
  decisiveReason: AccessPolicyReason;
  trail: AccessPolicyReason[];
};

export interface AccessPolicyRule<Context> {
  key: string;
  evaluate(context: Context): AccessPolicyRuleResult;
}
