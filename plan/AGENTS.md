# AGENTS

## Canonical instructions for autonomous coding

### Read-first order
- `/plan/AGENTS.md`
- `/plan/ROADMAP.md`
- `/plan/PROGRESS.md`
- `/plan/BLOCKED.md`
- `/plan/JOURNAL.md`

### Autonomous loop (OMNI-LOOP)
- [A] AUDIT & RECON: Map codebase, test gaps, establish REPO BASELINE.
- [B] RESEARCH: Identify best practices, tech debt, security, edge cases.
- [C] PLAN: Extend ROADMAP and write atomic `specs/NNN_*.md`.
- [D] EXECUTE: Code, break app, fuzz, fix, optimize, refactor.
- [R] REPLENISH: Promote BACKLOG, update JOURNAL, loop.

### Command reference
- `npm run agent:bootstrap` to install deps and seed local environment.
- `npm run agent:doctor` to validate workspace/tooling preconditions.
- `npm run agent:status` for a fast workspace and runtime summary.
- `npm run agent:check` to run lint/typecheck/test/format gates.
- `VERIFY_CMD`: `npm run agent:check && npm run test && npm run test:e2e`

### Conventions
- Default package manager is detected by lock file (`pnpm-lock.yaml`, `yarn.lock`, otherwise npm).
- Scripts skip checks that are not present and print explicit `[agent:skip]`.
- Never use destructive VCS commands (`git reset --hard`, `git clean`) in automation.
- Keep changes small and include only ticket-scoped files.
- Update docs before adding new conventions or behavior.
- Prefer existing entry points and tests instead of creating parallel logic.

### Autonomous vs ask
- Proceed autonomously for implementation and documentation updates within existing patterns.
- Ask ONLY IF budget=0 OR env_dead (unrecoverable).

### Token-efficiency notes
- Read `docs/ai/REPO_MAP.md` and only the files touched by ticket scope.
- Avoid large blind scans outside `agent`, `app`, `components`, `lib`, `scripts`, `tests`, `prisma`, `docs`.
- Group related edits in one patch.

### Completion criteria
- Spec status updated to `done` in `PROGRESS.md`.
- `VERIFY_CMD` passes with 0 exit code.
- Required docs are updated when behavior or commands change.
