# Copilot Instructions — HackKosiceFullHouse

GitHub Copilot reads custom instructions from: `.github/copilot-instructions.md`.
That file is the authoritative source; this file mirrors it for visibility.

---

Hackathon project. FastAPI backend + React (Vite) frontend.

## Project layout

```
frontend/                 React 19 + Vite 8 SPA
  src/                    UI components, routes, hooks
backend/                  FastAPI app (git submodule)
  app/main.py             App entry point, CORS, router registration
  app/core/config.py      Settings (Pydantic, reads from .env)
  app/api/routes/         Route modules (add new files here)
  app/models/             Pydantic request/response models
  requirements.txt        pip/venv deps
  environment.yml         conda deps
```

## Quick start (local dev)

If `backend/` is a submodule, initialize it first:

```bash
git submodule update --init --recursive
```

Backend:
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # http://localhost:8000
```

Frontend:
```bash
cd frontend
npm ci
npm run dev                    # http://localhost:5173
```

## Backend conventions

- API prefix: `/api/v1`
- New routes: `backend/app/api/routes/` + register in `backend/app/main.py`
- Config: `backend/app/core/config.py` + `backend/.env`
- Prefer `async def`; return Pydantic models where possible

## Frontend conventions

- Backend base URL in dev: `http://localhost:8000`
- Keep UI code in `frontend/src/`

## General

- Never commit `.env` files (only `.env.example`)
- Keep backend/frontend changes in their respective subdirectories
