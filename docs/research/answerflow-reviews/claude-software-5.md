# Salvage Review: claude-software-5 ("AnswerFlow AI", Claude variant)

- **Source repo:** `claude-software-5` (DELETED from local disk 2026-06-09; reviewed via detached worktree of the snapshot tag)
- **GitHub remote:** https://github.com/michaelcrosato/claude-software-5 — local bundle backup in `C:\dev\_purge-backup\`
- **Snapshot tag:** `pre-purge-20260609` · **Review date:** 2026-06-09
- **Driving model/harness:** Custom PowerShell autonomous loop (`scripts/run-autonomous-loop.ps1`) governed by `docs/AXIOMS.md` + `docs/AGENT-LOOP.md`. Commit trailers show **three phases**: Claude **Opus 4.7 (1M context)** bootstrapped iterations 1–22 (2026-05-23 02:13–14:00), Claude **Sonnet 4.6** drove the feature-mill middle, iterations ~23–98 (145 of 188 commits, through 05-24 11:48), then Opus 4.7 returned for iterations 0099–0113 (05-24 16:39 → 05-25 02:38)
- **Scale:** 188 commits, 113 logged iterations, ~48.4 hours wall clock, 40,496 lines of TypeScript across 125 files, **zero runtime dependencies**, 1,444 passing tests at final commit

## Verdict

This is the higher-rigor of the two attempts on the trust-critical core and the export endgame, and the lower-rigor on UI. In two days it produced a zero-dependency TypeScript modular monolith with hand-rolled CSV/XLSX/DOCX/PDF codecs, a BM25 + Voyage-embedding + RRF hybrid retriever, a citation-validating generator over a raw-fetch Anthropic transport, a deterministic answer verifier plus LLM entailment verifier, a 3-metric eval harness with a committed regression baseline, and — its crown jewel — surgical original-format XLSX/DOCX export that splices answers back into the customer's own file while preserving formatting byte-for-byte. The web UI is a single 3,700-line vanilla-JS `index.html` (throwaway), the eval fixture set is tiny (all metrics 1.0 — ceiling effect), and there are no HTTP-level integration tests. The keeper (`agy-software-2`) should absorb: the GOAL.md product spec interpretation, the deterministic verifier, the eval/regression-tripwire methodology, the original-format fill algorithms, and the approve→library reuse-flywheel semantics. Discard: zero-dep absolutism, the single-file server/SPA, and the toy baseline.

## 1. Origin & Mission

- Seed commit `91f5a49` (2026-05-23 02:13 PDT) lands the full control plane in one shot: `docs/GOAL.md` (1,910 lines), AXIOMS, AGENT-LOOP, and four hash-protected substrate scripts (`scripts/manifest.txt` holds SHA-256 of 6 control-plane files; `assert-gate-integrity.ps1` halts the loop on tamper).
- Loop runner: infinite `while($true)` — integrity check → `cmd /c $ExecuteCommand` (the LLM engine) → `local-gate.ps1` → `git reset --hard && git clean -fd` on red → 2s sleep. Note: `local-gate.ps1` only checks git hygiene/conflict markers; the *real* gate (`npm run gate` = `tsc --noEmit` + `node --test`) is self-enforced by the agent. It held, but it's honor-system.
- Last commit `163cab5` 2026-05-25 02:38: original-format DOCX fill, recovered from a 4-hour hang (see §7). Cadence peaked at 14 commits/hour; tests grew 25 → 1,444 monotonically; every logged iteration GREEN except one INCIDENT recovery.

## 2. Product Design (GOAL.md — highest-value artifact)

`docs/GOAL.md` is a 33-section, fully numbered PRD (the §-references in every commit). Same product as the keeper; this spec is far more complete than a typical brief. Sections the keeper should mine directly:

- **§14 AI System Requirements** — the pipeline contract: ingest → parse → retrieve → generate → verify, with §14.3 prompting rules ("Answer only from provided sources… State when information is missing"), **§14.4 confidence labels not numbers** (high/medium/low/no-source — "avoid misleading numerical precision"), §14.5 enumerated failure modes (11, incl. "similar question has different intent"), §14.6 safety rules ("never fabricate certifications… invent security controls… hide uncertainty").
- **§10.2.6 answer-status vocabulary:** `drafted / needs_source / needs_human_input / needs_review / approved / rejected / final`. **§14.2.2 answer types:** yes_no, short_text, long_text, date, number, multiple_choice, attachment_required, human_only.
- **§17.4 / §26.2 restricted-claim categories** (certifications, insurance, data residency, breach history, references…) — answers asserting these require human approval before export.
- **§18.5 acceptance thresholds:** ≥70% answers useful as-is/minor edits; **≥90% of unsupported questions correctly flagged**; ≥95% of exports preserve user edits; **0 fabricated compliance certifications**. §18.4 four-level human rating (useful as-is / minor edits / major edits / wrong-unsupported).
- **§19.1 North Star:** "Approved answers generated per active account per month" — counts only approved/exported, not raw generations. §19.2 activation: 60% of trials generate 10+ drafts from own sources in 24h.
- **§11.1.2 original-format export spec** (XLSX: fill answer cells in original workbook preserving formatting; DOCX: "Insert answers under questions, preserve headings, generate a response version") and **§32.3 "narrowest winning version"**: upload a security-questionnaire spreadsheet → fill from approved docs → flag uncertain → "exports a clean completed spreadsheet."
- §24.3 UX anti-patterns ("a generic chat-only interface… hiding unresolved answers during export"), §23 user stories with acceptance criteria (§23.6 "Later edits return answer to review status" drove a real trust fix, iter-0101), §31.1 concierge test, §30 open questions.

## 3. Implementation Reality

**Real and working** (all offline-gateable; only generation/embedding need network):

- **Zero-dep parsing substrate:** `src/parsing/ooxml.ts` (460 lines — ZIP reader/writer with DEFLATE via `node:zlib`, quote-aware XML scanners `findStartTagEnd`/`indexOfTag`), `xlsx.ts`, `docx.ts`, **`pdf.ts` (607-line dependency-free PDF text extractor)**, RFC-4180 `csv.ts`. `parsing/prose.ts`: precision-biased heuristic question extractor (interrogative leads, imperative verbs, "shall/must" modals); `prose-llm.ts`: LLM **delta-augmentation** for declarative requirements (default model `claude-sonnet-4-6`).
- **Retrieval (`src/retrieval/`):** BM25 with BM25+-style always-positive idf, stopwords, multiplicative boosts — `CATEGORY_BOOST` 1.25, `APPROVED_BOOST` 1.15, `CITED_RECENCY_BOOST` 1.10 (30-day window on `last_cited_at`, auto-stamped when a doc gets cited); embedding retriever over a `EmbeddingTransport` seam (Voyage AI `voyage-3` + deterministic fake hash-projection transport for tests); `hybrid.ts` RRF fusion (k=60, candidate pool 20).
- **Generation (`src/generation/generator.ts`):** versioned prompt (`PROMPT_VERSION="answerflow/generate@v1"`), temperature 0, structured-JSON contract; **`validateCitations` drops any citation whose chunk id wasn't actually retrieved ("the model cannot cite a source it never saw") and takes relevance scores from retrieval, never the model**; `reconcileConfidence` forces `"none"` when zero valid citations; synthesized `missingInfoNote`. Raw-`fetch` Anthropic Messages adapter (`anthropic.ts`, injectable fetch) + provider-agnostic retry transport (exponential backoff, full jitter, honors `Retry-After`, injectable clock).
- **Verification (`src/verification/verifier.ts`):** pure deterministic checks — citation presence, **quote grounding** (cited excerpt must appear in chunk text after normalization), dangling-citation detection, addresses-question token overlap, answer-type shape (yes/no clarity, short/long length, digit presence for date/number), restricted-claims gate, 13-term overconfidence lexicon ("guarantee", "100%", "fully compliant"…), no-source-disclaimer routing → `recommendedStatus`. "The verifier never approves — only humans approve." `llm-verifier.ts`: entailment check (`entailed/contradicts/uncertain`), skipped when deterministic errors are authoritative, **fail-open** on transport errors.
- **Orchestration (`src/orchestration/pipeline.ts`):** per-question isolation (one throw never sinks a batch), **verification-driven regeneration** (one corrective re-prompt listing the failed checks; keeps whichever draft verifies better; never regenerates no-source/restricted failures), **reuse-as-draft** (Jaccard ≥0.8 library match reused verbatim, model call skipped, still lands `needs_review`), **no-model/library-only mode** (free keyless pass: reuse + honest abstention).
- **Persistence:** `node:sqlite` (`DatabaseSync`), 17 ordered migrations, 8 stores, content-addressed SHA-256 **BlobStore** (workspace-scoped, idempotent) storing verbatim upload bytes — the prerequisite for original-format export.
- **API:** framework-free HTTP server (`src/api/server.ts`, 3,505 lines), **50 handler names** (auth/sessions, workspaces, invites, members, sources+chunks, library, projects, questions w/ assign/status/comments/ratings, bulk-assign/bulk-status/bulk-generate, analytics, audit log, exports + download history, SSE streaming generation, HMAC-SHA256-signed webhooks, account/workspace deletion).
- **CLI (`src/cli/run.ts`):** full end-to-end runner; notable flags `--learn` (seed library from a completed questionnaire, idempotent), `--review-out`/`--approve` (async human review round-trip via JSON doc), `--no-reuse`, `--hybrid`, `--model-extract`, `--adversarial`.

