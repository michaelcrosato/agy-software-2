# Engineering Review — answerflow-ai (`agy-software-2`)

- **Reviewer:** Senior engineering review (adversarial, evidence-based)
- **Date:** 2026-06-14
- **Branch reviewed:** `chore/template-reset-20260614` (product code identical to `develop`)
- **Scope:** the *product* — `src/`, `prisma/`, `tests/`, `public/`, `docs/`, config (`next.config.ts`, `fly.toml`, `Dockerfile`), and every unmerged branch. The freshly-installed ops-engine scaffolding (`CLAUDE.md`, `AGENTS.md`, `AI_OPERATIONS_PLAN.md`, `OPERATOR_GUIDE.md`, `.claude/`, `scripts/*`) is **not** a review target, though gate strength is noted where relevant.

---

## Verdict

**Grade: D+**

What actually exists here is a clean, correct, and well-tested **skeleton**: a Next.js 16 / React 19 app shell with a dark theme, a navbar, a single dashboard page that lists projects, a Prisma 7 + SQLite data layer with a deterministic synthetic seed, a DB-free health endpoint, and a working Docker + Fly.io deploy path. The ~579 lines of TypeScript in `src/` are honest, idiomatic, and exercised by 23 unit/integration tests plus a Playwright E2E that walks the real dashboard. For "four skeleton features," the craftsmanship is genuinely good — the seed is idempotent and synthetic, the deploy config is thought-through (standalone tracing of the out-of-`node_modules` Prisma client, volume-backed SQLite, `HOSTNAME=0.0.0.0`), and the test that asserts the DB file lives *under* the mounted volume is a non-trivial invariant.

