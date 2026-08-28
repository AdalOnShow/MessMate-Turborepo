# MessMate - Process Tracker

## Project Status

```text
Project Name: MessMate

Status: Active Development (Phase 6 Complete — Bazaar Management Done, Security Review Fixed, Next: Phase 7 Expenses)

Frontend:
Next.js 16
TypeScript
Tailwind CSS v4
TanStack Query
Zustand + Immer
Lucide icons
Custom design system (CSS variables) + selected shadcn/ui primitives (Button, Popover, Calendar, DatePicker)

Backend:
NestJS 11
Prisma ORM 7.8
PostgreSQL (Neon serverless)
JWT Authentication (Access + Refresh Tokens)
Passport (Local + JWT + Google OAuth)
Cloudinary (avatar uploads)
Multer (file uploads)

Architecture:
Turborepo Monorepo
pnpm Workspace
```

---

# Phase 0 - Project Foundation

## Monorepo Setup

- [x] Initialize Turborepo
- [x] Configure pnpm workspace
- [x] Create apps/web (Next.js 16)
- [x] Create apps/api (NestJS 11)
- [x] Create packages/database (Prisma + Neon)
- [x] Create packages/shared (DTOs, types, API response, Zod validations)
- [x] Shared Zod schemas + DTOs for members (packages/shared/src/messes/members.\*)
- [ ] Create packages/shared-types
- [ ] Create packages/shared-utils
- [ ] Create packages/validation
- [ ] Create packages/constants

> **Note:** Docs specify 5 separate packages but only `database` and `shared`
> exist. `shared` is a catch-all with DTOs, types, API response utilities, and
> Zod validations.

---

## Tooling Setup

- [x] ESLint (configured per app/package)
- [x] Prettier (root config exists)
- [x] Husky (`.husky/` directory exists)
- [ ] Husky hooks configured (pre-commit, commit-msg not verified)
- [ ] Commitlint (not configured)
- [ ] Environment Validation (not implemented)
- [x] API response envelope (middleware active on all routes)
- [x] Global validation pipe (whitelist + forbidNonWhitelisted + transform)
- [x] Global exception filter (ApiExceptionFilter)
- [x] Logging interceptor (dev mode only)
- [x] @Roles decorator + RolesGuard (role-based access control for mess endpoints)
- [ ] Path Aliases (not configured in any tsconfig)

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
- [x] Tailwind CSS v4 with design system tokens (CSS variables)
- [x] Custom dark/light/system theme store with localStorage persistence
- [x] ThemeToggle component
- [x] TanStack Query client singleton with optimized defaults
- [x] Zustand stores: Session (auth state) + Theme (dark/light/system)
- [x] API client with Bearer token injection, auto-refresh on 401, ApiResponse
      unwrapping
- [x] Server actions for auth (signup, signin, logout, getCurrentUser,
      refreshAccessToken)
- [x] Server actions for profile (getProfile, updateProfile, changePassword,
      uploadAvatar, deleteAvatar)
- [x] Server actions for members (getMembers, addMember, removeMember,
      updateMemberRole, searchUsers, createMemberAccount)
- [x] Server actions for invites (inviteUser, getPendingInvites, acceptInvite, rejectInvite)
- [x] Google Fonts: Plus Jakarta Sans + Alkatra (Bengali)
- [x] Landing page: Navbar, Hero, Stats, Features, How It Works, Pricing, Footer
- [x] Auth pages: /signin (with Google OAuth button + error handling), /signup
- [x] Auth hooks: useSignin, useSignup, useLogout (React Query mutations)
- [x] Profile hooks: useGetProfile, useUpdateProfile, useChangePassword,
      useUploadAvatar, useDeleteAvatar
- [x] Member hooks: useMembers, useAddMember, useRemoveMember, useUpdateMemberRole,
      useSearchUsers
- [x] Invite hooks: usePendingInvites, useInviteUser, useAcceptInvite, useRejectInvite
- [x] AuthInitializer component (session restoration on mount)
- [x] ProtectedPage component (client-side redirect guard)
- [x] Dashboard page (placeholder with user profile info + Quick Actions list)
- [x] Profile page (full: personal details, avatar upload/delete, change
      password, account status)
