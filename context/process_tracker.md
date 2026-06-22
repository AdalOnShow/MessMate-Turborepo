# MessMate - Process Tracker

## Project Status

```text
Project Name: MessMate

Status: Active Development (Phase 1-2)

Frontend:
Next.js 16
TypeScript
Tailwind CSS v4
TanStack Query
Zustand + Immer
shadcn/ui (Lucide icons)

Backend:
NestJS 11
Prisma ORM 7.8
PostgreSQL (Neon)
JWT Authentication (Access + Refresh Tokens)
Passport (Local + JWT)

Architecture:
Turborepo Monorepo
pnpm Workspace
```

---

# Phase 0 - Project Foundation

## Monorepo Setupww

- [x] Initialize Turborepo
- [x] Configure pnpm workspace
- [x] Create apps/web (Next.js 16)
- [x] Create apps/api (NestJS 11)
- [x] Create packages/database (Prisma + Neon)
- [x] Create packages/shared (DTOs, types, API response)
- [ ] Create packages/shared-types
- [ ] Create packages/shared-utils
- [ ] Create packages/validation
- [ ] Create packages/constants

> **Note:** Docs specify 5 separate packages but only `database` and `shared`
> exist. `shared` is a catch-all with DTOs, types, and API response utilities.

---

## Tooling Setup

- [x] ESLint (configured per app/package, but lint fails in database due to
      v8→flat config mismatch)
- [x] Prettier (root config exists)
- [ ] Husky (not configured)
- [ ] Commitlint (not configured)
- [ ] Environment Validation (not implemented)
- [x] API response envelope (middleware active on all routes)
- [x] Global validation pipe (whitelist + forbidNonWhitelisted + transform)
- [ ] Path Aliases (not configured)

---

## Documentation

- [x] project-overview.md
- [x] technical-flow.md
- [x] database-schema.md
- [x] features.md
- [x] architecture-decisions.md (23 ADRs)
- [x] design.md (full design system)
- [ ] API Documentation (not started)

---

## Frontend Foundation

- [x] Next.js 16 app with App Router
- [x] Tailwind CSS v4 with design system tokens
- [x] Custom dark/light/system theme store with localStorage persistence
- [x] TanStack Query client singleton with optimized defaults
- [x] Zustand stores: Session (auth state) + Theme (dark/light/system)
- [x] API client with Bearer token injection and ApiResponse unwrapping
- [x] Google Fonts: Plus Jakarta Sans + Alkatra (Bengali)
- [x] Landing page: Navbar, Hero, Stats, Features, How It Works, Pricing, Footer
- [x] Auth pages: /signin, /signup
- [x] Auth hooks: useSignin, useSignup, useLogout (React Query mutations)
- [ ] Dashboard pages (not started)
- [ ] Protected route layout (not implemented)
- [ ] Loading/error/empty state components (not implemented)

---

# Phase 1 - Database Layer

## PostgreSQL Setup

- [x] Configure PostgreSQL (Neon serverless)
- [x] Configure Prisma (7.8 with Neon adapter)
- [x] Create Prisma Client Package (@repo/database)
- [x] 2 migrations applied: init + add_refresh_token

---

## Schema Implementation

### Core

- [x] users (with refresh_token support)
- [x] oauth_accounts
- [x] messes
- [x] mess_members

### Month System

- [x] months

### Meal System

- [x] meal_types
- [x] meal_entries
- [x] meal_entry_items (DROPPED per ADR-021 - should use JSONB instead)

### Bazaar System

- [x] bazaar_submissions

### Expense System

- [x] expenses
- [x] expense_members

### Deposit System

- [x] deposits

### Accounting System

- [x] member_month_summaries
- [x] carry_forward_balances

### Activity System

- [x] activity_logs

### Join Request System

- [x] join_requests

---

## Database Tasks

- [x] Create Enums (SystemRole, MessRole, MonthStatus, ExpenseType,
      BazaarStatus, CarryForwardType, activity_action)
