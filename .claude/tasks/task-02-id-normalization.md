# Task 02 — ID normalization at API boundary

## Goal
Remove `id || _id` checks spread across pages/components.

## Scope
- Introduce one shared normalizer for backend entities.
- Normalize all API responses immediately after fetch.
- Use normalized shape (`id`) across UI code.

## Implementation
- Add helper(s) in `frontend/src/lib/` (e.g., `normalize.js`).
- Apply normalization in query functions/hooks before returning data.
- Refactor UI usage to rely on `id` only.

## Acceptance criteria
- No new `id || _id` patterns in pages/shared components.
- Existing routes and actions still work with same behavior.
- Data rendering and navigation keys use stable `id`.
