# AGENTS

## Canonical instructions for autonomous coding

### Read-first order
- `AGENTS.md`
- `GOAL.md`
- `ROADMAP.md`
- `docs/ai/REPO_MAP.md`
- `tickets/TICKET001.md`

### Autonomous loop
- Read `GOAL.md`, `ROADMAP.md`, `docs/ai/REPO_MAP.md`, and top open ticket.
- Mark exactly one ticket in progress.
- Make minimal scoped edits for one objective.
- Run the smallest useful check(s) first, then broader checks.
- Record outcomes in ticket and repo docs.
- If blocked by missing context, escalate in ticket notes and stop.

### Command reference
- `npm run agent:bootstrap` to install deps and seed local environment.
- `npm run agent:doctor` to validate workspace/tooling preconditions.
- `npm run agent:status` for a fast workspace and runtime summary.
- `npm run agent:check` to run lint/typecheck/test/format gates.
- `npm run agent:lint` for lint only.
- `npm run agent:typecheck` for typecheck only.
- `npm run agent:test` for tests.
- `npm run agent:format` for format checks.

### Conventions
- Default package manager is detected by lock file (`pnpm-lock.yaml`, `yarn.lock`, otherwise npm).
- Scripts skip checks that are not present and print explicit `[agent:skip]`.
- Never use destructive VCS commands (`git reset --hard`, `git clean`) in automation.
- Keep changes small and include only ticket-scoped files.
- Update docs before adding new conventions or behavior.
- Prefer existing entry points and tests instead of creating parallel logic.

### Autonomous vs ask
- Proceed autonomously for implementation and documentation updates within existing patterns.
- Ask only when:
  - secrets/access are missing,
  - external credentials are required,
  - destructive data operations are unavoidable,
  - ambiguous bugfix requires product judgment.

### Token-efficiency notes
- Read `docs/ai/REPO_MAP.md` and only the files touched by ticket scope.
- Avoid large blind scans outside `agent`, `app`, `components`, `lib`, `scripts`, `tests`, `prisma`, `docs`.
- Group related edits in one patch.

### Completion criteria
- Ticket status updated to `in_progress` then `done`.
- Requested checks attempted and failures documented.
- Required docs are updated when behavior or commands change.