- [x] Create Indexes (all specified indexes created)
- [x] Configure Soft Deletes (deleted_at on all major entities)
- [ ] Seed Initial Data (not done)
- [x] Generate Prisma Client
- [ ] Redis setup (not configured - needed for join verification codes)

> **Issue:** Schema still includes `meal_entry_items` table, but ADR-021
> specifies JSONB-based meal storage which eliminates this table. Requires
> schema migration to remove.

---

# Phase 2 - Authentication Module

## Backend

- [x] Register API (POST /auth/signup)
- [x] Login API (POST /auth/signin)
- [x] Refresh Token API (POST /auth/refresh)
- [x] Logout API (POST /auth/logout)

> All 4 auth endpoints use httpOnly cookies for refresh tokens. Access tokens
> via Bearer header. Refresh tokens are hashed with bcrypt and stored in
> `users.refresh_token`.

## OAuth

- [ ] Google Login (not implemented)

## Profile

- [x] Get Profile (GET /users/me)
- [x] Update Profile (PATCH /users/me)
- [x] Update Password (PATCH /users/me/password)
- [ ] Upload Avatar (not implemented)

## Manager Created Account

- [ ] Create Member Account (not implemented)
- [ ] Temporary Password Flow (not implemented)
- [ ] First Time Setup Flow (not implemented)
- [ ] One Time Email Update Logic (not implemented)

---

# Phase 3 - Mess Management

## Mess

- [ ] Create Mess
- [ ] Update Mess
- [ ] View Mess

---

## Members

- [ ] Add Member
- [ ] Remove Member
- [ ] Active Members List
- [ ] Removed Members List

---

## Manager Assignment

- [ ] Assign Manager
- [ ] Remove Manager
- [ ] Enforce Max Two Managers

---

## Join Request

- [ ] Generate Verification Code
- [ ] Redis Storage
- [ ] Verify Join Request
- [ ] Join Request History

---

# Phase 4 - Month Management

## Active Month

- [ ] Create Month
- [ ] Get Active Month
- [ ] Active Month Dashboard

---

## Month Closing

- [ ] Calculate Final Summary
- [ ] Generate Member Summary
- [ ] Generate Carry Forward Balances
- [ ] Archive Month

---

## Month History

- [ ] View Previous Months
- [ ] View Archived Reports

---

# Phase 5 - Meal Management

## Meal Types

- [ ] Create Meal Type
- [ ] Update Meal Type
- [ ] Disable Meal Type

---

## Meal Entry

- [ ] Create Daily Meal Entry
- [ ] Bulk Meal Entry
- [ ] Update Meal Entry
- [ ] Delete Meal Entry

---

## Meal Reports

- [ ] Daily Meal Report
- [ ] Member Meal Report
- [ ] Monthly Meal Report

---

# Phase 6 - Bazaar Management

## Bazaar Submission

- [ ] Submit Bazaar
- [ ] Add Bazaar Items
- [ ] Edit Bazaar Submission

---

## Bazaar Approval

- [ ] Approve Bazaar
- [ ] Reject Bazaar

---

## Bazaar History

- [ ] Submitted Bazaar List
- [ ] Approved Bazaar List
- [ ] Rejected Bazaar List

---

# Phase 7 - Expense Management

## Shared Expenses

- [ ] Create Shared Expense
- [ ] Select Members
- [ ] Allocate Expense
- [ ] Update Expense

---

## Individual Expenses

- [ ] Create Individual Expense
- [ ] Assign Member
- [ ] Update Individual Expense

---

## Expense Reports

- [ ] Expense Summary
- [ ] Expense History
- [ ] Member Expense Breakdown

---

# Phase 8 - Deposit Management

## Deposits

- [ ] Add Deposit
- [ ] Update Deposit
- [ ] Deposit History

---

## Reports

- [ ] Member Deposit Summary
- [ ] Monthly Deposit Summary

