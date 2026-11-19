# MessMate - Technical Flow

## Overview

MessMate is month-based accounting for a shared household. Meals, bazaar
(groceries), expenses and deposits are recorded against the mess's single
**active month**. When a manager closes the month, every member's bill and
balance are frozen into a statement and the balance carries into the next
month.

- A mess has at most one active month (database-enforced).
- Managers run the month: meals, expenses, deposits, approvals, members.
- Members see their own numbers and the mess's activity, and may submit
  bazaar purchases.

---

# System Architecture Flow

```text
Browser (Next.js 16, prerendered /dashboard, TanStack Query)
 │  reads:  GET /api/<path>  ─────────────┐   (route handler bridge, parallel)
 │  writes: server actions  ──────────────┤   (one at a time, Next.js limit)
 ▼                                        ▼
Next.js server (Vercel)  ── attaches httpOnly access_token, refreshes on 401
 ▼
NestJS API (Vercel function)
 │  AuthGuard('jwt') → session check (user_sessions)
 │  MembershipGuard / RolesGuard('MANAGER') on :messId
 │  Zod validation (@repo/shared) → service
 │  CacheService (Redis, read-through, fails open)
 ▼
PostgreSQL on Neon (Prisma)
```

## Request rules

- **Envelope:** success responses are `{ success, message, data }`. Errors
  come from `ApiExceptionFilter` as
  `{ success:false, message, statusCode, code, requestId, details? }`. Every
  response has an `X-Request-Id`. Messages of 5xx errors are never sent to
  clients.
- **Validation:** request bodies are `unknown` in controllers and parsed with
  Zod schemas from `@repo/shared`. Route UUIDs are checked by hand.
- **Rate limit:** 120 requests per minute per user, with stricter limits on
  auth and invite routes.
- **Cache:** writes under `/:messId/...` clear that mess's `live` cache bucket
  before the response is sent (ADR-026).
- **Web:** server actions return `ActionResult<T>` and never throw. Hooks
  call `unwrap(...)` so TanStack Query sees an `ActionError` with the real
  message. Every successful mutation invalidates all queries and refetches the
  dashboard home queries (ADR-027).

---

# Authentication and Sessions

## Sign up / sign in

- Email and password (`POST /auth/signup`, `POST /auth/signin`), or Google
  OAuth (`GET /auth/google` → `/auth/google/callback`).
- Each sign-in creates a `user_sessions` row and sets two httpOnly cookies:
  - `access_token`: JWT, 7 days, carries `sub` and the session id `sid`.
  - `refresh_token`: JWT with `sid` and a random `jti`, 30 days, sliding.
- `COOKIE_DOMAIN` lets the web app and the API share cookies on a parent
  domain in production.

## Every request

```text
JwtStrategy.validate(payload)
 ↓
payload has sub + sid?           no → 401
 ↓
session exists, not revoked,
not expired?                     no → 401 (code SESSION_EXPIRED)
 ↓
request.user = { id, email }
```

## Refresh

```text
api-client gets 401
 ↓
POST /auth/refresh (refresh_token cookie)
 ↓
token hash = session.token_hash          → rotate: new refresh token,
                                            expires_at = now + 30 days
token hash = previous_token_hash,
rotated less than 2 minutes ago          → access token only (parallel tab)
otherwise                                → 401, user is signed out
 ↓
retry the original request once
```

On the web, a failed refresh surfaces as `SESSION_EXPIRED`. `query-client.ts`
then clears the offline cache, calls logout and sends the user to `/signin`.

## Logout

`POST /auth/logout` revokes the session. The web app clears its offline data
and does a full navigation to `/signin` (`window.location.replace`), because
`/signin` and `/dashboard` live in different root layouts.

## Route protection (web)

`apps/web/proxy.ts` only checks whether the auth cookies exist, and redirects
between `/`, `/signin`, `/signup` and `/dashboard`. Real authorization
happens in the API.

