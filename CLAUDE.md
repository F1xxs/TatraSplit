# CLAUDEmd

## Workflow

## Coding Style

Remember to keep classes and components separate
If class is just for data, as settings classes or some backend models then that is okay
But for any actual classes with logic, and frontend components: Split them into different files, it will be easier to find them later

### Comments

Write comments only if logically splitting long lists of something.
Long lists of data with different purposes.
Otherwise, don't write comments.
If code requires comments to be readable, it should be refactored.

### Never Nesting

Flat code over nested code. Max 2 indent levels. Always prefer:

## Project

Split payments project
Purpose to allow easy management of payments, receipt, subscription
Between people or groups of people

### Backend

I don't care about db migrations, I can afford them
Python, use OOP style
Split files based on responsibilities
Group files into packages if suitable
Classes, if file only contains methods, make it class without init
Sometimes, avoiding classes can be acceptable
Only Repositories access DB, everybody else uses them

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
