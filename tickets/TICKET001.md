# TICKET001

## Status
- done

## Priority
- P1

## Goal
- Make first-run bootstrap deterministic and safe for both fresh and recurring agent sessions.

## Context
- Current setup lacks a canonical bootstrap script and local environment init path for agents.

## Scope
- In: `scripts/agent/bootstrap.sh`, `scripts/agent/common.sh`, `package.json`, `.env.example`
- Out: application business logic

## Likely files
- `scripts/agent/bootstrap.sh`
- `scripts/agent/common.sh`
- `.env.example`
- `package.json`

## Steps
- Add executable-safe bootstrap shell script.
- Ensure script manager detection prefers lockfile hints.
- Add `.env` bootstrap copy when missing.
- Add package wrapper script `agent:bootstrap`.

## Acceptance Criteria
- [ ] Fresh environment installs dependencies with detected package manager.
- [ ] `.env` is created from `.env.example` when absent.
- [ ] Existing Make/Just targets are optionally reused when present.
- [ ] Command `npm run agent:bootstrap` runs successfully without destructive behavior.

## Commands
- `npm run agent:bootstrap`
- `bash scripts/agent/bootstrap.sh`
- `npm pkg get scripts.agent:bootstrap`

## Risks
- Lockfile detection may pick npm even when pnpm is installed.

## Notes
- Treat `agent:bootstrap` as non-network-sensitive; seed behavior happens only via package manager install scripts.