- [x] Sidebar component (responsive: desktop fixed + mobile drawer, nav links,
      user info, logout)
- [x] Members page (/dashboard/members — table, filters, manager actions, dialogs, invite flow)
- [x] Create Account page (/dashboard/members/create-account — manager creates member account)
- [x] Bundle analyzer configured (Next.js)
- [x] Root layout with metadata, SEO, OpenGraph
- [~] shadcn/ui primitives (partial — user requested Button, Popover, Calendar,
      DatePicker; rest of UI remains custom Tailwind)
- [ ] Loading/error/empty state components (not yet extracted as reusable)
- [ ] Protected route layout group (not using Next.js middleware or layout
      group)

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

### Mess System

- [x] messes
- [x] mess_members
- [x] join_requests

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

---

## Database Tasks

- [x] Create Enums (SystemRole, MessRole, MonthStatus, ExpenseType,
      BazaarStatus, CarryForwardType, activity_action)
- [x] Create Indexes (all specified indexes created)
- [x] Configure Soft Deletes (deleted_at on all major entities)
- [ ] Seed Initial Data (not done)
- [x] Generate Prisma Client
- [ ] Redis setup (no longer needed for join requests — invite system uses DB-only join_requests table)
- [x] Remove meal_entry_items table (ADR-021 specifies JSONB-based meal storage)

> ~~**Issue:** Schema still includes `meal_entry_items` table, but ADR-021
> specifies JSONB-based meal storage which eliminates this table. Requires
> schema migration to remove.~~ **Resolved in Phase 5.**

---

# Phase 2 - Authentication Module

## Backend

- [x] Register API (POST /auth/signup) — Zod validation via @repo/shared, hashed
      password, tokens issued
- [x] Login API (POST /auth/signin) — Passport local strategy, bcrypt compare,
      tokens issued
- [x] Refresh Token API (POST /auth/refresh) — cookie-based refresh, bcrypt hash
      comparison, token rotation
- [x] Logout API (POST /auth/logout) — clears refresh_token in DB, clears
      httpOnly cookie

> All 4 auth endpoints use httpOnly cookies for refresh tokens. Access tokens
> via Bearer header. Refresh tokens are hashed with bcrypt and stored in
> `users.refresh_token`.

## OAuth (Google)

- [x] Google Login — Full flow implemented:
  - [x] GoogleStrategy with email verification check
  - [x] findOrCreateGoogleUser (creates new user or links existing OAuth
        account)
  - [x] GET /auth/google (initiates OAuth redirect)
  - [x] GET /auth/google/callback (handles callback, sets cookies, redirects to
        /dashboard)
  - [x] Error handling (NO_EMAIL, EMAIL_NOT_VERIFIED, ACCOUNT_EXISTS)
  - [x] GoogleSignInButton component on /signin and /signup pages
  - [x] OAuth error display from URL query params

## Profile

- [x] Get Profile (GET /users/me)
- [x] Update Profile (PATCH /users/me) — name, phone
- [x] Update Password (PATCH /users/me/password) — current password verification
- [x] Upload Avatar (POST /users/me/avatar) — Cloudinary upload with face-crop,
      old avatar cleanup
- [x] Delete Avatar (DELETE /users/me/avatar) — Cloudinary deletion + DB cleanup
- [x] Search Users (GET /users/search?q=...) — name/email search for Add Member flow

## Frontend Auth Pages

- [x] /signin — Full page with Google OAuth button, email/password form, Zod
      validation, error display
- [x] /signup — Full page with Google OAuth button, name/email/password form,
      Zod validation, error display
- [x] /dashboard — Auth-gated with AuthInitializer, Sidebar layout, user profile
      display
- [x] /profile — Full profile management: personal details form, avatar upload
      (CompactAvatarUpload component), change password form, account status
      display

## Manager Created Account

- [x] Create Member Account (POST /users/create-member — manager creates user + auto-adds to mess)
- [x] Create Member Account Page (/dashboard/members/create-account — form with name, email, password, phone)
- [ ] Temporary Password Flow (not implemented — manager manually sets password)
- [ ] First Time Setup Flow (not implemented)
- [ ] One Time Email Update Logic (not implemented)

