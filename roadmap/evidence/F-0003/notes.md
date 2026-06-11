# F-0003 Build Notes

## What was built

1. `@playwright/test` ^1.60.0 added as devDependency. `npm install` updated package-lock.json; `npm ci --dry-run` passes.
2. `playwright.config.ts` at repo root: testDir `tests/e2e`, two projects (`setup` → `chromium` with dependency), webServer on port 3100 using `url` (not deprecated `port`), 120s timeout, html reporter with `open:never`.
3. `"e2e"` npm script: self-sufficient browser install + test run (`playwright install --with-deps --only-shell chromium && playwright test`).
4. `vitest.config.ts` updated: `exclude: [...configDefaults.exclude, "tests/e2e/**"]` to prevent glob collision. `configDefaults` imported from `vitest/config`.
5. `tests/e2e/global.setup.ts`: runs `npm run seed` via `execSync` from the repo root before every E2E run.
6. `tests/e2e/dashboard.spec.ts`: single smoke spec — navigates to `/`, asserts Navbar brand link visible, asserts "Acme Corp Security Questionnaire" visible.
7. `src/app/page.tsx`: converted to async server component with `export const dynamic = "force-dynamic"`. Fetches projects via `prisma.project.findMany` with `_count.questions`. Shows each project name + question count when projects exist. Falls back to the original empty-state UI via try/catch when DB is absent or the query fails. Never crashes.
8. `tests/smoke.test.tsx`: adapted to work with the async component. Added `vi.mock("../src/lib/prisma", ...)` so the unit test never touches the real database — mocked `findMany` returns `[]`, so the empty-state branch is tested. Dynamic `await import("../src/app/page")` used so the mock is registered before the module loads. All four original assertions (h1 heading, empty-state text, Navbar brand link, Navbar nav links) preserved unchanged in their intent and wording.

## Test adaptation rationale

The original `smoke.test.tsx` called `render(<DashboardPage />)` synchronously. Once `DashboardPage` became async, the test environment (jsdom, Vitest) could either:
- call `await DashboardPage()` and render the resolved JSX, or
- mock the Prisma dependency so the component renders predictably without a DB.

Both approaches were considered. The mock approach was chosen because:
- It isolates the unit test from the database state (a prior test run seeded dev.db, so without the mock the component actually fetched real data and rendered the projects list, causing the empty-state assertion to fail).
- It matches the principle of unit testing: test component behavior, not database connectivity.
- All four existing assertions remain intact with identical wording.

## Deviations from brief

None. All spec items implemented as written. `webServer.url` used (not deprecated `port`). `--only-shell` used for headless-only Chromium. `force-dynamic` confirmed present. No `next.config.ts` changes needed (no native module bundling issues encountered).

## Surprises

- The Vitest environment discovered an existing seeded dev.db during unit testing, causing the async component to return real project data rather than empty list. This surfaced the need for the Prisma mock in the smoke test. The mock is clean and keeps the test hermetic.
- `npm install` reorders devDependencies alphabetically — the `e2e` script was added via a separate Edit before `npm install` ran, so the script survived.
