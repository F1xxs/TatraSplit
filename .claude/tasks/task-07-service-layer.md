# Task 07 — Introduce service layer over raw endpoint strings

## Goal
Separate endpoint wiring from hooks/components.

## Scope
- Add services by domain (groups, expenses, balances, activity, users).
- Move URL paths and request/response mapping into services.
- Make hooks call service functions instead of `api.get/post` directly.

## Implementation
- Create `src/services/` modules.
- Keep hooks as orchestration + caching wrappers.
- Reuse normalization/validation from previous tasks in services.

## Acceptance criteria
- Endpoint strings are centralized in services.
- Hooks are thinner and easier to reason about.
- Behavior remains unchanged for all existing pages.
