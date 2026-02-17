# AI Ingestion Security Verification

Requirement: `REQ-AI-002`  
Scope: verify prompt-injection defenses across ingestion and generation with explicit citation-policy enforcement and auditability.

## Artifact

- API hardening: `apps/api/src/ai/ai.service.ts`
- API tests: `apps/api/test/ai-ingestion-security.spec.ts`
- Signal scanner unit tests: `apps/api/test/prompt-injection-filter.util.spec.ts`

## Coverage Mapping

- High-risk prompt-injection quarantine:
  - ingestion metadata now persists `quarantinedFromContext` for high-severity findings
  - ingest response and audit event include `quarantinedChunks`
  - blocked/quarantined chunks remain excluded from AI context retrieval
- Citation enforcement in generation:
  - AI tool execution enforces trusted source citations using matter-context chunk IDs
  - if model output omits trusted citations, service appends canonical `Sources: [chunk:...]` references
  - policy metadata records citation mode and requirement satisfaction (`embedded` vs `appended`)
- Governance and audit trail:
  - artifact metadata includes `policyCompliance` and retrieval stats
  - audit event `ai.output.citation_policy_enforced` emitted when citations are auto-enforced
- Adversarial verification:
  - tests cover malicious-instruction redaction, blocked chunk exclusion, citation auto-append behavior, and worker-path audit emission

## Verification

- `pnpm --filter api test -- ai-ingestion-security.spec.ts`
- `pnpm --filter api test -- prompt-injection-filter.util.spec.ts`
- `pnpm test`
- `pnpm build`
- `pnpm backlog:sync`
- `pnpm backlog:verify`
- `pnpm backlog:snapshot`
- `pnpm backlog:handoff:check`
