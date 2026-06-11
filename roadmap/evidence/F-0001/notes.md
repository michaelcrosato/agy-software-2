# F-0001 Build Notes

## Versions installed
- next: 16.2.9
- react / react-dom: 19.2.0
- @types/react / @types/react-dom: 19.2.0
- tailwindcss: 4.3.0
- @tailwindcss/postcss: 4.3.0
- vitest: 4.1.8
- @vitejs/plugin-react: latest (installed as ^4.5.2)
- @testing-library/react: latest
- @testing-library/dom: latest
- @testing-library/jest-dom: latest (added — required for toBeInTheDocument / toHaveTextContent matchers)
- vite-tsconfig-paths: latest (used in vitest.config.ts; Vitest emits a soft warning that Vite now supports tsconfig paths natively — not an error, left as-is since it still works)
- lucide-react: latest
- jsdom: latest
- typescript: retained at ^6.0.3 (TS6, no conflict with Next 16 detected)

## tsconfig.json reconciliation
- Next.js 16 auto-edited tsconfig.json on first build:
  - Changed `jsx` from `preserve` to `react-jsx`
  - Added `.next/types/**/*.ts` and `.next/dev/types/**/*.ts` to `include`
- These edits are correct and kept as-is.
- ts-node override block (`"ts-node": { "compilerOptions": { "module": "NodeNext", "moduleResolution": "NodeNext", "jsx": "react-jsx", "types": ["node"] } }`) ensures engine scripts keep NodeNext semantics. The `types: ["node"]` in the ts-node override (not in root compilerOptions) ensures `@types/node` is available to ts-node without restricting React/DOM types for `tsc --noEmit` on src/.
- Root compilerOptions uses `module: ESNext` + `moduleResolution: bundler` for Next.js compatibility. No `types` restriction at root level — all installed `@types/*` are auto-included for `tsc --noEmit`.
- `scripts/**/*.ts` remains in `include` so tsc --noEmit continues to typecheck engine scripts.

## biome.json change
- Added `"linter": { "includes": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs", "**/*.cjs"] }` to skip Tailwind CSS files (`@theme {}` blocks cause biome parse errors when CSS is processed). This is the correct mechanism per biome v2 docs — CSS linting is effectively disabled by not including `**/*.css` in the linter includes.
- The engine meta-gate (`npx --no-install biome lint scripts`) is unaffected — scripts/ contains only .ts files.

## @testing-library/jest-dom
- Not listed in the brief's verified versions. Added because `toBeInTheDocument` and `toHaveTextContent` are jest-dom extensions not provided by @testing-library/react alone. A `tests/setup.ts` imports it; vitest.config.ts references the setup file.

## Judgment calls
- `tests/setup.ts` is a non-test file in tests/ — not a test file, no `.test.` in name, so the verify.sh test-wiring guard (which scans `src/` only) is unaffected.
- `src/lib/constants.ts` exports `APP_NAME` and `APP_TAGLINE`, used by Navbar and page. Satisfies the brief's requirement for a real module (no dead placeholder files).
- `public/` directory was created but left empty (not committed) — no favicon needed for placeholder quality.
- Vite plugin deprecation warning about `vite-tsconfig-paths` is informational only and does not affect test outcomes.

## Exit codes
- `npm run build`: 0
- `npm run test`: 0 (4/4 tests pass)
- `bash scripts/verify.sh`: 0 (all gates green, 89/89 hook contract tests pass)