The grade is a D+ rather than a B because **the repository lies about what it is.** The product is named "AnswerFlow AI," an RFP/questionnaire answering tool. There is **zero** answering functionality: no document upload, no parsing, no RAG/retrieval engine, no answer generation, no review workspace, no export, no auth, no second page. The data model has `Question`, `Answer`, `Source`, `Chunk` tables — and nothing reads or writes `Answer`, `Source`, or `Chunk` outside the seed. Meanwhile the **root `README.md` describes a complete, shipping product** (BM25+cosine RAG, six answer personas, pdf-parse/mammoth ingestion, a column-mapper UI, collaborative review, similarity clustering, "Premium Export Workflows," sensitive-claim redaction) that **does not exist in a single line of `src/`**, references files and dependencies that aren't in the repo, and credits "the Google DeepMind Antigravity Team." A reader cannot trust the repo's own description of itself. The `roadmap/PROGRESS.md` on this branch makes the same class of error in the opposite direction (claims features F-0026/F-0028 shipped and "31/31 passing" — features that never existed in this repo's history). A skeleton that misrepresents itself this badly is worse than an honest empty repo: it wastes the next engineer's first day. Hence D+: solid bones, dishonest skin.

---

## What this actually is

A four-feature skeleton, software-complete as a *shell* only:

| Feature | What it delivers | Real? |
|---|---|---|
| F-0001 | Next.js 16 App Router scaffold, dark theme, Navbar, dashboard placeholder | Yes |
| F-0002 | Prisma 7 + SQLite, 6 models, idempotent synthetic seed, shared client singleton | Yes |
| F-0003 | Playwright E2E harness wired into `verify.sh --e2e`; dashboard became a real server component | Yes |
| F-0004 | `output: standalone`, `GET /api/health`, multi-stage Dockerfile, `fly.toml` with volume-backed SQLite, plain-English deploy guide | Yes |

Everything beyond that — the entire reason the product is called "AnswerFlow" — is **aspirational / vaporware**. The rich product vision lives in two places, neither of which is implemented code in this repo:

1. `docs/research/answerflow-reviews/` — a salvage *review* of a deleted sibling repo (`claude-software-5`) that genuinely built the RAG/verifier/export core. That code was **deleted** (bundle in `C:\dev\_purge-backup\`); only the prose review survives here.
2. The real 1,910-line product PRD (`GOAL.md`) referenced throughout the review **is not in this repo.** `docs/archive/antigravity-harness/GOAL.md` is a *different*, generic 41-line "make-this-repo-AFK-ready" harness doc — not the AnswerFlow spec. So the foundational product spec everyone points at is absent; it must be recovered from the deleted bundle/GitHub before real work can resume.

**Net:** the product is ~5% built. The skeleton (scaffold + data layer + deploy + test rig) is real; the application is not.

---

## Architecture

- **Stack:** Next.js 16.2.9 (App Router), React 19.2.0, Tailwind 4.3.0 (CSS-first `@theme` in `globals.css`), Prisma 7.8.0 with the `better-sqlite3` driver adapter, TypeScript 6, Vitest 4 + Playwright 1.60.
- **Data:** SQLite. Six models (`prisma/schema.prisma`): `User`, `Project`, `Question`, `Answer (1:1 to Question)`, `Source`, `Chunk (n:1 to Source)`. Cascade deletes are set; statuses are free-text `String` (SQLite has no enums), enforced only by convention/comment, not by a check constraint.
- **Client singleton:** `src/lib/prisma.ts` — standard `globalThis` cache pattern, adapter over `DATABASE_URL` with a `file:./prisma/dev.db` fallback. Fine.
- **Rendering:** one `force-dynamic` async server component (`src/app/page.tsx`) that reads projects directly via Prisma. No API layer for the UI (the only route handler is `/api/health`). Styling is **inline `style={{}}` objects everywhere** — Tailwind is imported and a theme is declared, but the components don't use utility classes; they use CSS variables through inline styles. That's a paradigm split that will not scale.
- **Deploy:** multi-stage Docker (`node:24-bookworm-slim`): builder runs `npm ci` → `build` → `seed`, baking a synthetic DB; runner carries only `.next/standalone` + the seed DB; first-boot `CMD` copies the seed onto the `/data` Fly volume if absent, then `node server.js`. `fly.toml` mounts `answerflow_data` at `/data`, forces HTTPS, health-checks `/api/health`, scales to zero. This is a competent single-instance design — and its single-instance-ness is also a hard ceiling (see Risks).

---

## Code quality & correctness (file:line)

The code that exists is mostly clean. The defects are real but small in number because the surface is small.

1. **Dead navigation links — `src/components/Navbar.tsx:5-8`.** The navbar links to `/projects` and `/sources`. Neither route exists (`src/app/` has only `page.tsx`, `layout.tsx`, `api/health/`). Two of the three nav items are guaranteed 404s. A user clicking the product's own chrome hits nothing.
2. **No write path for the core domain.** `Answer`, `Source`, and `Chunk` are written **only** by the seed (`src/lib/seed.ts`). Nothing in `src/` reads `Chunk`/`Source`/`Answer` at runtime. The dashboard (`src/app/page.tsx:10-18`) reads only `Project` + a `_count` of questions. The "answering" product has no answering code.
3. **Inline-style monoculture.** `src/app/page.tsx`, `layout.tsx`, and `Navbar.tsx` are 100% inline styles despite Tailwind being installed and themed (`globals.css:3-12`). Either commit to Tailwind utilities or drop it; shipping both is debt with no payoff. The dashboard server component is also ~110 lines of presentational JSX with no extracted components — fine at this size, a smell as it grows.
4. **Swallowed DB error is reasonable but lossy — `src/app/page.tsx:19-22`.** `catch { projects = [] }` renders the empty state if the DB/table is missing. Defensible for first-boot resilience, but it also silently hides a *real* connection failure as "your dashboard is being set up." At minimum it should `console.error` the caught error; right now a misconfigured `DATABASE_URL` in production looks identical to an empty workspace.
5. **`next start` is semantically wrong for this build.** `package.json:10` defines `"start": "next start"`, but the app builds `output: "standalone"` and the container runs `node server.js`. `next start` emits a warning and does not use the standalone server. The script is a foot-gun left in place; PROGRESS.md acknowledges it but it was never fixed.
6. **E2E workflow path filter misses the test dir — `.github/workflows/e2e.yml:10`.** The `paths:` trigger lists `"e2e/**"`, but the E2E specs live in `tests/e2e/**` (already covered by `"tests/**"` on line, so it happens to still fire) — the `"e2e/**"` entry is dead/misleading and will mislead the next person who edits the filter. Cosmetic, but it's a latent correctness trap.
7. **Two parallel "seed" concepts.** `src/lib/seed.ts` (real product seed), `prisma/seed.ts` (thin CLI), `scripts/seed.ts` (engine delegation shim), and `tests/e2e/global.setup.ts` (re-seeds before E2E). This is more indirection than a 579-LOC app needs, justified mostly by the engine contract rather than the product. Not a bug, but a new contributor will spend time mapping it.

No memory-safety, injection, or logic-correctness bugs were found in the code that *does* exist — because almost nothing risky exists yet. There are no user inputs, no request bodies parsed, no file handling, no auth, no SQL beyond typed Prisma reads.

---

## Tests

For the surface area, test coverage is **good and honest** — the strongest part of the repo.

- `tests/health.test.ts` — imports the **real** `GET` handler, asserts `200` + `{status:"ok"}`. Unmocked. Good.
- `tests/seed.test.ts` — a genuine **integration** test: runs `npm run seed` *twice* (proving idempotency at the contract level), then asserts exact row counts, status distribution (8 unanswered / 2 drafted), the near-duplicate question pairs, chunk distribution, order monotonicity, and null-category presence via the real Prisma client against real SQLite. This is a real test of real behavior, not a tautology.
- `tests/deploy-config.test.ts` — asserts `standalone` output, Dockerfile shape, health-check path, and the **discriminating invariant** that the `DATABASE_URL` file path is a prefix of the Fly volume mount. That last assertion is the kind of thing that catches a real deploy regression.
- `tests/smoke.test.tsx` — renders the dashboard (Prisma mocked to `[]`) and the navbar; asserts branding and nav links. Light but legitimate.
- `tests/e2e/dashboard.spec.ts` — seeds, boots the real dev server on :3100, drives headless Chromium, asserts the seeded project name renders. A real end-to-end walk.

**Caveats / weaknesses:**
- **Coverage is of the skeleton, not the product** — there is no product to test. Every test passing tells you the shell works; none tells you the app does anything.
- The smoke test asserts the navbar renders links to `/projects` and `/sources` (`tests/smoke.test.tsx:53-55`) — i.e., the test suite **enforces the existence of two links that 404.** The test is green and the UX is broken; that's a coverage blind spot, not a test failure.
- No coverage threshold is configured in `vitest.config.ts`. Fine now (nothing to cover), but it means a future feature can land with zero tests and still be "green" at the unit layer (the engine gate mitigates this somewhat by failing if `src/` exists without a test script, but not on per-feature coverage).
- I could **not** run the suite (constraint: no installs/builds). Assessment is by reading; the tests are structurally sound and the recorded evidence on `develop` shows them green.

---

## Security & data handling

Low risk today purely because the attack surface is nearly empty. There is **no authentication, no authorization, no user input handling, no API beyond a static health probe.** That is a *feature gap*, not a security win — the moment upload/generation/review land, every one of these becomes a live concern with no existing pattern to follow.

- **Prisma/SQLite:** all DB access is typed Prisma reads (`src/app/page.tsx`) and seed writes. No raw SQL, no string interpolation, no injection vector today.
- **Seed data is synthetic** (`src/lib/seed.ts`) — fictional people (`alice@example.com`), fictional policies. No live or PII data baked into the image. The Dockerfile bakes this synthetic DB as a seed template; PROGRESS records a security review confirming synthetic content by row inspection. Good.
- **The Fly volume DB is the whole database.** `fly.toml:11-16` sets `min_machines_running = 0` with `auto_stop_machines = "stop"`, and `[mounts]` binds one volume to one machine. SQLite-on-a-volume means: **single instance only** (no horizontal scale), **no managed backups** (the volume is the only copy — the deploy guide's "start over" path literally `destroy`s it), and a cold-start penalty on scale-from-zero. Acceptable for a staging demo; not acceptable for anything with real customer data. There is no backup strategy, no migration story beyond `prisma db push` (which is **not** safe for production schema changes — it can drop columns).
- **`/api/health` is unauthenticated and DB-free** — correct for a liveness probe; it leaks nothing.
- **No `.env` is committed**; `.gitignore` and `.dockerignore` both exclude `.env*`, `*.pem`, `*.key`, and the CI has a secret-shaped-string scanner. The hygiene posture (inherited from the engine) is genuinely strong — arguably the most mature thing in the repo.
- **`DATABASE_URL` fallback to a local file** (`src/lib/prisma.ts:12`, `prisma.config.ts:5`) is convenient but means a missing env var in a misconfigured environment silently points at a local file instead of failing loudly. Combined with finding #4 (swallowed errors), a prod misconfiguration could fail very quietly.
- **Input validation:** N/A today; **this is the single biggest latent security debt.** When document upload lands (the README pretends it already has), file parsing of `.pdf`/`.docx`/`.xlsx` is a notorious attack surface (zip bombs, XXE, malicious macros, path traversal). There is no validation layer, no size limit, no content-type enforcement anywhere, because there is no upload yet. Build the validation *with* the feature, not after.

**Bottom line:** nothing is insecure because almost nothing is implemented. Do not mistake the absence of code for the presence of security.

---

## Unmerged branches

`git branch -a` shows the named `feat/`, `chore/`, `docs/`, and `fix/` branches are **already merged into `develop`** (zero diff: `feat/F-0004`, `chore/record-F-0004`, `docs/status-2026-06-11-late`, `fix/engine-sync-8ab68ff`). The only genuinely unmerged work is three Dependabot branches.

| Branch | What | Quality | Recommendation |
|---|---|---|---|
| `dependabot/npm_and_yarn/multi-b0dfc253ff` | `react` 19.2.0→19.2.7, `@types/react` 19.2.0→19.2.17 | Clean patch bump; lockfile collapse is normal Dependabot behavior, not a red flag | **Merge** (after CI green) — low risk, keeps React current |
| `dependabot/npm_and_yarn/multi-3d3f0671f1` | `react-dom` 19.2.0→19.2.7, `@types/react-dom` 19.2.0→19.2.3 | Same as above; pairs with the react bump | **Merge** — but note it and the react bump touch the same lines; merge one, rebase/auto-resolve the other |
| `dependabot/github_actions/anthropics/claude-code-action-1.0.144` | SHA-pin bump of `claude-code-action` 1.0.143→1.0.144 in `claude.yml` | Correct (keeps the SHA-pin discipline); **but this is ops-engine scaffolding, out of product scope** | **Merge** as routine engine hygiene; not a product decision |
| `feat/F-0004`, `chore/record-F-0004`, `docs/status-2026-06-11-late`, `fix/engine-sync-8ab68ff` | (already in develop) | n/a | **Delete** the stale local/remote branches to reduce noise |

**Stranded work:** none of consequence. There is no half-finished feature branch hiding real product code — which is itself telling: nobody ever started building the actual application. The dependabot PRs are the only open loop, and they're trivial.

---

## Tech debt & risks (ranked)

1. **Documentation is fiction (CRITICAL).** Root `README.md` describes a product that does not exist, names files/deps/scripts that aren't in the repo (`lib/rag.ts`, `app/library/`, `pdf-parse`, `mammoth`, `read-excel-file`, `npm run test:e2e`, `scripts/ensure-sqlite-db.mjs`), claims Tailwind 3 (it's 4), and credits the wrong team. `roadmap/PROGRESS.md` (this branch) claims features F-0026/F-0028 shipped — they never existed here. Anyone onboarding is actively misled. (Fixed by deliverable B of this review.)
2. **The product spec is missing (HIGH).** The 1,910-line `GOAL.md` PRD that the whole effort references is not in this repo — it was in the deleted `claude-software-5` bundle. `docs/archive/.../GOAL.md` is an unrelated harness doc. Real work cannot prioritize correctly until the spec is recovered (bundle in `_purge-backup/`, or GitHub).
3. **It's a skeleton sold as a product (HIGH).** ~5% built. No upload, parse, RAG, generate, verify, review, export, or auth. The differentiator (original-format export, the trust pipeline) exists only as prose in the salvage review.
4. **Dead nav links (MEDIUM).** `/projects` and `/sources` 404; tests even enforce their presence (`smoke.test.tsx`). First user interaction is broken.
5. **SQLite-on-a-volume has no backups and no scale path (MEDIUM).** Single instance, single copy, `prisma db push` (column-dropping) as the only migration mechanism. Fine for a demo, a data-loss incident waiting for production.
6. **Inline-style / Tailwind paradigm split (MEDIUM).** Two styling systems, one unused; will fork as the UI grows.
7. **Silent failure modes (MEDIUM).** Swallowed DB errors + `DATABASE_URL` file fallback mean a prod misconfig can masquerade as an empty app.
8. **`next start` script is wrong for the standalone build (LOW).** Foot-gun left in `package.json`.
9. **Engine-vs-product seed indirection (LOW).** Four seed touchpoints for a tiny app; onboarding tax.
10. **E2E path-filter dead entry (LOW).** `"e2e/**"` in `e2e.yml` is misleading.

---

## Top 5 to fix first

1. **Stop lying.** Replace the fictional `README.md` with an honest one (done here), and correct `roadmap/PROGRESS.md` / `roadmap/STATUS.md` so they describe the real state (skeleton, 4 features, 23 tests, no application yet). Misleading docs are the highest-leverage bug in the repo.
2. **Recover the real `GOAL.md` PRD** from the `claude-software-5` bundle/GitHub into `docs/`, and groom it into a concrete backlog. Nothing else can be prioritized honestly without it.
3. **Fix or remove the dead nav links.** Either ship minimal `/projects` and `/sources` pages or delete those nav items (and the tests that enforce them). Don't ship chrome that 404s.
4. **Build the first real vertical slice: questionnaire upload → parse → store `Source`/`Chunk`.** This is the foundation everything (RAG, generation, export) sits on, and it's the first thing that makes the `Source`/`Chunk` tables non-dead. Build input validation and size/content-type limits *with* it.
5. **Merge the three Dependabot PRs** (green CI) and delete the stale already-merged local/remote branches, so the branch list reflects reality.
