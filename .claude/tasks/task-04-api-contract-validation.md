# Task 04 — Runtime API contract validation

## Goal
Fail fast on malformed backend responses instead of propagating bad shapes.

## Scope
- Define runtime schemas for critical endpoints.
- Validate response payloads before writing to UI state.
- Produce actionable error messages when validation fails.

## Implementation
- Add schema layer (e.g., zod) in `src/lib/` or `src/domain/`.
- Validate inside query functions/services.
- Map schema errors into readable UI-safe errors.

## Acceptance criteria
- Core endpoints (`me`, `groups`, `group detail`, `expenses`, `balances`, `activity`) are validated.
- Invalid payloads surface explicit errors.
- Valid responses continue with no UX regressions.
