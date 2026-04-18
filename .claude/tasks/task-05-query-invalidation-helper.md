# Task 05 — Centralize React Query invalidation rules

## Goal
Reduce duplicated invalidation logic across mutation hooks.

## Scope
- Extract shared invalidation helpers for:
  - group-related updates
  - global balances/activity updates

## Implementation
- Create helper module (e.g., `src/lib/invalidation.js`).
- Replace repeated `invalidateQueries` blocks in `useMutations.js`.
- Keep invalidation coverage equivalent to current behavior.

## Acceptance criteria
- Mutation hooks are shorter and easier to read.
- No stale UI after create/add-expense/settle/join.
- Invalidation rules are defined in one place.
