# AnswerFlow AI — Salvage Review (claude-software-5 → this repo)

**Date:** 2026-06-09 · **Reviewer:** Claude (deep-review agent + synthesis)

AnswerFlow AI was built twice in parallel: **this repo** (`agy-software-2`, Google Antigravity — Next.js 16 + Prisma + SQLite webapp with a local-first BM25+cosine RAG engine, similarity clustering, and collaborative review UI) and **`claude-software-5`** (Claude Opus 4.7/Sonnet 4.6 autonomous loop — a zero-dependency TypeScript core with no real UI). This repo is the keeper; claude-software-5 was deleted from local disk on 2026-06-09 after review. Its full history remains on GitHub (https://github.com/michaelcrosato/claude-software-5) and in a verified bundle at `C:\dev\_purge-backup\claude-software-5.bundle`.

The two variants are complementary, not redundant: **this repo got the product surface right (webapp, workflows, UI); claude-software-5 got the trust core right.** [claude-software-5.md](claude-software-5.md) is the full review. The short version of what to absorb from it:

1. **The 1,910-line, 33-section GOAL.md PRD** — the most complete AnswerFlow product definition that exists (status/type/confidence vocabularies, restricted-claim categories, §18.5 acceptance thresholds, North Star metric). Recover via `git show pre-purge-20260609:docs/GOAL.md` from the bundle or GitHub.
2. **Original-format export** (the product differentiator): surgical XLSX cell-fill preserving all styling, and DOCX answer-splicing under each question via parser-normalization re-matching. Requires storing verbatim upload bytes (content-addressed blob store).
3. **The trust pipeline**: deterministic post-generation verifier (quote grounding, dangling citations, restricted claims, overconfidence lexicon) + citation validation that drops model citations to never-retrieved chunks + verification-driven regeneration.
4. **The eval methodology**: 3-stage deterministic harness (extraction P/R/F1, retrieval MAP/MRR, unsupported-question recall) with acceptance thresholds as CI exit codes and a baseline-diff regression tripwire — expand past its toy 12-case baseline.
5. **Reuse-flywheel semantics**: approve→library, reuse-as-draft at high similarity, edit-reverts-approval.

Pitfalls catalogued there worth remembering here: honor-system gates, foreground-server hangs in agent ticks (needs a tick watchdog), giant-file accretion under incremental agent edits, all-passing eval baselines.
