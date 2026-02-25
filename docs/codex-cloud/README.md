# Codex Cloud Lane Packets (RC-1)

These packets are copy/paste prompts for Codex Cloud lane execution.

## Usage

1. Start from latest `main`.
2. Create lane branch.
3. Paste corresponding packet prompt.
4. Require lane verification command completion before PR creation.
5. Do not run backlog sync in Cloud lanes.

## Lane Packets

1. Reliability lane packet: `docs/codex-cloud/lane-a-reliability.packet.md`
2. Usability lane packet: `docs/codex-cloud/lane-b-no-id-usability.packet.md`

## Local Orchestrator Only

Run these locally after merges:

```bash
pnpm rc1:orchestrator:post-merge
```