---

# User Lifecycle

## Registration

```text
Sign up (email/password or Google)
 ↓
No mess → dashboard shows "create a mess" or pending invites
```

## Manager-Created Account

```text
Manager → /dashboard/members/create-account
 ↓
Name, Email (must be new), Password, Phone (optional)
 ↓
POST /users/create-member
 ↓
API (one transaction):
  1. Checks the caller is a manager of their mess
  2. Creates the user (manager_created = true, must_change_password = true)
  3. Adds them to the mess as MEMBER
  4. Logs MEMBER_ADDED
 ↓
Toast "Member account created"
```

The member signs in with the password the manager chose. Until they set their
own password (`PATCH /users/me/password`, which clears
`must_change_password`), the dashboard shows a "Set your own password" notice
that links to Profile.

## Profile API

| Endpoint                    | Purpose                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `GET /users/me`             | Current user (also the session check on load)                                               |
| `PATCH /users/me`           | Name, phone                                                                                 |
| `PATCH /users/me/password`  | Change or set password                                                                      |
| `POST /users/me/avatar`     | Upload avatar (Cloudinary)                                                                  |
| `DELETE /users/me/avatar`   | Remove avatar                                                                               |
| `GET /users/search`         | Find users to invite (every query word must appear in the name or email; emails are masked) |
| `POST /users/create-member` | Manager creates a member account                                                            |

---

# OAuth Account Linking Flow

OAuth providers are never linked automatically at login (ADR-024).

```text
Google Login
↓
Email already belongs to a password account
↓
Reject: "An account with this email already exists. Please sign in with your
password first."
```

Planned (not built): link Google manually from Settings → Connected Accounts.

---

# Mess Lifecycle

## Create Mess

Any signed-in user without an active mess can create one
(`POST /messes`; a second one fails with `ALREADY_IN_MESS`).

```text
Create mess (name, optional description)
 ↓
One transaction:
  - messes row (unique slug)
  - creator added as MANAGER (MANAGER_ASSIGNED logged)
  - default meal types created: Lunch = 1, Dinner = 1
```

## Managers

- 1 to 2 managers per mess, all with equal permissions (ADR-004).
- `PATCH /messes/:messId/members/:userId/role` promotes or demotes.
- `POST /messes/:messId/handover` swaps roles: the chosen member becomes
  manager and the acting manager becomes a member, in one transaction.
- The last manager cannot be removed or demoted (`LAST_MANAGER`).

## Manager permissions

Invite members, create member accounts, remove members, assign or hand over
the manager role, configure meal types and mess details, record and edit
meals, add, edit and delete deposits and expenses, approve or reject bazaar,
start or close months.

---

# Member Joining Flow (Invites)

## Invite

```text
Manager opens Add Member → searches by name or email
 ↓
POST /invites { userId } or { email }   (5 per minute)
 ↓
API checks: caller is a manager, target has no active mess,
            no pending invite for this mess
 ↓
join_requests row (PENDING)
```

## Accept / reject

```text
Invitee's dashboard → GET /invites/pending
 ↓  (invites older than 7 days are marked EXPIRED first)
Accept → POST /invites/:id/accept
         one transaction: mess_members (MEMBER), invite ACCEPTED,
         MEMBER_ADDED logged
Reject → POST /invites/:id/reject → invite REJECTED
```

---

# Member Removal Flow

`DELETE /messes/:messId/members/:userId` sets `removed_at`. A manager cannot
remove themselves or the last manager.

Removed members cannot record or see anything in the mess any more, but their
meals, deposits and expenses stay. At month close they still get a summary
row (what they owe or are owed), but their balance is not carried into the
next month.

---

# Month Lifecycle

## Core principle

Months never open or close automatically (ADR-006). A manager presses
**Start Month**. If a month is active, starting the next one closes it first.

## Close preview