**Hollow/weak:** single-file vanilla-JS SPA (`src/api/public/index.html`, 3,700 lines, 66 commits of churn); no HTTP test harness (handlers tested via pure builders + store round-trips — acknowledged each iteration); no email notifications, Drive/SharePoint, OCR; DOCX fill is prose-paragraph-only (table-cell questionnaires → `OriginalDocxFillError` → 422 → structured export); XLSX fill leaves stale `<dimension>` and orphaned shared strings; "best-effort" `.catch(()=>{})` on audit/blob writes tolerates silent failure by design.

## 4. The Eval Harness (extract fully)

`src/eval/` (harness.ts 711 lines, metrics.ts, fixtures.ts, run.ts) + committed `eval-baseline.json`. Design: score the three stages that can be judged **deterministically** — no model, no DB — and refuse to fake the rest ("Answer usefulness and hallucination rate need human ratings or a model judge… logged, not faked — AXIOM 5; they plug in later behind these same report types").

1. **Extraction** — precision/recall/F1 of extracted vs. gold question sets, matched on normalized text; per-case `missed[]`/`spurious[]` for triage; micro-averaged aggregate.
2. **Retrieval** — MAP, MRR, precision@k, recall@k (k=5 default) against labelled relevant chunk ids.
3. **Support (unsupported-question detection)** — the distinctive one: ground truth = "is this answerable from the corpus at all"; prediction = "retrieval returned zero evidence"; **positive class is *unsupported***, so recall here is exactly the §18.5 "90%+ of unsupported questions correctly marked" gate.

Mechanics worth copying verbatim:
- **`checkAcceptance`** vs. thresholds (`unsupportedRecall ≥0.9`, `MAP ≥0.7`, `extractionRecall ≥0.7`) sets the CLI exit code → CI-usable quality gate.
- **`compareReports` regression tripwire:** diff current run vs. stored baseline across 9 metrics; *any* negative delta → `hasRegression` → exit 1. `npm run eval -- --compare eval-baseline.json`. Versioned report envelope with a strict validating parser ("a corrupt or stale report can never be mistaken for a real result").
- **Adversarial floor suite** (`fixtures.ts`): RFPs phrased as pure declaratives ("An explanation of your data encryption practices… is requested.") on which the heuristic extractor scores recall 0 *by design* — "if heuristic recall rises above 0 on this input it indicates unintended over-sensitivity." Establishes the floor against which `--model-extract` LLM augmentation is measured. Supplementary only — never affects the acceptance gate.
- **Baselines established:** the built-in suite is deliberately "a healthy baseline that clears the thresholds" — fixtures drawn from GOAL §3.2.1's own recurring questions (SSO, SOC 2, DR, retention) over a 5-chunk corpus, with 3 deliberately-uncovered questions (carbon footprint, HQ locations, mobile app). Baseline generated iter-31 (2026-05-23T22:58Z), all metrics 1.0.
- **Honest caveat encoded in code:** the fake embedding transport is excluded from support detection because hash collisions yield non-zero cosine for unrelated queries (`RunEvaluationOptions.retrieverFactory` JSDoc).

