# Task 10 — Route-level performance improvements

## Goal
Reduce initial bundle cost and improve perceived loading performance.

## Scope
- Add route-level lazy loading for page components.
- Add sensible suspense fallbacks.
- Keep navigation behavior unchanged.

## Implementation
- Convert static page imports in `App.jsx` to `React.lazy`.
- Wrap route tree or route elements with `Suspense`.
- Use lightweight fallback UI consistent with current design.

## Acceptance criteria
- Initial bundle excludes non-landing pages until needed.
- Route transitions remain smooth and understandable.
- No broken routes or hydration/runtime errors.
