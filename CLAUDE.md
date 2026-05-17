# CLAUDE.md

## Project

Split payments project
Purpose to allow easy management of payments, receipt, subscription
Between people or groups of people

## Coding Style

### Backend

Python, use OOP style.
Split files based on responsibilities.
Group files into packages if suitable.
Classes, if file only contains methods, make it class without init.
Sometimes, avoiding classes can be acceptable.

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
