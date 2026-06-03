# TICKET004

## Status
- done

## Goal
- Fix end-to-end (e2e) tests to pass CI and solve the "RAG Drafting Single Question" selector issue

## Context
- The e2e test suit failed on the RAG draft question case because a selector `button:has-text('Open Review Workspace')` was matching multiple elements in the DOM, violating the strict mode expectation for the locator in Playwright.

## Scope
- In: `tests/e2e/answerflow.spec.ts`
- Out: Other test files, app logic

## Likely files
- `tests/e2e/answerflow.spec.ts`

## Steps
- Update the selector `await page.click("text=Open Review Workspace");` in `should allow auto-drafting a single question via RAG` to be specific `await page.click("div.group:has-text('Enterprise Security Audit 2026') button:has-text('Open Review Workspace')");`

## Acceptance Criteria
- [x] E2E test passes locally.

## Notes
- Completed and fixed.
