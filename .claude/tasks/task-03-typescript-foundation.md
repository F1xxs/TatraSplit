# Task 03 — TypeScript foundation for data layer

## Goal
Catch integration bugs early by typing the API and hooks layer.

## Scope
- Start incremental TS migration in highest-value files:
  - `src/lib/api`
  - `src/lib/queryKeys`
  - query/mutation hooks in `src/hooks/`
  - domain type definitions

## Implementation
- Add TS setup (minimal config, keep incremental migration path).
- Introduce domain interfaces/types for core entities.
- Type hook return values and mutation payloads.

## Acceptance criteria
- Core data layer compiles with TypeScript.
- Hooks expose typed data/mutation contracts.
- No behavior changes in UI flows.
