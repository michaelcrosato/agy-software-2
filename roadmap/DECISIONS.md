# Decisions (append-only)

- 2026-06-10 · Engine install committed directly to `develop` as the bootstrap exception (no PR — there is no CI or manager before the engine exists). Everything after this goes through `feat/F-XXXX` PRs. (department)
- 2026-06-10 · QA deployment surface assumed **Vercel** (conventional for Next.js). Reversible until Phase 1 wires it. (department)
- 2026-06-10 · Database: **SQLite via Prisma** for dev per the product spec ("local-first" is the product's identity). How staging persists data on a serverless host is an open Phase 1 design point for `/groom` — options include Turso/libSQL or a container host; decide-and-document, don't block. (department)
- 2026-06-10 · E2E framework: **Playwright** (already the product spec's choice). (department)
- 2026-06-10 · Old root `GOAL.md`/`ROADMAP.md` (prior Antigravity AFK harness, superseded by this engine) archived to `docs/archive/antigravity-harness/`, not deleted. (department)
