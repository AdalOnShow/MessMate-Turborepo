<div align="center">

<img src="apps/web/public/messmate-logo.png" alt="MessMate logo" height="72" />

# MessMate

**Meal, bazaar and expense accounting for shared bachelor messes, with no more month-end spreadsheet math.**

[**Live Demo**](https://messmate.sadal.dev/) · [Screenshots](#screenshots) · [Architecture](#architecture) · [Engineering Highlights](#engineering-highlights) · [Run Locally](#getting-started)

![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![NestJS](https://img.shields.io/badge/NestJS_11-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](<https://img.shields.io/badge/PostgreSQL_(Neon)-4169E1?logo=postgresql&logoColor=white>)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?logo=tailwindcss&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white)
![CI](https://github.com/AdalOnShow/MessMate-Turborepo/actions/workflows/ci.yml/badge.svg)

<br />

<img src="docs/screenshots/dashboard.png" alt="MessMate manager dashboard: mess balance, meal rate, pending bazaar approvals and each member's meals" width="900" />

</div>

---

## Why this project exists

### The problem

In Bangladesh, students and young professionals often live in a **mess**: a shared flat where a group of people cook and eat together and split every cost. The money side is surprisingly hard:

- **Meals change every day.** Someone skips lunch, someone has a guest, someone is home for a week. Each member's share of the food depends on how many meals _they_ ate.
- **Everyone shops.** Members take turns going to the bazaar and pay out of pocket, so receipts have to be collected, checked and added up.
- **Bills are split differently.** Rent, the cook's salary, Wi-Fi and electricity are shared equally; a personal purchase belongs to one person.
- **Money moves across months.** Some members pay in advance, some owe at month end, and those balances must carry into the next month.

I live in a bachelor mess in Dhaka. Every month one of us spent hours doing this in a notebook or a spreadsheet, then posted the result in the group chat, and someone always found a mistake. Nobody could check the numbers during the month, so disputes only surfaced at the end.

### The solution

MessMate turns that monthly chore into a running ledger that everyone can see:

| Who         | What they do in MessMate                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Manager** | Records the day's meals in one grid, approves bazaar receipts, adds shared and individual bills, records deposits, and closes the month.             |
| **Member**  | Submits their bazaar receipts, and sees the meal rate, their own bill and their balance at any time — no waiting for month end.                      |
| **The app** | Calculates the meal rate, splits every bill to the paisa, produces each member's final bill, and carries balances into the next month automatically. |

**All 8 members of my mess used it to run October 2026.**

## Try it

| Role                  | Email                        | Password        |
| --------------------- | ---------------------------- | --------------- |
| Manager (full access) | `demo.manager@messmate.demo` | `MessMate@2026` |
| Member                | `demo.member@messmate.demo`  | `MessMate@2026` |

The live demo mess, _Green Villa Bachelor Mess_, has 8 members, a **closed October 2026** with final bills and carried-forward balances, and an **active November 2026** with daily meals, bazaar submissions waiting for approval, shared bills and deposits.

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/meals.png" alt="Daily meal entry grid" /><br />
      <b>Daily meal entry.</b> One grid for the whole mess, with half-meal steppers and an "Everyone" row to fill a normal day in one tap.
    </td>
    <td width="50%">
      <img src="docs/screenshots/bazaar.png" alt="Bazaar approval queue" /><br />
      <b>Bazaar approval.</b> Members submit itemised grocery runs; a manager approves (which posts the expense) or rejects them.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/month-summary.png" alt="Archived month summary" /><br />
      <b>Month close.</b> Closing a month archives it with the meal rate, totals, expense breakdown and every member's final bill.
    </td>
    <td width="50%">
      <img src="docs/screenshots/members.png" alt="Member cards with live balances" /><br />
      <b>Live balances.</b> Every member's meals, deposits, meal cost, shared and individual costs, and balance carried from last month.
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <img src="docs/screenshots/reports.png" alt="Per-day meal report" /><br />
      <b>Reports.</b> Per-day, per-member meal report (plus expenses, deposits and bazaar tabs). Any saved day can be corrected from here.
    </td>
  </tr>
</table>

**Mobile first.** A mess runs from people's phones, so MessMate is built as an installable PWA with a bottom navigation bar.

<p align="center">
  <img src="docs/screenshots/dashboard-mobile.png" alt="Dashboard on a phone" width="260" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/meals-mobile.png" alt="Meal entry on a phone" width="260" />
</p>

## Features

- **Mess and roles:** create a mess, invite members or create accounts for them, with up to two managers who have equal permissions. A manager can hand the role over to another member.
- **Daily meal grid:** one screen to record everyone's meals for a day, in half-meal steps. Meal types and their default counts are configurable per mess. Saved days are corrected from Reports.
- **Bazaar workflow:** members submit itemised grocery runs, and a manager approves (which posts the expense) or rejects them.
- **Three expense types:**
  - _Bazaar_ costs set the meal rate.
  - _Shared_ bills (rent, cook, Wi-Fi) are split equally to the paisa.
  - _Individual_ charges go to one member.
- **Deposits and live balances:** members always see their meal rate, current bill and balance.
- **Month lifecycle:** the manager closes the month, which archives it, computes every member's final bill, and opens the next month with each balance carried forward as a credit or a due.
- **Reports and history:** per-member and per-day meal reports, archived month summaries, and a full activity log of every change.
- **Accounts:** email/password or Google sign-in, per-device sessions, avatar upload, and profile and password management.
- **Polished UI:** English and বাংলা (Bengali), dark theme with a light mode, mobile-first layout, installable PWA with an offline page.

## Tech stack

| Layer    | Technology                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| Frontend | Next.js 16 (App Router, Server Actions), React 19, TanStack Query, Zustand, Tailwind CSS v4, Radix primitives, next-intl |
| Backend  | NestJS 11, Passport (JWT + Google OAuth 2.0), Zod validation, @nestjs/throttler                                          |
| Data     | PostgreSQL on Neon (serverless), Prisma 7 with the Neon driver adapter                                                   |
| Shared   | `@repo/shared`: Zod schemas, DTOs and response types used by **both** apps                                               |
| Infra    | Turborepo + pnpm workspaces, Vercel (web), Render (API), Cloudinary, GitHub Actions CI with remote caching               |

## Architecture

```mermaid
flowchart LR
    B[Browser / PWA] -->|RSC + Server Actions| W[Next.js 16<br/>apps/web]
    W -->|REST + JWT<br/>X-Request-Id| A[NestJS 11 API<br/>apps/api]
    A -->|Prisma 7 + Neon adapter| D[(PostgreSQL<br/>Neon)]
    A --> C[Cloudinary<br/>avatars]
    A --> G[Google OAuth]
    S[[packages/shared<br/>Zod schemas · DTOs · types]] -.-> W
    S -.-> A
    P[[packages/database<br/>Prisma schema · client]] -.-> A
```

```
apps/
  web/        Next.js 16: pages, server actions, React Query hooks, i18n, PWA
  api/        NestJS 11: auth, messes, meals, bazaar, expenses, deposits, months
packages/
  database/   Prisma schema, migrations, lazy Neon client
  shared/     Zod schemas + TypeScript types shared by web and api
context/      Product spec, database design, 24 Architecture Decision Records
```

The browser never talks to the API directly. Server Actions call it with the access token from an HTTP-only cookie, so tokens are never exposed to client JavaScript.

## Engineering highlights

**Correct money math, atomically.** Closing a month archives it, computes every member's summary, opens the next month, writes carry-forward balances and logs the action in a **single database transaction**. The status-guarded update acts as a lock, so a meal saved while the month is closing can't be left out of the bill. The calculation is a pure, Prisma-free function (`month-summary.ts`) that is unit-tested on its own. It never counts shared bills twice in the meal rate, and it splits the bazaar total across members in whole paisa with the largest-remainder method, so the meal costs always add up to exactly what was spent.

**Documented decisions.** Before the code there were **24 Architecture Decision Records** (`context/architecture-decisions.md`): one active mess per user, at most two managers, JSONB meal storage instead of a join table, soft deletes, timestamp-based membership, and the carry-forward rules.

**One validation contract, two apps.** Request bodies are validated with Zod schemas from `@repo/shared`. The web app imports the same package (the auth forms validate with the exact schemas the API enforces), so request and response types can't drift between client and server.

**Auth done properly.**

- Short-lived access tokens with 30-day sliding refresh sessions.
- **Per-device sessions** that store only a SHA-256 hash of each refresh token, so any device can be revoked.
- Transparent refresh on a 401, followed by one retry.
- Google OAuth with account linking.
- bcrypt password hashing.
- Per-user rate limiting, with stricter limits on auth routes.

**Consistent, safe errors.**

- Every response uses the same `{ success, message, data }` envelope.
- Errors carry a machine-readable `code` and a `requestId` that is also sent as the `X-Request-Id` header.
- Prisma errors map to the right HTTP status (unique violation → 409, missing record → 404, database unreachable → 503).
- 5xx details are logged as structured JSON and never leaked to the client.

**Frontend that doesn't lie.** Server Actions return a typed `ActionResult` instead of throwing, because Next.js hides thrown error messages in production. A failed load shows an error state, never an empty state. Otherwise a network blip could look like "no active month" and offer the manager a destructive "Start Month" button.

**Role-based access at the edge of every route.** NestJS guards check JWT → mess membership → manager role against the `:messId` in the URL, so one mess can never read or write another's data.

**Serverless-ready.** The same NestJS app runs as a long-lived server (local dev, Render in production) or as a lazily bootstrapped Vercel serverless function, from one entry point.

## Getting started

**Prerequisites:** Node.js 20+, pnpm 9, and a PostgreSQL database (a free [Neon](https://neon.tech) project works).

```bash
git clone https://github.com/AdalOnShow/MessMate-Turborepo.git messmate
cd messmate
pnpm install
```

Create a `.env` in the repo root (see `apps/api/.env.example` for every option):

```bash
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=<64-char hex>
JWT_REFRESH_SECRET=<64-char hex>
CORS_ORIGIN=http://localhost:3000
# optional: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET, CLOUDINARY_*
```

and `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Apply the schema, build the shared packages, and load the demo mess (8 members):

```bash
cd packages/database && pnpm prisma migrate deploy && cd ../..
pnpm turbo build --filter=@repo/database --filter=@repo/shared
pnpm --filter api seed:demo          # add --reset to rebuild it later
```

Run both apps:

```bash
pnpm turbo dev --filter=api          # http://localhost:4000
pnpm turbo dev --filter=web          # http://localhost:3000
```

### Useful commands

```bash
pnpm turbo build                     # build everything
pnpm turbo lint                      # ESLint (warnings fail CI)
pnpm turbo check-types               # TypeScript across the monorepo
pnpm --filter api test               # Jest unit tests
pnpm --filter api test:e2e           # Jest e2e tests
```

## Roadmap

- [ ] End-to-end tests for the full accounting flow (meals → bazaar → month close → carry-forward)
- [ ] PDF / CSV export of monthly bills
- [ ] Push notifications for bazaar approvals and month close
- [ ] Mobile app reusing `@repo/shared`
- [ ] Multi-tenant SaaS mode (designed for in ADR-019)

## Author

**Sharif Adal**: full-stack developer

[Portfolio](https://sharifadal.me) · [LinkedIn](https://linkedin.com/in/adalonshow) · [adalonshow@gmail.com](mailto:adalonshow@gmail.com)