`GET /months/:messId/close-preview` runs the same maths as the real close and
shows every member's bill and balance, plus how many pending bazaar
submissions will be rejected.

## Start new month (closes the current one)

`POST /months/:messId { title?, carryForward? }`

```text
Refuse if the active month started less than 60 s ago (double submit)
 ↓
One transaction (20 s timeout):
  1. Active month → ARCHIVED, ended_at = now
     (if it was already closed: 409 MONTH_ALREADY_CLOSED)
  2. Pending bazaar → REJECTED (BAZAAR_REJECTED logged for each)
  3. member_month_summaries computed and written
  4. MONTH_CLOSED logged
  5. New ACTIVE month (title unique per mess, e.g. "December 2026 (2)")
  6. carry_forward_balances for still-active members
     (unless carryForward.enabled = false or the member is excluded)
  7. MONTH_OPENED logged
 ↓
Activity older than 12 months deleted for this mess (ADR-028)
```

---

# Balance Carry Forward

Only member balances carry forward (ADR-008). They are stored in
`carry_forward_balances`, not as deposit or expense rows.

```text
Adal: deposits 5,000 − bill 5,200 = −200
 ↓
Next month: PREVIOUS_DUE 200   → counted as an individual cost
```

```text
Adal: deposits 5,500 − bill 5,000 = +500
 ↓
Next month: PREVIOUS_BALANCE 500 → counted as a deposit
```

Month statements (Months page) show carried amounts in their own
**Carried in** column, apart from the month's own individual expenses.

---

# Meal System

## Meal types

Per-mess, configurable (ADR-005). New messes start with default types; managers
add, rename, deactivate or delete them (Settings). Each type has a `value`,
the count the meal grid is pre-filled with. **Every meal counts as 1 toward
the bill**, whatever the type.

`meal_entries.meals` is keyed by meal type **id**:

```json
{ "8c1e…lunch-id": 1, "f02a…dinner-id": 0.5 }
```

Counts go in steps of 0.5, from 0 to 10.

## Daily meal entry (Meals page, managers)

```text
Pick a day (date picker limited to the days the API accepts)
 ↓
Grid: one row per active member, pre-filled with meal-type defaults
 ↓
Save → POST /meals/:messId/:monthId { entries: [{ memberId, date, meals }] }
 ↓
API rules (meal-entries.ts):
  - the date must be a calendar day (UTC midnight)
  - only ended days: yesterday or earlier in Asia/Dhaka (MEAL_DATE_NOT_PAST)
  - the day must belong to the active month: a mess's first month may
    back-fill 31 days; later months start on their start day, because
    earlier days belong to a closed month (DATE_OUTSIDE_MONTH)
  - a day that already has meals is never overwritten (MEAL_ALREADY_SAVED)
 ↓
total_meal computed per row; one MEAL_ADDED log row for the day
(entity_type 'meal_day', member and meal counts in details)
```

On the day a new month opens (e.g. the 1st, right after closing the previous
month), no day of the new month has ended yet. The Meals page shows "No day of
<month> can be filled in yet" instead of a grid.

## Meal update flow (Reports → Meals)

A saved day is read-only on the Meals page. To change it:

```text
Reports → Meals → pick a day → edit the whole day or one member's row
 ↓
PUT /meals/:messId/:monthId/day { date, entries }
 ↓
Replaces those members' meals for that day
 ↓
MEAL_UPDATED logged
```

Deleting one member's meals for a day uses `DELETE /meals/:messId/:entryId`
(active month only). Reports offers this only for members with meals that
day.

---

# Bazaar Workflow

## Submission

Any active member may submit: one or more items (`name`, `amount`), a date,
and an optional description. Status starts as PENDING. The submitter or a
manager can edit or delete it while it is pending.

## Approval

```text
Manager: Approve → status APPROVED, approved_by/at set,
                   BAZAAR expense created (same transaction)
         Reject  → status REJECTED
```

