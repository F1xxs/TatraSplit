---
name: Files that must be updated together
description: Which documentation files require coordinated updates when specific code changes
type: project
---

When a backend route is added:
- `.claude/api.md` — add endpoint, method, request/response shape
- `CLAUDE.md` routes line — keep the route list in sync with `backend/app/main.py`

When a frontend file is added to `components/`, `hooks/`, `lib/`, or `pages/`:
- `CLAUDE.md` frontend table — add the row
- `.claude/frontend_structure.md` — add to the relevant section with accurate description

When a `components/ui/` primitive is added:
- `CLAUDE.md` — update the parenthetical list in the `components/ui/` row
- `.claude/frontend_structure.md` — update the "Current primitives" line in section 7

When a `components/layout/` component is added:
- `CLAUDE.md` — update the `components/layout/` row
- `.claude/frontend_structure.md` section 7 layout list

When a `components/shared/` component is added:
- `CLAUDE.md` — update the `components/shared/` row
- `.claude/frontend_structure.md` section 7 shared list

**Why:** These files describe the same code from different angles; letting one drift creates contradictions.
