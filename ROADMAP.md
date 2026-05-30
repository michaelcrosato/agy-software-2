# ROADMAP

## Assessment
- Stack: Next.js app directory, TypeScript, Prisma, Vitest, Playwright.
- Current risks: mixed and duplicate agent docs, missing `.aiignore`, no canonical `AGENTS.md`, no executable AFK command layer, and a DB path mismatch in env defaults.
- Current opportunity: small, high-signal changes can make the repo directly executable by autonomous agents.

## Phased plan
- Stabilize tooling
  - Add root agent scripts for bootstrap/doctor/check/test/lint/typecheck/format/status.
  - Expose scripts via `package.json` as `agent:*`.
  - Ensure scripts fail on real failures and skip missing checks explicitly.
- Docs and governance
  - Add root `GOAL.md`, `ROADMAP.md`, `AGENTS.md`, and `docs/ai/REPO_MAP.md`.
  - Keep all automation and conventions documented in one place.
- Bugs and small fixes
  - Fix high-confidence misalignment in database path defaults.
  - Add minimal ticketed test/check coverage where practical.
- Tests and confidence
  - Run lint/typecheck/tests in the new `agent:check` flow.
  - Capture missing or failing checks in tickets.
- Modularity and maintainability
  - Add `.aiignore` and repository maps for token-efficient agent context.
  - Add canonical pointers (`CLAUDE.md`, `.cursor/rules`) to `AGENTS.md`.
- CI/maintenance loop
  - Run and record gate checks from `scripts/agent/status.sh` and `agent:check`.
  - Use ticket loop from `AGENTS.md` for future sessions.

## Prioritized tickets
- `tickets/TICKET001.md` (P1): bootstrap and environment scripts
- `tickets/TICKET002.md` (P1): agent workflow scripts and command surface
- `tickets/TICKET003.md` (P2): docs map + high-confidence bug fix (`DATABASE_URL` alignment)

## Risks and blockers
- Prisma tests may require local sqlite file/seed state to exist.
- E2E checks can fail in non-interactive environments with browser setup differences.
- Existing repository scripts are Windows-oriented; new shell scripts assume Bash availability for `agent:*`.

## Maintenance loop
- Start each session with `AGENTS.md` loop:
  1. Read current docs and top ticket.
  2. Make one small ticket and update it.
  3. Run targeted checks, then focused broader checks.
  4. Update ticket status and docs.
  5. Hand off blockers explicitly.

