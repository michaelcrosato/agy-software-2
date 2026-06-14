# AnswerFlow AI (`answerflow-ai`)

A Next.js + Prisma/SQLite **application skeleton** for a future B2B RFP / security-questionnaire answering tool. Today it is a working shell — app scaffold, data layer, deploy pipeline, and test rig — **not** the answering product its name implies. Read the [engineering review](docs/ENGINEERING_REVIEW.md) before trusting any other description of this repo.

> **Honest status (2026-06-14):** ~5% built. What works: a dark-themed dashboard that lists seeded projects, a Prisma 7 + SQLite data model with a synthetic seed, a `/api/health` probe, and a Docker + Fly.io deploy path. What does **not** exist yet: document upload, parsing, the RAG/retrieval engine, answer generation, the answer verifier, the review workspace, export, and authentication. There is no second page; two of the three nav links currently 404.

## What it does today

- Serves a single dashboard page (`/`) that lists projects from the database with a question count, or a plain-English empty state if the DB is unreachable.
- Ships a deterministic, idempotent **synthetic** seed (3 users, 1 project, 10 questions, 2 drafted answers, 3 policy sources, 15 text chunks) for demos and tests.
- Exposes `GET /api/health` → `{"status":"ok"}` (DB-free liveness probe for Fly.io).
- Builds as a standalone Next.js server and deploys to Fly.io with a volume-backed SQLite database.

That's the whole application. The product vision (local RAG, multi-format ingest, answer generation with citation validation, collaborative review, original-format export) lives only as design notes — see [Roadmap & vision](#roadmap--vision).

## Architecture

```
Browser ──▶ Next.js 16 App Router (src/app)
              ├─ page.tsx        async server component, reads Project via Prisma
              ├─ api/health      static liveness probe
              └─ layout + Navbar app shell (inline-styled, dark theme)
                     │
                     ▼
            src/lib/prisma.ts   PrismaClient singleton (better-sqlite3 adapter)
                     │
                     ▼
              SQLite (prisma/dev.db locally; /data/answerflow.db on Fly volume)
```

- **Data model** (`prisma/schema.prisma`): `User`, `Project`, `Question`, `Answer` (1:1 to Question), `Source`, `Chunk` (n:1 to Source). Cascade deletes; statuses are free-text strings (SQLite has no enums). **Note:** `Answer`, `Source`, and `Chunk` are currently written only by the seed — no runtime code reads or produces them yet.
- **No UI API layer:** the dashboard reads Prisma directly in the server component. The only route handler is `/api/health`.
- **Styling:** Tailwind 4 is installed and a theme is declared in `globals.css`, but components use inline `style={{}}` with CSS variables. (Flagged as debt in the review.)

## Stack

- Next.js 16.2.9 (App Router) · React 19.2.0
- Prisma 7.8.0 + SQLite via the `@prisma/adapter-better-sqlite3` driver adapter
- Tailwind CSS 4.3.0 (CSS-first `@theme`) · `lucide-react` icons
- TypeScript 6 · Vitest 4 (unit/integration) · Playwright 1.60 (E2E)
- Deploy: multi-stage Docker on `node:24-bookworm-slim` → Fly.io (`answerflow-staging`)
- License: MIT

## Run / develop

Requires Node 24 (matches CI and the Docker base) and npm.

```bash
npm install          # installs deps; postinstall runs `prisma generate`
npm run seed         # `prisma db push` + seed prisma/dev.db with synthetic data
npm run dev          # Next dev server on http://localhost:3000
```

Useful scripts (from `package.json`):

```bash
npm run build        # next build (standalone output)
npm run test         # vitest run — unit + integration suites
npm run e2e          # installs Chromium, runs Playwright against tests/e2e
npm run lint         # biome lint over scripts + src
npm run typecheck    # tsc --noEmit
```

The repository-wide gate (typecheck + lint + tests + engine meta-checks) is `bash scripts/verify.sh` (add `--e2e` for browser tests). This is the same gate CI runs.

## Deploy

Deploys to the Fly.io app **`answerflow-staging`** (`fly.toml`), single instance, scale-to-zero, with a persistent volume `answerflow_data` mounted at `/data` holding the SQLite file (`DATABASE_URL=file:/data/answerflow.db`). The image bakes a synthetic seed DB and, on first boot, copies it onto the volume if none exists. Health is checked at `/api/health`.

First-time setup and the deploy/update/reset commands are documented step-by-step in **[docs/DEPLOY.md](docs/DEPLOY.md)**. Short version once `fly` is installed and you're authed:

```bash
fly launch --no-deploy                         # reads fly.toml, creates the app
fly volumes create answerflow_data --size 1 --region iad
fly deploy                                      # build, push, run
```

**Operational caveats** (see the review's Security section): SQLite-on-a-volume means single-instance only, the volume is the **only** copy of the data (no managed backups), and `prisma db push` is the only migration mechanism (unsafe for destructive schema changes). Fine for a staging demo; not production-ready for real customer data.

## Roadmap & vision

- **Engineering review (read this first):** [docs/ENGINEERING_REVIEW.md](docs/ENGINEERING_REVIEW.md) — honest assessment, file:line findings, branch analysis, ranked debt.
- **Prioritized roadmap:** [roadmap/ROADMAP.md](roadmap/ROADMAP.md).
- **Product vision / salvage notes:** [docs/research/answerflow-reviews/](docs/research/answerflow-reviews/) — a review of a deleted sibling repo (`claude-software-5`) that actually built the RAG/verifier/export core. The full 1,910-line product PRD (`GOAL.md`) referenced there is **not in this repo** and must be recovered from the `claude-software-5` bundle/GitHub before serious work resumes.

## How this repo is operated

This is a 100%-AI-built project run by an autonomous "operations engine" (the `.claude/` config, `CLAUDE.md`, `AI_OPERATIONS_PLAN.md`, `OPERATOR_GUIDE.md`, and the `scripts/` gate/state tooling). That machinery is infrastructure for *how* features get built; it is not part of the product. If you only care about the application, look at `src/`, `prisma/`, and `tests/`.
