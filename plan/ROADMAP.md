# ROADMAP

## Assessment
- Stack: Next.js app directory, TypeScript, Prisma, Vitest, Playwright.
- Current risks: mixed and duplicate agent docs, missing `.aiignore`, no canonical `AGENTS.md`, no executable AFK command layer, and a DB path mismatch in env defaults.
- Current opportunity: small, high-signal changes can make the repo directly executable by autonomous agents.

## Waves
### Wave 0 (P0 QuickWins+Safety): Agent Framework Init
- Move agent state docs (`AGENTS.md`, `ROADMAP.md`, `PROGRESS.md`, `BACKLOG.md`, `BLOCKED.md`, `JOURNAL.md`, `specs/`) to `/plan` directory.
- Establish `VERIFY_CMD` in `/plan/AGENTS.md`.
- Bootstrap state docs for tracking current OMNI-LOOP cycle.

### Wave 1 (P1 Core): App Bootstrap & Verification
- Establish base system functionality.
- Resolve any outstanding DB connection issues.
- Ensure all tests run green (`npm run agent:check`, `npm run test`, `npm run test:e2e`).
- Aggressive interface and workflow exploration of current app.

### Wave 2 (P2 Features): Deep Optimization & Refactoring
- Identify and patch bugs, unhandled exceptions, and bad UI states.
- Improve performance, security, and quality.

## Priority Table
| Wave | Task | Impact | Feasibility | Risk | Fit |
|---|---|---|---|---|---|
| W0 | Init `/plan` structure | High | High | Low | Core |
| W1 | Establish REPO BASELINE | High | High | Med | Core |
| W1 | App Interface Exploration | Med | High | Low | Core |
| W2 | Perf/Security/Code Quality | High | Med | Med | Core |
