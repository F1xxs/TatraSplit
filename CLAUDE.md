# CLAUDE.md

## Project

Split payments project
Purpose to allow easy management of payments, receipt, subscription
Between people or groups of people

## Workflow

Plan when I tell you to
Don't verify yourself
Tell me what to verify

## API

backend/app/api/routes/\* - contains all routes

## Tests

None

## Build

Don't

## Architecture

```
React 19 + Vite + Tailwind + shadcn + TanStack Query
  → FastAPI + Motor   http://localhost:8000/api/v1
    → MongoDB Atlas   db: tatra_split
```
