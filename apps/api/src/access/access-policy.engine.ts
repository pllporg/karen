import {
  AccessPolicyEvaluation,
  AccessPolicyReason,
  AccessPolicyRule,
  AccessPolicyRuleResult,
} from './access-policy.types';

function normalizeRuleResult(result: AccessPolicyRuleResult): AccessPolicyRuleResult {
  if (!result.reason) {
    return result;
  }

  return {
    ...result,
    reason: {
      ...result.reason,
      metadata: result.reason.metadata ? { ...result.reason.metadata } : undefined,
    },
  };
}

export function evaluateAccessPolicies<Context>(
  context: Context,
  rules: AccessPolicyRule<Context>[],
  fallbackAllowReason: AccessPolicyReason,
): AccessPolicyEvaluation {
  const trail: AccessPolicyReason[] = [];
  let lastAllowReason: AccessPolicyReason | null = null;

  for (const rule of rules) {
    const rawResult = rule.evaluate(context);
    const result = normalizeRuleResult(rawResult);

    if (result.decision === 'abstain') {
      continue;
    }

    if (result.reason) {
      trail.push(result.reason);
    }

    if (result.decision === 'deny') {
      return {
        allowed: false,
        decisiveReason:
          result.reason ||
          ({
            code: 'MATTER_POLICY_DEFAULT_DENY',
            policyKey: rule.key,
            message: 'Access denied.',
          } as AccessPolicyReason),
        trail,
      };
    }

    if (result.decision === 'allow') {
      lastAllowReason = result.reason || lastAllowReason;
      if (result.terminal) {
        const decisiveReason = lastAllowReason || fallbackAllowReason;
        if (!result.reason) {
          trail.push(decisiveReason);
        }
        return {
          allowed: true,
          decisiveReason,
          trail,
        };
      }
    }
  }

  const decisiveReason = lastAllowReason || fallbackAllowReason;
  if (!lastAllowReason) {
    trail.push(decisiveReason);
  }

  return {
    allowed: true,
    decisiveReason,
    trail,
  };
}
