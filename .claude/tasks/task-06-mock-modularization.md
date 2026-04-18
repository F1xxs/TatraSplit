# Task 06 — Modularize mock backend

## Goal
Make mock behavior maintainable and easier to extend safely.

## Scope
- Break `src/lib/mock.js` into focused modules:
  - users/groups
  - expenses
  - balances/simplification
  - settlements/activity

## Implementation
- Introduce `src/lib/mock/` folder with small files.
- Keep one top-level `handleMock` entrypoint.
- Preserve current demo data and route behavior.

## Acceptance criteria
- Mock logic is split by domain with clear ownership.
- Existing mock endpoints still behave the same.
- Adding a new mocked endpoint is straightforward.
