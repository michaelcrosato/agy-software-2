# TICKET002

## Status
- done

## Priority
- P1

## Goal
- Provide a repeatable AFK maintenance loop with non-destructive agent scripts and status reporting.

## Context
- `agent:*` command surface does not exist; checks are not standardized for autonomous sessions.

## Scope
- In: `scripts/agent/{doctor,doctor.sh,status.sh,check.sh,lint.sh,typecheck.sh,format.sh,test.sh}.sh`, `scripts/agent/common.sh`, `package.json`
- Out: major feature changes

## Likely files
- `scripts/agent/common.sh`
- `scripts/agent/doctor.sh`
- `scripts/agent/status.sh`
- `scripts/agent/check.sh`
- `scripts/agent/lint.sh`
- `scripts/agent/typecheck.sh`
- `scripts/agent/format.sh`
- `scripts/agent/test.sh`
- `package.json`

## Steps
- Add shared shell utilities for package manager detection and script reuse.
- Add each required agent command wrapper with `set -euo pipefail`.
- Ensure missing checks return explicit skip logs, not failures.
- Add package scripts (`agent:doctor`, `agent:status`, etc.).

## Acceptance Criteria
- [ ] `npm run agent:status` runs and prints package manager and git context.
- [ ] `npm run agent:check` runs lint/typecheck/test/format in a deterministic order.
- [ ] Missing scripts are reported as `[agent:skip]`.
- [ ] Nonexistent Makefile/Justfile targets are skipped safely.

## Commands
- `npm run agent:status`
- `npm run agent:doctor`
- `npm run agent:check`
- `npm run agent:lint`
- `npm run agent:typecheck`
- `npm run agent:test`
- `npm run agent:format`

## Risks
- No-op environments without Bash will fail for these wrappers until dependencies are installed.

## Notes
- Keep scripts additive only; do not replace PowerShell-based tooling.
