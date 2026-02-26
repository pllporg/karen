#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const args = parseArgs({
  options: {
    out: { type: 'string', default: 'artifacts/ops/launch-candidate-signoff.md' },
    requirement: { type: 'string', default: 'REQ-RC-011' },
    issue: { type: 'string', default: 'KAR-97' },
    environment: { type: 'string', default: 'production' },
  },
});

const outPath = resolve(String(args.values.out));
const requirementId = String(args.values.requirement).trim() || 'REQ-RC-011';
const issueKey = String(args.values.issue).trim() || 'KAR-97';
const environment = String(args.values.environment).trim() || 'production';
const generatedAt = new Date().toISOString();

const markdown = `# Launch Candidate UAT + Go-Live Signoff\n\n- Requirement: ${requirementId}\n- Linear issue: ${issueKey}\n- Target environment: ${environment}\n- Generated at: ${generatedAt}\n\n## Final status\n\n- [ ] APPROVED\n- [ ] BLOCKED\n- [ ] APPROVED WITH WAIVERS\n\n## UAT matrix execution\n\n| Role | Owner | Status (PASS / PASS WITH WAIVER / FAIL) | Evidence link(s) | Notes |\n| --- | --- | --- | --- | --- |\n| Release owner (engineering) | | | | |\n| On-call engineer | | | | |\n| Security reviewer | | | | |\n| Product/UAT approver | | | | |\n| Ops owner | | | | |\n\n## Acceptance evidence checklist\n\n- [ ] Commit hash and release tag candidate recorded\n- [ ] \`pnpm test\` output attached\n- [ ] \`pnpm build\` output attached\n- [ ] \`pnpm test:provider-live\` output attached (or approved exception)\n- [ ] \`pnpm test:integrations-live\` output attached (or approved exception)\n- [ ] Migration rehearsal evidence attached\n- [ ] Backup/restore drill artifact attached (\`artifacts/ops/rc011-drill-evidence.json\`)\n- [ ] Provider readiness artifacts attached (\`artifacts/ops/provider-readiness-evidence.json\` and \`artifacts/ops/provider-readiness-evidence.md\`)\n- [ ] Security final sweep notes attached\n- [ ] UAT matrix completed with owner signoff timestamps\n- [ ] Linear issue evidence links added\n\n## Rollback criteria\n\nRollback if any gate fails during launch window:\n\n- [ ] Critical (SEV-1) incident unresolved after 15 minutes\n- [ ] API 5xx rate >= 5% for 10+ minutes\n- [ ] Critical provider unhealthy at cutover\n- [ ] Security or tenant-isolation regression\n- [ ] Migration integrity/data-loss risk identified\n\n## Signatures\n\n| Owner role | Name | Timestamp (UTC) | Decision |\n| --- | --- | --- | --- |\n| Engineering release owner | | | |\n| Operations/on-call owner | | | |\n| Security reviewer | | | |\n\n## Follow-up actions (waivers/incidents)\n\n| Action | Owner | Due date | Tracking link |\n| --- | --- | --- | --- |\n| | | | |\n`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, markdown);

console.log(`Generated launch candidate signoff package -> ${outPath}`);