Lists are cursor-paginated per status tab (`BAZAAR_PAGE_SIZE = 4`, "Load
more"). New submissions are added to the top of the cached first page.
Closing a month rejects every submission that is still pending.

---

# Expense Flow

`POST /expenses/:messId/:monthId { type, title, amount, expense_date, member_ids }`

- **SHARED** (gas, electricity, internet): split equally across the chosen
  members, to the paisa. The split is stored in `expense_members`.
- **INDIVIDUAL** (personal purchases, fines): exactly one member.
- **BAZAAR** expenses are only created by approving a bazaar. They have no
  allocations; they are shared by meals through the meal rate.

Managers can edit (`PATCH`, which replaces the allocations) or delete
(`DELETE`, a hard delete with a snapshot in the activity log) expenses of the
active month, from Reports.

---

# Deposit Flow

Managers record deposits (`POST /deposits/:messId/:monthId`), and edit or
delete them from Reports (`PATCH` / `DELETE`, soft delete). Each change is
logged. Balances update immediately.

---

# Monthly Calculation Engine

The same pure function (`computeMemberSummaries` in
`apps/api/src/months/month-summary.ts`) drives the live member calculations,
the close preview and the real close, so they always agree.

## Who gets a row

Every active member, plus anyone who has meals, deposits, allocations or
carries in the month, including members removed during it.

## Formulas

```text
Meal rate      = total BAZAAR expenses / total meals of everyone
Meal cost      = bazaar total split by each member's meals
                 (whole paisa, largest-remainder method, so the parts add
                 up exactly to the bazaar total)
Shared cost    = sum of the member's SHARED allocations
Individual     = sum of INDIVIDUAL allocations + PREVIOUS_DUE carried in
Deposits       = sum of deposits + PREVIOUS_BALANCE carried in
Bill           = meal cost + shared + individual
Balance        = deposits − bill
```

SHARED and INDIVIDUAL expenses count only through their allocations, never in
the meal rate, so they are never counted twice (fix e837ba5). Pending and
rejected bazaar do not count.

---

# Dashboard Flow

`/dashboard` (home):

- **Manager:** mess balance (total deposits − total expenses, with the share
  of deposits spent), meals, meal rate, days with
  meals, pending bazaar approvals, their own summary, meals by member, recent
  activity, quick actions.
- **Member:** their balance (deposits − bill), meals, meal rate, their own
  summary, recent activity.
- **No active month:** a notice, plus Start Month for managers.
- **No mess:** create a mess, or pending invites to accept.
- **Manager-created account:** the "Set your own password" notice.

Data: `GET /messes/:messId/dashboard` (manager), `GET /messes/:messId/member/me`,
`GET /meals/:messId/:monthId/summary`, `GET /messes/:messId/activities`. If
loading fails, the page renders an error state with Retry, never an empty
state.

## After a write

Deposit, expense, bazaar and meal pages show a **success dialog** with a
summary of what was saved, and two choices: Go to dashboard or Stay here. The
mutation stays pending until the screen's data and the dashboard home queries
have been refetched, so the dashboard shows the new numbers on arrival.
Other mutations show a toast. Failures always toast (`query-client.ts`).

---

# Activity Logging

Every state change writes an `activity_logs` row in the same transaction as
the change (ADR-013): members added or removed, manager changes, meals, bazaar
(submitted, updated, approved, rejected, deleted), expenses and deposits
(added, updated, deleted), months opened or closed, meal-type defaults.

- One row per meal-day, not per member (ADR-028).
- Deleted expenses keep a snapshot in `details`.
- Activity older than 12 months is purged when the mess opens a new month.
- Feeds: the dashboard shows the last 10 (`GET /messes/:messId/activities`);
  the Activity page pages through the full history
  (`GET /messes/:messId/activities/history`).

---

# Future Extensions

The schema leaves room for group chat, push notifications, mobile apps, SaaS
subscriptions, analytics and report exports without a redesign.
