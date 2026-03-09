import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const appRoot = join(__dirname, '../app');
const generalPageLineLimit = 400;
const legacyRouteEntryCeilings = new Map<string, number>([
  ['ai/page.tsx', 440],
  ['auditor/page.tsx', 412],
  ['matters/page.tsx', 402],
]);
const targetedRouteModuleLineLimits = new Map<string, number>([
  ['admin/page.tsx', 40],
  ['admin/admin-workspace.tsx', 60],
  ['admin/admin-reference-panels.tsx', 180],
  ['admin/admin-conflict-panels.tsx', 280],
  ['admin/use-admin-configuration-forms.ts', 180],
  ['intake/[leadId]/convert/page.tsx', 40],
  ['intake/[leadId]/convert/lead-convert-workspace.tsx', 140],
  ['intake/[leadId]/convert/use-lead-convert-page.ts', 240],
  ['intake/[leadId]/convert/convert-gate-section.tsx', 120],
  ['intake/[leadId]/convert/convert-participants-section.tsx', 220],
  ['intake/[leadId]/convert/convert-ethical-wall-section.tsx', 100],
  ['intake/[leadId]/engagement/page.tsx', 40],
  ['intake/[leadId]/engagement/lead-engagement-workspace.tsx', 180],
  ['intake/[leadId]/engagement/use-lead-engagement-page.ts', 260],
  ['intake/[leadId]/engagement/engagement-recipient-section.tsx', 120],
]);

function collectRoutePages(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const nextPath = join(directory, entry);
    const nextStat = statSync(nextPath);

    if (nextStat.isDirectory()) {
      return collectRoutePages(nextPath);
    }

    return entry === 'page.tsx' ? [nextPath] : [];
  });
}

function countFileLines(path: string) {
  return readFileSync(path, 'utf8').split('\n').length;
}

describe('web route size budgets', () => {
  it('keeps targeted route modules within the decomposition budget', () => {
    const offenders = [...targetedRouteModuleLineLimits.entries()]
      .map(([path, maxLines]) => {
        const absolutePath = join(appRoot, path);
        const actualLines = countFileLines(absolutePath);
        return actualLines > maxLines ? `${path} (${actualLines}/${maxLines})` : null;
      })
      .filter((entry): entry is string => entry !== null);

    expect(offenders).toEqual([]);
  });

  it('keeps all route entry files under the global ceiling', () => {
    const offenders = collectRoutePages(appRoot)
      .map((absolutePath) => {
        const path = relative(appRoot, absolutePath);
        const maxLines = targetedRouteModuleLineLimits.get(path) ?? legacyRouteEntryCeilings.get(path) ?? generalPageLineLimit;
        const actualLines = countFileLines(absolutePath);
        return actualLines > maxLines ? `${path} (${actualLines}/${maxLines})` : null;
      })
      .filter((entry): entry is string => entry !== null);

    expect(offenders).toEqual([]);
  });
});
