# REPO_MAP

## Purpose and scope
- This repository is a Next.js 14 TypeScript application for question/project workflows.
- Data is persisted through Prisma + SQLite.
- Primary execution path includes API routes, page routes, and parsing/export utilities.

## Entry points
- `app/layout.tsx`: global app layout shell.
- `app/page.tsx`: home page and project discovery entry.
- `app/projects/page.tsx` and `app/projects/[projectId]/page.tsx`: project-level views and interactions.
- `app/library/page.tsx`: library or source-document listing.
- `app/sources/page.tsx` and `app/team/page.tsx`: supporting pages.
- `app/api/projects/route.ts`: project CRUD and list endpoints.
- `app/api/projects/[id]/route.ts`: project detail/update endpoint.
- `app/api/questions/[id]/route.ts`: question read/update endpoint.
- `app/api/questions/[id]/ai/route.ts`: AI answer augmentation path.
- `app/api/parse-document/route.ts`: document parsing into questions.
- `app/api/library/route.ts`: library data endpoint.
- `app/api/sources/route.ts`: source index endpoint.
- `app/api/users/route.ts`: user-oriented endpoint.

## Core modules
- `lib/prisma.ts`: Prisma client singleton and logging setup.
- `lib/rag.ts`: retrieval and ranking helper for content-aware question workflows.
- `lib/` generally holds backend helpers used by routes.
- `prisma/schema.prisma`: canonical data model.
- `prisma/seed.ts`: seed dataset for tests/dev workflows.
- `scripts/` for local tooling and health checks.
- `tests/` contains parser, duplicate detection, flow, and e2e coverage.

## Configuration
- `package.json`: scripts, dependencies, and project tooling entry.
- `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`.
- `playwright.config.ts`, `vitest.config.ts`.
- `eslint.config.js`.
- `.env.example` and `.env` for database URL defaults.

## Test surface
- Unit/style checks: `npm run lint`, `npm run typecheck`, `npm run test`.
- E2E: `npm run test:e2e`.
- New AFK check surface in `scripts/agent` and package hooks `agent:*`.

## Agents and docs
- Root docs contract files:
  - `AGENTS.md`
  - `GOAL.md`
  - `ROADMAP.md`
  - `tickets/*.md`
- Runtime agent scripts:
  - `scripts/agent/bootstrap.sh`
  - `scripts/agent/doctor.sh`
  - `scripts/agent/status.sh`
  - `scripts/agent/check.sh`
  - `scripts/agent/lint.sh`
  - `scripts/agent/typecheck.sh`
  - `scripts/agent/format.sh`
  - `scripts/agent/test.sh`

## Skip for quick context
- `node_modules`, `.next`, `test-results`, large fixtures in `tests/*.docx|*.pdf`.
- `.aiignore` contains the recommended skip list for autonomous context pulls.

