import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('API lint guardrails', () => {
  const eslintConfigPath = join(__dirname, '../.eslintrc.cjs');

  it('enforces no-require-imports rule', () => {
    const eslintConfig = readFileSync(eslintConfigPath, 'utf8');

    expect(eslintConfig).toContain("'@typescript-eslint/no-require-imports': 'error'");
  });
});
