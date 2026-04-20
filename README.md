# TatraSplit

TatraSplit is a shared-payments demo built for HackKosice (Tatra Bank challenge). It helps small groups track expenses, calculate who owes what, and settle debts with minimal friction.

The app is designed for realistic group scenarios such as trips, shared households, and events. Users can create groups, add expenses with equal or custom splits, view simplified transfers, and settle balances through a lightweight wallet simulation.

## Project Description

Managing group money is usually messy: receipts get lost, splits are uneven, and people forget who paid last time. TatraSplit solves this by combining fast expense input with transparent balance logic.

Core product value:

- Clear group-based expense tracking with categories and activity history.
- Accurate cent-based calculations across expenses, settlements, and balances.
- Simplified debt resolution that reduces many small obligations into a short list of transfers.
- Recurring expenses for repeated costs (weekly, biweekly, monthly).
- Demo-friendly identity flow with account switching and no login friction.

The platform uses a modern full-stack architecture:

- Frontend: React + Vite + Tailwind + TanStack Query
- Backend: FastAPI + Motor (async MongoDB)
- Database: MongoDB Atlas

TatraSplit focuses on product clarity, predictable data flow, and implementation correctness for money-related operations. All amounts are handled as integer cents to avoid floating-point errors.

## Quick Summary

TatraSplit is a practical, demo-ready expense sharing app that turns chaotic group spending into a clear settlement plan.