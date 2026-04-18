# Task 01 — Environment hardening (mock vs backend)

## Goal
Avoid accidental mock-mode usage when backend integration is expected.

## Scope
- Update `frontend/.env.example` defaults to backend-first behavior.
- Document clear local modes: real backend vs mock demo mode.
- Ensure API behavior is explicit in `frontend/src/lib/api.js`.

## Implementation
- Set `VITE_USE_MOCK=false` in `.env.example`.
- Add short comment block in `.env.example` describing when to use `true`.
- Keep current fallback in `api.js`, but add clear inline comment about default behavior.

## Acceptance criteria
- Fresh setup connects to real backend by default.
- Mock mode can still be enabled quickly for demos.
- New contributors can understand env switches without reading code.
