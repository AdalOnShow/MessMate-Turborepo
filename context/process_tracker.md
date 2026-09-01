# MessMate - Process Tracker

## Project Status

```text
Project Name: MessMate

Status: Active Development (Phase 10 complete — Manager + Member Dashboard done; Recent Activities complete and rendered via the dashboard RecentActivity card)

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

- [x] Calculate Total Meals
- [x] Calculate Total Meal Cost
- [x] Calculate Meal Rate

---

## Bill Calculation

- [x] Shared Cost Calculation
- [x] Individual Cost Calculation
- [x] Deposit Calculation
- [x] Final Balance Calculation

---

## Carry Forward

- [x] Previous Due Logic
- [x] Previous Balance Logic

---

## Implementation Notes (Phase 9)

- Core accounting lives in `apps/api/src/months/months.service.ts` `closeMonth`
  (meal rate, per-member meal/shared/individual cost, deposits, final bill,
  final balance; writes `member_month_summaries`, archives month).
- **Carry-forward bug fixed:** previously `closeMonth` looked up an "active next
  month" before it existed, so `carry_forward_balances` were never written.
  Now `createMonth` creates the new ACTIVE month, then calls
  `generateCarryForward(messId, oldMonthId, newMonthId)` which reads
  `member_month_summaries` from the closed month and writes PREVIOUS_BALANCE
  (positive) / PREVIOUS_DUE (negative) rows per ADR-008.
- **Live member calculation engine** added:
  `GET /messes/:messId/members/calculations`
  (`MessesService.getMemberCalculations`) — computes the same math as
  `closeMonth` but for the current ACTIVE month (which has no archived summary
  yet), plus `previous_balance` (carry-forward) and `current_balance`.
  Shared type: `MemberCalculationList` in `packages/shared/src/messes/members.dto.ts`.
  This is the reusable, cacheable engine to wrap with Redis later.

---

# Phase 10 - Dashboard

## Manager Dashboard

- [x] Current Month
- [x] Total Members
- [x] Total Meals
- [x] Total Deposits
- [x] Total Expenses
- [x] Meal Rate
- [x] Balance
- [x] Recent Activities
- [x] Member Dashboard (role-based view on /dashboard; managers keep the manager bento, members get personal month summary + quick links below the shared MonthOverview/MealOverview top grid)

---

## Member Dashboard

- [x] Personal Meals
- [x] Personal Deposits
- [x] Personal Expenses
- [x] Personal Balance
- [x] Bazaar Information (dropped per user choice — bazaars are visible on the Bazaar page)
- [x] Monthly Summary (personal month summary card)

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

- [x] Recent Activities API (live via GET /messes/:messId/activities)
- [x] Activity Feed UI (dashboard RecentActivity card, rendered by DashboardPage)

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

- [x] S1 — Balance carry-forward (ADR-008) — FIXED. `createMonth` now creates the
      new ACTIVE month then calls `generateCarryForward` (reads closed month
      `member_month_summaries`, writes PREVIOUS_BALANCE/PREVIOUS_DUE). See Phase 9 notes.
- [x] S2 — Deposit Management — DONE. Full CRUD API (Phase 8) + add-only UI.
- [ ] S3 — SHARED expenses double-counted in `months.service.ts` `closeMonth`:
      BAZAAR+SHARED amounts are included in `totalMealCost`/meal rate AND SHARED
      allocations are also added to `memberSharedCost`. NOTE: the new live
      `getMemberCalculations` engine mirrors this same math for consistency with
      `closeMonth`, so if S3 is fixed it must be fixed in BOTH places together.
- [x] S4 — Expense/Deposit UI absent — RESOLVED. `/dashboard/expenses` and
      `/dashboard/deposits` pages exist (add-only).

---

## Feature Added — Members Page Live Calculation Cards

- Members page (`/dashboard/members`) now renders a **card per active member**
  showing live calculated data for the current active month:
  meals, deposits, meal cost, shared cost, individual cost, total bill,
  previous balance (carry-forward), and current balance.
- Backed by the reusable backend engine `GET /messes/:messId/members/calculations`.
- `MemberCards.tsx` replaces the old `MembersTable.tsx` (removed); management
  Role/Remove actions preserved in card footers for managers.

---

## Feature Added — Dashboard Bento Redesign

- `/dashboard` was rebuilt as a modern **bento grid** (replacing the old uniform
  8-stat-tile layout; `MessStats.tsx` removed). Reuses the existing dark theme,
  palette, and typography; only presentation/layout changed.
- Layout (`lg:grid-cols-3`, auto-flow dense):
  - **MonthOverviewBento** — large dominant card (col-span-2, row-span-2):
    month title, status, start date, active members, meal rate, and the
    merged **Financial overview** (deposits, expenses, bill, highlighted net
    balance), plus "Start New Month" / "View Month" manager actions.
  - **MealOverview** — tall right block (col-span-1, row-span-2): total meals,
    meal rate, active days, top members with proportional bars + report link.
  - **RecentActivity** — full-width (col-span-3): compact activity feed with
    type, user, time. Uses the lightweight `GET /messes/:messId/activities`
    endpoint (`MessesService.getRecentActivities`, `ActivityLog` shared type).
  - **PendingBazaarApprovals** — col-span-2 (manager-only): manager approval
    queue, preserved and restyled.
  - **QuickActions** — (col-span-1): links to Add Meal / Add Expense / Add
    Deposit / Manage Members (manager-gated).
- Data backend (unchanged contracts, additive): `GET /messes/:messId/dashboard`
  (`MessesService.getDashboard`, shared `MessDashboard`) and
  `GET /messes/:messId/activities` (`MessesService.getRecentActivities`,
  shared `ActivityLog`). Both derive from existing engine/logs — no API,
  schema, or business-logic changes.
- Reusable primitives in `apps/web/app/components/dashboard/bento.tsx`
  (`BentoCard`, `CardHeading`, `CardActionLink`) and money helpers in
  `apps/web/app/lib/format.ts` (`formatMoney` → ৳, `formatCompact`).

---

## Feature Added — Member Dashboard (Phase 10, role-based)

- `/dashboard` is now **role-based**: managers see the full manager bento
  (MonthOverview, MealOverview, Bazaar Approvals, Quick Actions, Recent
  Activity); members see the **same MonthOverview + MealOverview top grid**
  (per user request — unchanged from the manager dashboard), then:
  - **MemberMonthSummary** (col-span-2): personal month summary card —
    my deposits, my bill, meal/shared/individual cost, highlighted current
    balance, carried balance, my meals + meal rate, report links.
  - **MemberQuickLinks** (col-span-1): Add Meal, Bazaar, Meals Reports,
    Members.
  - **RecentActivity** (col-span-3) shared bottom feed.
- Additive endpoint `GET /messes/:messId/member/me`
  (`MessesService.getMemberDashboard`, MembershipGuard) — reuses the
  `getMemberCalculations` engine and returns the current user's personal
  record. Shared type: `MemberDashboard` in
  `packages/shared/src/messes/interfaces/member-dashboard.interface.ts`.
- No bazaar section on the member dashboard by user choice (bazaars are
  visible on the Bazaar page).

---

# Current Focus

```text
Current Phase:
Phase 10 - Dashboard (Manager + Member Dashboard DONE)

Phase 10 Completed:
- Manager /dashboard bento (MonthOverview+Financial, MealOverview,
  Bazaar Approvals, Quick Actions, Recent Activity)
- Member /dashboard (role-based): same MonthOverview + MealOverview top
  grid, then personal month summary card + member quick links + activity.
- Recent Activities (API + dashboard feed card) — complete.
- ৳ taka money formatting

Next Priority:
- Phase 11 - Activity Logs
- Phase 7/8 remaining polish

Completed Phases:
- Phase 0 - Project Foundation
- Phase 1 - Database Layer
- Phase 2 - Authentication Module
- Phase 3 - Mess Management
- Phase 4 - Month Management
- Phase 5 - Meal Management
- Phase 6 - Bazaar Management
```
