# Codex Cloud Lane Packets (Archived)

This folder contains historical Codex Cloud lane packets.
Active execution has moved to Symphony with a repo-owned `WORKFLOW.md`.

Current execution policy is:

- `docs/OPERATIONS_PLAYBOOK.md`
- `docs/ACTIVE_PHASES.md`

## Historical Usage

1. Start from latest `main`.
2. Create lane branch.
3. Paste corresponding packet prompt.
4. Require lane verification command completion before PR creation.
5. Do not run backlog sync in Cloud lanes.
6. Return results using `docs/templates/SYMPHONY_RUN_REPORT_TEMPLATE.md`.

## Lane Packets

1. Reliability lane packet: `docs/codex-cloud/lane-a-reliability.packet.md`
2. Usability lane packet: `docs/codex-cloud/lane-b-no-id-usability.packet.md`
3. EVE-2 wave packet: `docs/codex-cloud/eve2-wave-20260227.packet.md`

Notes:

1. `lane-a-*` and `lane-b-*` are RC-1 historical packets.
2. `eve2-wave-20260227.packet.md` is the current active multi-lane packet.

## Local Orchestrator Only (Legacy)

Run these locally after merges:

```bash
pnpm ops:housekeeping
```
