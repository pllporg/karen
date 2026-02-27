# Codex Cloud Lane Packets (RC-1 Archived)

These packets are historical RC-1 prompts.

Current execution policy is:

- `docs/OPERATIONS_PLAYBOOK.md`
- `docs/ACTIVE_PHASES.md`

## Usage

1. Start from latest `main`.
2. Create lane branch.
3. Paste corresponding packet prompt.
4. Require lane verification command completion before PR creation.
5. Do not run backlog sync in Cloud lanes.
6. Return results using `docs/templates/CODEX_CLOUD_REPORT_TEMPLATE.md`.

## Lane Packets

1. Reliability lane packet: `docs/codex-cloud/lane-a-reliability.packet.md`
2. Usability lane packet: `docs/codex-cloud/lane-b-no-id-usability.packet.md`

## Local Orchestrator Only (Current)

Run these locally after merges:

```bash
pnpm ops:housekeeping
```
