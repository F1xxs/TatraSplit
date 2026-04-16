# HackKosiceFullHouse

Hackathon project. FastAPI backend + React (Vite) frontend, organized as a monorepo with the backend as a git submodule.

## Repo structure

```
/
├── frontend/                 # React 19 + Vite 8 SPA
│   └── src/                  # UI components, routes, hooks
└── backend/                  # Git submodule
    ├── app/
    │   ├── main.py           # FastAPI app, CORS config, router registration
    │   ├── core/config.py    # Pydantic settings, reads from .env
    │   ├── api/routes/       # Route modules — add new files here
    │   └── models/           # Pydantic request/response models
    ├── requirements.txt      # pip/venv install
    └── environment.yml       # conda install
```

## Quick start (local dev)

If `backend/` is a submodule, initialize it first:

```bash
git submodule update --init --recursive
```

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload   # http://localhost:8000
```

**Frontend**
```bash
cd frontend
npm ci
npm run dev                     # http://localhost:5173
```

## Key conventions

- Backend API prefix: `/api/v1`
- Frontend dev server: `http://localhost:5173` (already whitelisted in CORS)
- New routes: create a file in `backend/app/api/routes/`, register its router in `backend/app/main.py`
- New models: add Pydantic models in `backend/app/models/`
- Environment config: copy `backend/.env.example` → `backend/.env`

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19, Vite 8 |
| Backend  | FastAPI, Uvicorn, Pydantic v2 |
| Python   | 3.11 (conda or venv) |
