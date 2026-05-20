## Key conventions

- **Money**: integer cents everywhere — `amount_cents`, `share_cents`, `net_cents`. Display via `formatMoney`.
- **IDs**: always `entity.id` (string). `normalizeEntity` applied in all query hooks — never write `id || _id`.
- **Invalidation**: mutations call `invalidateGroup(qc, id)` and/or `invalidateGlobal(qc)` — don't repeat `invalidateQueries` inline.
- **Demo identity**: selected account is persisted in `tatrasplit_user_handle`; API requests read that key and set `X-User-Handle`
- **CORS**: configured via env in `backend/app/core/config.py` (`CORS_ALLOW_ORIGINS`, `CORS_ALLOW_ORIGIN_REGEX`, `CORS_ALLOW_*`). Edit `backend/.env` using `backend/.env.example` templates for replaceable localhost/LAN origins.
- **New backend route**: add file in `api/routes/`, register in `main.py`.
- **New page**: add `React.lazy` import in `App.jsx`, wrap element with `<Suspense>`.
- **Loading/empty/error states**: use `<DataState>` component in list pages.
- **No floats** in the money pipeline.
