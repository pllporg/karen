import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';

describe('provider readiness evidence export script', () => {
  it('exports json and markdown artifacts with provider rows + blocking issues', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'kar99-evidence-'));
    const jsonOut = join(outDir, 'provider-readiness-evidence.json');
    const mdOut = join(outDir, 'provider-readiness-evidence.md');

    const server = createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (req.url === '/auth/login' && req.method === 'POST') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ token: 'test-token', user: { id: 'ops-user' } }));
        return;
      }

      if (req.url === '/ops/provider-status') {
        expect(req.headers['x-session-token']).toBe('test-token');
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            profile: 'staging',
            healthy: false,
            evaluatedAt: '2026-02-20T10:30:00.000Z',
            providers: [
              {
                key: 'email',
                mode: 'resend',
                critical: true,
                healthy: false,
                issues: ['Missing required configuration: RESEND_API_KEY'],
                missingEnv: ['RESEND_API_KEY'],
              },
              {
                key: 'sms',
                mode: 'twilio',
                critical: false,
                healthy: true,
                issues: [],
              },
            ],
          }),
        );
        return;
      }

      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    const result = await new Promise<{ code: number | null; stderr: string }>((resolve) => {
      const child = spawn(
        'node',
        [
          'tools/ops/capture_provider_status_evidence.mjs',
          '--api-base',
          `http://127.0.0.1:${port}`,
          '--json-out',
          jsonOut,
          '--md-out',
          mdOut,
        ],
        {
          cwd: join(__dirname, '../../..'),
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      let stderr = '';
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      child.on('close', (code) => resolve({ code, stderr }));
    });

    await new Promise<void>((resolve) => server.close(() => resolve()));

    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');

    const evidence = JSON.parse(readFileSync(jsonOut, 'utf8')) as {
      requirement: string;
      environmentProfile: string;
      providerCount: number;
      blockingIssues: Array<{ provider: string; issue: string }>;
    };

    expect(evidence.requirement).toBe('REQ-RC-013');
    expect(evidence.environmentProfile).toBe('staging');
    expect(evidence.providerCount).toBe(2);
    expect(evidence.blockingIssues).toEqual([
      expect.objectContaining({
        provider: 'email',
        issue: 'Missing required configuration: RESEND_API_KEY',
      }),
    ]);

    const markdown = readFileSync(mdOut, 'utf8');
    expect(markdown).toContain('# Provider Readiness Evidence');
    expect(markdown).toContain('| email | resend | yes | no | Missing required configuration: RESEND_API_KEY |');
    expect(markdown).toContain('- [ ] email: Missing required configuration: RESEND_API_KEY (missing env: RESEND_API_KEY)');

    rmSync(outDir, { recursive: true, force: true });
  });
});
