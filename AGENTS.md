# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

AnswerFlow AI is a single Next.js 16 app (not a monorepo). It uses embedded SQLite (`prisma/dev.db`) via Prisma 7 — no separate database server. Draft answers use the local RAG engine in `lib/rag.ts` (no external LLM API).

### Services

| Service | How to run | Port / notes |
|---------|------------|--------------|
| Next.js dev server | `npm run dev` | http://localhost:3000 |
| SQLite | Automatic via `DATABASE_URL=file:./dev.db` | File at `prisma/dev.db` |

Only the Next.js process is required for local development and E2E.

### Standard commands

See `README.md` for full setup. Quick reference:

- Install: `npm install` (runs `postinstall` → `scripts/ensure-sqlite-db.mjs`)
- Env: copy `.env.example` → `.env` (`DATABASE_URL="file:./dev.db"`)
- DB: `npm run seed` (schema push + seed data)
- Dev: `npm run dev`
- Lint: `npm run lint` (ESLint; config intentionally ignores most app source dirs)
- Typecheck: `npm run typecheck`
- Unit tests: `npm run test` (re-seeds, Vitest single worker for SQLite locking)
- E2E: `npm run test:e2e` (re-seeds, Playwright; installs Chromium under `node_modules` via `playwright_browsers_path: "0"`)

### Gotchas

- **Playwright browsers**: First E2E run may need `npx playwright install chromium` if browsers are missing (normally satisfied after `npm install` in this repo).
- **E2E + dev server**: With `CI` unset, Playwright reuses an existing server on port 3000 (`playwright.config.ts`). Set `CI=1` to force Playwright to start its own `webServer`.
- **SQLite locking**: Unit tests use `--maxWorkers=1`; do not raise Vitest parallelism against the same `dev.db`.
- **Seeding resets data**: `npm run test` and `npm run test:e2e` both run `npm run seed` first, wiping and repopulating demo data.

### Hello-world smoke test

After `npm run seed` and `npm run dev`:

1. Open http://localhost:3000 (dashboard metrics).
2. Projects → **Enterprise Security Audit 2026** → review workspace.
3. Select the SSO question → **Draft with AI** (or `POST /api/questions/<id>/ai` with `{"tone":"Concise"}`).

Expected: draft text plus citations from seeded knowledge-base chunks (e.g. Authentication and SSO Policy).