**Weakness to fix in the keeper:** 12 total cases and an all-1.0 baseline — the tripwire only fires on regression *below perfect*; there is no headroom signal. Expand the fixture set with real questionnaire data and add the deferred model-judged usefulness/hallucination stages.

## 5. Loop Methodology

**AXIOMS.md — the six axioms (verbatim titles):** 1. Axioms are Sacred. 2. Keep Main Green. 3. Preserve Every Attempt ("Nothing is hard-deleted… archived for analysis"). 4. Own the Next Move ("full autonomy… discard existing plans whenever doing so maximizes systemic benefit"). 5. Log the Truth ("unvarnished, high-compression record of reality"). 6. Never Stop Looping.

**AGENT-LOOP.md:** peer-communication standard; write-protected substrate list; 6-step iteration checklist — notably **"Reconcile Repo Truth: Real repo state completely outranks stale documentation"** and on-red "archive the current state as a compressed failure artifact, restore… last known green baseline"; closes with the "Empowerment Mandate."

**Log regime:** mid-run (commit `63ee393`, human substrate refresh) the free-form `LOOP_LOG.md` was replaced by a formal `docs/LOG.md` spec — newest-first prepend below `== LOG-ANCHOR ==`, strict header `## YYYY-MM-DDThh:mm · iter-NNNN · STATUS · slug`, required fields Baseline/Move/Changed/Decisions/Validation/Next, status vocab GREEN/AMBER/RED/BLOCKED/INCIDENT/ROLLBACK, 500-word cap, 250KB rotation — machine-enforced by `scripts/validate-log-compliance.py`. The migration itself was iter-0099 (`git mv` to `docs/log/2026-05-legacy-loop-log.md`, AXIOM 3).

**Observed behavior:** ~25 min/iteration average; every entry carries exact gate counts ("tsc clean, 1444/1444") and live-smoke results; "Next" items form an explicit backlog the loop actually reconciles against (iter-0102→0103→0104 chains its own deferred items; the bulk-generate gap was carried 5 iterations before being taken). Middle phase split each iteration into feat+log commit pairs (~94 pairs), doubling history noise. Quality of commit messages is unusually high — every one cites GOAL § numbers.

## 6. Research Artifacts Inventory

- `docs/GOAL.md` — the 1,910-line, 33-section PRD. The definitive product definition; more complete than anything in the keeper. Carry forward nearly whole.
- `docs/AXIOMS.md` — 6-axiom distilled operating philosophy for autonomous loops (941 bytes; quotable as-is).
- `docs/AGENT-LOOP.md` — loop contract: substrate boundary, iteration checklist, empowerment mandate.
- `docs/LOG.md` — "Rules of the Log (Specification v1.0)" page + iters 0099–0113; the spec + `scripts/validate-log-compliance.py` are a reusable pair for any agent-driven repo.
- `docs/log/2026-05-legacy-loop-log.md` — 4,554 lines, iterations 1–98; per-iteration design rationale (e.g. iter-1's toolchain-determinism argument; iter-48's `RETURNING`-clause avoidance and null-vs-undefined patch semantics).
- `eval-baseline.json` — stored eval report (the regression-tripwire input format).
- `README.md` — clean architecture summary + the `--learn`/`--review-out`/`--approve` library workflow docs.
- `src/eval/*`, `src/verification/verifier.ts`, `src/export/{xlsx-original,docx-original}.ts`, `src/parsing/xlsx-edit.ts` — code-as-research; methodologies detailed in §4 and §8.

## 7. Pitfalls & Anti-Patterns

