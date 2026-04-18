# Task 08 — Standardize loading/empty/error states

## Goal
Improve UX consistency and reduce repeated page-level state code.

## Scope
- Define reusable state wrappers/patterns for list/detail pages.
- Standardize skeleton/empty/error presentation.
- Add explicit retry action on recoverable fetch failures.

## Implementation
- Add shared components/helpers (e.g., `DataState`, `EmptyState`, `ErrorState`).
- Refactor major pages (`Dashboard`, `GroupsList`, `GroupDetail`, `Activity`) to use them.

## Acceptance criteria
- Page states look and behave consistently.
- Retry is available where network failures can happen.
- Duplicate state-handling code is reduced.
