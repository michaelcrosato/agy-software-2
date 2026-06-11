# Progress Log (newest first — prepend, never append)

## 2026-06-11 — Daily improvement pass

### kaizen
- **Signal:** F-0001's first CI run went red because local `npm install` and CI's `npm ci` disagreed about the lockfile (missing nested optional-peer entry). Cost: one red CI round + one extra builder spawn. Nearly every upcoming feature (Prisma, Playwright, file parsers, exporters) adds dependencies, so this failure mode recurs without a fix.
- **Change:** `scripts/verify.sh` now runs `npm ci --dry-run --no-audit --no-fund` as the first stack gate whenever a package-lock.json exists — the same sync validation CI performs, in ~0.6s, without touching node_modules. Proven both ways: green on the synced tree, and it reproduces CI's exact `Missing: <pkg> from lock file` error on a deliberately desynced package.json.
- **Metric to move:** zero CI failures caused by lockfile desync on future dependency-touching features (check `gh run list` + metrics.jsonl notes next kaizen; baseline: 1 such failure in 1 feature shipped).

## 2026-06-11 — F-0001 shipped: Next.js scaffold under src/, product mode live (PR #7)

- **What:** First product feature. AnswerFlow app scaffolded under `src/` — Next.js 16.2.9 (App Router), React 19.2.0, Tailwind 4.3.0 (CSS-first), dark theme, Navbar + dashboard placeholder, Vitest smoke tests in root `tests/`, npm scripts wired (build / test / lint incl. src). Repo is now in product mode: hard lint/test gates + placeholder scan active. Versions live-verified per P1 before install (README's "Tailwind 3" was stale). Security follow-up pinned seven `"latest"` dep specifiers to lockfile-resolved ranges.
- **Verified:** `bash scripts/verify.sh` green on both branch commits (builder run + orchestrator re-run + post-pinning run) — evidence in `roadmap/evidence/F-0001/` (build.log, test.log, verify.log, verify-pinned.log, notes.md). Evaluator: PASS. Security review: APPROVE (2 low findings, both addressed).
- **Surprises:** (1) Next auto-edits tsconfig.json on first build (`jsx` → `react-jsx`, adds `.next/types` includes) — reconciled; the single root tsconfig serves Next + `tsc --noEmit` + ts-node engine scripts via a `ts-node` override block (NodeNext). (2) Biome's CSS parser chokes on Tailwind v4 `@theme` — `biome.json` linter scoped to TS/JS file types (not a rule weakening; engine meta-gate unaffected). (3) Process: state/evidence can't ride the feature PR (status=done only exists after merge, and `develop` is protected) — each feature now gets a small follow-up record PR. Logged in DECISIONS.md. (4) CI red on first push: local `npm install` and CI's `npm ci` (Node 20/npm 10) disagreed — `tsconfck` (via `vite-tsconfig-paths`) optionally peers `typescript ^5` while we pin TS 6, and the locally-written lock omitted the nested 5.9.3 CI wanted. Fixed by dropping the plugin for Vite's native `resolve.tsconfigPaths` (commit 9ce9345) and proving `npm ci` locally. **Rule for future builders: any dependency change must pass a local `npm ci` before push.**
- **Next step:** `/work` F-0002 (Prisma + SQLite schema + seed fixtures) — its `npm run seed` script name is a gate contract (seed shim delegates to it). F-0003 (Playwright) unlocks after F-0002.

## 2026-06-11 — Crash recovery: groom output committed, engine synced, PRs housekept

- **What:** The operator's machine crashed after the 2026-06-10 `/groom` finished writing but before the session committed. This session recovered: re-ran the gate on the uncommitted tree (green), committed the groom output (19 features + seed.ts shim) and pushed it to `fix/recover-groom-output` → PR to `develop`. Separate commit on the same PR: synced `verify.sh`'s placeholder regex from template PR #23 (`<[A-Z_]{3,}>` → `<[A-Z][A-Z0-9_]{2,}>`) so digit-containing tokens like `<E2E_TEST_FRAMEWORK>` are caught once `src/` lands. Housekeeping: merged dependabot #5 and #4 (green patch bumps), closed stale pre-purge PRs #1/#2/#3 (retired harnesses).
- **Verified:** `bash scripts/verify.sh` green twice (before the recovery commit and after the regex sync) — 19 features valid, 89 hook contract tests pass.
- **Surprises:** `develop` is GitHub-protected (requires the `verify` status check), so the planned direct push was rejected; recovery went through a PR instead. Logged in DECISIONS.md.
- **Next step:** `/work` F-0001 (Next.js scaffold) in a fresh session once this recovery PR is merged. One operator question open (staging host — Fly.io assumed, nothing blocked).

## 2026-06-10 — Groomed: 19 features from all 6 Now/Next bullets

- **What:** `/groom` seeded the backlog: F-0001–F-0009 (P1: skeleton ×4, intake ×2, workspace, RAG engine, cited drafting) from the two "Now" bullets; F-0010–F-0019 (P2: tone profiles, KB pipeline+UI, team/comments/approval, clusters ×2, exports ×2) from the four "Next" bullets. "Later" left unscoped by design. Also hardened the `scripts/seed.ts` gate shim (silent-pass stub → fails unseeded in product mode) as factory work.
- **Verified:** `bash scripts/verify.sh` green (19 features valid, no cycles, 89 hook contract tests pass).
- **Surprises:** gate facts shaped the layout — product mode keys off `src/` (so no root `app/`), the test-wiring guard scans `src/` (so tests live in root `tests/`), and `--e2e` hard-codes `scripts/seed.ts` (hence the shim). All logged in DECISIONS.md.
- **Next step:** `/work` F-0001 (Next.js scaffold). One operator question open (staging host — Fly.io assumed, nothing blocked).

## 2026-06-10 — Engine installed (department bootstrap)

- **What:** The AI operations engine (ai-operations-template) was installed by the portfolio department session: constitution, agents, skills, hooks, gates, CI workflows, fresh roadmap state. Product README.md (the AnswerFlow spec) untouched; old Antigravity harness docs archived to `docs/archive/antigravity-harness/`.
- **Verified:** `bash scripts/init.sh` + `bash scripts/verify.sh` green post-install (template mode — product gates harden when `src/` lands).
- **Surprises:** none yet.
- **Next step:** run `/groom` against `README.md` + `docs/research/answerflow-reviews/` to seed `features.json`, then `/work` the first Phase 1 feature. Note for groom: the deepest product PRD (1,910 lines, 33 sections) is recoverable via the claude-software-5 bundle/GitHub — see the research README.
