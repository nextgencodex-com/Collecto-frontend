# Collecto-frontend

Next.js frontend for **COLLECTO** — smart installment & collection management for a retail shop.
Two apps in one project:

- **Owner / admin** (desktop-first): dashboard, customers, installments, products, inventory, riders,
  collections, reports, audit log, settings.
- **Rider** (mobile, `/rider`): today's visits, map, customers, collect payment, receipts, daily closing,
  history, profile.

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Radix UI (shadcn/ui-style primitives) · Zustand · Sonner

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with a demo account:

| Role  | Username             | Password   |
| ----- | -------------------- | ---------- |
| Owner | `owner@collecto.lk`  | `owner123` |
| Rider | `kasun`, `nimal` or `tharindu` | `1234` |

Data is mocked and persisted in the browser (`localStorage`). Use **Settings → Reset demo data** to restore it.
All due dates are calculated against the demo date `2026-10-13` (override with `NEXT_PUBLIC_DEMO_TODAY`).

## Project structure

```
src/
  app/
    login/                 sign-in (owner / rider tabs)
    (owner)/…              owner pages, wrapped in the sidebar + topbar shell
    rider/…                rider mobile app with bottom tab bar
  components/
    layout/owner|rider/    app shells
    modals/                customer, item, product, stock, rider, correction, receipt dialogs
    ui-collecto/           shared UI primitives (chips, avatar, tables, search, pager, …)
  lib/
    calc.ts                installment schedule / balance engine
    seed.ts                demo dataset
    selectors.ts           derived data, dashboard & report builders
  store/                   Zustand mock backend (app data + session) and UI modal store
  services/api.ts          API facade — swap these functions for real HTTP calls
scripts/extract-prototype.mjs   unpacks the original COLLECTO.html prototype into reference/ + assets
reference/                 readable sources of the HTML prototype (porting reference only)
```

## Connecting a real API

Components only depend on `src/services/api.ts` (writes) and the selectors in `src/lib/selectors.ts` (reads).
Replace the facade implementations with `fetch` calls and hydrate the store from the API.
