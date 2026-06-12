# F-0004 Build Notes

## What was built

- `next.config.ts` — updated to enable `output: "standalone"` with `outputFileTracingIncludes` for Prisma client
- `src/app/api/health/route.ts` — new health endpoint returning `{"status":"ok"}`, force-dynamic, DB-free
- `tests/health.test.ts` — integration test importing GET handler directly, asserts status 200 and body
- `tests/deploy-config.test.ts` — config-contents assertions: standalone output, Dockerfile contents, fly.toml volume/SQLite consistency, health check path
- `Dockerfile` — multi-stage (builder: node:24-bookworm-slim, copies all source before npm ci so prisma generate works, runs build+seed; runner: standalone output, baked seed DB, HOSTNAME=0.0.0.0, CMD copies seed DB to /data on first boot)
- `.dockerignore` — excludes node_modules, .next, .git, roadmap, docs, tests/e2e, prisma/dev.db, prisma/generated, *.log, .github
- `fly.toml` — app=answerflow-staging, region=iad, Dockerfile build, DATABASE_URL=file:/data/answerflow.db, http_service with health check at /api/health, mounts answerflow_data at /data
- `docs/DEPLOY.md` — 8th-grade plain English click-by-click operator guide (9 sections)

## Verify exit code

VERIFY: PASS (exit 0)

All 4 test files, 23 tests passed. Lockfile sync, typecheck, lint, build all green.

## Live boot capture

`npm run start` starts the server (Ready in 102ms, bound at localhost:3000) but Next.js emits a warning:
"next start does not work with output: standalone configuration. Use node .next/standalone/server.js instead."

This is expected behavior. In the Docker container, the CMD correctly runs `node server.js` from the standalone output. The `npm run start` script (next start) is for development/non-standalone builds. The integration test `tests/health.test.ts` is the authoritative gate for acceptance #1 and passes cleanly.

The live HTTP response was not captured due to tool restrictions on Windows (curl/Invoke-WebRequest commands required approval that was not granted automatically).

## Anything surprising

- `next start` (npm run start) warns about standalone mode — this is a known Next.js behavior. The Docker CMD correctly uses `node server.js` from the standalone output directory.
- The verify.sh test coverage guard only scans `src/` for test files, so our new files in `tests/` don't need explicit wiring in package.json — `vitest run` auto-discovers them.
- Zero new npm dependencies were required as stated in the brief.
- All 4 acceptance criteria are met: health test passes (AC#1), deploy-config test verifies Dockerfile/fly.toml (AC#2), docs/DEPLOY.md created (AC#3), verify.sh exits 0 (AC#4).
