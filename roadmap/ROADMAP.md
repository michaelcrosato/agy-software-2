# Roadmap — AnswerFlow AI

> **Operator: this is your file.** Plain-English bullets; reorder to change priorities. Agents only ever mark items "✅ shipped (PR #n)" — they never rewrite your words. Sections mean: **Now** = working on it, **Next** = queued, **Later** = someday, **Ideas** = unscoped thoughts.

## Now
- Stand the app skeleton back up: Next.js project, database, test harness, continuous checks, and a staging link to click (the full spec is `README.md`; rebuild from it, not from memory).
- Rebuild the core answering flow: upload a questionnaire (CSV/XLSX), see the questions in a workspace, and get drafted answers from the knowledge base — with citations to the source documents.

## Next
- Knowledge base uploads: .txt, .pdf, .docx documents sliced into searchable chunks that answers cite.
- Review workspace: invite teammates, assign question owners, comment threads, approve answers.
- Similarity clusters: group near-duplicate questions with one-click propagate and bulk approve.
- Exports: finished questionnaires as Excel, Word, CSV, and JSON.

## Later
- The trust pipeline (from the research notes in `docs/research/answerflow-reviews/`): automatic checking that every answer's citations are real and grounded, restricted-claim warnings, and a quality-measurement harness that blocks regressions.
- Original-format export — fill answers directly into the customer's own uploaded file, keeping all their styling (the product's signature feature; design notes in the research folder).
- Optional AI answer generation behind a setting (the core product works fully offline with no AI fees).

## Ideas
- Reuse flywheel: approved answers automatically feed the library, and very similar new questions start pre-drafted from it.
