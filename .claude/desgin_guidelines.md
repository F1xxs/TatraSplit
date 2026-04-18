# TatraSplit — Lightweight Design Guidelines

This guide is intentionally **less strict**.  
Use it as a direction, not a pixel-perfect rulebook.

---

## 1) Visual direction

- Dark-first UI, banking style: clean, calm, high contrast.
- Accent color is blue for active/primary actions.
- Success and danger colors should stay clearly readable on dark surfaces.
- Prefer token-based colors from `frontend/src/index.css` (`--color-*`) over hardcoded hex values.

If a one-off hardcoded color improves a specific visual (for example a special nav or card accent), it is acceptable.

---

## 2) Layout principles

- Mobile-first; desktop gets sidebar shell.
- Keep content centered with a comfortable max width.
- Respect safe-area padding for sticky/fixed mobile UI (top bar, bottom nav).
- Spacing should feel consistent, but exact numbers can vary by component.

---

## 3) Component approach

- Reuse `src/components/ui/*` primitives first (Button, Card, Input, Tabs, Dialog, Sheet, etc.).
- Build feature UI in `src/components/shared/*`.
- It is fine to style directly in pages when local context is clearer.

### Common patterns (guidance, not strict)

- Cards: rounded dark surfaces with subtle borders.
- Rows/lists: icon/avatar + text + right-side amount/meta.
- Actions: icon + short label for discoverability.
- Empty states: short message + clear next action.

---

## 4) Typography and content tone

- Prioritize readability over strict type scale.
- Use concise, plain labels.
- Keep financial language clear: “owes”, “owed”, “settled”, “add expense”, etc.
- Minor wording differences across screens are acceptable during iteration.

---

## 5) Money and data display

- Amounts are represented as **integer cents** in code.
- Display amounts using shared helpers (`formatMoney`).
- Keep debit/credit meaning visually clear (red/green or equivalent semantic tokens).
- Use `tabular-nums` where columns of amounts should align.

Locale formatting can differ by screen for demo reasons, but new work should prefer shared formatting helpers.

---

## 6) Motion and interaction

- Keep motion subtle and quick.
- Reuse existing keyframes in `index.css` where possible.
- Favor responsive feedback (hover, active, loading, skeletons, toasts) over decorative animation.

No need to force animation on every interaction.

---

## 7) Accessibility baseline

- Interactive targets should be easy to tap/click (around 44px when possible).
- Icon-only controls should include `aria-label`.
- Maintain visible focus styles for keyboard users.
- Ensure important text and money values remain legible on dark backgrounds.

---

## 8) Practical “do this by default”

1. Start with existing tokens and primitives.
2. Match nearby components rather than inventing a new mini-system.
3. Keep screens simple: clear hierarchy, clear primary action.
4. Optimize for working product clarity over visual perfection.
5. If design and delivery speed conflict, choose consistency + clarity.
