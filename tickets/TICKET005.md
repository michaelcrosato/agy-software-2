# TICKET005

## Status
- done

## Goal
- Fix Vitest failure regarding duplicate emails during user creation testing.

## Context
- The unit test `should prevent duplicate emails` inside `tests/users.test.ts` fails, and throws a Prisma Unique constraint failed error which indicates it isn't properly handled or wrapped in an expect rejection inside Vitest.

## Scope
- In: `tests/users.test.ts`
- Out: Other components

## Likely files
- `tests/users.test.ts`

## Steps
- Identify why `expect(prisma.user.create(...)).rejects.toThrow()` is failing. It might be directly awaited instead of asserting the rejection.

## Acceptance Criteria
- [x] Vitest `npm run test` passes without errors.

## Notes
- Let's fix this now.
