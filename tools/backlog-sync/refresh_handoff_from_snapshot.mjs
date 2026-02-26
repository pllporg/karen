#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const snapshotPath = path.join(process.cwd(), 'tools', 'backlog-sync', 'session.snapshot.json');
const handoffPath = path.join(process.cwd(), 'docs', 'SESSION_HANDOFF.md');

async function main() {
  const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
  const handoff = await readFile(handoffPath, 'utf8');

  const snapshotTimestamp = String(snapshot.generatedAt || '').trim();
  const lastVerify = String(snapshot.operational?.lastSuccessfulBacklogVerifyAt || '').trim();

  if (!snapshotTimestamp) {
    throw new Error(`Snapshot is missing generatedAt: ${snapshotPath}`);
  }

  let updated = handoff;
  const snapshotPattern = /Snapshot Timestamp:\s*`[^`]+`/;
  const verifyPattern = /Last Successful Mirror Verify:\s*`[^`]*`/;

  if (!snapshotPattern.test(updated)) {
    throw new Error(`Could not locate Snapshot Timestamp marker in ${handoffPath}`);
  }
  if (!verifyPattern.test(updated)) {
    throw new Error(`Could not locate Last Successful Mirror Verify marker in ${handoffPath}`);
  }

  updated = updated.replace(snapshotPattern, `Snapshot Timestamp: \`${snapshotTimestamp}\``);
  updated = updated.replace(verifyPattern, `Last Successful Mirror Verify: \`${lastVerify}\``);

  if (updated !== handoff) {
    await writeFile(handoffPath, updated, 'utf8');
    console.log(`Updated handoff timestamps in ${path.relative(process.cwd(), handoffPath)}`);
  } else {
    console.log('Handoff timestamps already current');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
