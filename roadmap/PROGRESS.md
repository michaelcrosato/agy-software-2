# Progress Log (newest first — prepend, never append)

## 2026-06-10 — Groomed: 19 features from all 6 Now/Next bullets

- **What:** `/groom` seeded the backlog: F-0001–F-0009 (P1: skeleton ×4, intake ×2, workspace, RAG engine, cited drafting) from the two "Now" bullets; F-0010–F-0019 (P2: tone profiles, KB pipeline+UI, team/comments/approval, clusters ×2, exports ×2) from the four "Next" bullets. "Later" left unscoped by design. Also hardened the `scripts/seed.ts` gate shim (silent-pass stub → fails unseeded in product mode) as factory work.
- **Verified:** `bash scripts/verify.sh` green (19 features valid, no cycles, 89 hook contract tests pass).
- **Surprises:** gate facts shaped the layout — product mode keys off `src/` (so no root `app/`), the test-wiring guard scans `src/` (so tests live in root `tests/`), and `--e2e` hard-codes `scripts/seed.ts` (hence the shim). All logged in DECISIONS.md.
- **Next step:** `/work` F-0001 (Next.js scaffold). One operator question open (staging host — Fly.io assumed, nothing blocked).

## 2026-06-10 — Engine installed (department bootstrap)

- **What:** The AI operations engine (ai-operations-template) was installed by the portfolio department session: constitution, agents, skills, hooks, gates, CI workflows, fresh roadmap state. Product README.md (the AnswerFlow spec) untouched; old Antigravity harness docs archived to `docs/archive/antigravity-harness/`.
- **Verified:** `bash scripts/init.sh` + `bash scripts/verify.sh` green post-install (template mode — product gates harden when `src/` lands).
- **Surprises:** none yet.
- **Next step:** run `/groom` against `README.md` + `docs/research/answerflow-reviews/` to seed `features.json`, then `/work` the first Phase 1 feature. Note for groom: the deepest product PRD (1,910 lines, 33 sections) is recoverable via the claude-software-5 bundle/GitHub — see the research README.
