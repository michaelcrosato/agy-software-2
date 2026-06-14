# Roadmap

> **Operator: this is your file.** Plain-English bullets; reorder to change priorities. Agents only ever mark items "✅ shipped (PR #n)" — they never rewrite your words. Sections mean: **Now** = working on it, **Next** = queued, **Later** = someday, **Ideas** = unscoped thoughts.

## Now

- **Tell the truth about what this is.** The old README described a finished product that does not exist; the progress log claimed features that were never built. Replace both with an honest picture (the rewritten README and the new engineering review do this) and correct the status/progress notes so nobody is misled.
- **Get the real product spec back.** The detailed product plan (the long "GOAL" document) is not in this repo — it was in a sibling project we deleted. Recover it from the backup bundle or GitHub, drop it into `docs/`, and break it into small concrete tasks before building more.
- **Fix the broken menu.** The top navigation links to "Projects" and "Sources," but clicking them leads to a missing-page error. Either build those two simple pages or remove the links until they're real.

## Next

- **Upload a questionnaire.** Let a user drop in a file (start with spreadsheets/CSV, then PDF and Word) and turn it into stored questions. This is the front door of the whole product and the first thing that makes the empty "Sources" and "Chunks" parts of the database actually used. Build the safety checks (file size limits, file-type checks) at the same time, not later.
- **Build the knowledge base.** Let users add their own policy/answer documents, split them into searchable pieces, and store them. This is the raw material the answer engine needs.
- **Draft answers from sources (the core promise).** Add the retrieval-plus-generation engine that proposes an answer to each question using the user's own documents, always shows which source it came from, and honestly says "no source found" when it can't back something up. Never invent certifications or compliance claims.
- **Merge the pending dependency updates.** Three automated update requests are open (React, React-DOM, and a workflow action). They're low-risk; merge them once checks pass, and clean up the stale already-merged branches cluttering the list.

## Later

- **Review workspace.** A place for teammates to see drafted answers, edit them, comment, assign owners, and approve. Editing an approved answer should send it back for review (a real trust rule from the design notes).
- **Group similar questions.** Detect near-duplicate questions (the seed already includes example pairs) and let users answer once and apply to the whole group.
- **Export finished questionnaires.** Download answers as Excel, Word, CSV, or JSON. The high-value version fills the user's *original* file in place, preserving its formatting — this is the product's main differentiator per the design notes.
- **Answer verification gate.** Before an answer can be approved, automatically check it actually quotes its cited source, flags overconfident or unsupported claims, and routes risky compliance claims to a human. (Design notes describe this in detail.)
- **Sign-in and accounts.** No authentication exists today. Real multi-user use needs login, per-workspace data separation, and roles.
- **Make the data durable.** SQLite-on-a-single-disk has no backups and no safe way to change the schema in production. Add backups and a real migration process before storing anything that matters, or move to a managed database.

## Ideas

- **Reuse flywheel:** approved answers feed a reusable library; high-similarity questions reuse prior answers as drafts automatically.
- **Quality scoreboard:** a small evaluation harness (extraction accuracy, retrieval quality, "did we correctly flag unanswerable questions") with a pass/fail bar wired into CI — adapted from the deleted sibling repo's methodology, but with real test data, not a toy all-perfect baseline.
- **Pick one styling system.** Today the UI mixes inline styles with an unused Tailwind setup. Standardize before the UI grows.
- **Better failure visibility:** right now a database misconfiguration looks identical to an empty workspace. Surface real errors instead of silently showing the empty state.
- **Confidence labels, not numbers:** show answers as high/medium/low/no-source rather than fake percentages (from the design notes).
