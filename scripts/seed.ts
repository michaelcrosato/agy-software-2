import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';

/**
 * seed.ts — deterministic synthetic seed data for manual QA and E2E runs (plan §3, §7.1).
 *
 * verify.sh --e2e hard-codes this path, but scripts/ is guardrail surface that
 * product features never touch — so this shim delegates to the product-owned
 * `npm run seed` (defined by F-0002). Rules that survive any stack:
 *  - Synthetic data only — never copies of live customer data (compliance boundary, plan §6.2).
 *  - Deterministic + idempotent — same state every run; dev/ephemeral databases only.
 *  - Refuses production — bail if the connection target looks like prod.
 *  - No silent pass in product mode — src/ present without a seed script is a FAILURE.
 */

const target = process.env.DATABASE_URL ?? '';
if (/prod/i.test(target)) {
  console.error('[seed] REFUSING: connection string looks like production.');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>;
};

if (pkg.scripts?.seed) {
  const result = spawnSync('npm', ['run', '--silent', 'seed'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  process.exit(result.status ?? 1);
}

if (fs.existsSync('src')) {
  console.error('[seed] FAILED: product code exists (src/) but package.json defines no "seed" script — the E2E gate must not pass unseeded.');
  process.exit(1);
}

console.log('[seed] template stub — no product schema yet. F-0002 defines the `seed` npm script this shim delegates to.');
process.exit(0);
