# MessMate - Process Tracker

## Project Status

```text
Project Name: MessMate

Status: Active Development (Phase 3 In Progress — Members + Invite System Complete)

Frontend:
Next.js 16
TypeScript
Tailwind CSS v4
TanStack Query
Zustand + Immer
Lucide icons
Custom design system (CSS variables, no shadcn/ui)

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
- [x] Shared Zod schemas + DTOs for members (packages/shared/src/messes/members.*)
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
- [ ] shadcn/ui setup (not installed — using custom Tailwind components)
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
- [ ] Remove meal_entry_items table (ADR-021 specifies JSONB-based meal storage)

> **Issue:** Schema still includes `meal_entry_items` table, but ADR-021
> specifies JSONB-based meal storage which eliminates this table. Requires
> schema migration to remove.

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

- [x] Member Added
- [x] Member Removed
- [ ] Meal Added
- [ ] Meal Updated
- [ ] Expense Added
- [ ] Expense Updated
- [ ] Deposit Added
- [ ] Deposit Updated
- [ ] Bazaar Submitted
- [ ] Bazaar Approved
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
- [x] JWT tokens stored in httpOnly cookies only (removed from Zustand)
- [x] CORS hardened (explicit methods/headers, no fallback)
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

# Current Focus

```text
Current Phase:
Phase 3 - Mess Management (In Progress)

Completed:
- Create Mess Module (POST, GET /messes)
- Member Management (Add/Remove/List with mess_members table)
- Manager Assignment (enforce max 2 managers, prevent demoting last manager)
- Members page with table, search, filters, role/status, permission branching
- Roles decorator + RolesGuard for backend RBAC
- User search endpoint for Add Member flow
- Invite System (invite/accept/reject/expiry using existing join_requests table)
- Manager Created Account (POST /users/create-member + create-account page)
- Dashboard Invite Notification Banner

Next Priority:
- Mess settings (update mess details)
- Month Management (Phase 4)

Prerequisites for Phase 3:
- [ ] Remove meal_entry_items table (ADR-021 cleanup)
- [ ] Optional: Protected route layout group for dashboard pages

After Phase 3:
Phase 4 - Month Management
- Active month creation
- Month closing and archiving
- Balance carry forward
```
