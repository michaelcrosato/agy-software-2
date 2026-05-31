1. *Implement Global Error Boundary (Next.js)*
   - Create `app/error.tsx` containing a Next.js client-side Error Boundary component. This will prevent unhandled exceptions in the React tree from crashing the entire application and instead display a graceful fallback UI with a "Try again" button.
2. *Verify File Creation*
   - Read the file `app/error.tsx` using `cat` or `read_file` to confirm the error boundary component was created correctly.
3. *Run Tests*
   - Run `npm run agent:check && npm run test && npm run test:e2e` to verify no regressions occur and tests still pass.
4. *Complete pre commit steps*
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
5. *Submit the change*
   - Submit the changes to branch `agent-error-boundaries`.