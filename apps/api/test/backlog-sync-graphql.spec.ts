import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Backlog sync GitHub discovery', () => {
  const commonPath = join(__dirname, '../../../tools/backlog-sync/common.mjs');
  const syncPath = join(__dirname, '../../../tools/backlog-sync/linear_to_github.mjs');
  const verifyPath = join(__dirname, '../../../tools/backlog-sync/verify_backlog_sync.mjs');

  it('defines shared GitHub GraphQL issue-list helper', () => {
    const common = readFileSync(commonPath, 'utf8');
    expect(common).toContain('export async function githubGraphQL');
    expect(common).toContain("`${GITHUB_API_URL}/graphql`");
    expect(common).toContain('export async function listGitHubIssuesGraphQL');
    expect(common).toContain('repository(owner: $owner, name: $repo)');
  });

  it('uses GraphQL issue discovery in linear_to_github mirror sync', () => {
    const syncScript = readFileSync(syncPath, 'utf8');
    expect(syncScript).toContain('listGitHubIssuesGraphQL');
    expect(syncScript).not.toContain('/repos/${owner}/${repo}/issues?');
  });

  it('uses GraphQL issue discovery in verify_backlog_sync', () => {
    const verifyScript = readFileSync(verifyPath, 'utf8');
    expect(verifyScript).toContain('listGitHubIssuesGraphQL');
    expect(verifyScript).not.toContain('/repos/${owner}/${repo}/issues?state=all&labels=');
  });
});
