export type PromptInjectionSeverity = 'none' | 'medium' | 'high';

export type PromptInjectionFinding = {
  signalId: string;
  severity: PromptInjectionSeverity;
  description: string;
  count: number;
};

export type PromptInjectionScanResult = {
  sanitizedText: string;
  detected: boolean;
  redactionCount: number;
  maxSeverity: PromptInjectionSeverity;
  blockedFromAiContext: boolean;
  findings: PromptInjectionFinding[];
};

type SignalDefinition = {
  id: string;
  severity: Exclude<PromptInjectionSeverity, 'none'>;
  description: string;
  pattern: RegExp;
};

const REDACTION_TOKEN_PREFIX = '[FILTERED_UNTRUSTED_INSTRUCTION';

const SIGNAL_DEFINITIONS: SignalDefinition[] = [
  {
    id: 'override-instructions',
    severity: 'high',
    description: 'Instruction override attempt',
    pattern: /\b(?:ignore|disregard|forget)\s+(?:all|any|the|previous|prior|above)?\s*instructions?\b/gi,
  },
  {
    id: 'prompt-exfiltration',
    severity: 'high',
    description: 'System/developer prompt exfiltration attempt',
    pattern: /\b(?:reveal|show|print|expose|leak)\s+(?:the\s+)?(?:system|developer)\s+prompt\b/gi,
  },
  {
    id: 'credential-exfiltration',
    severity: 'high',
    description: 'Credential exfiltration attempt',
    pattern: /\b(?:api\s*key|access\s*token|secret(?:s)?|password(?:s)?)\b.{0,60}\b(?:reveal|output|print|show|exfiltrat)\w*/gi,
  },
  {
    id: 'role-impersonation',
    severity: 'medium',
    description: 'Role impersonation attempt',
    pattern: /\b(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be)\s+(?:the\s+)?(?:system|developer|admin)\b/gi,
  },
  {
    id: 'tool-call-injection',
    severity: 'medium',
    description: 'Tool invocation injection attempt',
    pattern: /\b(?:call_tool|tool_call|function_call|execute\s+this\s+command)\b/gi,
  },
];

export function scanAndSanitizeUntrustedText(text: string): PromptInjectionScanResult {
  let sanitizedText = text;
  const findings: PromptInjectionFinding[] = [];
  let redactionCount = 0;

  for (const signal of SIGNAL_DEFINITIONS) {
    const matches = sanitizedText.match(signal.pattern);
    const count = matches?.length || 0;
    if (!count) continue;

    redactionCount += count;
    sanitizedText = sanitizedText.replace(signal.pattern, `${REDACTION_TOKEN_PREFIX}:${signal.id}]`);
    findings.push({
      signalId: signal.id,
      severity: signal.severity,
      description: signal.description,
      count,
    });
  }

  const maxSeverity = determineMaxSeverity(findings);
  const detected = findings.length > 0;

  return {
    sanitizedText,
    detected,
    redactionCount,
    maxSeverity,
    blockedFromAiContext: maxSeverity === 'high',
    findings,
  };
}

function determineMaxSeverity(findings: PromptInjectionFinding[]): PromptInjectionSeverity {
  if (findings.some((finding) => finding.severity === 'high')) return 'high';
  if (findings.some((finding) => finding.severity === 'medium')) return 'medium';
  return 'none';
}

