# F-0002 Build Notes

## What was built
- `prisma/schema.prisma` — Prisma 7 schema with models User, Project, Question, Answer, Source, Chunk. Generator uses `provider = "prisma-client"` with `output = "./generated"` (Prisma 7 requirement).
- `prisma.config.ts` — root config using `defineConfig` from `prisma/config`. Datasource URL defaults to `file:./prisma/dev.db`, overridable via `DATABASE_URL`.
- `prisma/seed.ts` — thin CLI entry: imports shared prisma client and calls the exported `seed()` function.
- `src/lib/prisma.ts` — shared client singleton using `PrismaBetterSqlite3` adapter (required by Prisma 7 for SQLite), with globalThis cache for Next.js hot-reload.
- `src/lib/seed.ts` — exported `async function seed(prisma)` with full deterministic fixture data (3 sources, 15 chunks, 1 project, 10 questions, 2 answers, 3 users). Deletes all rows before inserting with stable hardcoded IDs — fully idempotent.
- `tests/seed.test.ts` — integration test with `// @vitest-environment node`, runs `npm run seed` twice via `execSync`, asserts all counts and data shapes via the shared prisma client.
- `package.json` — added `postinstall: "prisma generate"` and `seed: "prisma db push && tsx prisma/seed.ts"` scripts; added allowScripts for `prisma`, `@prisma/engines`, `better-sqlite3`.
- `.gitignore` — added entries for `prisma/dev.db`, `prisma/dev.db-journal`, `prisma/*.db-wal`, `prisma/*.db-shm`, `prisma/generated/`.

## Deviations from brief
None. All API shapes matched the brief exactly:
- `defineConfig` from `prisma/config` had the shape described (`schema`, `datasource`, `migrations`)
- `PrismaBetterSqlite3` constructor signature matched (`{ url: string }`)
- `prisma.config.ts` loaded correctly by `npx prisma` CLI
- Generated client at `prisma/generated/` — confirmed gitignored, TypeScript resolves it via relative import

## Observations
1. `npm approve-scripts` wrote `"allowScripts"` section to package.json (not `.npmrc`). This is the npm 11 allow-scripts mechanism. The `esbuild` and `sharp` packages were already present and warned, per brief: sharp was not approved (out of scope). `esbuild` was also not approved (not in the brief's approval list) — it appears to be a tsx/vitest transitive dep but functions correctly without running its postinstall (pre-built binaries ship with the package).
2. TypeScript `tsc --noEmit` passes cleanly. The generated client at `prisma/generated/` has `// @ts-nocheck` at the top and `// biome-ignore-all lint: generated file` so it passes both gates without issue.
3. `npm ci` ran cleanly (exit 0) after all dependency additions.
4. `vitest run` picked up `seed.test.ts` automatically — no changes to vitest.config.ts needed. The `// @vitest-environment node` directive at the top of the file overrides the global `jsdom` environment correctly.
5. The brief says 15 chunks total (5 per source, 3 sources). The `≥12 chunks` requirement is satisfied (15 ≥ 12). The integration test asserts the exact count of 15 and also `≥10` as per acceptance criteria.