---

# Phase 9 - Accounting Engine

## Meal Rate Calculation

- [ ] Calculate Total Meals
- [ ] Calculate Total Meal Cost
- [ ] Calculate Meal Rate

---

## Bill Calculation

- [ ] Shared Cost Calculation
- [ ] Individual Cost Calculation
- [ ] Deposit Calculation
- [ ] Final Balance Calculation

---

## Carry Forward

- [ ] Previous Due Logic
- [ ] Previous Balance Logic

---

# Phase 10 - Dashboard

## Manager Dashboard

- [ ] Current Month
- [ ] Total Members
- [ ] Total Meals
- [ ] Total Deposits
- [ ] Total Expenses
- [ ] Meal Rate
- [ ] Balance
- [ ] Recent Activities

---

## Member Dashboard

- [ ] Personal Meals
- [ ] Personal Deposits
- [ ] Personal Expenses
- [ ] Personal Balance
- [ ] Bazaar Information
- [ ] Monthly Summary

---

# Phase 11 - Activity Logs

## Logging

- [ ] Member Added
- [ ] Member Removed
- [ ] Meal Added
- [ ] Meal Updated
- [ ] Expense Added
- [ ] Expense Updated
- [ ] Deposit Added
- [ ] Deposit Updated
- [ ] Bazaar Submitted
- [ ] Bazaar Approved
- [ ] Manager Assigned
- [ ] Manager Removed

---

## Activity Feed

- [ ] Recent Activities API
- [ ] Activity Feed UI

---

# Phase 12 - Reports

## Member Reports

- [ ] Member Summary
- [ ] Member Balance
- [ ] Member Expenses

---

## Month Reports

- [ ] Monthly Summary
- [ ] Meal Summary
- [ ] Expense Summary
- [ ] Deposit Summary

---

# Future Features

## Connected Accounts Management

- [ ] Google account linking
- [ ] Google account unlinking
- [ ] Linked providers UI
- [ ] OAuth account management settings page
- [ ] Activity logging for linking/unlinking

---

## Chat

- [ ] Group Chat
- [ ] Message History
- [ ] File Sharing

---

## Mobile

- [ ] React Native App
- [ ] Android App
- [ ] iOS App

---

## SaaS

- [ ] Subscription Plans
- [ ] Billing System
- [ ] Super Admin Dashboard

---

# Definition of Done

A task can be marked complete only if:

- [ ] Backend API completed
- [ ] Frontend UI completed
- [ ] Validation completed
- [ ] Authorization completed
- [ ] Activity logging implemented
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] Documentation updated

---

# Infrastructure & DevOps

## Security Improvements

- [x] Rate limiting configured (5 req/min on auth, 10 req/min global)
- [x] JWT tokens stored in httpOnly cookies only (removed from Zustand)
- [x] CORS hardened (explicit methods/headers, no fallback)
- [x] Environment variables documented (.env.example files)

## CI/CD Pipeline

- [x] GitHub Actions workflow created
- [x] Turborepo remote caching configured
- [x] Selective builds (--filter=[origin/main])
- [x] Frozen lockfile in CI (--frozen-lockfile)

## Deployment

- [x] Vercel deployment guide (web app)
- [x] Vercel deployment guide (API - serverless)
- [x] Neon database setup guide
- [x] Environment variables configuration

## Performance

- [x] Turbo.json updated (test task, inputs, cache)
- [x] Bundle analyzer added to Next.js
- [x] DATABASE_URL consolidated (single source of truth)

---

# Current Focus

```text
Current Phase:
Phase 1-2 (Active)

Current Priority:
Complete Phase 3 (Mess Management)
- Create Mess API + UI
- Member Management (Add/Remove/List)
- Manager Assignment
- Join Request with Redis verification

Next Up:
Phase 4 - Month Management
- Active month creation
- Month closing and archiving
- Balance carry forward
```