---

# Phase 3 - Mess Management

## Mess

- [x] Create Mess (backend module + controller + service + DTOs)
- [x] Create Mess UI (dashboard Create Mess button + modal)
- [ ] Update Mess
- [ ] View Mess

---

## Members

- [x] Add Member (backend: POST /messes/:messId/members, frontend: AddMemberDialog with user search)
- [x] Invite Member (backend: POST /invites, frontend: AddMemberDialog → search → "Send Invite")
- [x] Accept/Reject Invite (backend: POST /invites/:id/accept|reject, frontend: InviteBanner on dashboard)
- [x] Pending Invites (backend: GET /invites/pending, frontend: usePendingInvites hook)
- [x] Invite Expiry (7-day automatic expiry in getPendingInvites)
- [x] Create Member Account (backend: POST /users/create-member, frontend: /dashboard/members/create-account page)
- [x] Remove Member (backend: DELETE /messes/:messId/members/:userId, frontend: RemoveMemberDialog with confirmation)
- [x] Active Members List (backend: GET /messes/:messId/members?status=ACTIVE, frontend: table with filters)
- [x] Removed Members List (backend: GET /messes/:messId/members?status=REMOVED, frontend: table with filters)
- [x] Search Users (backend: GET /users/search?q=..., frontend: user search in AddMemberDialog)
- [x] Members page with table, search, role/status filters, permission branching
- [x] Loading skeletons, empty states, inline success/error messages
- [x] Shared Zod schemas + DTOs in packages/shared/src/messes/members.schemas.ts

---

## Manager Assignment

- [x] Assign Manager (backend: PATCH /messes/:messId/members/:userId/role, frontend: RoleChangeDialog)
- [x] Remove Manager (same endpoint, demotes to MEMBER)
- [x] Enforce Max Two Managers (backend validation + frontend disables MANAGER option when limit reached)
- [x] Prevent Demoting Last Manager (backend validation + frontend disables MEMBER option)

---

## Join Request (Invite System)

- [x] Invite User (POST /invites — manager sends invite to existing user via email)
- [x] Get Pending Invites (GET /invites/pending — user sees pending invites on dashboard)
- [x] Accept Invite (POST /invites/:id/accept — user becomes member, join_requests status = ACCEPTED)
- [x] Reject Invite (POST /invites/:id/reject — invite cancelled, join_requests status = REJECTED)
- [x] 7-Day Expiry (auto-expires PENDING invites older than 7 days in getPendingInvites)
- [x] Duplicate Prevention (ensureCanInvite checks: already member, already pending, previously removed)
- [x] Activity Logging (invite sends MEMBER_ADDED log, accept creates mess_members + log)
- [x] Dashboard Notification Banner (InviteBanner with Accept/Reject buttons)
- [x] AddMemberDialog → Invite Flow (search → select → "Send Invite" instead of direct add)
- [x] Not-Found User → Create Account Link (shows "Create Account" when email not registered)
- [ ] Redis Verification Code (not needed — replaced by DB-only invite flow)

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

- [x] Create Meal Type (POST /messes/:messId/meal-types)
- [x] Update Meal Type (PATCH /messes/:messId/meal-types/:mealTypeId)
- [x] Disable Meal Type (PATCH with is_active: false)
- [x] Delete Meal Type (DELETE /messes/:messId/meal-types/:mealTypeId)
- [x] Meal Types Page (/dashboard/meal-types)

---

## Meal Entry

- [x] Create Daily Meal Entry (POST /meals/:messId/:monthId)
- [x] Bulk Meal Entry (same endpoint, array of entries)
- [x] Update Meal Entry (upsert via bulk save)
- [x] Delete Meal Entry (DELETE /meals/:messId/:entryId + UI reset button)
- [x] Activity Logging (MEAL_ADDED, MEAL_UPDATED, MEAL_DELETED)

---

## Meal Reports