- **Foreground-server hang (iter-0113 INCIDENT):** the agent wrote a live HTTP smoke and started the dev server in the foreground; `listen()` never returns, blocking the engine ~4h until human Ctrl-C, leaving an orphan node PID (~6.7h) and uncommitted work. Logged lesson: the feature was already covered by 411 in-process tests — "the live server was redundant *and* the hang vector." Proposed fix (never shipped): per-tick watchdog timeout in the loop runner. **Any keeper agent harness needs a tick timeout.**
- **Honor-system gate:** the substrate's `local-gate.ps1` validates only git hygiene; `npm run gate` is run by the agent itself. Worked here; structurally unsound.
- **Log-counter drift:** "Iteration 65" used for two different iterations (project-attach and analytics); legacy log entries appended out of chronological order with three format generations. The formal LOG.md spec + validator fixed this — adopt it from day 1, not iteration 99.
- **Zero-dep absolutism:** hand-rolled ZIP/XLSX/DOCX/PDF codecs kept the gate hermetic and fast, but is ~10K lines of bespoke parser surface the keeper should not inherit (it already uses libraries). Take the *algorithms*, not the codecs.
- **Ceiling-effect eval baseline** (all 1.0, 12 cases) and **no HTTP-harness tests** despite a 3,505-line server.
- **Monolith accretion:** `server.ts` (62 commits), `validation.ts` (50), `index.html` (66) — incremental agent appends concentrate churn in giant files.

## 8. Carry-Forward Recommendations for agy-software-2

**Merge (high value, keeper likely lacks):**
1. **Original-format export — the differentiator.** XLSX: `src/parsing/xlsx-edit.ts` `editWorksheetCells` rebuilds only the `<sheetData>` region, overwriting target cells while keeping each cell's `s` style index and leaving `xl/styles.xml`, shared strings, `<cols>`, `<mergeCells>` byte-for-byte; falls back to grid round-trip on `WorksheetEditError` so output is "never an error… only unstyled." DOCX: `src/export/docx-original.ts` walks top-level `<w:p>` body paragraphs (depth-aware table skip), **matches stored questions back to source paragraphs by re-running the parser's own normalization (`stripListMarker` + `collapseWhitespace`)** — resilient to re-parsing, no offsets persisted — then splices a bold "Answer:" paragraph after each match (`<w:br/>` for multi-line, first-occurrence wins for duplicates, fill uses the *current* draft so human edits survive, 422 + structured-export fallback for table docs). Prerequisite: store verbatim upload bytes (content-addressed blob store, iters 0108–0110).
2. **The deterministic verifier** (`src/verification/verifier.ts`) as the post-generation trust gate: citation presence, quote-grounding substring check, dangling-citation detection, restricted-claims list, overconfidence lexicon, answer-type shape checks → status routing. Plus the LLM entailment verifier pattern (skip when deterministic errors are authoritative; fail-open).
3. **Citation validation in generation:** drop model citations to non-retrieved chunks; relevance scores from retrieval only; confidence forced to `none` with zero citations; synthesized missing-info note. Cheap, directly portable, kills a whole hallucination class.
4. **Eval methodology** (§4): 3-stage deterministic harness, §18.5 acceptance thresholds as CI exit codes, baseline-diff regression tripwire, adversarial floor suite measuring LLM-vs-heuristic extraction delta. Wire into the keeper's CI; expand fixtures with real data.
5. **Reuse-flywheel semantics:** reuse-as-draft at high similarity (skips model, still `needs_review`, records usage); **edit-reverts-approval** (`approved/final` → `needs_review` on text change, explicit status wins — GOAL §23.6's last AC, a real trust defect when missed); usage-preserving re-approval; archive-not-delete on revert; bulk-approve must feed the library identically to single approve (iter-0102/0103 found this inconsistency).
6. **Verification-driven regeneration** (one corrective re-prompt enumerating failed checks; keep the better-verifying draft; never regenerate human-only failures) and **no-model/library-only run mode** (free concierge/demo pass).
7. **GOAL.md vocabularies** into the keeper's schema: confidence labels, answer statuses, answer types, restricted-claim categories, the North Star metric, §18.4 rating scale.
8. **Loop hygiene** if agentic development continues: AXIOMS + LOG.md spec + `validate-log-compliance.py`, hash-manifest substrate protection, and a per-tick watchdog.

**Avoid:** zero-dep codec rewrites; all-passing toy eval baselines; single-file server/SPA accretion; trusting the agent to run its own only-real gate; feat/log commit splitting; foreground long-running processes in agent ticks.
