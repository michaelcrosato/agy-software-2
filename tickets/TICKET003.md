# TICKET003

## Status
- done

## Goal
- Add AFK documentation backbone and fix a high-confidence production configuration bug.

## Context
- Root docs are fragmented and not aligned to a single AFK workflow, while `.env` defaults conflict with runtime Prisma fallback path.

## Scope
- In: `GOAL.md`, `ROADMAP.md`, `AGENTS.md`, `docs/ai/REPO_MAP.md`, `.aiignore`, `.env`, `.env.example`, `tickets/*`
- Out: user-facing feature implementation

## Likely files
- `GOAL.md`
- `ROADMAP.md`
- `AGENTS.md`
- `docs/ai/REPO_MAP.md`
- `.aiignore`
- `.env`
- `.env.example`

## Steps
- Add repo map and AFK contract documents.
- Add ignore policy for common generated/artifact paths.
- Normalize `DATABASE_URL` default to `file:./prisma/dev.db`.
- Add a pointer file for autonomous toolchains (`CLAUDE.md`, `.cursor/rules`).

## Acceptance Criteria
- [ ] `GOAL.md`, `ROADMAP.md`, `AGENTS.md`, and `docs/ai/REPO_MAP.md` exist at expected paths.
- [ ] `.aiignore` contains generated/build/cache directories and binary/log artifacts.
- [ ] `.env` and `.env.example` use matching `DATABASE_URL` default path.
- [ ] `CLAUDE.md` and `.cursor/rules` point to `AGENTS.md`.
- [ ] Ticket evidence references are in this file and linked in `ROADMAP.md`.

## Commands
- `git diff -- .env .env.example`
- `Get-Content .env | Select-Object -First 1`
- `Get-Content .env.example | Select-Object -First 1`

## Risks
- Developers relying on an older root database file path need to move/reseed manually.

## Notes
- This ticket is intentionally small and low-risk; no business logic changed.