- [x] Daily Meal Report (GET /meals/:messId/:monthId/daily?date=...)
- [x] Member Meal Report (GET /meals/:messId/:monthId/member/:memberId)
- [x] Monthly Meal Report (GET /meals/:messId/:monthId/summary)
- [x] Reports Page (/dashboard/meals/reports — tabbed: Daily, Member, Monthly)
- [x] Dashboard Meal Summary Card

---

# Phase 6 - Bazaar Management

## Bazaar Submission

- [x] Submit Bazaar (POST /bazaar/:messId/:monthId — any active member)
- [x] Add Bazaar Items (JSONB item list with name + amount, ADR-022)
- [x] Edit Bazaar Submission (PATCH /bazaar/:messId/:submissionId — while PENDING only, submitter or manager)
- [x] Delete Bazaar Submission (DELETE /bazaar/:messId/:submissionId — while PENDING only)

---

## Bazaar Approval

- [x] Approve Bazaar (POST /bazaar/:messId/:submissionId/approve — manager only, atomically creates `expenses` row type=BAZAAR, ADR-012)
- [x] Reject Bazaar (POST /bazaar/:messId/:submissionId/reject — manager only)

---

## Bazaar History

- [x] Submitted Bazaar List (GET /bazaar/:messId/:monthId → { pending, approved, rejected })
- [x] Approved Bazaar List
- [x] Rejected Bazaar List
- [x] Bazaar Page UI (/dashboard/bazaar — submit form, tabs for pending/approved/rejected, approve/reject/edit/delete actions)
- [x] shadcn DatePicker on bazaar form (replaces native date input)
- [x] Manager dashboard Pending Bazaar Approvals card (approve/reject inline)
- [x] Activity logging (BAZAAR_SUBMITTED, BAZAAR_UPDATED, BAZAAR_APPROVED, BAZAAR_REJECTED added to enum + migration)

---

# Phase 7 - Expense Management

> **Scope note (user request):** The expenses page is currently a dedicated
> add-only page (/dashboard/expenses) for creating extra shared/individual
> expenses with an auto-split preview. History/tabs/summary-cards were removed
> from that page per user request. The API supports full create/update/delete
> (manager-only) and BAZAAR-type expenses (auto-created on bazaar approve) are
> locked. Expense reports remain pending (below).

## Shared Expenses

- [x] Create Shared Expense
- [x] Select Members
- [x] Allocate Expense (auto-split preview in UI + even split with remainder)
- [x] Update Expense

---

## Individual Expenses

- [x] Create Individual Expense
- [x] Assign Member
- [x] Update Individual Expense

---

## Expense Reports

- [ ] Expense Summary
- [ ] Expense History
- [ ] Member Expense Breakdown

---

# Phase 8 - Deposit Management

## Deposits

- [x] Add Deposit (POST /deposits/:messId/:monthId — manager only, Zod validation, activity log DEPOSIT_ADDED)
- [x] Update Deposit (PATCH /deposits/:messId/:depositId — manager only, activity log DEPOSIT_UPDATED)
- [x] Delete Deposit (DELETE /deposits/:messId/:depositId — manager only, soft delete via deleted_at)
- [x] Deposit History (GET /deposits/:messId/:monthId — active members can view, returns items + total + count)
- [x] Shared package (packages/shared/src/deposits — create/update Zod DTOs + Deposit/DepositListResponse interfaces)
- [x] API module (apps/api/src/deposits — service/controller/module, wired into app.module)
- [x] Frontend (apps/web — actions/deposits.ts, hooks/use-deposits.ts, /dashboard/deposits add-only page with form + skeletons; **no** totals/history cards, matching the simplified expenses page)
- [x] Nav links added (Sidebar + BottomNav, /dashboard/deposits, WalletCards icon)
- [x] Removed `note` field from deposits schema (matching expenses note removal)
- [x] Manager permission model (per user choice — manager-only create/edit/delete, view for all members)

> **Scope note (user request):** The deposits page is add-only — it does NOT
> show total deposits, counts, or deposit history. API still supports
> create/update/delete with activity logging; only the page was simplified.

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

