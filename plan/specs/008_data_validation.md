1. *Data Validations & Query Optimization*
   - In `app/api/projects/route.ts`, the `POST` endpoint receives an array of `parsedQuestions` and inserts them sequentially using a `for` loop with `await prisma.question.create({...})` and `await prisma.answerDraft.create({...})`. This generates an N+1 query bottleneck when large projects are submitted.
   - I will refactor `app/api/projects/route.ts` to bulk insert questions using `prisma.question.createMany(...)`. After inserting, I will query the generated questions by `projectId` to get their `id`s, then map over them to create an array of `answerDraft` objects, and finally bulk insert the drafts via `prisma.answerDraft.createMany(...)`.
2. *Verify File Modification*
   - Read the file `app/api/projects/route.ts` using `cat` or `read_file` to confirm the bulk insertion logic was written correctly without syntax errors.
3. *Run `VERIFY_CMD`*
   - Execute `npm run agent:check && npm run test && npm run test:e2e` to establish that refactored components didn't break E2E flows.
4. *Complete pre commit steps*
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
5. *Submit the change*
   - Submit the changes to branch `agent-deep-optimization-data`.