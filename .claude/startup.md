# TatraSplit — Startup

## Quick start (LAN mode)

Open **two terminals** from project root:

```bash
# Terminal 1 — Backend
cd backend && ./run.sh

# Terminal 2 — Frontend (build + preview)
cd frontend && ./run.sh
```

---

## What each script does

### `backend/run.sh`
1. Sources `backend/.env`
2. Creates `.venv` if missing, activates, installs deps
3. Runs `uvicorn app.main:app --host $BACKEND_HOST --port $BACKEND_PORT [--reload]`

### `frontend/run.sh`
1. Sources `frontend/.env`
2. `npm install`
3. `npm run build` — Vite reads `.env` automatically, bakes `VITE_API_BASE` into bundle
4. `npm run preview -- --host $FRONTEND_HOST --port $FRONTEND_PORT`

> **Why build before preview?** `VITE_API_BASE` is baked at build time. Edit it in `frontend/.env`, re-run `./run.sh`.

---

## Configuration

Each service has one `.env` file. Copy `.env.example` to `.env` and fill in values.

### `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `MONGO_URI` | *(required)* | MongoDB connection string |
| `CORS_ALLOW_ORIGINS` | localhost origins | Comma-separated allowed origins — add `http://<LAN_IP>:4173` |
| `BACKEND_HOST` | `0.0.0.0` | Host uvicorn binds to |
| `BACKEND_PORT` | `8000` | Port uvicorn listens on |
| `RELOAD` | `true` | Enable uvicorn `--reload` |

### `frontend/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE` | *(required)* | Full backend URL, e.g. `http://192.168.1.50:8000/api/v1` |
| `VITE_USE_MOCK` | `false` | Enable mock API mode |
| `FRONTEND_HOST` | `0.0.0.0` | Host the preview server binds to |
| `FRONTEND_PORT` | `4173` | Port the preview server listens on |

**To change LAN IP:** edit `VITE_API_BASE` in `frontend/.env` and `CORS_ALLOW_ORIGINS` in `backend/.env`.

---

## Ports

| Service  | Port | URL |
|----------|------|-----|
| Backend  | 8000 | `http://<LAN_IP>:8000` |
| Frontend | 4173 | `http://<LAN_IP>:4173` |
| API docs | 8000 | `http://<LAN_IP>:8000/docs` |

---

## CORS

`CORS_ALLOW_ORIGIN_REGEX` in `backend/.env` already matches all RFC-1918 ranges (`10.x`, `192.168.x`, `172.16-31.x`) on any port — no regex change needed for new LAN IPs. Only update `CORS_ALLOW_ORIGINS` if you use explicit origin lists.

---

## Dev mode (localhost only)

```bash
cd backend && ./run.sh          # same script
cd frontend && npm run dev      # hot reload, reads .env automatically
```

---

## Prerequisites

- Python 3.11+
- Node 20+
- `MONGO_URI` set in `backend/.env`