- [x] Member Added
- [x] Member Removed
- [ ] Meal Added
- [ ] Meal Updated
- [x] Expense Added
- [x] Expense Updated
- [x] Deposit Added
- [x] Deposit Updated
- [x] Bazaar Submitted
- [x] Bazaar Approved
- [x] Bazaar Rejected
- [x] Manager Assigned
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
- [x] Rate limit guard actually enforced (ThrottlerGuard registered as APP_GUARD)
- [x] JWT tokens stored in httpOnly cookies only (removed from Zustand)
- [x] CORS hardened (explicit methods/headers, CORS_ORIGIN validated, no fallback)
- [x] MembershipGuard (applied to mess read endpoints) — prevents cross-mess IDOR
- [x] User search strips PII (no phone numbers exposed)
- [x] Soft-deleted users blocked from all auth flows (login, refresh, JWT)
- [x] COOKIE_DOMAIN env support for auth cookies (split-host deployments)
- [x] Environment variables documented (.env.example files)
- [x] Cloudinary configured for avatar uploads
- [x] Multer configured with file size/type limits for avatar uploads

## CI/CD Pipeline

- [x] GitHub Actions workflow created (.github/workflows/ci.yml)
- [x] Turborepo remote caching configured (TURBO_TOKEN/TURBO_TEAM)
- [x] Selective builds (--filter=[origin/main])
- [x] Frozen lockfile in CI (--frozen-lockfile)

## Deployment

- [x] Vercel deployment guide (web app)
- [x] Vercel deployment guide (API - serverless via @vendia/serverless-express)
- [x] Neon database setup guide
- [x] Environment variables configuration (.env + .env.example)

## Performance

- [x] Turbo.json updated (test task, inputs, cache)
- [x] Bundle analyzer added to Next.js
- [x] DATABASE_URL consolidated (single source of truth)

---

# Security Review — Deferred Work

Items found in full-project security review (root commit `aa549b95...HEAD`), queued for later:

- [ ] S1 — Balance carry-forward (ADR-008) unimplemented. `closeMonth` writes `carry_forward_balances` only if an active other month exists, but `createMonth` closes the old month first, so records never get written; the month summary never applies carries. Fix ordering + apply carry when computing `opening_balance`/summary.
- [ ] S2 — Deposit Management missing entirely. Schema has `deposits` table but no API module, no controller, no UI. Needed: deposits CRUD (Phase 8), member deposit summary, net balance calc.
- [ ] S3 — SHARED expenses double-counted in `months.service.ts` `closeMonth`: BAZAAR+SHARED amounts are included in `totalMealCost`/meal rate (lines ~161-165) AND SHARED allocations are also added to `memberSharedCost` (lines ~176-181). Decide which bucket carries shared cost and subtract.
- [ ] S4 — Expense/Deposit UI absent. `Sidebar.tsx` and `BottomNav.tsx` link to `/dashboard/expenses` and `/dashboard/deposits` which 404. Build pages (ties into Phase 7/8 after S2/S3 resolved).

---

# Current Focus

```text
Current Phase:
Phase 6 - Bazaar Management (COMPLETED)

Phase 6 Completed:
- Bazaar submission (any active member), with JSONB item list + description + date
- Edit/delete PENDING submissions (submitter or manager)
- Manager approve/reject workflow
- Approve atomically creates `expenses` row (type=BAZAAR) per ADR-012
- Bazaar history lists (pending/approved/rejected)
- Bazaar Page UI (/dashboard/bazaar)
- Activity logging (BAZAAR_SUBMITTED, BAZAAR_UPDATED, BAZAAR_APPROVED, BAZAAR_REJECTED)
- shadcn DatePicker on bazaar form (replaces native date input)
- Manager dashboard Pending Bazaar Approvals card (approve/reject inline)

Next Priority:
- Phase 7 - Expense Management
- Phase 8 - Deposit Management

Completed Phases:
- Phase 0 - Project Foundation
- Phase 1 - Database Layer
- Phase 2 - Authentication Module
- Phase 3 - Mess Management
- Phase 4 - Month Management
- Phase 5 - Meal Management
- Phase 6 - Bazaar Management
```
